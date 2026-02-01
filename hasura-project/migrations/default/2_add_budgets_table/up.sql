-- Add budgets table that is missing in production
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    itinerary_id INTEGER NOT NULL,
    activity_id INTEGER,
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    currency VARCHAR(3) DEFAULT 'JPY',
    paid_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL
);

-- Add missing columns to activities table if they don't exist
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS lat NUMERIC,
  ADD COLUMN IF NOT EXISTS lng NUMERIC,
  ADD COLUMN IF NOT EXISTS place_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_budgets_itinerary_id ON budgets(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_budgets_activity_id ON budgets(activity_id);
CREATE INDEX IF NOT EXISTS idx_budgets_date ON budgets(date);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- Add comments for documentation
COMMENT ON TABLE budgets IS 'Budget entries for travel expenses';
COMMENT ON COLUMN activities.photo_url IS 'URL of the place photo from Google Places API';
COMMENT ON COLUMN activities.lat IS 'Latitude coordinate from Google Places API';
COMMENT ON COLUMN activities.lng IS 'Longitude coordinate from Google Places API';
COMMENT ON COLUMN activities.place_id IS 'Google Places API place ID';
COMMENT ON COLUMN budgets.paid_by IS 'Name of the person who paid for this expense';