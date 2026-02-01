# 本番環境データベース統一手順

## 現在の状況
本番環境とローカル環境のスキーマに以下の違いがあります：

### 本番環境に不足しているもの
- `budgets` テーブル全体
- `activities` テーブルの以下のカラム：
  - `photo_url` (TEXT)
  - `lat` (NUMERIC)
  - `lng` (NUMERIC)
  - `place_id` (VARCHAR(255))
  - `created_at` (TIMESTAMP)

## 手動での修正手順

### 1. Hasura Cloud Console にアクセス
1. ブラウザで [https://travel-planner.hasura.app/console](https://travel-planner.hasura.app/console) を開く
2. Admin Secret を入力: `cMv0MBpz27N2gf3eUEXdewaBqo1WK4t0yCZhEgXVyNHHXMiEdPONcCqAV9RrMKHb`

### 2. SQL タブで以下のコマンドを実行

#### Step 1: budgets テーブルを作成
```sql
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
```

#### Step 2: activities テーブルに不足カラムを追加
```sql
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS lat NUMERIC,
  ADD COLUMN IF NOT EXISTS lng NUMERIC,
  ADD COLUMN IF NOT EXISTS place_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

#### Step 3: インデックスを作成
```sql
CREATE INDEX IF NOT EXISTS idx_budgets_itinerary_id ON budgets(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_budgets_activity_id ON budgets(activity_id);
CREATE INDEX IF NOT EXISTS idx_budgets_date ON budgets(date);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
```

#### Step 4: テーブルコメントを追加
```sql
COMMENT ON TABLE budgets IS 'Budget entries for travel expenses';
COMMENT ON COLUMN activities.photo_url IS 'URL of the place photo from Google Places API';
COMMENT ON COLUMN activities.lat IS 'Latitude coordinate from Google Places API';
COMMENT ON COLUMN activities.lng IS 'Longitude coordinate from Google Places API';
COMMENT ON COLUMN activities.place_id IS 'Google Places API place ID';
COMMENT ON COLUMN budgets.paid_by IS 'Name of the person who paid for this expense';
```

### 3. テーブル権限の設定
各SQLコマンド実行後、以下を確認：
1. 「Data」タブで新しい`budgets`テーブルが表示されているか
2. `activities`テーブルに新しいカラムが追加されているか
3. 必要に応じて権限（Permissions）を設定

### 4. 確認方法
以下のクエリで正常に統一されたかを確認：

```sql
-- budgets テーブルの存在確認
SELECT table_name FROM information_schema.tables WHERE table_name = 'budgets';

-- activities テーブルのカラム確認
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'activities'
ORDER BY ordinal_position;
```

## 統一後のスキーマ構造

### 共通テーブル（本番・ローカル統一済み）
- **users**: ユーザー情報
- **groups**: 旅行グループ
- **group_members**: グループメンバー
- **itineraries**: 旅行予定表
- **activities**: アクティビティ（Google Maps連携カラム付き）
- **budgets**: 予算・支出管理

## ローカル環境の同期
本番環境の修正完了後、ローカル環境でも以下を実行：

```bash
# PostgreSQL + Hasura起動
docker-compose up -d postgres graphql-engine data-connector-agent

# 更新されたマイグレーション適用
cd hasura-project
hasura migrate apply --endpoint http://localhost:8080 --admin-secret travelplanner9032

# メタデータ適用
hasura metadata apply --endpoint http://localhost:8080 --admin-secret travelplanner9032
```

これで本番環境とローカル環境が完全に統一されます。