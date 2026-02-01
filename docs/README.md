# Travel Planner ドキュメント

このディレクトリには、Travel Plannerプロジェクトの技術ドキュメントが含まれています。

## ドキュメント一覧

### 📋 [SPECIFICATIONS.md](./SPECIFICATIONS.md)
プロジェクトの包括的な技術仕様書です。

**内容:**
- プロジェクト概要
- システム構成
- 技術スタック詳細
- データベース設計（ER図、テーブル定義）
- API仕様（GraphQLクエリ・Mutation）
- フロントエンド構成
- 環境設定
- 開発環境セットアップ手順
- デプロイメント手順
- トラブルシューティング

**対象読者:** 開発者、アーキテクト、技術リーダー

---

## クイックスタート

### 開発環境の起動（最短手順）

```bash
# 1. リポジトリのクローン
git clone [repository-url]
cd travel-planner

# 2. 依存関係のインストール
npm install

# 3. 環境変数の設定
cp .env.example .env
# .envファイルを編集

# 4. Dockerコンテナの起動
docker compose up -d

# 5. データベースのセットアップ
cd hasura-project
hasura migrate apply --endpoint http://localhost:8080 --admin-secret travelplanner9032
hasura metadata apply --endpoint http://localhost:8080 --admin-secret travelplanner9032
cd ..

# 6. 開発サーバーの起動
npm run dev
```

### アクセスURL
- フロントエンド: http://localhost:3000
- Hasuraコンソール: http://localhost:8080/console
- GraphQL API: http://localhost:8080/v1/graphql

---

## 主要な技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | Next.js 15.3, React 19, TailwindCSS 4 |
| バックエンド | Hasura GraphQL Engine v2.46.0 |
| データベース | PostgreSQL 15 |
| コンテナ | Docker, Docker Compose |
| 地図統合 | Google Maps API |

---

## よくある質問

### Q: Hasuraが起動しない
A: `.env`の`HASURA_DATABASE_URL`に`?schema=public`パラメータが含まれていないか確認してください。Hasuraでは不要です。

### Q: データベースをリセットしたい
```bash
docker compose down --volumes
docker compose up -d
cd hasura-project && hasura migrate apply && hasura metadata apply
```

### Q: 本番環境へのデプロイ方法は？
詳細は[SPECIFICATIONS.md](./SPECIFICATIONS.md)の「デプロイメント」セクションを参照してください。

---

## 関連ドキュメント

- [README.md](../README.md) - プロジェクト概要
- [DATABASE_SETUP.md](../DATABASE_SETUP.md) - データベースセットアップガイド
- [PRODUCTION_UPDATE_GUIDE.md](../PRODUCTION_UPDATE_GUIDE.md) - 本番更新ガイド

---

## ドキュメントの更新

ドキュメントを更新した場合は、必ず以下を行ってください：
1. 更新日を記載
2. 変更内容を簡潔に記述
3. 関連するコード変更とリンク

---

**最終更新**: 2025-12-23
