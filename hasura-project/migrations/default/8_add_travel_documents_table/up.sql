-- travel_documents テーブル（旧 documents テーブルの拡張版）
CREATE TABLE travel_documents (
  id SERIAL PRIMARY KEY,
  itinerary_id INTEGER NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  date DATE,
  reservation_number VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_travel_documents_itinerary_id ON travel_documents(itinerary_id);

-- document_files テーブル（1ドキュメントに複数ファイル添付可能）
CREATE TABLE document_files (
  id SERIAL PRIMARY KEY,
  travel_document_id INTEGER NOT NULL REFERENCES travel_documents(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  cloudinary_public_id VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_document_files_travel_document_id ON document_files(travel_document_id);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_travel_documents_updated_at
  BEFORE UPDATE ON travel_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
