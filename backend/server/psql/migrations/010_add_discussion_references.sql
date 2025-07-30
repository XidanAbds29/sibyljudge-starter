-- Migration to add reference type and constraints to discussion_thread
ALTER TABLE discussion_thread
ADD COLUMN reference_type VARCHAR(50);

-- Add check constraint for valid reference types
ALTER TABLE discussion_thread
ADD CONSTRAINT discussion_thread_reference_type_check 
CHECK (reference_type IN ('problem', 'contest', 'group', NULL));

-- Create a function to validate references
CREATE OR REPLACE FUNCTION validate_discussion_reference()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for NULL consistency
  IF (NEW.reference_type IS NULL AND NEW.reference_id IS NOT NULL) OR
     (NEW.reference_type IS NOT NULL AND NEW.reference_id IS NULL) THEN
    RAISE EXCEPTION 'Both reference_type and reference_id must be either NULL or non-NULL';
  END IF;

  -- If both are NULL, that's valid
  IF NEW.reference_type IS NULL AND NEW.reference_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check references based on type
  CASE NEW.reference_type
    WHEN 'problem' THEN
      IF NOT EXISTS (SELECT 1 FROM "Problem" WHERE problem_id = NEW.reference_id) THEN
        RAISE EXCEPTION 'Invalid problem reference';
      END IF;
    WHEN 'contest' THEN
      IF NOT EXISTS (SELECT 1 FROM contest WHERE contest_id = NEW.reference_id) THEN
        RAISE EXCEPTION 'Invalid contest reference';
      END IF;
    WHEN 'group' THEN
      IF NOT EXISTS (SELECT 1 FROM "group" WHERE group_id = NEW.reference_id) THEN
        RAISE EXCEPTION 'Invalid group reference';
      END IF;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reference validation
DROP TRIGGER IF EXISTS validate_discussion_reference_trigger ON discussion_thread;
CREATE TRIGGER validate_discussion_reference_trigger
  BEFORE INSERT OR UPDATE ON discussion_thread
  FOR EACH ROW
  EXECUTE FUNCTION validate_discussion_reference();
