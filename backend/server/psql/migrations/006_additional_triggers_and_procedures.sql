-- 1. Trigger: Update user's submission statistics
CREATE OR REPLACE FUNCTION update_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- This trigger will run after a new submission is inserted
  IF TG_OP = 'INSERT' THEN
    -- You might want to add these columns to your User table first
    UPDATE "User"
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
        AND verdict = 'Accepted'
      )
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for submission statistics
DROP TRIGGER IF EXISTS trg_update_user_statistics ON submission;
CREATE TRIGGER trg_update_user_statistics
AFTER INSERT ON submission
FOR EACH ROW
EXECUTE FUNCTION update_user_statistics();

-- 2. Function: Calculate user's solve rate
CREATE OR REPLACE FUNCTION get_user_solve_rate(p_user_id INT)
RETURNS FLOAT AS $$
DECLARE
  total INT;
  accepted INT;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE verdict = 'Accepted')
  INTO total, accepted
  FROM submission
  WHERE user_id = p_user_id;
  
  IF total = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (accepted::FLOAT / total::FLOAT) * 100;
END;
$$ LANGUAGE plpgsql;

-- 3. Procedure: Clean up old temporary data
CREATE OR REPLACE PROCEDURE cleanup_old_temp_data(days_old INT)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete old temporary submissions (if you have any temporary submission status)
  DELETE FROM submission 
  WHERE verdict = 'Processing' 
  AND created_at < NOW() - (days_old || ' days')::INTERVAL;
  
  -- Add more cleanup tasks as needed
  
  COMMIT;
END;
$$;

-- 4. Function: Get problem solve rate
CREATE OR REPLACE FUNCTION get_problem_solve_rate(p_problem_id INT)
RETURNS FLOAT AS $$
DECLARE
  total INT;
  accepted INT;
BEGIN
  SELECT 
    COUNT(DISTINCT user_id),
    COUNT(DISTINCT CASE WHEN verdict = 'Accepted' THEN user_id END)
  INTO total, accepted
  FROM submission
  WHERE problem_id = p_problem_id;
  
  IF total = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (accepted::FLOAT / total::FLOAT) * 100;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger: Prevent duplicate accepted submissions
CREATE OR REPLACE FUNCTION check_duplicate_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verdict = 'Accepted' THEN
    IF EXISTS (
      SELECT 1 
      FROM submission 
      WHERE user_id = NEW.user_id 
      AND problem_id = NEW.problem_id 
      AND verdict = 'Accepted'
    ) THEN
      -- Don't prevent the submission, but mark it as duplicate
      NEW.is_duplicate = TRUE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for duplicate submissions
DROP TRIGGER IF EXISTS trg_check_duplicate_accepted ON submission;
CREATE TRIGGER trg_check_duplicate_accepted
BEFORE INSERT ON submission
FOR EACH ROW
EXECUTE FUNCTION check_duplicate_accepted();

-- Add required columns if they don't exist
DO $$
BEGIN
  -- Add total_submissions and accepted_submissions to User table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='user' AND column_name='total_submissions'
  ) THEN
    ALTER TABLE "User" ADD COLUMN total_submissions INT DEFAULT 0;
    ALTER TABLE "User" ADD COLUMN accepted_submissions INT DEFAULT 0;
  END IF;

  -- Add is_duplicate to submission table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='submission' AND column_name='is_duplicate'
  ) THEN
    ALTER TABLE submission ADD COLUMN is_duplicate BOOLEAN DEFAULT FALSE;
  END IF;
END$$;
