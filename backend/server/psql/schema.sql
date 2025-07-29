CREATE TABLE public.Online_judge (
  name character varying NOT NULL,
  api_based_url text,
  judge_id integer NOT NULL DEFAULT nextval('"Online_judge_judge_id_seq"'::regclass),
  CONSTRAINT Online_judge_pkey PRIMARY KEY (judge_id)
);
CREATE TABLE public.Problem (
  source_oj_id integer NOT NULL,
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
  fetched_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  problem_id integer NOT NULL DEFAULT nextval('"Problem_problem_id_seq"'::regclass),
  CONSTRAINT Problem_pkey PRIMARY KEY (problem_id),
  CONSTRAINT Problem_source_oj_id_fkey FOREIGN KEY (source_oj_id) REFERENCES public.Online_judge(judge_id)
);
CREATE TABLE public.Problem_tag (
  problem_id integer NOT NULL,
  tag_id integer NOT NULL,
  CONSTRAINT Problem_tag_pkey PRIMARY KEY (problem_id, tag_id),
  CONSTRAINT Problem_tag_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.Problem(problem_id),
  CONSTRAINT Problem_tag_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.Tag(tag_id)
);
CREATE TABLE public.Tag (
  name character varying NOT NULL UNIQUE,
  tag_id integer NOT NULL DEFAULT nextval('"Tag_tag_id_seq"'::regclass),
  CONSTRAINT Tag_pkey PRIMARY KEY (tag_id)
);
CREATE TABLE public.badge (
  name character varying NOT NULL,
  icon_url text,
  description text,
  badge_id integer NOT NULL DEFAULT nextval('badge_badge_id_seq'::regclass),
  CONSTRAINT badge_pkey PRIMARY KEY (badge_id)
);
CREATE TABLE public.contest (
  name character varying NOT NULL,
  password_hash text,
  start_time timestamp without time zone,
  end_time timestamp without time zone,
  difficulty character varying,
  description character varying,
  contest_id integer NOT NULL DEFAULT nextval('contest_contest_id_seq'::regclass),
  is_virtual boolean DEFAULT false,
  is_secured boolean DEFAULT false,
  CONSTRAINT contest_pkey PRIMARY KEY (contest_id)
);
CREATE TABLE public.contest_creation (
  created_by uuid NOT NULL,
  contest_id integer NOT NULL,
  creation_id integer NOT NULL DEFAULT nextval('contest_creation_creation_id_seq'::regclass),
  CONSTRAINT contest_creation_pkey PRIMARY KEY (creation_id),
  CONSTRAINT contest_creation_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contest(contest_id),
  CONSTRAINT contest_creation_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.contest_problem (
  contest_id integer NOT NULL,
  problem_id integer NOT NULL,
  alias character varying,
  CONSTRAINT contest_problem_pkey PRIMARY KEY (contest_id, problem_id),
  CONSTRAINT contest_problem_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contest(contest_id),
  CONSTRAINT contest_problem_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.Problem(problem_id)
);
CREATE TABLE public.contest_submission (
  con_sub_id integer NOT NULL DEFAULT nextval('contest_submission_conprob_id_seq'::regclass),
  problem_id integer,
  contest_id integer NOT NULL,
  submission_id integer NOT NULL,
  CONSTRAINT contest_submission_pkey PRIMARY KEY (con_sub_id),
  CONSTRAINT contest_submission_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.Problem(problem_id),
  CONSTRAINT contest_submission_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contest(contest_id),
  CONSTRAINT contest_submission_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submission(submission_id)
);
CREATE TABLE public.discussion_like (
  post_id integer,
  user_id uuid,
  like_id integer NOT NULL DEFAULT nextval('discussion_like_like_id_seq'::regclass),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT discussion_like_pkey PRIMARY KEY (like_id),
  CONSTRAINT discussion_like_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.discussion_post(disspost_id),
  CONSTRAINT discussion_like_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.discussion_post (
  dissthread_id integer NOT NULL,
  user_id uuid NOT NULL,
  content text,
  disspost_id integer NOT NULL DEFAULT nextval('discussion_post_disspost_id_seq'::regclass),
  posted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  likes integer DEFAULT 0,
  CONSTRAINT discussion_post_pkey PRIMARY KEY (disspost_id),
  CONSTRAINT discussion_post_dissthread_id_fkey FOREIGN KEY (dissthread_id) REFERENCES public.discussion_thread(dissthread_id),
  CONSTRAINT discussion_post_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.discussion_thread (
  created_by uuid NOT NULL,
  title character varying NOT NULL,
  thread_type character varying,
  reference_id integer,
  dissthread_id integer NOT NULL DEFAULT nextval('discussion_thread_dissthread_id_seq'::regclass),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  view_count integer DEFAULT 0,
  CONSTRAINT discussion_thread_pkey PRIMARY KEY (dissthread_id),
  CONSTRAINT discussion_thread_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.discussion_view (
  thread_id integer,
  user_id uuid,
  view_id integer NOT NULL DEFAULT nextval('discussion_view_view_id_seq'::regclass),
  last_viewed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT discussion_view_pkey PRIMARY KEY (view_id),
  CONSTRAINT discussion_view_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT discussion_view_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.discussion_thread(dissthread_id)
);
CREATE TABLE public.editorial_approval (
  probed_id integer NOT NULL,
  approved_by uuid NOT NULL,
  approval_id integer NOT NULL DEFAULT nextval('editorial_approval_approval_id_seq'::regclass),
  approved_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT editorial_approval_pkey PRIMARY KEY (approval_id),
  CONSTRAINT editorial_approval_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id),
  CONSTRAINT editorial_approval_probed_id_fkey FOREIGN KEY (probed_id) REFERENCES public.problem_editorial(probed_id)
);
CREATE TABLE public.fav_prob (
  user_id uuid NOT NULL,
  problem_id integer NOT NULL,
  fav_prob_id integer NOT NULL DEFAULT nextval('fav_prob_fav_prob_id_seq'::regclass),
  CONSTRAINT fav_prob_pkey PRIMARY KEY (fav_prob_id),
  CONSTRAINT fav_prob_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT fav_prob_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.Problem(problem_id)
);
CREATE TABLE public.follow (
  follower_id uuid NOT NULL,
  followee_id uuid NOT NULL,
  awarded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT follow_pkey PRIMARY KEY (follower_id, followee_id),
  CONSTRAINT follow_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.profiles(id),
  CONSTRAINT follow_followee_id_fkey FOREIGN KEY (followee_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.group (
  name character varying NOT NULL,
  description text,
  password_hash text,
  group_id integer NOT NULL DEFAULT nextval('group_group_id_seq'::regclass),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  is_private boolean NOT NULL DEFAULT false,
  CONSTRAINT group_pkey PRIMARY KEY (group_id)
);
CREATE TABLE public.group_creation (
  created_by uuid NOT NULL,
  group_id integer NOT NULL,
  grp_crt_id integer NOT NULL DEFAULT nextval('group_creation_grp_crt_id_seq'::regclass),
  CONSTRAINT group_creation_pkey PRIMARY KEY (grp_crt_id),
  CONSTRAINT group_creation_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT group_creation_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.group(group_id)
);
CREATE TABLE public.group_member (
  group_id integer NOT NULL,
  user_id uuid NOT NULL,
  group_member_id integer NOT NULL DEFAULT nextval('group_member_group_member_id_seq'::regclass),
  joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  role character varying NOT NULL DEFAULT 'member'::character varying,
  CONSTRAINT group_member_pkey PRIMARY KEY (group_member_id),
  CONSTRAINT group_member_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT group_member_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.group(group_id)
);
CREATE TABLE public.notification (
  user_id uuid NOT NULL,
  type character varying NOT NULL,
  reference_id integer,
  title character varying NOT NULL,
  message text NOT NULL,
  read_at timestamp without time zone,
  group_id integer,
  notification_id integer NOT NULL DEFAULT nextval('notification_notification_id_seq'::regclass),
  is_read boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notification_pkey PRIMARY KEY (notification_id),
  CONSTRAINT notification_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.group(group_id),
  CONSTRAINT notification_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.personal_record (
  user_id uuid NOT NULL,
  problem_id integer NOT NULL,
  last_attempted timestamp without time zone,
  solved_at timestamp without time zone,
  record_id integer NOT NULL DEFAULT nextval('personal_record_record_id_seq'::regclass),
  status character varying NOT NULL DEFAULT 'attempted'::character varying,
  attempts_count integer NOT NULL DEFAULT 0,
  first_attempted timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT personal_record_pkey PRIMARY KEY (record_id),
  CONSTRAINT personal_record_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT personal_record_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.Problem(problem_id)
);
CREATE TABLE public.problem_editorial (
  problem_id integer NOT NULL,
  created_by uuid NOT NULL,
  content text,
  updated_at timestamp without time zone,
  probed_id integer NOT NULL DEFAULT nextval('problem_editorial_probed_id_seq'::regclass),
  status character varying NOT NULL DEFAULT 'draft'::character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT problem_editorial_pkey PRIMARY KEY (probed_id),
  CONSTRAINT problem_editorial_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT problem_editorial_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.Problem(problem_id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username character varying NOT NULL UNIQUE,
  institution character varying,
  bio character varying,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.recommendation (
  user_id uuid NOT NULL,
  problem_id integer NOT NULL,
  score double precision,
  generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT recommendation_pkey PRIMARY KEY (user_id, problem_id),
  CONSTRAINT recommendation_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT recommendation_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.Problem(problem_id)
);
CREATE TABLE public.submission (
  output text,
  user_id uuid NOT NULL,
  problem_id integer NOT NULL,
  language character varying,
  status character varying,
  exec_time double precision,
  solution_code text,
  submission_id integer NOT NULL DEFAULT nextval('submission_submission_id_seq'::regclass),
  submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  mem_taken double precision,
  CONSTRAINT submission_pkey PRIMARY KEY (submission_id),
  CONSTRAINT submission_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT submission_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.Problem(problem_id)
);
CREATE TABLE public.track (
  name character varying NOT NULL,
  description text,
  created_by uuid NOT NULL,
  track_id integer NOT NULL DEFAULT nextval('track_track_id_seq'::regclass),
  generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT track_pkey PRIMARY KEY (track_id),
  CONSTRAINT track_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.track_problem (
  track_id integer NOT NULL,
  problem_id integer NOT NULL,
  ordinal integer,
  uploaded_by uuid NOT NULL,
  uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT track_problem_pkey PRIMARY KEY (track_id, problem_id),
  CONSTRAINT track_problem_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id),
  CONSTRAINT track_problem_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.Problem(problem_id),
  CONSTRAINT track_problem_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.track(track_id)
);
CREATE TABLE public.user_badge (
  badge_id integer NOT NULL,
  user_id uuid NOT NULL,
  awarded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_badge_pkey PRIMARY KEY (badge_id, user_id),
  CONSTRAINT user_badge_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badge(badge_id),
  CONSTRAINT user_badge_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_participant (
  contest_id integer NOT NULL,
  user_id uuid NOT NULL,
  user_participant_id integer NOT NULL DEFAULT nextval('user_participant_user_participant_id_seq'::regclass),
  joined_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_participant_pkey PRIMARY KEY (user_participant_id),
  CONSTRAINT user_participant_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contest(contest_id),
  CONSTRAINT user_participant_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_rating (
  user_id uuid NOT NULL,
  contest_id integer NOT NULL,
  rating_performance integer,
  CONSTRAINT user_rating_pkey PRIMARY KEY (user_id, contest_id),
  CONSTRAINT user_rating_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_rating_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contest(contest_id)
);
CREATE TABLE public.user_track_progress (
  user_id uuid NOT NULL,
  track_id integer NOT NULL,
  status character varying,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_track_progress_pkey PRIMARY KEY (user_id, track_id),
  CONSTRAINT user_track_progress_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.track(track_id),
  CONSTRAINT user_track_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);