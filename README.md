# Travel Planner

このプロジェクトは[Next.js](https://nextjs.org)を使用し、[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)でブートストラップされたウェブアプリケーションです。

旅行計画を簡単に作成・管理できるウェブアプリケーションです。

## プロジェクト概要

このアプリケーションは、最新のウェブ技術を活用した旅行計画プラットフォームです。

### 主要な機能
- 地図表示と操作（Google Maps API連携）
- 旅行プランの作成と管理
- GraphQLを使用したデータの取得と操作
- レスポンシブデザイン対応

### 技術スタック
- **フロントエンド**
  - Next.js 15.2.0
  - React 19.0.0
  - TailwindCSS
  - Radix UI（UIコンポーネント）
  - Google Maps API

- **バックエンド/API**
  - GraphQL (Apollo Server & Client)
  - Next.js API Routes

- **開発環境**
  - TypeScript
  - ESLint
  - Turbopack
  - GraphQL Code Generator

## はじめに

まず、開発サーバーを起動します：

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
# または
bun dev
```

ブラウザで[http://localhost:3000](http://localhost:3000)を開くと、アプリケーションが表示されます。

`app/page.tsx`を編集することでページの内容を変更できます。ファイルを編集すると、ページは自動的に更新されます。

このプロジェクトでは、[`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)を使用して、Vercelの新しいフォントファミリーである[Geist](https://vercel.com/font)を自動的に最適化して読み込んでいます。

## 開発環境のセットアップ

1. リポジトリのクローン
```bash
git clone [repository-url]
cd travel-planner
```

2. 依存関係のインストール
```bash
npm install
```

3. 開発サーバーの起動
```bash
npm run dev
```

4. ブラウザで以下のURLにアクセス
```
http://localhost:3000
```

## 詳細情報

Next.jsについて詳しく学ぶには、以下のリソースをご覧ください：

- [Next.jsドキュメント](https://nextjs.org/docs) - Next.jsの機能とAPIについて学ぶ
- [Next.jsラーニングガイド](https://nextjs.org/learn) - インタラクティブなNext.jsチュートリアル

[Next.jsのGitHubリポジトリ](https://github.com/vercel/next.js)もご覧ください。フィードバックや貢献を歓迎しています！

## Vercelへのデプロイ

Next.jsアプリをデプロイする最も簡単な方法は、Next.jsの作者が提供する[Vercelプラットフォーム](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)を使用することです。

詳しくは[Next.jsデプロイメントドキュメント](https://nextjs.org/docs/app/building-your-application/deploying)をご覧ください。

## データベース設定

このプロジェクトではHasura GraphQL EngineとPostgreSQLを使用しています。

### 必要な環境変数

`.env`ファイルを作成し、以下の環境変数を設定してください：

```env
# Database Configuration
DATABASE_URL="postgresql://masaaki:Tatakomaki4649@localhost:5432/mydb?schema=public"

# Hasura Configuration
NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT="http://localhost:8080/v1/graphql"
NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET="travelplanner9032"

# API Keys
OPENAI_API_KEY="your-openai-api-key"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

### ローカル開発環境のセットアップ

1. **PostgreSQLとHasuraの起動**
   ```bash
   # Docker Composeを使用する場合
   docker-compose up -d postgres graphql-engine data-connector-agent

   # 手動でセットアップする場合はDATABASE_SETUP.mdを参照
   ```

2. **マイグレーションの適用**
   ```bash
   cd hasura-project
   hasura migrate apply --endpoint http://localhost:8080 --admin-secret travelplanner9032
   ```

3. **メタデータの適用**
   ```bash
   hasura metadata apply --endpoint http://localhost:8080 --admin-secret travelplanner9032
   ```

4. **Hasuraコンソールへのアクセス**
   ```bash
   # CLIを使用（推奨）
   hasura console --endpoint http://localhost:8080 --admin-secret travelplanner9032

   # またはブラウザで直接アクセス
   # http://localhost:8080/console
   ```

詳細なデータベース設定については、[DATABASE_SETUP.md](./DATABASE_SETUP.md)を参照してください。

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
