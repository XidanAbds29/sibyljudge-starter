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

// List all groups (ordered by creation time desc)
router.get('/', async (req, res) => {
  const supabase = req.supabase;
  try {
    let query = supabase.from('group').select('*').order('created_at', { ascending: false });
    if (req.query.onlyPublic === 'true') {
      query = query.eq('is_private', false);
    }
    const { data, error } = await query;
    if (error) {
      console.error('[GroupList] DB error:', error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
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
    // Fetch group and creator
    const { data: group, error } = await supabase
      .from('group')
      .select('*, group_creation(created_by)')
      .eq('group_id', group_id)
      .single();
    if (error || !group) return res.status(404).json({ error: 'Group not found' });
    // Get creator username (if available)
    let creator = null;
    if (group.group_creation?.created_by) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('uuid', group.group_creation.created_by)
        .single();
      creator = profile?.username || null;
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
      creator,
      is_member,
      members: (members || []).map(m => ({
        user_id: m.user_id,
        role: m.role,
        username: m.profiles?.username || null,
        uuid: m.profiles?.id || null,
      })),
    });
  } catch (err) {
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

// User leaves a group (using UUID)
router.post('/:group_id/leave', async (req, res) => {
  const supabase = req.supabase;
  const { group_id } = req.params;
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });
  try {
    const { error } = await supabase
      .from('group_member')
      .delete()
      .eq('group_id', group_id)
      .eq('user_id', user_id);
    if (error) throw new Error(error.message);
    res.json({ message: 'Left group' });
  } catch (err) {
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
