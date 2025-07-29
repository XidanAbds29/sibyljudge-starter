-- Add required columns to profiles table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='profiles' AND column_name='total_submissions'
    ) THEN
        ALTER TABLE profiles ADD COLUMN total_submissions INT DEFAULT 0;
        ALTER TABLE profiles ADD COLUMN accepted_submissions INT DEFAULT 0;
    END IF;
END$$;

-- Create the trigger function
CREATE OR REPLACE FUNCTION update_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- This trigger will run after a new submission is inserted
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles
        SET 
            total_submissions = (
                SELECT COUNT(*) 
                FROM submission 
                WHERE user_id = NEW.user_id
            ),
            accepted_submissions = (
                SELECT COUNT(*) 
                FROM submission 
                WHERE user_id = NEW.user_id 
                AND status = 'Accepted'
            )
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trg_update_user_statistics ON submission;

-- Create the trigger
CREATE TRIGGER trg_update_user_statistics
    AFTER INSERT ON submission
    FOR EACH ROW
    EXECUTE FUNCTION update_user_statistics();
