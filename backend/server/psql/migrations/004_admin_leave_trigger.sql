-- Migration: Admin Leave Group Trigger
-- This trigger detects when an admin leaves a group and ensures proper cleanup

-- First, create a function to check if user is admin and handle group deletion
CREATE OR REPLACE FUNCTION check_admin_leave_group()
RETURNS TRIGGER AS $$
DECLARE
    admin_count INTEGER;
    creator_id UUID;
    is_creator BOOLEAN := FALSE;
BEGIN
    -- Check if the deleted member was an admin
    IF OLD.role = 'admin' THEN
        -- Get the creator of the group
        SELECT created_by INTO creator_id
        FROM "Group_creation"
        WHERE group_id = OLD.group_id;
        
        -- Check if the leaving user is the creator
        IF creator_id = OLD.user_id THEN
            is_creator := TRUE;
        END IF;
        
        -- Count remaining admins in the group
        SELECT COUNT(*) INTO admin_count
        FROM "Group_member"
        WHERE group_id = OLD.group_id 
        AND role = 'admin'
        AND user_id != OLD.user_id;  -- Exclude the user who is leaving
        
        -- If no admins remain or if the creator is leaving, delete the entire group
        IF admin_count = 0 OR is_creator THEN
            -- Log the group deletion (optional)
            INSERT INTO "Notification" (user_id, type, reference_id, title, message, group_id)
            SELECT 
                gm.user_id,
                'group_deleted',
                OLD.group_id,
                'Group Deleted',
                'The group "' || g.name || '" has been automatically deleted because the admin left.',
                OLD.group_id
            FROM "Group_member" gm
            JOIN "Group" g ON g.group_id = OLD.group_id
            WHERE gm.group_id = OLD.group_id 
            AND gm.user_id != OLD.user_id;  -- Notify all other members
            
            -- Delete all related records in proper order to avoid foreign key violations
            
            -- Delete all notifications related to this group
            DELETE FROM "Notification" WHERE group_id = OLD.group_id;
            
            -- Delete all group members (remaining members)
            DELETE FROM "Group_member" WHERE group_id = OLD.group_id AND user_id != OLD.user_id;
            
            -- Delete group creation record
            DELETE FROM "Group_creation" WHERE group_id = OLD.group_id;
            
            -- Finally delete the group itself
            DELETE FROM "Group" WHERE group_id = OLD.group_id;
            
            -- Log successful deletion
            RAISE NOTICE 'Group % automatically deleted due to admin departure', OLD.group_id;
        END IF;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on Group_member table
DROP TRIGGER IF EXISTS admin_leave_group_trigger ON "Group_member";

CREATE TRIGGER admin_leave_group_trigger
    AFTER DELETE ON "Group_member"
    FOR EACH ROW
    EXECUTE FUNCTION check_admin_leave_group();

-- Create a function to check admin status before allowing leave
CREATE OR REPLACE FUNCTION check_admin_leave_warning(
    p_group_id INTEGER,
    p_user_id UUID
)
RETURNS TABLE (
    is_admin BOOLEAN,
    is_creator BOOLEAN,
    admin_count INTEGER,
    will_delete_group BOOLEAN,
    group_name TEXT
) AS $$
DECLARE
    creator_id UUID;
    user_role TEXT;
    remaining_admins INTEGER;
    g_name TEXT;
BEGIN
    -- Get group name
    SELECT name INTO g_name FROM "Group" WHERE group_id = p_group_id;
    
    -- Get user's role in the group
    SELECT role INTO user_role FROM "Group_member" 
    WHERE group_id = p_group_id AND user_id = p_user_id;
    
    -- Get the creator of the group
    SELECT created_by INTO creator_id
    FROM "Group_creation"
    WHERE group_id = p_group_id;
    
    -- Count admins excluding the user who wants to leave
    SELECT COUNT(*) INTO remaining_admins
    FROM "Group_member"
    WHERE group_id = p_group_id 
    AND role = 'admin'
    AND user_id != p_user_id;
    
    -- Return the analysis
    RETURN QUERY SELECT
        (user_role = 'admin')::BOOLEAN as is_admin,
        (creator_id = p_user_id)::BOOLEAN as is_creator,
        remaining_admins as admin_count,
        ((user_role = 'admin' AND remaining_admins = 0) OR (creator_id = p_user_id))::BOOLEAN as will_delete_group,
        g_name as group_name;
END;
$$ LANGUAGE plpgsql;
