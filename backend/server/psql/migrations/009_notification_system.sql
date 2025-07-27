-- Notification Types
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
    FROM "Problem" p
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
