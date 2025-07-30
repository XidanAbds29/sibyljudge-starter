-- Rollback function in case of failure
CREATE OR REPLACE FUNCTION rollback_discussion_changes()
RETURNS void AS $$
BEGIN
    -- Restore columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'discussion_thread' 
                  AND column_name = 'reference_type') THEN
        ALTER TABLE discussion_thread ADD COLUMN reference_type character varying;
        ALTER TABLE discussion_thread ADD COLUMN reference_id integer;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Begin transaction
BEGIN;

-- Save existing data in a temporary table
CREATE TEMPORARY TABLE temp_discussion_refs AS
SELECT dissthread_id, 
       reference_type, 
       reference_id,
       problem_id,
       contest_id,
       group_id
FROM discussion_thread;

-- First drop any existing triggers and functions that might be using the old columns
DROP TRIGGER IF EXISTS validate_discussion_reference_trigger ON discussion_thread;
DROP TRIGGER IF EXISTS validate_discussion_reference ON discussion_thread;
DROP FUNCTION IF EXISTS validate_discussion_reference() CASCADE;

-- Drop existing constraints if they exist
ALTER TABLE discussion_thread DROP CONSTRAINT IF EXISTS check_reference_or_general;
ALTER TABLE discussion_thread DROP CONSTRAINT IF EXISTS discussion_thread_reference_type_check;

-- Update data to ensure consistency
UPDATE discussion_thread
SET problem_id = CAST(reference_id AS INTEGER)
WHERE reference_type = 'problem'
AND problem_id IS NULL;

UPDATE discussion_thread
SET contest_id = CAST(reference_id AS INTEGER)
WHERE reference_type = 'contest'
AND contest_id IS NULL;

UPDATE discussion_thread
SET group_id = CAST(reference_id AS INTEGER)
WHERE reference_type = 'group'
AND group_id IS NULL;

-- Ensure thread_type is set correctly
UPDATE discussion_thread
SET thread_type = reference_type
WHERE thread_type IS NULL AND reference_type IS NOT NULL;

UPDATE discussion_thread
SET thread_type = 'general'
WHERE thread_type IS NULL;

-- Create a new validation function that's more flexible
CREATE OR REPLACE FUNCTION validate_discussion_thread()
RETURNS trigger AS $$
BEGIN
    -- For general threads, ensure no references
    IF NEW.thread_type = 'general' THEN
        NEW.problem_id := NULL;
        NEW.contest_id := NULL;
        NEW.group_id := NULL;
    ELSE
        -- Set thread_type based on which reference is provided
        IF NEW.problem_id IS NOT NULL THEN
            NEW.thread_type := 'problem';
            NEW.contest_id := NULL;
            NEW.group_id := NULL;
        ELSIF NEW.contest_id IS NOT NULL THEN
            NEW.thread_type := 'contest';
            NEW.problem_id := NULL;
            NEW.group_id := NULL;
        ELSIF NEW.group_id IS NOT NULL THEN
            NEW.thread_type := 'group';
            NEW.problem_id := NULL;
            NEW.contest_id := NULL;
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

-- Add check constraint
ALTER TABLE discussion_thread
ADD CONSTRAINT check_reference_or_general
CHECK (
    (thread_type = 'general' AND problem_id IS NULL AND contest_id IS NULL AND group_id IS NULL)
    OR
    (thread_type = 'problem' AND problem_id IS NOT NULL AND contest_id IS NULL AND group_id IS NULL)
    OR
    (thread_type = 'contest' AND contest_id IS NOT NULL AND problem_id IS NULL AND group_id IS NULL)
    OR
    (thread_type = 'group' AND group_id IS NOT NULL AND problem_id IS NULL AND contest_id IS NULL)
);

-- Create indices for better performance
DROP INDEX IF EXISTS idx_discussion_thread_problem;
DROP INDEX IF EXISTS idx_discussion_thread_contest;
DROP INDEX IF EXISTS idx_discussion_thread_group;
DROP INDEX IF EXISTS idx_discussion_thread_general;

CREATE INDEX idx_discussion_thread_problem ON discussion_thread(problem_id) WHERE problem_id IS NOT NULL;
CREATE INDEX idx_discussion_thread_contest ON discussion_thread(contest_id) WHERE contest_id IS NOT NULL;
CREATE INDEX idx_discussion_thread_group ON discussion_thread(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX idx_discussion_thread_general ON discussion_thread(thread_type) WHERE thread_type = 'general';

-- Now it's safe to drop the old columns
ALTER TABLE discussion_thread
DROP COLUMN IF EXISTS reference_type,
DROP COLUMN IF EXISTS reference_id;

COMMIT;
