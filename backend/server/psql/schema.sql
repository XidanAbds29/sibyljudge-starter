-- Users
CREATE TABLE "User" (
  user_id       SERIAL PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL,
  email         VARCHAR(100) NOT NULL,
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  institution   VARCHAR(100),
  bio           VARCHAR(100),
  is_admin      BOOLEAN      NOT NULL DEFAULT FALSE
);

-- Online judges
CREATE TABLE Online_judge (
  judge_id     SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  api_based_url TEXT
);

-- Problems
CREATE TABLE Problem (
  problem_id   SERIAL PRIMARY KEY,
  source_oj_id INT         NOT NULL REFERENCES Online_judge(judge_id),
  external_id  VARCHAR(100) NOT NULL,
  title        VARCHAR(200) NOT NULL,
  url          TEXT,
  difficulty   VARCHAR(20),
  time_limit   INT          NOT NULL,
  mem_limit    INT          NOT NULL,
  fetched_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Tags
CREATE TABLE Tag (
  tag_id SERIAL PRIMARY KEY,
  name   VARCHAR(100) NOT NULL UNIQUE
);

-- Problem ↔ Tag
CREATE TABLE Problem_tag (
  problem_id INT NOT NULL REFERENCES Problem(problem_id),
  tag_id     INT NOT NULL REFERENCES Tag(tag_id),
  PRIMARY KEY (problem_id, tag_id)
);

-- Submissions
CREATE TABLE Submission (
  submission_id  SERIAL PRIMARY KEY,
  user_id        INT     NOT NULL REFERENCES "User"(user_id),
  problem_id     INT     NOT NULL REFERENCES Problem(problem_id),
  language       VARCHAR(50),
  status         VARCHAR(50),
  exec_time      FLOAT,
  submitted_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verdict_detail TEXT
);

-- Contests
CREATE TABLE Contest (
  contest_id    SERIAL PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  password_hash TEXT,
  start_time    TIMESTAMP,
  end_time      TIMESTAMP,
  is_virtual    BOOLEAN DEFAULT FALSE,
  is_secured    BOOLEAN DEFAULT FALSE,
  difficulty    VARCHAR(50),
  description   VARCHAR(1000)
);

-- Contest ↔ Problem
CREATE TABLE Contest_problem (
  contest_id INT NOT NULL REFERENCES Contest(contest_id),
  problem_id INT NOT NULL REFERENCES Problem(problem_id),
  alias      VARCHAR(50),
  PRIMARY KEY (contest_id, problem_id)
);

-- Contest submissions
CREATE TABLE Contest_submission (
  conprob_id    SERIAL PRIMARY KEY,
  contest_id    INT    NOT NULL REFERENCES Contest(contest_id),
  submission_id INT    NOT NULL REFERENCES Submission(submission_id)
);

-- User ratings
CREATE TABLE User_rating (
  user_id            INT NOT NULL REFERENCES "User"(user_id),
  contest_id         INT NOT NULL REFERENCES Contest(contest_id),
  rating_performance INT,
  PRIMARY KEY (user_id, contest_id)
);

-- Groups
CREATE TABLE "Group" (
  group_id      SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_private    BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash TEXT
);

-- Group members
CREATE TABLE Group_member (
  group_member_id SERIAL PRIMARY KEY,
  group_id        INT    NOT NULL REFERENCES "Group"(group_id),
  user_id         INT    NOT NULL REFERENCES "User"(user_id),
  joined_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role            VARCHAR(50) NOT NULL DEFAULT 'member'
);

-- Discussion threads & posts
CREATE TABLE Discussion_thread (
  dissthread_id SERIAL PRIMARY KEY,
  created_by    INT    NOT NULL REFERENCES "User"(user_id),
  title         VARCHAR(200) NOT NULL,
  thread_type   VARCHAR(50),
  reference_id  INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Discussion_post (
  disspost_id    SERIAL PRIMARY KEY,
  dissthread_id  INT    NOT NULL REFERENCES Discussion_thread(dissthread_id),
  user_id        INT    NOT NULL REFERENCES "User"(user_id),
  content        TEXT,
  posted_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Problem editorials & approvals
CREATE TABLE Problem_Editorial (
  probed_id   SERIAL PRIMARY KEY,
  problem_id  INT    NOT NULL REFERENCES Problem(problem_id),
  created_by  INT    NOT NULL REFERENCES "User"(user_id),
  content     TEXT,
  status      VARCHAR(50) NOT NULL DEFAULT 'draft',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP
);

CREATE TABLE Editorial_Approval (
  approval_id SERIAL PRIMARY KEY,
  probed_id   INT    NOT NULL REFERENCES Problem_Editorial(probed_id),
  approved_by INT    NOT NULL REFERENCES "User"(user_id),
  approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Badges
CREATE TABLE Badge (
  badge_id   SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  icon_url   TEXT,
  description TEXT
);

CREATE TABLE User_badge (
  badge_id   INT NOT NULL REFERENCES Badge(badge_id),
  user_id    INT NOT NULL REFERENCES "User"(user_id),
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (badge_id, user_id)
);

-- Follows
CREATE TABLE Follow (
  follower_id INT NOT NULL REFERENCES "User"(user_id),
  followee_id INT NOT NULL REFERENCES "User"(user_id),
  awarded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, followee_id)
);

-- Recommendations
CREATE TABLE Recommendation (
  user_id       INT NOT NULL REFERENCES "User"(user_id),
  problem_id    INT NOT NULL REFERENCES Problem(problem_id),
  score         FLOAT,
  generated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, problem_id)
);

-- Tracks & track problems
CREATE TABLE Track (
  track_id     SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  description  TEXT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by   INT    NOT NULL REFERENCES "User"(user_id)
);

CREATE TABLE Track_problem (
  track_id    INT NOT NULL REFERENCES Track(track_id),
  problem_id  INT NOT NULL REFERENCES Problem(problem_id),
  ordinal     INT,
  uploaded_by INT    NOT NULL REFERENCES "User"(user_id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (track_id, problem_id)
);

-- User track progress
CREATE TABLE User_track_progress (
  user_id    INT NOT NULL REFERENCES "User"(user_id),
  track_id   INT NOT NULL REFERENCES Track(track_id),
  status     VARCHAR(50),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, track_id)
);

-- Contest & group creations, participants
CREATE TABLE Contest_creation (
  creation_id SERIAL PRIMARY KEY,
  created_by  INT    NOT NULL REFERENCES "User"(user_id),
  contest_id  INT    NOT NULL REFERENCES Contest(contest_id)
);

CREATE TABLE User_participant (
  user_participant_id SERIAL PRIMARY KEY,
  contest_id          INT NOT NULL REFERENCES Contest(contest_id),
  user_id             INT NOT NULL REFERENCES "User"(user_id),
  joined_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Group_creation (
  grp_crt_id SERIAL PRIMARY KEY,
  created_by INT    NOT NULL REFERENCES "User"(user_id),
  group_id   INT    NOT NULL REFERENCES "Group"(group_id)
);

-- Favorite problems
CREATE TABLE Fav_prob (
  fav_prob_id SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES "User"(user_id),
  problem_id  INT NOT NULL REFERENCES Problem(problem_id)
);

-- Notifications
CREATE TABLE Notification (
  notification_id SERIAL PRIMARY KEY,
  user_id         INT     NOT NULL REFERENCES "User"(user_id),
  type            VARCHAR(50) NOT NULL,
  reference_id    INT,
  title           VARCHAR(200) NOT NULL,
  message         TEXT    NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at         TIMESTAMP,
  group_id        INT     REFERENCES "Group"(group_id)
);

-- Personal Record
CREATE TABLE Personal_Record (
  record_id       SERIAL PRIMARY KEY,
  user_id         INT    NOT NULL REFERENCES "User"(user_id),
  problem_id      INT    NOT NULL REFERENCES Problem(problem_id),
  status          VARCHAR(50) NOT NULL DEFAULT 'attempted',
  attempts_count  INT    NOT NULL DEFAULT 0,
  first_attempted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_attempted  TIMESTAMP,
  solved_at       TIMESTAMP,
  UNIQUE (user_id, problem_id)
);
