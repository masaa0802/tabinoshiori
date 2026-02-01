-- Remove total_budget column from itineraries table
ALTER TABLE itineraries
DROP COLUMN IF EXISTS total_budget;
