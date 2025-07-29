-- Function to update timestamp on any table
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at to discussion_thread if it doesn't exist
ALTER TABLE discussion_thread 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add view_count to discussion_thread
ALTER TABLE discussion_thread 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Add likes to discussion_post
ALTER TABLE discussion_post 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

-- Create a table for tracking discussion views
CREATE TABLE IF NOT EXISTS discussion_view (
    view_id SERIAL PRIMARY KEY,
    thread_id INTEGER REFERENCES discussion_thread(dissthread_id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(thread_id, user_id)
);

-- Create a table for discussion likes
CREATE TABLE IF NOT EXISTS discussion_like (
    like_id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES discussion_post(disspost_id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Create trigger to update thread's updated_at when posts are added/modified
CREATE OR REPLACE FUNCTION update_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE discussion_thread 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE dissthread_id = NEW.dissthread_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER discussion_post_update
    AFTER INSERT OR UPDATE ON discussion_post
    FOR EACH ROW
    EXECUTE FUNCTION update_thread_timestamp();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_thread_views()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE discussion_thread 
    SET view_count = view_count + 1 
    WHERE dissthread_id = NEW.thread_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER discussion_view_increment
    AFTER INSERT ON discussion_view
    FOR EACH ROW
    EXECUTE FUNCTION increment_thread_views();



-- Function to increment post likes
CREATE OR REPLACE FUNCTION increment_post_likes(post_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE discussion_post 
    SET likes = likes + 1 
    WHERE disspost_id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement post likes
CREATE OR REPLACE FUNCTION decrement_post_likes(post_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE discussion_post 
    SET likes = GREATEST(likes - 1, 0)
    WHERE disspost_id = post_id;
END;
$$ LANGUAGE plpgsql;    