-- Lowercase Schema Initialization Script for SibylJudge Database
-- Run this in the Supabase SQL Editor first

-- 1. Drop existing tables and views if they exist safely
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop views if they exist
    FOR r IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
          AND viewname IN ('Problem', 'Tag', 'Problem_tag', 'Group', 'User')
    LOOP
        EXECUTE 'DROP VIEW public.' || quote_ident(r.viewname) || ' CASCADE';
    END LOOP;

    -- Drop tables if they exist
    FOR r IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename IN ('Problem', 'Tag', 'Problem_tag', 'Group', 'User')
    LOOP
        EXECUTE 'DROP TABLE public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

DROP TABLE IF EXISTS public.user_track_progress CASCADE;
DROP TABLE IF EXISTS public.user_rating CASCADE;
DROP TABLE IF EXISTS public.user_participant CASCADE;
DROP TABLE IF EXISTS public.user_badge CASCADE;
DROP TABLE IF EXISTS public.track_problem CASCADE;
DROP TABLE IF EXISTS public.track CASCADE;
DROP TABLE IF EXISTS public.recommendation CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.problem_editorial CASCADE;
DROP TABLE IF EXISTS public.personal_record CASCADE;
DROP TABLE IF EXISTS public.notification CASCADE;
DROP TABLE IF EXISTS public.group_member CASCADE;
DROP TABLE IF EXISTS public.group_creation CASCADE;
DROP TABLE IF EXISTS public.group_chat CASCADE;
DROP TABLE IF EXISTS public."group" CASCADE;
DROP TABLE IF EXISTS public.follow CASCADE;
DROP TABLE IF EXISTS public.fav_prob CASCADE;
DROP TABLE IF EXISTS public.editorial_approval CASCADE;
DROP TABLE IF EXISTS public.discussion_view CASCADE;
DROP TABLE IF EXISTS public.discussion_thread CASCADE;
DROP TABLE IF EXISTS public.discussion_post CASCADE;
DROP TABLE IF EXISTS public.discussion_like CASCADE;
DROP TABLE IF EXISTS public.contest_submission CASCADE;
DROP TABLE IF EXISTS public.contest_problem CASCADE;
DROP TABLE IF EXISTS public.contest_creation CASCADE;
DROP TABLE IF EXISTS public.contest CASCADE;
DROP TABLE IF EXISTS public.submission CASCADE;
DROP TABLE IF EXISTS public.badge CASCADE;
DROP TABLE IF EXISTS public.problem_tag CASCADE;
DROP TABLE IF EXISTS public.tag CASCADE;
DROP TABLE IF EXISTS public.problem CASCADE;
DROP TABLE IF EXISTS public.online_judge CASCADE;

-- 2. Create tables
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username character varying NOT NULL UNIQUE,
  institution character varying,
  bio character varying,
  is_admin boolean NOT NULL DEFAULT false,
  total_submissions integer DEFAULT 0,
  accepted_submissions integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.online_judge (
  judge_id SERIAL PRIMARY KEY,
  name character varying NOT NULL,
  api_based_url text
);

CREATE TABLE public.problem (
  problem_id SERIAL PRIMARY KEY,
  source_oj_id integer NOT NULL REFERENCES public.online_judge(judge_id) ON DELETE CASCADE,
  external_id character varying NOT NULL,
  title character varying NOT NULL,
  url text,
  difficulty character varying,
  time_limit integer NOT NULL,
  mem_limit integer NOT NULL,
  statement_html text,
  input_spec text,
  output_spec text,
  samples jsonb,
  fetched_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.tag (
  tag_id SERIAL PRIMARY KEY,
  name character varying NOT NULL UNIQUE
);

CREATE TABLE public.problem_tag (
  problem_id integer NOT NULL REFERENCES public.problem(problem_id) ON DELETE CASCADE,
  tag_id integer NOT NULL REFERENCES public.tag(tag_id) ON DELETE CASCADE,
  PRIMARY KEY (problem_id, tag_id)
);

CREATE TABLE public.submission (
  submission_id SERIAL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id integer NOT NULL REFERENCES public.problem(problem_id) ON DELETE CASCADE,
  language character varying,
  status character varying,
  exec_time double precision,
  submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  solution_code text,
  mem_taken double precision,
  output text,
  is_duplicate boolean DEFAULT false
);

CREATE TABLE public.contest (
  contest_id SERIAL PRIMARY KEY,
  name character varying NOT NULL,
  password_hash text,
  start_time timestamp without time zone,
  end_time timestamp without time zone,
  is_virtual boolean DEFAULT false,
  is_secured boolean DEFAULT false,
  difficulty character varying,
  description character varying
);

CREATE TABLE public.contest_creation (
  creation_id SERIAL PRIMARY KEY,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contest_id integer NOT NULL REFERENCES public.contest(contest_id) ON DELETE CASCADE
);

CREATE TABLE public.contest_problem (
  contest_id integer NOT NULL REFERENCES public.contest(contest_id) ON DELETE CASCADE,
  problem_id integer NOT NULL REFERENCES public.problem(problem_id) ON DELETE CASCADE,
  alias character varying,
  PRIMARY KEY (contest_id, problem_id)
);

CREATE TABLE public.contest_submission (
  con_sub_id SERIAL PRIMARY KEY,
  contest_id integer NOT NULL REFERENCES public.contest(contest_id) ON DELETE CASCADE,
  submission_id integer NOT NULL REFERENCES public.submission(submission_id) ON DELETE CASCADE,
  problem_id integer REFERENCES public.problem(problem_id) ON DELETE CASCADE
);

CREATE TABLE public.discussion_thread (
  dissthread_id SERIAL PRIMARY KEY,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title character varying NOT NULL,
  thread_type character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  view_count integer DEFAULT 0,
  problem_id integer REFERENCES public.problem(problem_id) ON DELETE CASCADE,
  contest_id integer REFERENCES public.contest(contest_id) ON DELETE CASCADE,
  group_id integer,
  archived boolean DEFAULT false
);

CREATE TABLE public.discussion_post (
  disspost_id SERIAL PRIMARY KEY,
  dissthread_id integer NOT NULL REFERENCES public.discussion_thread(dissthread_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text,
  posted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  likes integer DEFAULT 0
);

CREATE TABLE public.discussion_like (
  like_id SERIAL PRIMARY KEY,
  post_id integer REFERENCES public.discussion_post(disspost_id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.discussion_view (
  view_id SERIAL PRIMARY KEY,
  thread_id integer REFERENCES public.discussion_thread(dissthread_id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_viewed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.problem_editorial (
  probed_id SERIAL PRIMARY KEY,
  problem_id integer NOT NULL REFERENCES public.problem(problem_id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text,
  status character varying NOT NULL DEFAULT 'draft'::character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone
);

CREATE TABLE public.editorial_approval (
  approval_id SERIAL PRIMARY KEY,
  probed_id integer NOT NULL REFERENCES public.problem_editorial(probed_id) ON DELETE CASCADE,
  approved_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  approved_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.badge (
  badge_id SERIAL PRIMARY KEY,
  name character varying NOT NULL,
  icon_url text,
  description text
);

CREATE TABLE public.user_badge (
  badge_id integer NOT NULL REFERENCES public.badge(badge_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  awarded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (badge_id, user_id)
);

CREATE TABLE public.follow (
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  awarded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, followee_id)
);

CREATE TABLE public."group" (
  group_id SERIAL PRIMARY KEY,
  name character varying NOT NULL,
  description text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  is_private boolean NOT NULL DEFAULT false,
  password_hash text
);

CREATE TABLE public.group_creation (
  grp_crt_id SERIAL PRIMARY KEY,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id integer NOT NULL REFERENCES public."group"(group_id) ON DELETE CASCADE
);

CREATE TABLE public.group_member (
  group_member_id SERIAL PRIMARY KEY,
  group_id integer NOT NULL REFERENCES public."group"(group_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  role character varying NOT NULL DEFAULT 'member'::character varying
);

CREATE TABLE public.group_chat (
  chat_id SERIAL PRIMARY KEY,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  chat_content text,
  group_id integer REFERENCES public."group"(group_id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  edited_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.notification (
  notification_id SERIAL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type character varying NOT NULL,
  reference_id integer,
  title character varying NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  read_at timestamp without time zone,
  group_id integer REFERENCES public."group"(group_id) ON DELETE CASCADE
);

CREATE TABLE public.personal_record (
  record_id SERIAL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id integer NOT NULL REFERENCES public.problem(problem_id) ON DELETE CASCADE,
  status character varying NOT NULL DEFAULT 'attempted'::character varying,
  attempts_count integer NOT NULL DEFAULT 0,
  first_attempted timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  last_attempted timestamp without time zone,
  solved_at timestamp without time zone,
  CONSTRAINT personal_record_user_problem_unique UNIQUE (user_id, problem_id)
);

CREATE TABLE public.recommendation (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id integer NOT NULL REFERENCES public.problem(problem_id) ON DELETE CASCADE,
  score double precision,
  generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, problem_id)
);

CREATE TABLE public.track (
  track_id SERIAL PRIMARY KEY,
  name character varying NOT NULL,
  description text,
  generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.track_problem (
  track_id integer NOT NULL REFERENCES public.track(track_id) ON DELETE CASCADE,
  problem_id integer NOT NULL REFERENCES public.problem(problem_id) ON DELETE CASCADE,
  ordinal integer,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (track_id, problem_id)
);

CREATE TABLE public.user_participant (
  user_participant_id SERIAL PRIMARY KEY,
  contest_id integer NOT NULL REFERENCES public.contest(contest_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.user_rating (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contest_id integer NOT NULL REFERENCES public.contest(contest_id) ON DELETE CASCADE,
  rating_performance integer,
  PRIMARY KEY (user_id, contest_id)
);

CREATE TABLE public.user_track_progress (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id integer NOT NULL REFERENCES public.track(track_id) ON DELETE CASCADE,
  status character varying,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, track_id)
);

CREATE TABLE public.fav_prob (
  fav_prob_id SERIAL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id integer NOT NULL REFERENCES public.problem(problem_id) ON DELETE CASCADE
);

-- Add group constraint to discussion_thread
ALTER TABLE public.discussion_thread ADD CONSTRAINT fk_discussion_thread_group FOREIGN KEY (group_id) REFERENCES public."group"(group_id) ON DELETE CASCADE;

-- 3. Populate default online judges
INSERT INTO public.online_judge (judge_id, name, api_based_url) VALUES
(1, 'Codeforces', 'https://codeforces.com'),
(2, 'AtCoder', 'https://atcoder.jp'),
(3, 'SPOJ', 'https://www.spoj.com'),
(4, 'CodeChef', 'https://www.codechef.com'),
(5, 'CSES', 'https://cses.fi/problemset/')
ON CONFLICT (judge_id) DO UPDATE SET 
  name = EXCLUDED.name,
  api_based_url = EXCLUDED.api_based_url;

-- 4. Create trigger to automatically insert a new profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, is_admin)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1)), 
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
