-- Add missing problem section columns
ALTER TABLE Problem 
ADD COLUMN IF NOT EXISTS statement_html TEXT,
ADD COLUMN IF NOT EXISTS input_spec TEXT,
ADD COLUMN IF NOT EXISTS output_spec TEXT,
ADD COLUMN IF NOT EXISTS samples JSONB;
