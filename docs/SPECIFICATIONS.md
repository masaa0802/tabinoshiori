# Travel Planner - 技術仕様書

## 目次
1. [プロジェクト概要](#プロジェクト概要)
2. [システム構成](#システム構成)
3. [技術スタック](#技術スタック)
4. [アーキテクチャ](#アーキテクチャ)
5. [データベース設計](#データベース設計)
6. [API仕様](#api仕様)
7. [フロントエンド構成](#フロントエンド構成)
8. [環境設定](#環境設定)
9. [開発環境セットアップ](#開発環境セットアップ)
10. [デプロイメント](#デプロイメント)

---

## プロジェクト概要

### 概要
Travel Plannerは、グループでの旅行計画を簡単に作成・管理できるウェブアプリケーションです。
地図表示、スケジュール管理、予算管理などの機能を提供します。

### 主要機能
- **グループ管理**: 旅行グループの作成と共有URL生成
- **旅程管理**: 旅行プランの作成・編集・削除
- **アクティビティ管理**: 日程ごとのアクティビティ登録
- **地図統合**: Google Maps APIを使用した場所の検索と表示
- **予算管理**: 支出の記録とカテゴリ別集計
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応

---

## システム構成

### コンポーネント構成図
```
┌─────────────────────────────────────────────────────────┐
│                    ユーザー（ブラウザ）                     │
└─────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Next.js Frontend (Port 3000)               │
│  - React 19.0.0                                         │
│  - TailwindCSS                                          │
│  - Apollo Client                                        │
└─────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ↓                       ↓
┌──────────────────────────┐  ┌─────────────────────────┐
│  Hasura GraphQL Engine   │  │   Google Maps API       │
│     (Port 8080)          │  │                         │
└──────────────────────────┘  └─────────────────────────┘
                │
                ↓
┌──────────────────────────────────────────────────────────┐
│         PostgreSQL Database (Port 5432)                  │
│  - Database: mydb                                        │
│  - User: masaaki                                         │
└──────────────────────────────────────────────────────────┘
                │
                ↓
┌──────────────────────────────────────────────────────────┐
│    Hasura Data Connector Agent (Port 8081)               │
└──────────────────────────────────────────────────────────┘
```

### Dockerコンテナ構成
- **web**: Next.jsアプリケーション（Node.js 18）
- **postgres**: PostgreSQL 15データベース
- **graphql-engine**: Hasura GraphQL Engine v2.46.0
- **data-connector-agent**: Hasura Data Connector v2.46.0

---

## 技術スタック

### フロントエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 15.3.1 | Reactフレームワーク |
| React | 19.0.0 | UIライブラリ |
| TypeScript | 5.x | 型安全な開発 |
| TailwindCSS | 4.x | CSSフレームワーク |
| Apollo Client | 3.13.7 | GraphQLクライアント |
| Radix UI | 最新 | UIコンポーネントライブラリ |
| Lucide React | 0.477.0 | アイコンライブラリ |
| @react-google-maps/api | 2.20.6 | Google Maps統合 |

### バックエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Hasura GraphQL Engine | v2.46.0 | GraphQL API自動生成 |
| PostgreSQL | 15 | リレーショナルデータベース |
| Apollo Server | 4.11.3 | GraphQLサーバー |
| GraphQL | 16.10.0 | APIクエリ言語 |

### 開発ツール
| 技術 | バージョン | 用途 |
|------|-----------|------|
| GraphQL Code Generator | 5.0.5 | TypeScript型定義生成 |
| ESLint | 9.x | コード品質チェック |
| Turbopack | 組み込み | 高速ビルドツール |
| Docker Compose | - | コンテナオーケストレーション |

### 外部API
- **Google Maps API**: 地図表示、場所検索、ジオコーディング
- **OpenAI API**: AI機能（将来的な拡張用）

---

## アーキテクチャ

### アプリケーションアーキテクチャ
```
src/
├── app/                      # Next.js App Router
│   ├── page.tsx              # トップページ
│   ├── layout.tsx            # グローバルレイアウト
│   ├── providers.tsx         # グローバルプロバイダー
│   ├── group/                # グループ関連ページ
│   │   ├── new/              # グループ新規作成
│   │   └── [token]/          # グループ詳細（トークンベース）
│   │       └── travelplanner/
│   │           ├── [travelPlannerId]/  # 旅程詳細
│   │           ├── new/                # 旅程新規作成
│   │           ├── map/                # 地図ビュー
│   │           ├── budget/             # 予算管理
│   │           └── components/         # コンポーネント
│   ├── contact/              # お問い合わせ
│   ├── privacy/              # プライバシーポリシー
│   └── terms/                # 利用規約
├── components/
│   ├── ui/                   # Radix UI再利用可能コンポーネント
│   └── GoogleMapsProvider.tsx
├── graphql/
│   ├── queries.ts            # GraphQLクエリ
│   └── mutates.ts            # GraphQL Mutation
├── lib/
│   ├── apollo-provider.tsx   # Apollo Clientセットアップ
│   └── utils.ts              # ユーティリティ関数
└── types/
    └── generated/
        └── graphql.ts        # 自動生成型定義
```

### ルーティング構造
```
/                                    # トップページ
/group/new                           # グループ新規作成
/group/[token]                       # グループページ（リダイレクト）
/group/[token]/travelplanner/new     # 旅程新規作成
/group/[token]/travelplanner/[id]    # 旅程詳細
/group/[token]/travelplanner/map     # 地図ビュー
/group/[token]/travelplanner/budget  # 予算管理
/contact                             # お問い合わせ
/privacy                             # プライバシーポリシー
/terms                               # 利用規約
```

---

## データベース設計

### ER図
```
┌─────────────┐
│   groups    │
├─────────────┤
│ id (PK)     │ UUID
│ name        │ VARCHAR(255)
│ token       │ VARCHAR(255) UNIQUE
│ created_at  │ TIMESTAMP
│ updated_at  │ TIMESTAMP
└─────────────┘
       │
       │ 1:N
       ↓
┌─────────────────┐
│  itineraries    │
├─────────────────┤
│ id (PK)         │ SERIAL
│ group_id (FK)   │ UUID
│ title           │ VARCHAR(255)
│ destination     │ VARCHAR(255)
│ start_date      │ DATE
│ end_date        │ DATE
│ travel_purpose  │ TEXT
│ location_type   │ VARCHAR(100)
│ created_by      │ VARCHAR(255)
│ updated_at      │ TIMESTAMP
└─────────────────┘
       │
       ├────────────┐
       │ 1:N        │ 1:N
       ↓            ↓
┌──────────────┐  ┌──────────────┐
│ activities   │  │   budgets    │
├──────────────┤  ├──────────────┤
│ id (PK)      │  │ id (PK)      │
│ itinerary_id │  │ itinerary_id │
│ name         │  │ activity_id  │
│ location     │  │ date         │
│ notes        │  │ category     │
│ type         │  │ amount       │
│ date         │  │ description  │
│ time         │  │ currency     │
│ photo_url    │  │ paid_by      │
│ lat          │  │ created_at   │
│ lng          │  └──────────────┘
│ place_id     │
│ created_at   │
└──────────────┘
```

### テーブル詳細

#### groups テーブル
旅行グループの基本情報を管理

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | グループID |
| name | VARCHAR(255) | NOT NULL | グループ名 |
| token | VARCHAR(255) | UNIQUE | 共有用トークン |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | 更新日時 |

#### itineraries テーブル
旅行プランの詳細情報

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | SERIAL | PRIMARY KEY | 旅程ID |
| group_id | UUID | FOREIGN KEY | グループID |
| title | VARCHAR(255) | | タイトル |
| destination | VARCHAR(255) | | 目的地 |
| start_date | DATE | | 開始日 |
| end_date | DATE | | 終了日 |
| travel_purpose | TEXT | | 旅行目的 |
| location_type | VARCHAR(100) | | 場所タイプ |
| created_by | VARCHAR(255) | | 作成者 |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | 更新日時 |

#### activities テーブル
各日程のアクティビティ情報

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | SERIAL | PRIMARY KEY | アクティビティID |
| itinerary_id | INTEGER | FOREIGN KEY, NOT NULL | 旅程ID |
| name | VARCHAR(255) | NOT NULL | アクティビティ名 |
| location | TEXT | | 場所 |
| notes | TEXT | | メモ |
| type | VARCHAR(100) | | タイプ |
| date | DATE | | 日付 |
| time | TIME | | 時刻 |
| photo_url | TEXT | | 写真URL |
| lat | NUMERIC | | 緯度 |
| lng | NUMERIC | | 経度 |
| place_id | VARCHAR(255) | | Google Places ID |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | 作成日時 |

#### budgets テーブル
予算・支出管理

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | SERIAL | PRIMARY KEY | 予算ID |
| itinerary_id | INTEGER | FOREIGN KEY, NOT NULL | 旅程ID |
| activity_id | INTEGER | FOREIGN KEY | アクティビティID（任意） |
| date | DATE | NOT NULL | 日付 |
| category | VARCHAR(100) | NOT NULL | カテゴリ |
| amount | NUMERIC(10,2) | NOT NULL | 金額 |
| description | TEXT | | 説明 |
| currency | VARCHAR(3) | DEFAULT 'JPY' | 通貨 |
| paid_by | VARCHAR(255) | | 支払者 |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | 作成日時 |

### リレーションシップ
- `groups` → `itineraries`: 1対多（ON DELETE SET NULL）
- `itineraries` → `activities`: 1対多（ON DELETE CASCADE）
- `itineraries` → `budgets`: 1対多（ON DELETE CASCADE）
- `activities` → `budgets`: 1対多（ON DELETE SET NULL、任意）

---

## API仕様

### GraphQL エンドポイント
```
開発環境: http://localhost:8080/v1/graphql
本番環境: [設定による]
```

### 認証
- Admin Secret: 環境変数 `NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET`
- ヘッダー: `x-hasura-admin-secret`

### 主要なクエリ

#### グループ取得
```graphql
query GetGroup($token: String!) {
  groups(where: {token: {_eq: $token}}) {
    id
    name
    token
    created_at
    itineraries {
      id
      title
      destination
      start_date
      end_date
    }
  }
}
```

#### 旅程詳細取得
```graphql
query GetItinerary($id: Int!) {
  itineraries_by_pk(id: $id) {
    id
    title
    destination
    start_date
    end_date
    travel_purpose
    activities(order_by: {date: asc, time: asc}) {
      id
      name
      location
      date
      time
      lat
      lng
      type
    }
    budgets(order_by: {date: asc}) {
      id
      date
      category
      amount
      description
    }
  }
}
```

### 主要なMutation

#### グループ作成
```graphql
mutation CreateGroup($name: String!, $token: String!) {
  insert_groups_one(object: {name: $name, token: $token}) {
    id
    name
    token
  }
}
```

#### アクティビティ追加
```graphql
mutation InsertActivity($object: activities_insert_input!) {
  insert_activities_one(object: $object) {
    id
    name
    location
    date
    time
  }
}
```

#### 予算追加
```graphql
mutation InsertBudget($object: budgets_insert_input!) {
  insert_budgets_one(object: $object) {
    id
    amount
    category
    date
  }
}
```

---

## フロントエンド構成

### 状態管理
- **Apollo Client**: GraphQLデータのキャッシュと状態管理
- **React Hooks**: ローカル状態管理（useState, useEffect）
- **Context API**: Google Maps、テーマなどのグローバル状態

### UIコンポーネントライブラリ
- **Radix UI**: アクセシブルなプリミティブコンポーネント
  - Alert Dialog
  - Dialog
  - Button
  - Card
- **Lucide React**: SVGアイコン
- **TailwindCSS**: スタイリング

### 主要なページコンポーネント

#### トップページ (`app/page.tsx`)
- グループ作成フォーム
- 機能説明
- グループ一覧（個人保存分）

#### グループページ (`app/group/[token]/travelplanner/[travelPlannerId]/page.tsx`)
- 旅程詳細表示
- アクティビティ一覧
- アクティビティ追加・編集・削除

#### 地図ページ (`app/group/[token]/travelplanner/map/page.tsx`)
- Google Maps表示
- アクティビティのマーカー表示
- 場所検索

#### 予算ページ (`app/group/[token]/travelplanner/budget/page.tsx`)
- 支出一覧
- カテゴリ別集計
- 予算追加・編集

---

## 環境設定

### 環境変数

#### 必須環境変数
```env
# データベース設定（Prisma用）
DATABASE_URL="postgresql://postgres:password@postgres:5432/mydb?schema=public"

# Hasura用データベース設定（schemaパラメータなし）
HASURA_DATABASE_URL="postgresql://masaaki:password@postgres:5432/mydb"

# Hasura設定
NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT="http://localhost:8080/v1/graphql"
NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET="travelplanner9032"

# API Keys
OPENAI_API_KEY="your-openai-api-key"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

#### 環境変数の説明
| 変数名 | 説明 | 備考 |
|--------|------|------|
| DATABASE_URL | Prisma用データベース接続URL | `?schema=public`パラメータ必須 |
| HASURA_DATABASE_URL | Hasura用データベース接続URL | クエリパラメータなし |
| NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT | GraphQLエンドポイント | クライアントサイドで使用 |
| NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET | Hasura管理者シークレット | クライアントサイドで使用 |
| OPENAI_API_KEY | OpenAI APIキー | サーバーサイドのみ |
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | Google Maps APIキー | クライアントサイドで使用 |

### Docker Compose設定

#### サービス構成
1. **web** (Next.js)
   - ポート: 3000
   - ボリューム: プロジェクトルートを `/opt/web` にマウント
   - コマンド: `npm run start`

2. **postgres** (PostgreSQL 15)
   - ポート: 5432
   - ボリューム: `db_data` (永続化)
   - データベース: `mydb`
   - ユーザー: `masaaki`

3. **graphql-engine** (Hasura)
   - ポート: 8080
   - 依存: postgres, data-connector-agent
   - コンソール: 有効

4. **data-connector-agent** (Hasura Data Connector)
   - ポート: 8081
   - ヘルスチェック: 有効

---

## 開発環境セットアップ

### 前提条件
- Node.js 18以上
- Docker & Docker Compose
- Git

### セットアップ手順

#### 1. リポジトリのクローン
```bash
git clone [repository-url]
cd travel-planner
```

#### 2. 依存関係のインストール
```bash
npm install
```

#### 3. 環境変数の設定
```bash
cp .env.example .env
# .envファイルを編集して必要な値を設定
```

#### 4. Dockerコンテナの起動
```bash
# 初回起動（全てのイメージをダウンロード）
docker compose up -d

# コンテナの状態確認
docker compose ps
```

#### 5. データベースのマイグレーション
```bash
cd hasura-project
hasura migrate apply --endpoint http://localhost:8080 --admin-secret travelplanner9032
hasura metadata apply --endpoint http://localhost:8080 --admin-secret travelplanner9032
```

#### 6. 開発サーバーの起動
```bash
npm run dev
```

#### 7. アプリケーションへのアクセス
- フロントエンド: http://localhost:3000
- Hasuraコンソール: http://localhost:8080/console
- GraphQL Playground: http://localhost:8080/v1/graphql

### 開発時のコマンド

#### Docker関連
```bash
# コンテナの起動
docker compose up -d

# コンテナの停止
docker compose down

# ログの確認
docker compose logs -f [service-name]

# データベースのリセット
docker compose down --volumes
docker compose up -d
```

#### Hasura関連
```bash
# マイグレーションの作成
hasura migrate create "migration_name" --from-server

# メタデータのエクスポート
hasura metadata export

# コンソールの起動（推奨）
hasura console
```

#### Next.js関連
```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番モード起動
npm run start

# Lint
npm run lint
```

---

## デプロイメント

### Vercelへのデプロイ（推奨）

#### 1. Vercelプロジェクトの作成
```bash
vercel
```

#### 2. 環境変数の設定
Vercelダッシュボードで以下を設定：
- `DATABASE_URL`
- `HASURA_DATABASE_URL`
- `NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT`
- `NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

#### 3. データベースのセットアップ
- Hasura Cloudでプロジェクトを作成
- PostgreSQLデータベースを接続
- マイグレーションとメタデータを適用

```bash
hasura migrate apply --endpoint https://your-hasura.hasura.app
hasura metadata apply --endpoint https://your-hasura.hasura.app
```

### 本番環境チェックリスト
- [ ] 環境変数が正しく設定されている
- [ ] データベースマイグレーションが適用されている
- [ ] Hasuraメタデータが適用されている
- [ ] Google Maps APIキーの制限が設定されている
- [ ] Hasura Admin Secretが安全に管理されている
- [ ] CORS設定が適切である
- [ ] エラーハンドリングが実装されている

---

## トラブルシューティング

### よくある問題

#### 1. Hasuraが起動しない
**エラー**: `invalid URI query parameter: "schema"`

**解決策**:
- `.env`の`HASURA_DATABASE_URL`に`?schema=public`が含まれていないか確認
- docker-compose.ymlで正しい環境変数を参照しているか確認

#### 2. GraphQLクエリが失敗する
**解決策**:
- Hasuraコンソールでテーブルが存在するか確認
- マイグレーションが適用されているか確認
- Admin Secretが正しいか確認

#### 3. Google Mapsが表示されない
**解決策**:
- API Keyが正しく設定されているか確認
- Google Cloud ConsoleでMaps JavaScript APIが有効か確認
- ブラウザのコンソールでエラーを確認

#### 4. Dockerコンテナが起動しない
**解決策**:
```bash
# コンテナとボリュームを完全削除
docker compose down --volumes

# イメージも削除
docker rmi $(docker images -q)

# 再起動
docker compose up -d
```

---

## 付録

### ディレクトリ構造の全体図
```
travel-planner/
├── .claude/                  # Claude設定
├── .github/                  # GitHub設定
├── .next/                    # Next.jsビルド成果物
├── database/                 # データベース関連
├── docs/                     # ドキュメント
│   └── SPECIFICATIONS.md     # 本ドキュメント
├── hasura-project/           # Hasuraプロジェクト
│   ├── migrations/           # マイグレーションファイル
│   └── metadata/             # メタデータ
├── node_modules/             # npmパッケージ
├── public/                   # 静的ファイル
├── src/                      # ソースコード
│   ├── app/                  # Next.js App Router
│   ├── components/           # Reactコンポーネント
│   ├── graphql/              # GraphQLクエリ
│   ├── lib/                  # ライブラリ
│   └── types/                # 型定義
├── .env                      # 環境変数（gitignore）
├── .env.example              # 環境変数テンプレート
├── .gitignore                # Git除外設定
├── docker-compose.yml        # Docker Compose設定
├── package.json              # npmパッケージ設定
├── tsconfig.json             # TypeScript設定
├── next.config.ts            # Next.js設定
├── tailwind.config.ts        # TailwindCSS設定
├── DATABASE_SETUP.md         # データベースセットアップガイド
├── PRODUCTION_UPDATE_GUIDE.md # 本番更新ガイド
└── README.md                 # プロジェクト概要
```

### 参考リンク
- [Next.js Documentation](https://nextjs.org/docs)
- [Hasura Documentation](https://hasura.io/docs/latest/index/)
- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives/overview/introduction)

---

**最終更新日**: 2025-12-23
**バージョン**: 1.0.0
**作成者**: Claude AI Assistant
