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
