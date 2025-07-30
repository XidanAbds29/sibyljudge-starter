-- Migration to add proper foreign key relationships for discussion threads

-- First, add separate columns for each reference type
ALTER TABLE discussion_thread
ADD COLUMN problem_id INTEGER NULL,
ADD COLUMN contest_id INTEGER NULL,
ADD COLUMN group_id INTEGER NULL;

-- Migrate existing data
UPDATE discussion_thread
SET problem_id = CAST(reference_id AS INTEGER)
WHERE reference_type = 'problem';

UPDATE discussion_thread
SET contest_id = CAST(reference_id AS INTEGER)
WHERE reference_type = 'contest';

UPDATE discussion_thread
SET group_id = CAST(reference_id AS INTEGER)
WHERE reference_type = 'group';

-- Clean up any invalid references (where reference_id points to non-existent records)
UPDATE discussion_thread
SET problem_id = NULL
WHERE problem_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM "Problem" WHERE problem_id = discussion_thread.problem_id);

UPDATE discussion_thread
SET contest_id = NULL
WHERE contest_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM "contest" WHERE contest_id = discussion_thread.contest_id);

UPDATE discussion_thread
SET group_id = NULL
WHERE group_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM "group" WHERE group_id = discussion_thread.group_id);

-- Ensure general threads have no references
UPDATE discussion_thread
SET problem_id = NULL,
    contest_id = NULL,
    group_id = NULL
WHERE thread_type = 'general';

-- Add foreign key constraints
ALTER TABLE discussion_thread
ADD CONSTRAINT fk_discussion_thread_problem
FOREIGN KEY (problem_id) REFERENCES "Problem"(problem_id)
ON DELETE CASCADE;

ALTER TABLE discussion_thread
ADD CONSTRAINT fk_discussion_thread_contest
FOREIGN KEY (contest_id) REFERENCES "contest"(contest_id)
ON DELETE CASCADE;

ALTER TABLE discussion_thread
ADD CONSTRAINT fk_discussion_thread_group
FOREIGN KEY (group_id) REFERENCES "group"(group_id)
ON DELETE CASCADE;

-- Add check constraint that handles both general and referenced threads
ALTER TABLE discussion_thread
ADD CONSTRAINT check_reference_or_general
CHECK (
    (thread_type = 'general' AND problem_id IS NULL AND contest_id IS NULL AND group_id IS NULL)
    OR
    (thread_type != 'general' AND
     (CASE WHEN problem_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN contest_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN group_id IS NOT NULL THEN 1 ELSE 0 END) = 1)
);

-- Drop old columns
ALTER TABLE discussion_thread
DROP COLUMN reference_type,
DROP COLUMN reference_id;

-- Add indices for better performance
CREATE INDEX idx_discussion_thread_problem_id ON discussion_thread(problem_id) WHERE problem_id IS NOT NULL;
CREATE INDEX idx_discussion_thread_contest_id ON discussion_thread(contest_id) WHERE contest_id IS NOT NULL;
CREATE INDEX idx_discussion_thread_group_id ON discussion_thread(group_id) WHERE group_id IS NOT NULL;

-- Add index for general threads
CREATE INDEX idx_discussion_thread_general ON discussion_thread(thread_type) WHERE thread_type = 'general';
