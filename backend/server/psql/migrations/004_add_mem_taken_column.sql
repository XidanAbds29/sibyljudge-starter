-- Add mem_taken column to Submission table
ALTER TABLE Submission ADD COLUMN IF NOT EXISTS mem_taken INT;

-- Add comment for clarity
COMMENT ON COLUMN Submission.mem_taken IS 'Memory usage in KB during execution';
