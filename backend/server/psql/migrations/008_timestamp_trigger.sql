-- Create the trigger function
CREATE OR REPLACE FUNCTION update_submission_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.submitted_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trg_update_submission_timestamp ON submission;

-- Create the trigger
CREATE TRIGGER trg_update_submission_timestamp
    BEFORE INSERT ON submission
    FOR EACH ROW
    EXECUTE FUNCTION update_submission_timestamp();
