# 本番環境 Database 統一手順

## 現在の状況
ローカル環境に完全なスキーマを作成済み。本番環境をローカル環境と同じ構造に統一する必要があります。

## 統一手順

### 1. 本番環境情報の確認
以下の情報が必要です：
- 本番環境Hasura GraphQL Endpoint
- 本番環境Admin Secret

### 2. 本番環境の現在の状態確認

```bash
# 環境変数を設定
export PROD_HASURA_ENDPOINT="https://your-hasura-app.hasura.app"
export PROD_ADMIN_SECRET="your-production-admin-secret"

# 現在のマイグレーション状況確認
cd hasura-project
hasura migrate status --endpoint "$PROD_HASURA_ENDPOINT" --admin-secret "$PROD_ADMIN_SECRET"
```

### 3. ローカルスキーマを本番環境に適用

#### 方法A: 自動スクリプト使用
```bash
cd hasura-project
./production-migrate.sh
```

#### 方法B: 手動実行
```bash
# マイグレーション適用
hasura migrate apply --endpoint "$PROD_HASURA_ENDPOINT" --admin-secret "$PROD_ADMIN_SECRET"

# メタデータ適用
hasura metadata apply --endpoint "$PROD_HASURA_ENDPOINT" --admin-secret "$PROD_ADMIN_SECRET"
```

### 4. 適用されるスキーマ内容

#### テーブル構造
- **groups**: 旅行グループ
  - id (UUID, Primary Key)
  - name (VARCHAR(255), NOT NULL)
  - created_at, updated_at (TIMESTAMP)

- **itineraries**: 旅行予定表
  - id (SERIAL, Primary Key)
  - group_id (UUID, Foreign Key)
  - title, destination (VARCHAR(255))
  - start_date, end_date (DATE)
  - travel_purpose (TEXT)
  - location_type (VARCHAR(100))
  - created_by (VARCHAR(255))
  - updated_at (TIMESTAMP)

- **activities**: アクティビティ
  - id (SERIAL, Primary Key)
  - itinerary_id (INTEGER, NOT NULL, Foreign Key)
  - name (VARCHAR(255), NOT NULL)
  - location, notes (TEXT)
  - type (VARCHAR(100))
  - date (DATE), time (TIME)
  - photo_url (TEXT)
  - lat, lng (NUMERIC) - Google Maps座標
  - place_id (VARCHAR(255)) - Google Places API ID
  - created_at (TIMESTAMP)

- **budgets**: 予算・支出
  - id (SERIAL, Primary Key)
  - itinerary_id (INTEGER, NOT NULL, Foreign Key)
  - activity_id (INTEGER, Foreign Key, Optional)
  - date (DATE, NOT NULL)
  - category (VARCHAR(100), NOT NULL)
  - amount (NUMERIC(10,2), NOT NULL)
  - description (TEXT)
  - currency (VARCHAR(3), DEFAULT 'JPY')
  - paid_by (VARCHAR(255))
  - created_at (TIMESTAMP)

#### インデックス
パフォーマンス向上のため以下のインデックスが作成されます：
- itineraries.group_id
- activities.itinerary_id, activities.date
- budgets.itinerary_id, budgets.activity_id, budgets.date

### 5. 安全な適用のための注意点

1. **バックアップ**: 本番データベースのバックアップを事前に取得
2. **段階適用**: 可能であればステージング環境で事前テスト
3. **確認**: 各ステップ後にデータの整合性を確認
4. **ロールバック**: 問題発生時のロールバック手順を準備

### 6. トラブルシューティング

#### 既存テーブルとの競合
既存のテーブルがある場合：
```sql
-- 必要に応じて既存テーブルを削除（注意：データが失われます）
DROP TABLE IF EXISTS existing_table_name CASCADE;
```

#### マイグレーション失敗時
```bash
# マイグレーション状況確認
hasura migrate status --endpoint "$PROD_HASURA_ENDPOINT" --admin-secret "$PROD_ADMIN_SECRET"

# 特定バージョンまでロールバック
hasura migrate apply --version [VERSION] --type down --endpoint "$PROD_HASURA_ENDPOINT" --admin-secret "$PROD_ADMIN_SECRET"
```

### 7. 適用後の確認

```bash
# Hasuraコンソールで確認
hasura console --endpoint "$PROD_HASURA_ENDPOINT" --admin-secret "$PROD_ADMIN_SECRET"

# GraphQL APIの動作確認
# ブラウザで Hasura Console の GraphiQL を使用してクエリテスト
```

## 本番環境設定の更新

適用後、フロントエンドアプリケーションの本番環境変数も更新：

```env
NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT="https://your-hasura-app.hasura.app/v1/graphql"
NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET="your-production-admin-secret"
DATABASE_URL="postgresql://username:password@host:port/database"
```