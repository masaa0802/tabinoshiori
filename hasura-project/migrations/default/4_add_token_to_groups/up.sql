-- Add token column to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS token VARCHAR(255) UNIQUE;

-- Add index for token column
CREATE INDEX IF NOT EXISTS idx_groups_token ON groups(token);

-- Add comment
COMMENT ON COLUMN groups.token IS 'Unique token for sharing group via URL';
