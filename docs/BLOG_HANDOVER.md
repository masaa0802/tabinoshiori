# ブログ機能 引き継ぎドキュメント

最終更新: 2026-08-24

旅のしおり（tabinoshiori）のブログ機能を引き継ぐためのドキュメント。
実装の現状・検証済みの範囲・未解決の判断・残作業をまとめている。

関連ドキュメント:
- `docs/BLOG_SPECIFICATION.md` — 元の仕様書（**一部が現状と乖離。セクション11参照**）
- `docs/MICROCMS_SETUP.md` — microCMS接続の手順書

---

## 1. ひとことで言うと

ブログ機能の**土台は動く状態で完成しているが、CMSに未接続で実記事がゼロ**。
現在はローカルのシードデータ（サンプル記事4本）で動作している。
編集方針（カテゴリ設計・メディア名・記事のトーン）は議論途中で未確定。

---

## 2. アーキテクチャ

```
microCMS (未接続)
  └─ src/lib/microcms/client.ts     … SDKクライアント（server-only）
       └─ queries.ts                 … 記事取得。環境変数が無ければシードデータにフォールバック
            ├─ src/app/blog/**       … ページ（Server Component / ISR 1時間）
            ├─ src/app/api/blog/related  … 情報タブ用（クライアントから呼ぶ）
            └─ src/app/sitemap.ts, blog/feed.xml
```

**重要な設計判断: `queries.ts` は `server-only`。**
microCMSのAPIキーがクライアントバンドルに載るのを防ぐため。
クライアントコンポーネントから記事を取得する場合は必ず `/api/blog/related` のような
Route Handler を経由すること。直接importするとビルドが落ちる。

**フォールバック機構**: 環境変数 `MICROCMS_SERVICE_DOMAIN` / `MICROCMS_API_KEY` が
未設定なら `src/data/blogPosts.ts` のシードデータを返す。
未設定時はサーバーログに警告が出る（プロセスにつき1回）:

```
[blog] microCMSの環境変数が未設定のため、ローカルのシードデータを使用しています。
```

---

## 3. ファイル構成

### データ層 `src/lib/microcms/`
| ファイル | 役割 |
|---|---|
| `client.ts` | microCMSクライアント初期化。エンドポイント名（`blogs`/`categories`/`spots`）を定義 |
| `queries.ts` | 記事取得関数。**CMS切り替えはこのファイル内で完結する** |
| `mappers.ts` | microCMSレスポンス → `BlogPost` 型への変換 |
| `types.ts` | `BlogPost` / `Category` / `Spot` / `ArticleBody` の型定義 |
| `format.ts` | 読了時間・日付整形・画像URL変換。**クライアントからも読むので server-only にしないこと** |
| `jsonLd.ts` | 構造化データ生成（Article / BreadcrumbList / Blog / ItemList） |

### ページ `src/app/blog/`
| パス | 内容 |
|---|---|
| `page.tsx` | ブログトップ。注目記事＋カテゴリ＋新着一覧＋CTA |
| `[slug]/page.tsx` | 記事詳細。`generateStaticParams` でSSG |
| `category/[slug]/page.tsx` | カテゴリ別一覧 |
| `layout.tsx` | ブログ共通ヘッダー／フッター |
| `feed.xml/route.ts` | RSSフィード |

### コンポーネント `src/components/blog/`
| ファイル | 役割 |
|---|---|
| `ArticleCard.tsx` | 記事カード（一覧で使用）。`featured` で大きい表示に切り替わる |
| `ArticleBody.tsx` | 本文描画。HTML（microCMS）とブロック配列（シード）を出し分け |
| `HtmlBody.tsx` | microCMSのリッチエディタHTMLを描画。**`dangerouslySetInnerHTML` 使用** |
| `SpotCard.tsx` | スポットカード |
| `BlogHighlights.tsx` | LPに差し込む新着記事セクション（Server Component） |
| `RelatedArticles.tsx` | しおり画面「情報」タブの関連記事（Client Component） |

### API
| パス | 役割 |
|---|---|
| `src/app/api/blog/related/route.ts` | 目的地に一致する記事を返す。情報タブから呼ばれる |
| `src/app/api/revalidate/route.ts` | microCMS webhook受け口。HMAC-SHA256署名を検証 |

### その他
| ファイル | 役割 |
|---|---|
| `src/data/blogPosts.ts` | シードデータ（サンプル記事4本）。**実記事投入後は削除予定** |
| `src/lib/site.ts` | サイトURL・名称・ロゴURLの定数 |
| `microcms/schemas/*.json` | microCMSのAPIスキーマ定義（管理画面からインポート可能） |
| `.env.local.example` | 環境変数のテンプレート |

---

## 4. アプリ内の導線（3箇所）

しおり作成フローを妨げない位置に配置している。**この方針は維持すること。**

| 位置 | ファイル | 意図 |
|---|---|---|
| LPフッター | `src/app/page.tsx` | 全ページ共通の受け皿 |
| LP CTAセクション直下 | `src/app/page.tsx`（`<BlogHighlights />`） | ヒーローCTAより**下**に置き、作成導線に干渉させない |
| しおり「情報」タブ末尾 | `InformationContent.tsx`（`<RelatedArticles />`） | 予約情報の保管場所であり主動線ではないため |

**スマホ下部ナビに5個目のタブを追加してはいけない。** 現在4分割（`flex-1`）で、
5分割にすると既存タブのタップ領域が2割狭くなり、しおり利用体験が劣化する。

`RelatedArticles` は関連記事が0件のときセクションごと描画しない。
情報タブを無駄に長くしないため、およびCMS未接続時に空セクションが出ないようにするため。

---

## 5. SEO / AI検索対応（実装済み）

- `robots.ts`: GPTBot / OAI-SearchBot / ChatGPT-User / ClaudeBot / Claude-User /
  PerplexityBot / Google-Extended / Applebot-Extended / Bingbot / CCBot を明示許可。
  `/group/` `/admin/` は全クローラーから除外
- 構造化データ: 記事に `Article` + `BreadcrumbList`、一覧に `Blog` + `ItemList`
  （一覧に全記事の絶対URLを列挙し、検索側が記事単体を直接扱えるようにしている）
- `sitemap.ts`: `/blog`・全記事・全カテゴリを含む。記事の `lastModified` は `updatedAt` 基準
- RSS: `/blog/feed.xml`
- 各記事に canonical / OGP / Twitter Card / `max-image-preview:large`

---

## 6. 検証済みの範囲と、未検証の範囲

**ここを取り違えないこと。** 「動いている」と言えるのは以下の範囲のみ。

### 検証済み
- `npm run build` 成功。ブログ関連は全てSSG/Static（ISR 1時間）
- `tsc --noEmit` 通過、ESLint 通過
- HTTP 200: `/blog`, `/blog/[slug]`, `/blog/category/[slug]`, `/blog/feed.xml`,
  `/robots.txt`, `/sitemap.xml`。存在しないスラッグは 404
- JSON-LD の出力内容をパースして確認（Article / BreadcrumbList / Blog / ItemList）
- `robots.txt` / `sitemap.xml` / `feed.xml` の出力内容
- `/api/blog/related?destination=京都` が正しい記事を返すこと。
  目的地なし・該当なしのときは空配列
- webhook署名検証（ローカルのテスト用シークレットで実施）:
  - 正しい署名 → 200、`/blog`・`/`・`/sitemap.xml`・該当記事を再生成
  - 誤った署名 → 401
  - 署名ヘッダーなし → 401
  - 署名の長さが異なる → 401（`timingSafeEqual` の長さ不一致で例外を投げないようガード済み）
  - 削除イベント（`contents.old`）→ 200
  - 署名は正しいが本文がJSONでない → 200（一覧のみ再生成）
- レイアウト表示（Chromium・実測）:
  - モバイル幅 390px: ブログトップ・記事詳細・カテゴリ一覧・関連記事セクション
  - タブレット幅 768px / デスクトップ幅 1280px
  - いずれも横スクロールの発生なし（`scrollWidth - clientWidth = 0`）
  - 関連記事カードがモバイルで横並び、`sm` 以上で縦積みに切り替わることを確認

### 未検証（引き継ぎ後に必要）
- **microCMSからの実データ取得**（認証情報が無いため一度も通っていない）。
  マッパーのフィールド名は `microcms/schemas/*.json` と揃えてあるが、実データでの疎通は未確認
- **しおり画面「情報」タブ上での関連記事の実表示**。Hasuraの接続情報（`.env`）が無く、
  しおりのデータを取得できないため。一時ルートを立ててコンポーネント単体の
  見た目のみ確認し、そのルートは削除済み
- **画像の実表示**。開発コンテナのネットワークポリシーが `images.unsplash.com` を
  ブロックしており（`next/image` が 403）、画像そのものの表示は確認できていない。
  レイアウト・領域確保は確認済み。本番では既存LPと同じ経路なので問題ない見込み
- 本番デプロイ後の挙動全般

---

## 7. 未解決の判断（**着手前にオーナーへ確認すること**）

ブログの編集方針を議論中に引き継ぎとなったため、以下が未確定。
**コンテンツ設計に関わるので、記事を書き始める前に決める必要がある。**

### 決まっていること（オーナーの意向）
ブログのコンセプトは「**旅行初心者・これから旅行に行く人の後押し**」。
航空券の安い時期、安く旅行する方法など、**旅行の不安や懸念を取り除く**内容にしたい。
旅のしおりのユーザー以外にも届く、広い読者に向けた内容にする。

### 決まっていないこと

**(1) カテゴリ設計を切り直すか**

現行は `目的地ガイド / 旅の準備 / モデルコース`（情報の種類による分類）。
コンセプトに合わせ「不安の種類」で切り直す案を提示済み・未承認:

| 案 | 潰す不安 | 記事例 |
|---|---|---|
| お金の不安 | 高そう・予算が読めない | 航空券が安い時期、格安で行く手段、予算の立て方 |
| 手続きの不安 | 何を準備すればいいか分からない | パスポート、ビザ・ESTA、保険、持ち物 |
| 現地の不安 | 言葉・移動・治安が心配 | 空港から市街への行き方、SIM・Wi-Fi、両替 |
| 段取りの不安 | 日程が組めない | モデルコース、何日必要か、詰め込みすぎない組み方 |

決定後、`docs/MICROCMS_SETUP.md` セクション5の入稿内容と
`src/data/blogPosts.ts` の `seedCategories` の更新が必要。

**(2) メディア名**

現在の表示名は「旅行ガイド」（`src/lib/site.ts` の `BLOG_NAME`）。
一般名詞すぎてコンセプト（初心者向け・不安解消）を伝えていないため変更を提案済み・未承認。
URLは `/blog` のままなのでSEOコストはゼロ。
`BLOG_NAME` を書き換えれば、ヘッダー・フッター・RSS・構造化データに一括で反映される。

**(3) 価格情報の扱い**

「航空券の安い時期」系は鮮度が命で、放置すると誤情報になる。2案を提示済み・未承認:
- A: 具体的な金額を書かず「構造」で書く（例:「需要の谷は1月中旬〜2月、GW明け、11月。理由は◯◯」）
- B: 金額も出して、更新月を決めて定期的に棚卸しする

シードデータの `cheap-flight-timing` は暫定的に A（金額を書かない）で執筆してある。
B を採る場合は書き直しが必要。

**(4) コピーの修正** — 方針合意済み・**対応済み**

以前のコピーは読者が「旅のしおり」を既に知っている前提になっていたため、
検索流入した初見の読者にも通じる言い回しに書き直した。

| 箇所 | 対応 |
|---|---|
| ブログトップ本文 | 製品前提の文言を置かず、読者の便益のみで書いた |
| ブログトップ meta description | 記事内容だけで完結させた（サービス説明を入れていない） |
| 記事末尾CTA | 「この内容をもとに、旅程を組み立てる」＋機能の説明。製品名を知らなくても通じる |

CTA自体は残している（読了後の位置は正しい）。

---

## 8. 残作業（優先度順）

1. **microCMS接続** — `docs/MICROCMS_SETUP.md` の手順を実施。オーナーがAPIキーを
   `.env.local` に設定する必要がある（**AIがキーを入力してはいけない**）
2. **上記セクション7の判断を確定**
3. **カテゴリ確定に伴うシードデータ・入稿内容の更新**
4. **実記事の入稿**（10本目安。仕様書3-3では管理画面の統計から人気目的地の上位を優先とある）
5. **本番環境の環境変数設定**（Netlify等。忘れると本番でシードデータが表示され続ける）
6. **Search Console にsitemap送信・インデックス登録リクエスト**（コードでは完結しない）
7. **シードデータの削除**（`src/data/blogPosts.ts` と `queries.ts` のフォールバック分岐）
8. **しおり情報タブでの関連記事の実表示確認**（Hasura接続が必要）
9. **`docs/BLOG_SPECIFICATION.md` の更新**（セクション11参照）

---

## 9. ハマりどころ・制約

**セグメント設定はリテラルでないとビルドが落ちる**
`export const revalidate = 3600;` のように直接書く。定数をimportして代入すると
`Invalid segment configuration export detected` でビルド失敗する。

**`src/app/` 配下の `_` 始まりディレクトリはルーティングされない**
Next.js の App Router ではプライベートフォルダ扱いになる。
検証用の一時ルートを作るときに踏みやすい。

**`.gitignore` の `.env*` が example ファイルまで除外する**
`!.env.local.example` の例外を追加済み。消さないこと。

**microCMSのコンテンツIDがURLスラッグ**
記事URLは `/blog/<コンテンツID>`。記事作成時に「コンテンツIDを変更」から
英数字のIDを設定する運用が必要。自動生成のランダムIDだとURLが読みにくくなる。

**スキーマインポート後の手動設定が2箇所ある**
スキーマJSONでは参照先APIを指定できないため、`blogs` APIの
`category`（参照）→ `categories`、`spots`（複数参照）→ `spots` を管理画面で設定する。

**`tags` / `destination` はカンマ区切りテキスト**
microCMSに文字列配列型がないため。`mappers.ts` の `splitList()` が
カンマ・読点・改行で分割する。

**`HtmlBody.tsx` はサニタイズしていない**
入稿者が運営のみである前提（仕様書2章）。外部ライターに入稿権限を渡す場合は
サニタイズ処理（sanitize-html等）の追加が必須。

**カテゴリ・目的地の絞り込みはメモリ上で行っている**
記事数が数十本の想定のため、microCMS の `filters` を使わず全件取得後に絞っている
（`queries.ts` の `getAllPosts` 参照）。数百本規模になったら `filters` に切り替えること。

**`npm run lint` が動かない**
`next lint` は Next.js 16 で廃止された。ブログ機能とは無関係の既存の問題。
当面は `./node_modules/.bin/eslint <path>` を直接使う。

---

## 10. 開発コマンド

```bash
npm install
```

```bash
npm run build
```

```bash
./node_modules/.bin/tsc --noEmit
```

```bash
./node_modules/.bin/eslint src/lib/microcms src/components/blog src/app/blog
```

webhook署名検証のローカルテスト例（`MICROCMS_WEBHOOK_SECRET` を設定した状態で、
`PORT` を実際のポート番号に置き換える）:

```bash
BODY='{"contents":{"new":{"id":"kyoto-2days-guide"}}}'; SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$MICROCMS_WEBHOOK_SECRET" | sed 's/^.*= //'); curl -s -X POST http://localhost:PORT/api/revalidate -H "X-MICROCMS-Signature: $SIG" -d "$BODY"
```

---

## 11. 注意: 既存仕様書との乖離

`docs/BLOG_SPECIFICATION.md` は着手前に書かれたもので、**現状と3点ズレている**。
参照する際は注意し、方針確定後に更新すること。

1. **CMSがContentful前提のまま**（4章・5章・9章）。実装はmicroCMSに移行済み。
   フィールド定義の考え方は流用できるが、パッケージ名・環境変数名・APIの呼び方は全て異なる
2. **ブログの位置づけが「しおり作成の質を上げるための情報インフラ」**（1章）。
   セクション7に記した「旅行初心者の不安を取り除く、広い読者向けメディア」という
   現在の意向とは方向性が異なる
3. **6-1・6-2の一部が未実装**。目的地タグクラウド、カテゴリ別ピックアップ、
   タグによる絞り込み、ページネーションは作っていない。記事数が10本程度のあいだは不要と判断した

また、仕様書7-1にある「記事内のスポットをワンタップでしおりに追加」機能は**未実装**。
`Spot` の型とスキーマ、表示用の `SpotCard.tsx`（地図リンクまで）は用意してあるが、
追加ボタン・旅程選択モーダル（仕様書7-2）は作っていない。
