-- Add unique constraint for (source_oj_id, external_id)
ALTER TABLE Problem
ADD CONSTRAINT problem_source_external_unique UNIQUE (source_oj_id, external_id);
