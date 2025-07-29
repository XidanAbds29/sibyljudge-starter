const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Helper: Validate required fields
function validateFields(obj, fields) {
  for (const f of fields) {
    if (!obj[f]) return f;
  }
  return null;
}

// List all groups (ordered by creation time desc) with pagination and filters
router.get('/', async (req, res) => {
  const supabase = req.supabase;
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const search = req.query.search;
  const privacy = req.query.privacy; // "Public" or "Private"
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  try {
    let query = supabase.from('group').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
    
    // Apply privacy filter
    if (privacy === 'Public') {
      query = query.eq('is_private', false);
    } else if (privacy === 'Private') {
      query = query.eq('is_private', true);
    }
    
    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    const { data: groups, error, count } = await query;
    if (error) {
      console.error('[GroupList] DB error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Fetch creator information for each group
    const groupsWithCreators = await Promise.all(groups.map(async (group) => {
      try {
        // Get creator information from group_creation table
        const { data: groupCreation, error: creationError } = await supabase
          .from('group_creation')
          .select('created_by')
          .eq('group_id', group.group_id)
          .single();
        
        let creator = null;
        if (!creationError && groupCreation?.created_by) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', groupCreation.created_by)
            .single();
          
          if (!profileError && profile?.username) {
            creator = profile.username;
          }
        }
        
        return {
          ...group,
          creator
        };
      } catch (error) {
        console.error(`Error fetching creator for group ${group.group_id}:`, error);
        return {
          ...group,
          creator: null
        };
      }
    }));

    res.json({ groups: groupsWithCreators, total: count });
  } catch (err) {
    console.error('[GroupList] Route error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get group by id (with creator, members, and problems if applicable)
router.get('/:group_id', async (req, res) => {
  const supabase = req.supabase;
  const group_id = req.params.group_id;
  const user_id = req.query.user_id;
  try {
    // Fetch group basic info
    const { data: group, error } = await supabase
      .from('group')
      .select('*')
      .eq('group_id', group_id)
      .single();
    if (error || !group) return res.status(404).json({ error: 'Group not found' });

    // Get creator information from group_creation table
    let creator = null;
    const { data: groupCreation, error: creationError } = await supabase
      .from('group_creation')
      .select('created_by')
      .eq('group_id', group_id)
      .single();
    
    if (!creationError && groupCreation?.created_by) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', groupCreation.created_by)
        .single();
      
      if (!profileError && profile?.username) {
        creator = profile.username;
      }
    }

    // Get members
    const { data: members, error: memberError } = await supabase
      .from('group_member')
      .select('user_id, role, profiles(username, id)')
      .eq('group_id', group_id);
    if (memberError) throw memberError;

    // Check if user is a member
    let is_member = false;
    if (user_id) {
      const { data: part } = await supabase
        .from('group_member')
        .select('*')
        .eq('group_id', group_id)
        .eq('user_id', user_id)
        .maybeSingle();
      is_member = !!part;
    }

    res.json({
      group_id: group.group_id,
      name: group.name,
      description: group.description,
      is_private: group.is_private,
      created_at: group.created_at,
      creator,
      is_member,
      members: (members || []).map(m => ({
        user_id: m.user_id,
        role: m.role,
        username: m.profiles?.username || m.user_id,
        uuid: m.profiles?.id || m.user_id,
      })),
    });
  } catch (err) {
    console.error('Error fetching group:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create a new group (mirroring contest creation logic exactly, using UUIDs)
router.post('/', async (req, res) => {
  const supabase = req.supabase;
  const { name, description, privacy, password, created_by } = req.body;
  if (!name || !created_by) return res.status(400).json({ error: 'Missing required fields' });
  try {
    let password_hash = null;
    let is_private = privacy === 'Private';
    if (is_private) {
      if (!password) return res.status(400).json({ error: 'Password required for private groups' });
      password_hash = await bcrypt.hash(password, 10);
    }
    // 1. Create group
    const { data: group, error: groupError } = await supabase
      .from('group')
      .insert([{ name, description, is_private, password_hash }])
      .select()
      .single();
    if (groupError) throw new Error(groupError.message);
    // 2. Add group creation record (using UUID)
    const { error: creationError } = await supabase
      .from('group_creation')
      .insert({ created_by, group_id: group.group_id });
    if (creationError) throw new Error(creationError.message);
    // 3. Add creator as member (role: admin) using UUID
    const { error: memberError } = await supabase
      .from('group_member')
      .insert({ group_id: group.group_id, user_id: created_by, role: 'admin' });
    if (memberError) throw new Error(memberError.message);
    res.json({ group });
  } catch (err) {
    console.error('[GroupCreate] Route error:', err);
    res.status(500).json({ error: err.message });
  }
});

// User joins a group (with password check if private, using UUID)
router.post('/:group_id/join', async (req, res) => {
  const supabase = req.supabase;
  const { group_id } = req.params;
  const { user_id, password } = req.body;
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });
  try {
    // Fetch group to check if private
    const { data: group, error: groupError } = await supabase
      .from('group')
      .select('password_hash, is_private')
      .eq('group_id', group_id)
      .single();
    if (groupError || !group) return res.status(404).json({ error: 'Group not found' });
    if (group.is_private) {
      if (!password) return res.status(400).json({ error: 'Password required' });
      const valid = await bcrypt.compare(password, group.password_hash || '');
      if (!valid) return res.status(403).json({ error: 'Incorrect password' });
    }
    // Check if already joined (using UUID)
    const { data: existing } = await supabase
      .from('group_member')
      .select('*')
      .eq('group_id', group_id)
      .eq('user_id', user_id)
      .maybeSingle();
    if (existing) return res.status(200).json({ message: 'Already joined' });
    // Insert member (using UUID)
    const { error } = await supabase
      .from('group_member')
      .insert({ group_id, user_id });
    if (error) throw new Error(error.message);
    res.json({ message: 'Joined group' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check admin leave warning before actual leave
router.post('/:group_id/check-leave', async (req, res) => {
  const supabase = req.supabase;
  const { group_id } = req.params;
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });
  
  try {
    // Get group info
    const { data: group, error: groupError } = await supabase
      .from('group')
      .select('name')
      .eq('group_id', group_id)
      .single();
    
    if (groupError || !group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Get user's role in the group
    const { data: userMember, error: memberError } = await supabase
      .from('group_member')
      .select('role')
      .eq('group_id', group_id)
      .eq('user_id', user_id)
      .single();
    
    if (memberError || !userMember) {
      return res.status(404).json({ error: 'User not found in group' });
    }
    
    // Get the creator of the group
    const { data: groupCreation, error: creationError } = await supabase
      .from('group_creation')
      .select('created_by')
      .eq('group_id', group_id)
      .single();
    
    if (creationError) {
      console.error('Error fetching group creation:', creationError);
    }
    
    const isCreator = groupCreation?.created_by === user_id;
    const isAdmin = userMember.role === 'admin';
    
    // Count remaining admins (excluding this user)
    const { data: adminMembers, error: adminError } = await supabase
      .from('group_member')
      .select('user_id')
      .eq('group_id', group_id)
      .eq('role', 'admin')
      .neq('user_id', user_id);
    
    if (adminError) {
      throw new Error(adminError.message);
    }
    
    const remainingAdminCount = adminMembers?.length || 0;
    const willDeleteGroup = isAdmin && (remainingAdminCount === 0 || isCreator);
    
    res.json({
      is_admin: isAdmin,
      is_creator: isCreator,
      admin_count: remainingAdminCount,
      will_delete_group: willDeleteGroup,
      group_name: group.name,
      warning_message: willDeleteGroup 
        ? `Warning: You are the ${isCreator ? 'creator' : 'last admin'} of this group. Leaving will permanently delete the entire group and remove all members.`
        : null
    });
    
  } catch (err) {
    console.error('[CheckAdminLeave] Route error:', err);
    res.status(500).json({ error: err.message });
  }
});

// User leaves a group (using UUID) - Enhanced with admin checks
router.post('/:group_id/leave', async (req, res) => {
  const supabase = req.supabase;
  const { group_id } = req.params;
  const { user_id, confirm_deletion } = req.body;
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });
  
  try {
    // Get group info and user's role
    const { data: group, error: groupError } = await supabase
      .from('group')
      .select('name')
      .eq('group_id', group_id)
      .single();
    
    if (groupError || !group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const { data: userMember, error: memberError } = await supabase
      .from('group_member')
      .select('role')
      .eq('group_id', group_id)
      .eq('user_id', user_id)
      .single();
    
    if (memberError || !userMember) {
      return res.status(404).json({ error: 'User not found in group' });
    }
    
    // Get the creator of the group
    const { data: groupCreation } = await supabase
      .from('group_creation')
      .select('created_by')
      .eq('group_id', group_id)
      .single();
    
    const isCreator = groupCreation?.created_by === user_id;
    const isAdmin = userMember.role === 'admin';
    
    // Count remaining admins (excluding this user)
    const { data: adminMembers } = await supabase
      .from('group_member')
      .select('user_id')
      .eq('group_id', group_id)
      .eq('role', 'admin')
      .neq('user_id', user_id);
    
    const remainingAdminCount = adminMembers?.length || 0;
    const willDeleteGroup = isAdmin && (remainingAdminCount === 0 || isCreator);
    
    // If this will delete the group, require confirmation
    if (willDeleteGroup && !confirm_deletion) {
      return res.status(400).json({ 
        error: 'Group deletion confirmation required',
        requires_confirmation: true,
        warning_message: `Leaving will permanently delete the group "${group.name}" and remove all members.`
      });
    }
    
    // If group will be deleted, handle the deletion manually
    if (willDeleteGroup) {
      // Get all members for notifications
      const { data: allMembers } = await supabase
        .from('group_member')
        .select('user_id')
        .eq('group_id', group_id)
        .neq('user_id', user_id);
      
      // Create notifications for other members
      if (allMembers && allMembers.length > 0) {
        const notifications = allMembers.map(member => ({
          user_id: member.user_id,
          type: 'group_deleted',
          reference_id: parseInt(group_id),
          title: 'Group Deleted',
          message: `The group "${group.name}" has been automatically deleted because the admin left.`,
          group_id: parseInt(group_id)
        }));
        
        await supabase.from('notification').insert(notifications);
      }
      
      // Delete in proper order to avoid foreign key violations
      
      // 1. Delete all notifications for this group
      await supabase
        .from('notification')
        .delete()
        .eq('group_id', group_id);
      
      // 2. Delete all group members
      await supabase
        .from('group_member')
        .delete()
        .eq('group_id', group_id);
      
      // 3. Delete group creation record
      await supabase
        .from('group_creation')
        .delete()
        .eq('group_id', group_id);
      
      // 4. Delete the group itself
      await supabase
        .from('group')
        .delete()
        .eq('group_id', group_id);
      
      res.json({ 
        message: 'Group deleted successfully',
        group_deleted: true
      });
    } else {
      // Normal leave - just remove the user from group
      const { error } = await supabase
        .from('group_member')
        .delete()
        .eq('group_id', group_id)
        .eq('user_id', user_id);
      
      if (error) throw new Error(error.message);
      
      res.json({ 
        message: 'Left group successfully',
        group_deleted: false
      });
    }
    
  } catch (err) {
    console.error('[GroupLeave] Route error:', err);
    res.status(500).json({ error: err.message });
  }
});

// List groups a user is a member of (using UUID)
router.get('/user/:user_id', async (req, res) => {
  const supabase = req.supabase;
  const user_id = req.params.user_id;
  try {
    const { data, error } = await supabase
      .from('group')
      .select('*, group_member!inner(user_id)')
      .eq('group_member.user_id', user_id);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
