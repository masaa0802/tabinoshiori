-- 紐づけの情報だけが消える。情報・ファイルの行は残る
DROP INDEX IF EXISTS idx_travel_documents_activity_id;
ALTER TABLE travel_documents DROP COLUMN IF EXISTS activity_id;
