CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  itinerary_id INTEGER NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- 'ticket' | 'hotel' | 'flight'
  title VARCHAR(255) NOT NULL,
  date DATE,
  notes TEXT,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_documents_itinerary_id ON documents(itinerary_id);
