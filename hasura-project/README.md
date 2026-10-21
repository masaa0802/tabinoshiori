# hasura-project

旅のしおりの Hasura（GraphQL エンジン）のメタデータとマイグレーション。

## 構成

| パス | 内容 |
| --- | --- |
| `config.yaml` | ローカル開発用（`http://localhost:8080`）。Hasura CLI が読むのはこのファイルだけ |
| `config-production.yaml` | 本番（Hasura Cloud）の接続先メモ。**admin secret は書かない**（下記） |
| `metadata/` | Hasura のメタデータ。**本番から export したもの**（2026-10-18 時点） |
| `migrations/default/` | ローカル DB を作るマイグレーション |
| `migrations/travel-planner-prd/` | 旧データソース名のときのマイグレーション。今はどこからも使われていない（参考として残している） |
| `scripts/group-member-permissions.mjs` | `group_member` ロールの permission の定義と、本番に差分だけを足すスクリプト（[docs/GROUP_SCOPED_ACCESS.md](../docs/GROUP_SCOPED_ACCESS.md)） |
| `backups/` | 上のスクリプトが取るバックアップ（git 管理外） |

## 本番との関係

- 本番のデータソースは `default` の1つだけ。DB の接続先は環境変数 `PG_DATABASE_URL` で渡す（metadata には URL を書いていない）。
- `metadata/` は本番を `hasura metadata export` した内容と同じ。ただし次の1点だけ意図的に外している。
  - `playing_with_neon` テーブル: Neon がプロジェクト作成時に作るサンプルテーブルで、本番では track されているがアプリは使っていない。ローカルのマイグレーションには無いため、入れておくとローカルで常に「Metadata is inconsistent」になる。
- 以前あった `metadata/databases/travel-planner/` と `metadata/databases/travel-planner-prd/` は削除した。`databases.yaml` から参照されておらず（= `hasura metadata apply` で一度も使われない）、中身も本番と違っていた（本番にあるリレーションが無い等）。残すと「これが本番」と誤解されるため。必要なら git 履歴から参照できる。

### 本番に `hasura metadata apply` はしない

本番のメタデータは、コンソールでの変更や `scripts/group-member-permissions.mjs` で直接変えてきた経緯がある。リポジトリの内容で丸ごと置き換えると、取り込み後に本番で行われた変更が消える。本番への変更は差分だけを足す方法（スクリプトやコンソール）で行い、そのあと下の手順で export し直してリポジトリに取り込む。

`production-migrate.sh` と `production-setup-guide.md` は本番への `metadata apply` を含む古い手順なので、使う前に必ず差分を確認すること。

### 本番のメタデータを取り込み直す（読み取りのみ）

本番環境へのアクセスなので、実行前に後藤さんの承認を取る。

```bash
HASURA_GRAPHQL_ENDPOINT=https://travel-planner.hasura.app \
HASURA_GRAPHQL_ADMIN_SECRET=<本番の admin secret> \
hasura --project /tmp/prod-export metadata export   # 事前に /tmp/prod-export/config.yaml に「version: 3」と「metadata_directory: metadata」を書いておく
diff -r hasura-project/metadata /tmp/prod-export/metadata
```

差分を確認してから `metadata/` に反映する。export には DB の接続文字列が含まれない（`from_env`）ことも確認する。

## admin secret の扱い

- 本番の admin secret はリポジトリに書かない。Hasura CLI は環境変数 `HASURA_GRAPHQL_ADMIN_SECRET`（接続先は `HASURA_GRAPHQL_ENDPOINT`）を `config.yaml` より優先して読む。
- アプリ（Netlify）も同じ名前の環境変数 `HASURA_GRAPHQL_ADMIN_SECRET` で受け取る。
- `config.yaml` の admin secret はローカルの Docker 用の値で、本番とは関係ない。

## ローカル開発

```bash
cd hasura-project
hasura metadata apply                        # データソース default を登録（DB が空なら inconsistent の警告が出るが続けてよい）
hasura migrate apply --database-name default # テーブルを作る
hasura metadata reload
hasura metadata ic list                      # 「metadata is consistent」になること
```

DB にテーブルが既にある環境では `hasura metadata apply` だけでよい。
