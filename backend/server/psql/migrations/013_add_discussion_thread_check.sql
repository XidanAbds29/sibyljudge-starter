-- First drop any existing triggers and functions that might be using the old columns
DROP TRIGGER IF EXISTS validate_discussion_reference_trigger ON discussion_thread;
DROP TRIGGER IF EXISTS validate_discussion_reference ON discussion_thread;
DROP FUNCTION IF EXISTS validate_discussion_reference() CASCADE;

-- First drop existing constraint if it exists
ALTER TABLE discussion_thread
DROP CONSTRAINT IF EXISTS check_reference_or_general;

-- Clean up any invalid data before adding constraint
UPDATE discussion_thread
SET contest_id = NULL,
    group_id = NULL
WHERE problem_id IS NOT NULL;

UPDATE discussion_thread
SET problem_id = NULL,
    group_id = NULL
WHERE contest_id IS NOT NULL;

UPDATE discussion_thread
SET problem_id = NULL,
    contest_id = NULL
WHERE group_id IS NOT NULL;

UPDATE discussion_thread
SET problem_id = NULL,
    contest_id = NULL,
    group_id = NULL
WHERE thread_type = 'general';

-- Create a new validation function
CREATE OR REPLACE FUNCTION validate_discussion_thread()
RETURNS trigger AS $$
BEGIN
    -- For general threads, ensure no references
    IF NEW.thread_type = 'general' THEN
        NEW.problem_id := NULL;
        NEW.contest_id := NULL;
        NEW.group_id := NULL;
    ELSE
        -- For non-general threads, ensure exactly one reference
        IF (CASE WHEN NEW.problem_id IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN NEW.contest_id IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN NEW.group_id IS NOT NULL THEN 1 ELSE 0 END) != 1 THEN
            RAISE EXCEPTION 'Non-general threads must have exactly one reference';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger
CREATE TRIGGER validate_discussion_thread_trigger
    BEFORE INSERT OR UPDATE ON discussion_thread
    FOR EACH ROW
    EXECUTE FUNCTION validate_discussion_thread();

-- Add check constraint to ensure proper reference handling for discussion threads
ALTER TABLE discussion_thread
ADD CONSTRAINT check_reference_or_general
CHECK (
    -- Either it's a general thread with no references
    (thread_type = 'general' AND problem_id IS NULL AND contest_id IS NULL AND group_id IS NULL)
    OR
    -- Or it has exactly one reference type and it's not a general thread
    (thread_type != 'general' AND
     (CASE WHEN problem_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN contest_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN group_id IS NOT NULL THEN 1 ELSE 0 END) = 1)
);

-- Drop existing index if it exists and recreate
DROP INDEX IF EXISTS idx_discussion_thread_general;
CREATE INDEX idx_discussion_thread_general ON discussion_thread(thread_type) WHERE thread_type = 'general';
