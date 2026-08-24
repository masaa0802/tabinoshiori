# microCMS セットアップ手順

ブログ機能を microCMS に接続するための手順書。

現状、環境変数が未設定のあいだは `src/data/blogPosts.ts` のシードデータで動作する。
サーバーログに次の警告が出ていれば、まだ CMS につながっていない状態。

```
[blog] microCMSの環境変数が未設定のため、ローカルのシードデータを使用しています。
```

> **APIキーの入力はオーナーが行うこと。** AI に `.env.local` へキーを書かせないこと。

---

## 1. サービスを作る

1. [microcms.io](https://microcms.io) でアカウントを作り、サービスを作成する
2. 管理画面URL `https://<サービスID>.microcms.io` の `<サービスID>` が
   `MICROCMS_SERVICE_DOMAIN` に入る値

## 2. API を3つ作る

`microcms/schemas/` にスキーマJSONを置いてある。管理画面からインポートできる。

| 作る API | エンドポイント名 | 型 | スキーマ |
|---|---|---|---|
| ブログ | `blogs` | リスト形式 | `microcms/schemas/blogs.json` |
| カテゴリ | `categories` | リスト形式 | `microcms/schemas/categories.json` |
| スポット | `spots` | リスト形式 | `microcms/schemas/spots.json` |

**エンドポイント名は上記のとおりにすること。** `src/lib/microcms/client.ts` の
`MICROCMS_ENDPOINTS` と一致している必要がある。

インポート手順:
「API を作成」→「自分で決める」→ エンドポイント名を入力 → リスト形式 →
API スキーマの画面で「スキーマのインポート」から JSON を読み込む。

### 2-1. インポート後に手動で設定する箇所（2つ）

スキーマJSONでは参照先APIを指定できないため、`blogs` API の以下2フィールドは
管理画面で参照先を設定する必要がある。

| フィールド | 種類 | 参照先に指定する API |
|---|---|---|
| `category` | コンテンツ参照 | `categories` |
| `spots` | 複数コンテンツ参照 | `spots` |

## 3. APIキーを発行する

1. 管理画面 → サービス設定 → APIキー
2. デフォルトキーの GET 権限があれば足りる（書き込み権限は不要）
3. 発行したキーが `MICROCMS_API_KEY` に入る値

## 4. 環境変数を設定する

`.env.local.example` をコピーして `.env.local` を作り、値を埋める。

```bash
cp .env.local.example .env.local
```

```
MICROCMS_SERVICE_DOMAIN=<サービスID>
MICROCMS_API_KEY=<APIキー>
MICROCMS_WEBHOOK_SECRET=<自分で決めた文字列>
```

`.env.local` はコミットしないこと（`.gitignore` の `.env*` で除外済み）。

> `.gitignore` には `!.env.local.example` の例外を入れてある。テンプレートを
> コミットするために必要なので消さないこと。

開発サーバーを再起動すると、シードデータではなく microCMS から記事を取るようになる。
警告ログが消えていれば接続できている。

## 5. カテゴリを入稿する

記事より先にカテゴリを作る。記事の `category` は必須のため。

現行のシードデータに合わせるなら以下の3件。
**ただしカテゴリ設計は未確定なので、確定してから入稿すること**（後述）。

| コンテンツID | name | slug | order |
|---|---|---|---|
| `destination-guide` | 目的地ガイド | destination-guide | 1 |
| `preparation` | 旅の準備 | preparation | 2 |
| `model-course` | モデルコース | model-course | 3 |

## 6. 記事を入稿する

**コンテンツIDがそのまま記事URLになる。** `/blog/<コンテンツID>`

記事作成画面の右上「コンテンツIDを変更」から、英数字のIDを設定する運用にすること。
自動生成のランダムIDのままだと URL が読みにくくなり、後から変えると URL が変わる。

例: `kyoto-2days-guide` → `https://tabinoshiori.jp/blog/kyoto-2days-guide`

### フィールド入力の注意

| フィールド | 注意点 |
|---|---|
| `tags` | カンマ区切りのテキスト（例: `台湾, はじめての旅行`）。読点・改行でも区切れる |
| `destination` | 同上。しおりの目的地と突き合わせるので、しおり側の表記に合わせる |
| `excerpt` | 一覧と OGP に出る。120文字以内が目安 |
| `seoDescription` | 未設定なら `excerpt` が使われる |
| `ogImage` | 未設定なら `coverImage` が使われる |
| `featured` | ON にした記事がブログトップの大きな枠に出る |

## 7. Webhook を設定する（記事の即時反映）

記事の公開・更新時に該当ページだけ再生成する。設定しない場合は最大1時間（ISR）で反映される。

1. 管理画面 → `blogs` API → API設定 → Webhook
2. 「カスタム通知」を選ぶ
3. URL: `https://tabinoshiori.jp/api/revalidate`
4. シークレット: `.env.local` の `MICROCMS_WEBHOOK_SECRET` と同じ値
5. 通知タイミング: 公開・更新・削除

再生成されるパス: `/blog`、`/`、`/sitemap.xml`、該当記事 `/blog/<コンテンツID>`

### ローカルでの署名検証テスト

`MICROCMS_WEBHOOK_SECRET` を設定した状態で開発サーバーを起動し、
`PORT` を実際のポート番号に置き換えて実行する。

```bash
BODY='{"contents":{"new":{"id":"kyoto-2days-guide"}}}'; SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$MICROCMS_WEBHOOK_SECRET" | sed 's/^.*= //'); curl -s -X POST http://localhost:PORT/api/revalidate -H "X-MICROCMS-Signature: $SIG" -d "$BODY"
```

期待する結果:

| ケース | 結果 |
|---|---|
| 正しい署名 | 200 `{"revalidated":true,...}` |
| 誤った署名 | 401 |
| 署名ヘッダーなし | 401 |

## 8. 本番環境の環境変数を設定する

**忘れると本番でシードデータが表示され続ける。**

Netlify（または利用中のホスティング）の環境変数に、`.env.local` と同じ3つを設定する。

- `MICROCMS_SERVICE_DOMAIN`
- `MICROCMS_API_KEY`
- `MICROCMS_WEBHOOK_SECRET`

`NEXT_PUBLIC_BASE_URL` も本番URL（`https://tabinoshiori.jp`）にしておくこと。
未設定でも同じ値にフォールバックするが、明示したほうが事故が少ない。

## 9. 実記事の投入後にやること

1. `src/data/blogPosts.ts` を削除する
2. `src/lib/microcms/queries.ts` のフォールバック分岐（`isMicroCMSConfigured` の
   false 側と `warnOnceAboutSeedData`）を削除する
3. Search Console に `https://tabinoshiori.jp/sitemap.xml` を送信し、
   主要記事のインデックス登録をリクエストする（コードでは完結しない）

---

## 補足: 画像について

microCMS のメディアは `images.microcms-assets.io` から配信される。
`next.config.ts` の `remotePatterns` に登録済み。

`src/lib/microcms/format.ts` の `optimizedImageUrl()` が
`?w=...&fm=webp&q=80` を付与する（microCMS のURLのときのみ）。

## 補足: 未確定の設計判断

以下は着手前にオーナーの判断が必要。詳細は `docs/BLOG_HANDOVER.md` セクション7を参照。

- カテゴリ設計を「情報の種類」から「不安の種類」で切り直すか
- メディア名（現在は `src/lib/site.ts` の `BLOG_NAME = "旅行ガイド"`）
- 価格情報の扱い（金額を書くか、構造で書くか）

カテゴリを変える場合は `microcms/schemas/categories.json` の入稿内容と
`src/data/blogPosts.ts` の更新が必要になる。
