-- 情報タブの情報（travel_documents）をアクティビティに紐づける
--
-- 既存データへの影響:
--   - 列は NULL 可・既定値なしで足すので、既存の行はすべて activity_id = NULL（どのアクティビティにも紐づかない）になる。
--     PostgreSQL ではテーブルの書き換えが起きず、一瞬で終わる。
--   - アクティビティを消しても、情報とファイルは消さずに紐づけだけ外す（ON DELETE SET NULL）。
--     予算（budgets.activity_id）と同じ扱い。
--   - 何度流しても同じ結果になるよう IF NOT EXISTS を付けている。
ALTER TABLE travel_documents
  ADD COLUMN IF NOT EXISTS activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_travel_documents_activity_id ON travel_documents(activity_id);
