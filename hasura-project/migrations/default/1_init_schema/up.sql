-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255)
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
    id SERIAL PRIMARY KEY,
    group_id UUID,
    user_id INTEGER,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create itineraries table
CREATE TABLE IF NOT EXISTS itineraries (
    id SERIAL PRIMARY KEY,
    group_id UUID,
    title VARCHAR(255) NOT NULL,
    destination VARCHAR(255),
    start_date DATE,
    end_date DATE,
    travel_purpose TEXT,
    location_type VARCHAR(100),
    created_by INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    itinerary_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    location TEXT,
    notes TEXT,
    type VARCHAR(100),
    date DATE,
    time TIME,
    photo_url TEXT,
    lat NUMERIC,
    lng NUMERIC,
    place_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
);

-- Create budgets table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_itineraries_group_id ON itineraries(group_id);
CREATE INDEX IF NOT EXISTS idx_activities_itinerary_id ON activities(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
CREATE INDEX IF NOT EXISTS idx_budgets_itinerary_id ON budgets(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_budgets_activity_id ON budgets(activity_id);
CREATE INDEX IF NOT EXISTS idx_budgets_date ON budgets(date);

-- Add comments for documentation
COMMENT ON TABLE groups IS 'Travel groups created by users';
COMMENT ON TABLE itineraries IS 'Travel itineraries belonging to groups';
COMMENT ON TABLE activities IS 'Activities within travel itineraries';
COMMENT ON TABLE budgets IS 'Budget entries for travel expenses';

COMMENT ON COLUMN activities.photo_url IS 'URL of the place photo from Google Places API';
COMMENT ON COLUMN activities.lat IS 'Latitude coordinate from Google Places API';
COMMENT ON COLUMN activities.lng IS 'Longitude coordinate from Google Places API';
COMMENT ON COLUMN activities.place_id IS 'Google Places API place ID';
COMMENT ON COLUMN budgets.paid_by IS 'Name of the person who paid for this expense';