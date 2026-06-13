-- Combined migrations for SibylJudge database
-- Run this in the Supabase SQL Editor AFTER running init_schema.sql

-- =============================================
-- MIGRATION: 001_add_sections.sql
-- =============================================
-- Add sections columns to problem table
ALTER TABLE problem 
ADD COLUMN IF NOT EXISTS statement_html TEXT,
ADD COLUMN IF NOT EXISTS input_spec TEXT,
ADD COLUMN IF NOT EXISTS output_spec TEXT,
ADD COLUMN IF NOT EXISTS samples JSONB;


-- =============================================
-- MIGRATION: 002_add_problem_sections.sql
-- =============================================
-- Add missing problem section columns
ALTER TABLE problem 
ADD COLUMN IF NOT EXISTS statement_html TEXT,
ADD COLUMN IF NOT EXISTS input_spec TEXT,
ADD COLUMN IF NOT EXISTS output_spec TEXT,
ADD COLUMN IF NOT EXISTS samples JSONB;


-- =============================================
-- MIGRATION: 003_add_problem_unique_constraint.sql
-- =============================================
-- Add unique constraint for (source_oj_id, external_id)
ALTER TABLE problem
ADD CONSTRAINT problem_source_external_unique UNIQUE (source_oj_id, external_id);


-- =============================================
-- MIGRATION: 004_add_mem_taken_column.sql
-- =============================================
-- Add mem_taken column to Submission table
ALTER TABLE Submission ADD COLUMN IF NOT EXISTS mem_taken INT;

-- Add comment for clarity
COMMENT ON COLUMN Submission.mem_taken IS 'Memory usage in KB during execution';


-- =============================================
-- MIGRATION: 004_admin_leave_trigger.sql
-- =============================================
-- Migration: Admin Leave Group Trigger
-- This trigger detects when an admin leaves a group and ensures proper cleanup

-- First, create a function to check if user is admin and handle group deletion
CREATE OR REPLACE FUNCTION check_admin_leave_group()
RETURNS TRIGGER AS $$
DECLARE
    admin_count INTEGER;
    creator_id UUID;
    is_creator BOOLEAN := FALSE;
BEGIN
    -- Check if the deleted member was an admin
    IF OLD.role = 'admin' THEN
        -- Get the creator of the group
        SELECT created_by INTO creator_id
        FROM group_creation
        WHERE group_id = OLD.group_id;
        
        -- Check if the leaving user is the creator
        IF creator_id = OLD.user_id THEN
            is_creator := TRUE;
        END IF;
        
        -- Count remaining admins in the group
        SELECT COUNT(*) INTO admin_count
        FROM group_member
        WHERE group_id = OLD.group_id 
        AND role = 'admin'
        AND user_id != OLD.user_id;  -- Exclude the user who is leaving
        
        -- If no admins remain or if the creator is leaving, delete the entire group
        IF admin_count = 0 OR is_creator THEN
            -- Log the group deletion (optional)
            INSERT INTO notification (user_id, type, reference_id, title, message, group_id)
            SELECT 
                gm.user_id,
                'group_deleted',
                OLD.group_id,
                'Group Deleted',
                'The group "' || g.name || '" has been automatically deleted because the admin left.',
                OLD.group_id
            FROM group_member gm
            JOIN "group" g ON g.group_id = OLD.group_id
            WHERE gm.group_id = OLD.group_id 
            AND gm.user_id != OLD.user_id;  -- Notify all other members
            
            -- Delete all related records in proper order to avoid foreign key violations
            
            -- Delete all notifications related to this group
            DELETE FROM notification WHERE group_id = OLD.group_id;
            
            -- Delete all group members (remaining members)
            DELETE FROM group_member WHERE group_id = OLD.group_id AND user_id != OLD.user_id;
            
            -- Delete group creation record
            DELETE FROM group_creation WHERE group_id = OLD.group_id;
            
            -- Finally delete the group itself
            DELETE FROM "group" WHERE group_id = OLD.group_id;
            
            -- Log successful deletion
            RAISE NOTICE 'Group % automatically deleted due to admin departure', OLD.group_id;
        END IF;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on Group_member table
DROP TRIGGER IF EXISTS admin_leave_group_trigger ON group_member;

CREATE TRIGGER admin_leave_group_trigger
    AFTER DELETE ON group_member
    FOR EACH ROW
    EXECUTE FUNCTION check_admin_leave_group();

-- Create a function to check admin status before allowing leave
CREATE OR REPLACE FUNCTION check_admin_leave_warning(
    p_group_id INTEGER,
    p_user_id UUID
)
RETURNS TABLE (
    is_admin BOOLEAN,
    is_creator BOOLEAN,
    admin_count INTEGER,
    will_delete_group BOOLEAN,
    group_name TEXT
) AS $$
DECLARE
    creator_id UUID;
    user_role TEXT;
    remaining_admins INTEGER;
    g_name TEXT;
BEGIN
    -- Get group name
    SELECT name INTO g_name FROM "group" WHERE group_id = p_group_id;
    
    -- Get user's role in the group
    SELECT role INTO user_role FROM group_member 
    WHERE group_id = p_group_id AND user_id = p_user_id;
    
    -- Get the creator of the group
    SELECT created_by INTO creator_id
    FROM group_creation
    WHERE group_id = p_group_id;
    
    -- Count admins excluding the user who wants to leave
    SELECT COUNT(*) INTO remaining_admins
    FROM group_member
    WHERE group_id = p_group_id 
    AND role = 'admin'
    AND user_id != p_user_id;
    
    -- Return the analysis
    RETURN QUERY SELECT
        (user_role = 'admin')::BOOLEAN as is_admin,
        (creator_id = p_user_id)::BOOLEAN as is_creator,
        remaining_admins as admin_count,
        ((user_role = 'admin' AND remaining_admins = 0) OR (creator_id = p_user_id))::BOOLEAN as will_delete_group,
        g_name as group_name;
END;
$$ LANGUAGE plpgsql;


-- =============================================
-- MIGRATION: 005_vjudge_features.sql
-- =============================================
-- =============================================
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


-- =============================================
-- MIGRATION: 006_user_statistics_trigger.sql
-- =============================================
-- Add required columns to profiles table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='profiles' AND column_name='total_submissions'
    ) THEN
        ALTER TABLE profiles ADD COLUMN total_submissions INT DEFAULT 0;
        ALTER TABLE profiles ADD COLUMN accepted_submissions INT DEFAULT 0;
    END IF;
END$$;

-- Create the trigger function
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

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trg_update_user_statistics ON submission;

-- Create the trigger
CREATE TRIGGER trg_update_user_statistics
    AFTER INSERT ON submission
    FOR EACH ROW
    EXECUTE FUNCTION update_user_statistics();


-- =============================================
-- MIGRATION: 007_duplicate_check_trigger.sql
-- =============================================
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


-- =============================================
-- MIGRATION: 008_timestamp_trigger.sql
-- =============================================
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


-- =============================================
-- MIGRATION: 009_notification_system.sql
-- =============================================
-- Notification Types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM (
            'contest_start',
            'contest_end',
            'thread_reply',
            'contest_registration',
            'editorial_update',
            'group_invite',
            'group_join',
            'badge_earned',
            'track_completed'
        );
    END IF;
END $$;

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id uuid,
    p_type notification_type,
    p_reference_id integer,
    p_title varchar(200),
    p_message text,
    p_group_id integer DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO notification (
        user_id,
        type,
        reference_id,
        title,
        message,
        group_id,
        created_at
    ) VALUES (
        p_user_id,
        p_type::varchar(50),
        p_reference_id,
        p_title,
        p_message,
        p_group_id,
        CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql;

-- Function to notify contest participants
CREATE OR REPLACE FUNCTION notify_contest_participants() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Notify all participants about contest start
        INSERT INTO notification (user_id, type, reference_id, title, message)
        SELECT 
            up.user_id,
            'contest_start',
            NEW.contest_id,
            'Contest Starting Soon: ' || NEW.name,
            'The contest "' || NEW.name || '" will start at ' || NEW.start_time || '.'
        FROM user_participant up
        WHERE up.contest_id = NEW.contest_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify about discussion replies
CREATE OR REPLACE FUNCTION notify_discussion_replies() RETURNS trigger AS $$
DECLARE
    thread_title text;
    original_poster uuid;
BEGIN
    -- Get thread title and original poster
    SELECT dt.title, dt.created_by
    INTO thread_title, original_poster
    FROM discussion_thread dt
    WHERE dt.dissthread_id = NEW.dissthread_id;

    -- Notify the thread creator
    IF original_poster != NEW.user_id THEN
        PERFORM create_notification(
            original_poster,
            'thread_reply'::notification_type,
            NEW.dissthread_id,
            'New Reply to Your Thread: ' || thread_title,
            'Someone has replied to your thread "' || thread_title || '"'
        );
    END IF;

    -- Notify other participants in the thread (except the current poster)
    INSERT INTO notification (user_id, type, reference_id, title, message)
    SELECT DISTINCT
        dp.user_id,
        'thread_reply',
        NEW.dissthread_id,
        'New Reply in Thread: ' || thread_title,
        'There is a new reply in a thread you participated in: "' || thread_title || '"'
    FROM discussion_post dp
    WHERE dp.dissthread_id = NEW.dissthread_id
    AND dp.user_id != NEW.user_id
    AND dp.user_id != original_poster;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify about editorial updates
CREATE OR REPLACE FUNCTION notify_editorial_updates() RETURNS trigger AS $$
DECLARE
    problem_title text;
BEGIN
    -- Get problem title
    SELECT title INTO problem_title
    FROM public.problem p
    WHERE p.problem_id = NEW.problem_id;

    -- Notify users who attempted the problem
    INSERT INTO notification (user_id, type, reference_id, title, message)
    SELECT DISTINCT
        pr.user_id,
        'editorial_update',
        NEW.problem_id,
        'New Editorial: ' || problem_title,
        'An editorial has been published for problem "' || problem_title || '"'
    FROM personal_record pr
    WHERE pr.problem_id = NEW.problem_id
    AND pr.user_id != NEW.created_by;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify about track completion
CREATE OR REPLACE FUNCTION notify_track_completion() RETURNS trigger AS $$
DECLARE
    track_name text;
    total_problems integer;
    solved_problems integer;
BEGIN
    -- Get track name
    SELECT t.name INTO track_name
    FROM track t
    WHERE t.track_id = NEW.track_id;

    -- Count total and solved problems
    SELECT 
        COUNT(DISTINCT tp.problem_id),
        COUNT(DISTINCT CASE WHEN pr.status = 'solved' THEN pr.problem_id END)
    INTO total_problems, solved_problems
    FROM track_problem tp
    LEFT JOIN personal_record pr ON pr.problem_id = tp.problem_id AND pr.user_id = NEW.user_id
    WHERE tp.track_id = NEW.track_id;

    -- If all problems are solved, create completion notification
    IF total_problems = solved_problems AND total_problems > 0 THEN
        PERFORM create_notification(
            NEW.user_id,
            'track_completed'::notification_type,
            NEW.track_id,
            'Track Completed: ' || track_name,
            'Congratulations! You have completed all problems in the track "' || track_name || '"!'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify about badge awards
CREATE OR REPLACE FUNCTION notify_badge_award() RETURNS trigger AS $$
DECLARE
    badge_info record;
BEGIN
    -- Get badge details
    SELECT * INTO badge_info
    FROM badge
    WHERE badge_id = NEW.badge_id;

    -- Create notification for badge award
    PERFORM create_notification(
        NEW.user_id,
        'badge_earned'::notification_type,
        NEW.badge_id,
        'New Badge Earned: ' || badge_info.name,
        'Congratulations! You have earned the "' || badge_info.name || '" badge. ' || 
        COALESCE(badge_info.description, '')
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Triggers
CREATE TRIGGER contest_notification_trigger
    AFTER INSERT ON contest
    FOR EACH ROW
    EXECUTE FUNCTION notify_contest_participants();

CREATE TRIGGER discussion_reply_notification_trigger
    AFTER INSERT ON discussion_post
    FOR EACH ROW
    EXECUTE FUNCTION notify_discussion_replies();

CREATE TRIGGER editorial_update_notification_trigger
    AFTER INSERT ON problem_editorial
    FOR EACH ROW
    WHEN (NEW.status = 'published')
    EXECUTE FUNCTION notify_editorial_updates();

CREATE TRIGGER track_completion_notification_trigger
    AFTER INSERT OR UPDATE ON user_track_progress
    FOR EACH ROW
    EXECUTE FUNCTION notify_track_completion();

CREATE TRIGGER badge_award_notification_trigger
    AFTER INSERT ON user_badge
    FOR EACH ROW
    EXECUTE FUNCTION notify_badge_award();

-- Index for better notification queries
CREATE INDEX idx_notification_user_id ON notification(user_id);
CREATE INDEX idx_notification_created_at ON notification(created_at);
CREATE INDEX idx_notification_is_read ON notification(is_read);


-- =============================================
-- MIGRATION: 010_add_discussion_references.sql (Skipped - Schema already uses clean fields)
-- =============================================


-- =============================================
-- MIGRATION: 010_update_contest_submission_table.sql
-- =============================================
-- Migration to update contest_submission table structure
-- Add missing columns as described by user

-- First, check if we need to add columns to contest_submission table
-- The user mentioned it should have: user_participant_id, contest_id, user_id, joined_at

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contest_submission' AND column_name = 'user_id') THEN
        ALTER TABLE contest_submission ADD COLUMN user_id UUID REFERENCES profiles(id);
    END IF;
END $$;

-- Add user_participant_id column if it doesn't exist  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contest_submission' AND column_name = 'user_participant_id') THEN
        ALTER TABLE contest_submission ADD COLUMN user_participant_id INT REFERENCES user_participant(user_participant_id);
    END IF;
END $$;

-- Add joined_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contest_submission' AND column_name = 'joined_at') THEN
        ALTER TABLE contest_submission ADD COLUMN joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Update existing records to populate the new columns
UPDATE contest_submission cs
SET user_id = s.user_id,
    joined_at = s.submitted_at
FROM submission s
WHERE cs.submission_id = s.submission_id
  AND cs.user_id IS NULL;

-- Update user_participant_id
UPDATE contest_submission cs
SET user_participant_id = up.user_participant_id
FROM user_participant up
WHERE cs.contest_id = up.contest_id 
  AND cs.user_id = up.user_id
  AND cs.user_participant_id IS NULL;


-- =============================================
-- MIGRATION: discussion_thread_setup.sql
-- =============================================
-- Setup foreign keys, triggers, constraints and indexes for discussion_thread table

-- 1. Ensure foreign key constraints on the base tables
ALTER TABLE public.discussion_thread DROP CONSTRAINT IF EXISTS fk_discussion_thread_problem;
ALTER TABLE public.discussion_thread
ADD CONSTRAINT fk_discussion_thread_problem
FOREIGN KEY (problem_id) REFERENCES public.problem(problem_id)
ON DELETE CASCADE;

ALTER TABLE public.discussion_thread DROP CONSTRAINT IF EXISTS fk_discussion_thread_contest;
ALTER TABLE public.discussion_thread
ADD CONSTRAINT fk_discussion_thread_contest
FOREIGN KEY (contest_id) REFERENCES public.contest(contest_id)
ON DELETE CASCADE;

ALTER TABLE public.discussion_thread DROP CONSTRAINT IF EXISTS fk_discussion_thread_group;
ALTER TABLE public.discussion_thread
ADD CONSTRAINT fk_discussion_thread_group
FOREIGN KEY (group_id) REFERENCES public."group"(group_id)
ON DELETE CASCADE;

-- 2. Drop any old validation triggers and functions
DROP TRIGGER IF EXISTS validate_discussion_thread_trigger ON public.discussion_thread;
DROP FUNCTION IF EXISTS public.validate_discussion_thread() CASCADE;

-- 3. Create the new validation function
CREATE OR REPLACE FUNCTION public.validate_discussion_thread()
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

-- 4. Create trigger
CREATE TRIGGER validate_discussion_thread_trigger
    BEFORE INSERT OR UPDATE ON public.discussion_thread
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_discussion_thread();

-- 5. Add check constraint
ALTER TABLE public.discussion_thread DROP CONSTRAINT IF EXISTS check_reference_or_general;
ALTER TABLE public.discussion_thread
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

-- 6. Create indexes for better query performance
DROP INDEX IF EXISTS public.idx_discussion_thread_problem;
DROP INDEX IF EXISTS public.idx_discussion_thread_contest;
DROP INDEX IF EXISTS public.idx_discussion_thread_group;
DROP INDEX IF EXISTS public.idx_discussion_thread_general;

CREATE INDEX idx_discussion_thread_problem ON public.discussion_thread(problem_id) WHERE problem_id IS NOT NULL;
CREATE INDEX idx_discussion_thread_contest ON public.discussion_thread(contest_id) WHERE contest_id IS NOT NULL;
CREATE INDEX idx_discussion_thread_group ON public.discussion_thread(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX idx_discussion_thread_general ON public.discussion_thread(thread_type) WHERE thread_type = 'general';


-- =============================================
-- MIGRATION: personal_record_and_track_progress.sql
-- =============================================
-- Add unique constraint to personal_record if not present
ALTER TABLE public.personal_record DROP CONSTRAINT IF EXISTS personal_record_user_problem_unique;
ALTER TABLE public.personal_record ADD CONSTRAINT personal_record_user_problem_unique UNIQUE (user_id, problem_id);

-- Trigger to automatically update personal_record when a new submission is created
CREATE OR REPLACE FUNCTION public.update_personal_record()
RETURNS trigger AS $$
DECLARE
    is_solved BOOLEAN;
BEGIN
    is_solved := (NEW.status = 'Accepted');
    
    INSERT INTO public.personal_record (user_id, problem_id, status, attempts_count, first_attempted, last_attempted, solved_at)
    VALUES (
        NEW.user_id,
        NEW.problem_id,
        CASE WHEN is_solved THEN 'solved' ELSE 'attempted' END,
        1,
        NEW.submitted_at,
        NEW.submitted_at,
        CASE WHEN is_solved THEN NEW.submitted_at ELSE NULL END
    )
    ON CONFLICT (user_id, problem_id) DO UPDATE SET
        attempts_count = personal_record.attempts_count + 1,
        last_attempted = NEW.submitted_at,
        status = CASE WHEN is_solved OR personal_record.status = 'solved' THEN 'solved' ELSE 'attempted' END,
        solved_at = CASE WHEN is_solved AND personal_record.solved_at IS NULL THEN NEW.submitted_at ELSE personal_record.solved_at END;
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_personal_record ON public.submission;
CREATE TRIGGER trg_update_personal_record
AFTER INSERT ON public.submission
FOR EACH ROW
EXECUTE FUNCTION public.update_personal_record();

-- Trigger to automatically update user_track_progress when personal_record changes to 'solved'
CREATE OR REPLACE FUNCTION public.update_track_progress()
RETURNS trigger AS $$
DECLARE
    r RECORD;
    total_problems INT;
    solved_problems INT;
    track_status VARCHAR;
BEGIN
    IF NEW.status = 'solved' AND (TG_OP = 'INSERT' OR OLD.status != 'solved') THEN
        FOR r IN 
            SELECT track_id FROM public.track_problem WHERE problem_id = NEW.problem_id
        LOOP
            -- Count total problems in this track
            SELECT COUNT(*) INTO total_problems
            FROM public.track_problem
            WHERE track_id = r.track_id;
            
            -- Count solved problems in this track by the user
            SELECT COUNT(DISTINCT tp.problem_id) INTO solved_problems
            FROM public.track_problem tp
            JOIN public.personal_record pr ON pr.problem_id = tp.problem_id
            WHERE tp.track_id = r.track_id
              AND pr.user_id = NEW.user_id
              AND pr.status = 'solved';
              
            IF solved_problems >= total_problems THEN
                track_status := 'completed';
            ELSE
                track_status := 'in_progress';
            END IF;
            
            INSERT INTO public.user_track_progress (user_id, track_id, status, updated_at)
            VALUES (NEW.user_id, r.track_id, track_status, NOW())
            ON CONFLICT (user_id, track_id) DO UPDATE SET
                status = track_status,
                updated_at = NOW();
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_track_progress ON public.personal_record;
CREATE TRIGGER trg_update_track_progress
AFTER INSERT OR UPDATE ON public.personal_record
FOR EACH ROW
EXECUTE FUNCTION public.update_track_progress();


-- =============================================
-- POST-MIGRATION: Create views for PostgREST case-sensitive queries
-- =============================================
CREATE OR REPLACE VIEW public."Problem" AS SELECT * FROM public.problem;
CREATE OR REPLACE VIEW public."Tag" AS SELECT * FROM public.tag;
CREATE OR REPLACE VIEW public."Problem_tag" AS SELECT * FROM public.problem_tag;
CREATE OR REPLACE VIEW public."Group" AS SELECT * FROM public."group";
