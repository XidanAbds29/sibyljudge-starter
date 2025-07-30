-- Migration to update discussion thread references
ALTER TABLE discussion_thread
DROP CONSTRAINT IF EXISTS discussion_thread_reference_type_check;

-- Add a proper check constraint for reference_type
ALTER TABLE discussion_thread
ADD CONSTRAINT discussion_thread_reference_type_check
CHECK (reference_type IN ('problem', 'contest', 'group'));

-- Add indices to improve join performance
CREATE INDEX IF NOT EXISTS idx_discussion_thread_reference_problem 
ON discussion_thread(reference_id) 
WHERE reference_type = 'problem';

CREATE INDEX IF NOT EXISTS idx_discussion_thread_reference_contest 
ON discussion_thread(reference_id) 
WHERE reference_type = 'contest';

CREATE INDEX IF NOT EXISTS idx_discussion_thread_reference_group 
ON discussion_thread(reference_id) 
WHERE reference_type = 'group';
