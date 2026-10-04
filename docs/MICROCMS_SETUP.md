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
| 記事 | `articles` | リスト形式 | `microcms/schemas/articles.json` |
| カテゴリ | `categories` | リスト形式 | `microcms/schemas/categories.json` |
| スポット | `spots` | リスト形式 | `microcms/schemas/spots.json` |

**エンドポイント名は上記のとおりにすること。** `src/lib/microcms/client.ts` の
`MICROCMS_ENDPOINTS` と一致している必要がある。

インポート手順:
「API を作成」→「自分で決める」→ エンドポイント名を入力 → リスト形式 →
API スキーマの画面で「スキーマのインポート」から JSON を読み込む。

セレクトフィールドの選択肢と複数選択の設定も、このインポートで反映される
（2026-10-02 に `articles` で確認済み）。手で入れ直す必要はない。

### 2-1. インポート後に手動で設定する箇所（2つ）

スキーマJSONでは参照先APIを指定できないため、`articles` API の以下2フィールドは
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

## 5-1. CSVでまとめて入稿する場合の制約

`microcms/seed-csv/` のCSVを使う場合、microCMS のCSVインポートには
次の2つの制約がある（どちらも 2026-10-02 に実機で確認）。

**1. 列数がスキーマのフィールド数と完全一致していること**

値が空でも列そのものが必要。参照フィールドと画像フィールドも空列として用意する。

> CSVデータの列数が、APIスキーマのフィールド数（コンテンツID含む）と異なります。

**2. 必須フィールドに値が入っていること**

CSVでは参照フィールドと画像フィールドに値を入れられない。これらが必須だと
インポートが弾かれるため、**一時的に「必須」を外してインポートし、あとで戻す**。

> "coverImage" フィールドは必須です。値を入力してください。

CSVインポート後は、参照フィールド（`category` / `spots`）と画像を
各コンテンツで手動設定する必要がある。詳細は `microcms/seed-csv/README.md`。

`scripts/import-microcms.mjs` を使えば参照フィールドも含めて投入できるが、
書き込み権限つきのAPIキーが必要。

## 6. 記事を入稿する

**コンテンツIDがそのまま記事URLになる。** `/blog/<コンテンツID>`

記事作成画面の右上「コンテンツIDを変更」から、英数字のIDを設定する運用にすること。
自動生成のランダムIDのままだと URL が読みにくくなり、後から変えると URL が変わる。

例: `kyoto-2days-guide` → `https://tabinoshiori.jp/blog/kyoto-2days-guide`

### フィールド入力の注意

| フィールド | 注意点 |
|---|---|
| `tags`（不安タグ） | セレクトから**1つ以上選ぶ**（下記参照） |
| `freeTags`（自由タグ） | カンマ区切りのテキスト。表示されるだけで一覧ページは持たない |
| `destination` | カンマ区切り。しおりの目的地と突き合わせるので、しおり側の表記に合わせる |
| `excerpt` | 一覧と OGP に出る。120文字以内が目安 |
| `seoDescription` | 未設定なら `excerpt` が使われる |
| `ogImage` | 未設定なら `coverImage` が使われる |
| `featured` | ON にした記事がブログトップの大きな枠に出る |
| `priceCheckedAt` | **金額を書いたら必ず設定する**（下記参照） |
| `priceSources` | 同上。カンマ区切り |

### 不安タグと自由タグ（2つのフィールドに分かれている）

カテゴリ（情報の種類）とは別に、「不安の種類」でも記事を探せるようにしている。
この2軸が「たびのまえに」の探し方の骨格。

**`tags`（不安タグ）** はセレクトフィールドの複数選択。選んだものが一覧ページに載る。
以前はカンマ区切りテキストだったが、打ち間違えると警告も出ずに一覧から消えるため、
選択式にしてある。**記事ごとに1つ以上選ぶこと。**

| 選択肢 | 一覧ページ |
|---|---|
| お金の不安 | `/blog/tag/money` |
| 手続きの不安 | `/blog/tag/paperwork` |
| 現地の不安 | `/blog/tag/onsite` |
| 段取りの不安 | `/blog/tag/planning` |

**`freeTags`（自由タグ）** はカンマ区切りのテキスト。`台湾, はじめての旅行` のように
自由に書ける。ただし記事下部に `#台湾` と**表示されるだけで、一覧ページは持たない**
（リンクにもならない）。読者の導線にはならないので、分類の主役にしないこと。

不安タグを増減するときは、**2か所を必ず揃える。**

1. `src/lib/microcms/tags.ts` の `ANXIETY_TAGS`（コード変更）
2. microCMS の `tags` フィールドの選択肢

片方だけ変えると、一覧ページはあるのに選べない（または選べるのに一覧に出ない）
状態になる。一覧ページ・sitemap・ブログトップのナビは `ANXIETY_TAGS` に自動で追従する。

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

1. 管理画面 → `articles` API → API設定 → Webhook
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

## トラブルシューティング

### ビルドは通るのに記事が出ない

サーバーログ（Netlify なら Deploy log）に次のエラーが出ていないか確認する。

```
[blog] microCMS の articles を取得できませんでした。エンドポイント名・APIキーの権限・サービスIDを確認してください。
```

よくある原因は3つ。

| 症状 | 原因 | 対処 |
|---|---|---|
| 404 | エンドポイント名が `articles` / `categories` / `spots` になっていない | API の作り直し（エンドポイント名は変更できない） |
| 403 / 401 | APIキーの権限不足、または失効 | サービス設定 → APIキー で GET 権限を確認 |
| 404 | サービスIDの綴り違い | `MICROCMS_SERVICE_DOMAIN` を管理画面URLと突き合わせる |

### 記事は出るのに不安タグの一覧ページが空になる

`tags` の選択肢の文字列が `src/lib/microcms/tags.ts` の `label` と一致していない。
全角スペースや表記ゆれ（「お金の悩み」など）でも一致しなくなる。
microCMS の `tags` フィールドの選択肢を、下記と完全一致に直す。

`お金の不安` / `手続きの不安` / `現地の不安` / `段取りの不安`

**環境変数が設定されていて取得に失敗した場合、記事は0件として扱う。**
シードデータにはフォールバックしない。サンプル記事（レイアウト確認用の金額を含む）が
本番で公開されるのを防ぐため。

ビルド自体は通る。CMS の不調でサイト全体がデプロイできなくなるのを避けている。

---

## 補足: 編集方針

編集方針は確定済み。詳細は `docs/BLOG_HANDOVER.md` セクション7を参照。

- 分類は2軸。カテゴリ（情報の種類）＋不安タグ（不安の種類）
- メディア名は「たびのまえに」（`src/lib/site.ts` の `BLOG_NAME`）
- 金額は出す。ただし調査時点と出典の併記が必須
