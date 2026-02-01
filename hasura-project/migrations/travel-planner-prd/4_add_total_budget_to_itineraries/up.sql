-- Add total_budget column to itineraries table
ALTER TABLE itineraries
ADD COLUMN total_budget NUMERIC(10,2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN itineraries.total_budget IS 'Total budget planned for the trip';
