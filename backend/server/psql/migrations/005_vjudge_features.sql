-- =============================================
-- User Related -- 1. Function: Get problem solve rate
CREATE OR REPLACE FUNCTION get_problem_solve_rate(p_problem_id INT)
RETURNS FLOAT AS $$
DECLARE
    total INT;
    accepted INT;
BEGIN
    SELECT 
        COUNT(DISTINCT user_id),
        COUNT(DISTINCT CASE WHEN status = 'Accepted' THEN user_id END)
    INTO total, accepted
    FROM submission
    WHERE problem_id = p_problem_id;Triggers
-- =============================================

-- 1. Function: Get total accepted submissions for a user
CREATE OR REPLACE FUNCTION get_accepted_submission_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM submission 
        WHERE user_id = p_user_id AND status = 'Accepted'
    );
END;
$$ LANGUAGE plpgsql;

-- 2. Function: Calculate user's solve rate
CREATE OR REPLACE FUNCTION get_user_solve_rate(p_user_id UUID)
RETURNS FLOAT AS $$
DECLARE
    total INT;
    accepted INT;
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'Accepted')
    INTO total, accepted
    FROM submission
    WHERE user_id = p_user_id;
  
  IF total = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (accepted::FLOAT / total::FLOAT) * 100;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger: Update user's submission statistics
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

-- Create trigger for submission statistics
DROP TRIGGER IF EXISTS trg_update_user_statistics ON submission;
CREATE TRIGGER trg_update_user_statistics
AFTER INSERT ON submission
FOR EACH ROW
EXECUTE FUNCTION update_user_statistics();

-- =============================================
-- Problem Related Functions and Triggers
-- =============================================

-- 1. Function: Get problem solve rate
CREATE OR REPLACE FUNCTION get_problem_solve_rate(p_problem_id INT)
RETURNS FLOAT AS $$
DECLARE
  total INT;
  accepted INT;
BEGIN
  SELECT 
    COUNT(DISTINCT profile_id),
    COUNT(DISTINCT CASE WHEN verdict = 'Accepted' THEN profile_id END)
  INTO total, accepted
  FROM contest_submission cs
  JOIN contest_problem cp ON cs.contest_problem_id = cp.id
  WHERE cp.problem_id = p_problem_id;
  
  IF total = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (accepted::FLOAT / total::FLOAT) * 100;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger: Auto-update updated_at on problem changes
CREATE OR REPLACE FUNCTION update_problem_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_problem_timestamp ON problem;
CREATE TRIGGER trg_update_problem_timestamp
BEFORE UPDATE ON problem
FOR EACH ROW
EXECUTE FUNCTION update_problem_timestamp();

-- =============================================
-- Submission Related Functions and Triggers
-- =============================================

-- 1. Trigger: Prevent duplicate accepted submissions
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

-- =============================================
-- Discussion Related Functions and Procedures
-- =============================================

-- 1. Procedure: Archive old discussion threads (older than 1 year)
CREATE OR REPLACE PROCEDURE archive_old_discussions()
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE discussion_thread SET archived = TRUE WHERE updated_at < timezone('utc'::text, now()) - INTERVAL '1 year';
END;
$$;

-- =============================================
-- Maintenance Procedures
-- =============================================

-- 1. Procedure: Clean up old temporary data
CREATE OR REPLACE PROCEDURE cleanup_old_temp_data(days_old INT)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete old temporary submissions
  DELETE FROM contest_submission 
  WHERE verdict = 'Processing' 
  AND created_at < timezone('utc'::text, now()) - (days_old || ' days')::INTERVAL;
  
  -- Add more cleanup tasks as needed
  COMMIT;
END;
$$;

-- =============================================
-- Add Required Columns and Functions
-- =============================================

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  -- Add archived column to discussion_thread if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='discussion_thread' AND column_name='archived'
  ) THEN
    ALTER TABLE discussion_thread ADD COLUMN archived BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add total_submissions and accepted_submissions to profiles table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='total_submissions'
  ) THEN
    ALTER TABLE profiles ADD COLUMN total_submissions INT DEFAULT 0;
    ALTER TABLE profiles ADD COLUMN accepted_submissions INT DEFAULT 0;
  END IF;

  -- Add is_duplicate to submission table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='submission' AND column_name='is_duplicate'
  ) THEN
    ALTER TABLE submission ADD COLUMN is_duplicate BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add updated_at trigger to profiles if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_profiles_updated'
  ) THEN
    CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
  END IF;
END$$;
