-- Add is_duplicate column to submission table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='submission' AND column_name='is_duplicate'
    ) THEN
        ALTER TABLE submission ADD COLUMN is_duplicate BOOLEAN DEFAULT FALSE;
    END IF;
END$$;

-- Create the trigger function
CREATE OR REPLACE FUNCTION check_duplicate_accepted()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Accepted' THEN
        IF EXISTS (
            SELECT 1 
            FROM submission
            WHERE user_id = NEW.user_id 
            AND problem_id = NEW.problem_id
            AND status = 'Accepted'
            AND submission_id != NEW.submission_id
        ) THEN
            -- Don't prevent the submission, but mark it as duplicate
            NEW.is_duplicate = TRUE;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trg_check_duplicate_accepted ON submission;

-- Create the trigger
CREATE TRIGGER trg_check_duplicate_accepted
    BEFORE INSERT ON submission
    FOR EACH ROW
    EXECUTE FUNCTION check_duplicate_accepted();
