-- Remove budgets table
DROP TABLE IF EXISTS budgets CASCADE;

-- Remove added columns from activities table
ALTER TABLE activities
  DROP COLUMN IF EXISTS photo_url,
  DROP COLUMN IF EXISTS lat,
  DROP COLUMN IF EXISTS lng,
  DROP COLUMN IF EXISTS place_id,
  DROP COLUMN IF EXISTS created_at;

-- Remove indexes
DROP INDEX IF EXISTS idx_budgets_itinerary_id;
DROP INDEX IF EXISTS idx_budgets_activity_id;
DROP INDEX IF EXISTS idx_budgets_date;
DROP INDEX IF EXISTS idx_group_members_group_id;
DROP INDEX IF EXISTS idx_group_members_user_id;