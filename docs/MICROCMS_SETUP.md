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
| `tags` | カンマ区切りのテキスト。**先頭に不安タグを1つ以上入れる**（下記参照） |
| `destination` | 同上。しおりの目的地と突き合わせるので、しおり側の表記に合わせる |
| `excerpt` | 一覧と OGP に出る。120文字以内が目安 |
| `seoDescription` | 未設定なら `excerpt` が使われる |
| `ogImage` | 未設定なら `coverImage` が使われる |
| `featured` | ON にした記事がブログトップの大きな枠に出る |
| `priceCheckedAt` | **金額を書いたら必ず設定する**（下記参照） |
| `priceSources` | 同上。カンマ区切り |

### 不安タグ（必須）

カテゴリ（情報の種類）とは別に、「不安の種類」でも記事を探せるようにしている。
`tags` に下記の文字列を**一字一句同じに**入れると、その一覧ページに載る。
表記がずれると単なる自由タグになり、一覧に出てこない。

| 入稿する文字列 | 一覧ページ |
|---|---|
| お金の不安 | `/blog/tag/money` |
| 手続きの不安 | `/blog/tag/paperwork` |
| 現地の不安 | `/blog/tag/onsite` |
| 段取りの不安 | `/blog/tag/planning` |

記入例: `お金の不安, 航空券, 節約`

タグを増減したい場合は `src/lib/microcms/tags.ts` の `ANXIETY_TAGS` を編集する
（コード変更が必要）。一覧ページ・sitemap・ブログトップのナビは自動で追従する。

### 金額・相場を書くときのルール（必須）

編集方針として、**金額は出すが、必ず注釈と根拠を添える**ことにしている。
仕組みで担保しているので、次の2つを設定すること。

1. `priceCheckedAt` に調査した日を入れる
   → 記事冒頭に「この記事の料金・相場は◯年◯月時点の情報です」と自動表示される
2. `priceSources` に出典を入れる（例: `各航空会社の公式サイト, 観光局の公表資料`）
   → 同じバナーに列挙される

調査から6か月が過ぎると、バナーが警告色に変わり「最新の価格をあわせてご確認ください」
という文言が追加される。定期的に見直して `priceCheckedAt` を更新すること。

推測や伝聞の数字は載せないこと。自分で確認できた数字だけを、確認元とセットで書く。

## 7. Webhook を設定する（記事の即時反映・任意）

> **Hobby プランでは webhook を使えない。** その場合はこのセクションを飛ばしてよい。
> 記事は ISR により最大1時間で自動反映される。すぐ反映したいときは、
> ホスティング管理画面から手動で再デプロイすれば即時に反映できる。
>
> `MICROCMS_WEBHOOK_SECRET` も設定不要。未設定でもブログ本体は動作し、
> `/api/revalidate` が使えなくなるだけ。

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

利用中のホスティング（Vercel なら Settings → Environment Variables、
Netlify なら Site configuration → Environment variables）に設定する。

ソースコードを触る必要はない。ブラウザ上のフォームに入力するだけ。

| 変数名 | 必須 |
|---|---|
| `MICROCMS_SERVICE_DOMAIN` | 必須 |
| `MICROCMS_API_KEY` | 必須 |
| `MICROCMS_WEBHOOK_SECRET` | 任意（webhook を使う場合のみ） |

**環境変数を追加したら再デプロイすること。** 追加しただけでは反映されない。

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

## 補足: 編集方針

編集方針は確定済み。詳細は `docs/BLOG_HANDOVER.md` セクション7を参照。

- 分類は2軸。カテゴリ（情報の種類）＋不安タグ（不安の種類）
- メディア名は「たびのまえに」（`src/lib/site.ts` の `BLOG_NAME`）
- 金額は出す。ただし調査時点と出典の併記が必須
