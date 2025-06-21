-- Add sections columns to problem table
ALTER TABLE problem 
ADD COLUMN IF NOT EXISTS statement_html TEXT,
ADD COLUMN IF NOT EXISTS input_spec TEXT,
ADD COLUMN IF NOT EXISTS output_spec TEXT,
ADD COLUMN IF NOT EXISTS samples JSONB;
