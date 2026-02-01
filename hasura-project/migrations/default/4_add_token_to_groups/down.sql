-- Remove token column from groups table
DROP INDEX IF EXISTS idx_groups_token;
ALTER TABLE groups DROP COLUMN IF EXISTS token;
