# ブログ機能 引き継ぎドキュメント

最終更新: 2026-08-24

旅のしおり（tabinoshiori）のブログ機能を引き継ぐためのドキュメント。
実装の現状・検証済みの範囲・未解決の判断・残作業をまとめている。

関連ドキュメント:
- `docs/BLOG_SPECIFICATION.md` — 仕様書。全章とも実装・現在の方針と一致（未実装機能はセクション11参照）
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

**フォールバック機構**: フォールバックは2段階ある。

| 状況 | 挙動 |
|---|---|
| 環境変数が未設定 | `src/data/blogPosts.ts` のシードデータを返す（ローカル開発用） |
| 環境変数は設定済みだが microCMS の呼び出しが失敗 | **空を返す**。ビルドは通す |

2で空にしてシードデータを返さないのは、本番でサンプル記事が公開されるのを防ぐため。
サンプル記事にはレイアウト確認用の金額が入っており、事実として出してはいけない。

どちらの場合もビルドは通す。**CMS の不調でサイト全体（LP・しおりを含む）が
デプロイできなくなる事態を避けるため。** 以前はここで例外が外に漏れ、
Netlify のビルドが `exit code 2` で落ちていた。

未設定時はサーバーログに警告が出る（プロセスにつき1回）:

```
[blog] microCMSの環境変数が未設定のため、ローカルのシードデータを使用しています。
```

呼び出しが失敗したときはエラーログが出る:

```
[blog] microCMS の articles を取得できませんでした。エンドポイント名・APIキーの権限・サービスIDを確認してください。
```

---

## 3. ファイル構成

### データ層 `src/lib/microcms/`
| ファイル | 役割 |
|---|---|
| `client.ts` | microCMSクライアント初期化。エンドポイント名（`articles`/`categories`/`spots`）を定義 |
| `queries.ts` | 記事取得関数。**CMS切り替えはこのファイル内で完結する** |
| `mappers.ts` | microCMSレスポンス → `BlogPost` 型への変換 |
| `types.ts` | `BlogPost` / `Category` / `Spot` / `ArticleBody` の型定義 |
| `format.ts` | 読了時間・日付整形・画像URL変換・料金の鮮度判定。**クライアントからも読むので server-only にしないこと** |
| `jsonLd.ts` | 構造化データ生成（Article / BreadcrumbList / Blog / ItemList） |
| `tags.ts` | 「不安の種類」タグの定義。ここを編集すると一覧ページ・sitemap・ナビに反映される |

### ページ `src/app/blog/`
| パス | 内容 |
|---|---|
| `page.tsx` | ブログトップ。不安タグ／カテゴリの2軸ナビ＋注目記事＋新着一覧＋CTA |
| `[slug]/page.tsx` | 記事詳細。`generateStaticParams` でSSG |
| `category/[slug]/page.tsx` | カテゴリ別一覧（情報の種類） |
| `tag/[slug]/page.tsx` | 不安タグ別一覧（不安の種類） |
| `layout.tsx` | ブログ共通ヘッダー／フッター |
| `feed.xml/route.ts` | RSSフィード |

### コンポーネント `src/components/blog/`
| ファイル | 役割 |
|---|---|
| `ArticleCard.tsx` | 記事カード（一覧で使用）。`featured` で大きい表示に切り替わる |
| `ArticleBody.tsx` | 本文描画。HTML（microCMS）とブロック配列（シード）を出し分け |
| `HtmlBody.tsx` | microCMSのリッチエディタHTMLを描画。**`dangerouslySetInnerHTML` 使用** |
| `SpotCard.tsx` | スポットカード |
| `PriceNote.tsx` | 本文中の金額ブロック。出典・調査時点が型で必須 |
| `PriceDisclosure.tsx` | 記事冒頭の料金注釈バナー。6か月経過で警告色 |
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
- `sitemap.ts`: `/blog`・全記事・全カテゴリ・全不安タグを含む。
  記事の `lastModified` は `updatedAt` 基準
- RSS: `/blog/feed.xml`
- 各記事に canonical / OGP / Twitter Card / `max-image-preview:large`

---

## 6. 検証済みの範囲と、未検証の範囲

**ここを取り違えないこと。** 「動いている」と言えるのは以下の範囲のみ。

### 検証済み
- `npm run build` 成功。ブログ関連は全てSSG/Static（ISR 1時間）
- `tsc --noEmit` 通過、ESLint 通過
- HTTP 200: `/blog`, `/blog/[slug]`, `/blog/category/[slug]`, `/blog/tag/[slug]`,
  `/blog/feed.xml`, `/robots.txt`, `/sitemap.xml`。存在しないスラッグ・タグは 404
- 不安タグ4件それぞれの一覧ページが、正しい記事だけを拾うこと
- 料金の鮮度判定 `isPriceStale()` を境界値込みで確認（6か月ちょうど手前は false、
  6か月と1日経過で true）
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

- **スキーマJSONのインポート**（2026-10-02、実機で確認）:
  `microcms/schemas/articles.json` を管理画面からインポートすると、
  セレクトフィールドの選択肢（`selectItems`）と複数選択（`multipleSelect: true`）が
  そのまま反映される。`selectItems` の `id` は microCMS の自動生成値ではなく
  こちらで書いた任意の文字列（`anxiety-1` など）でも受け付けられた

- **microCMSからの実データ取得**（2026-10-04、本番で確認）。
  CSVインポートした記事が `https://tabinoshiori.jp/blog` に表示されることを確認した。
  マッパーのフィールド名と `microcms/schemas/*.json` の対応も実データで通っている。

  **反映にはビルド時点の公開状態しか反映されない。** 記事を公開したあとに
  Netlify で Trigger deploy するか、ISR（1時間）を待つ必要がある。
  公開より先にデプロイすると、記事があっても0件のまま表示される。

### 未検証（引き継ぎ後に必要）
- **セレクトフィールドへのCSVインポート**。`tags` にCSVの文字列が入るかは未確認
  （`microcms/seed-csv/README.md` に入らなかった場合の対応表あり）
- **しおり画面「情報」タブ上での関連記事の実表示**。Hasuraの接続情報（`.env`）が無く、
  しおりのデータを取得できないため。一時ルートを立ててコンポーネント単体の
  見た目のみ確認し、そのルートは削除済み
- **画像の実表示**。開発コンテナのネットワークポリシーが `images.unsplash.com` を
  ブロックしており（`next/image` が 403）、画像そのものの表示は確認できていない。
  レイアウト・領域確保は確認済み。本番では既存LPと同じ経路なので問題ない見込み
- 本番デプロイ後の挙動全般

---

## 7. 編集方針（オーナー確定済み）

### コンセプト
ブログのコンセプトは「**旅行初心者・これから旅行に行く人の後押し**」。
航空券の安い時期、安く旅行する方法など、**旅行の不安や懸念を取り除く**内容にする。
旅のしおりのユーザー以外にも届く、広い読者に向けた内容にする。

**(1) 分類は2軸** — 確定・**対応済み**

カテゴリ（情報の種類）はそのまま維持し、「不安の種類」をタグの軸として追加した。
読者は「自分が何に困っているか」からも、「何の記事か」からも辿れる。

| 軸 | 実体 | URL | 定義場所 |
|---|---|---|---|
| 情報の種類 | カテゴリ（目的地ガイド / 旅の準備 / モデルコース） | `/blog/category/<slug>` | microCMS の `categories` API |
| 不安の種類 | タグ（お金 / 手続き / 現地 / 段取り） | `/blog/tag/<slug>` | `src/lib/microcms/tags.ts` |

不安タグは microCMS 側では `tags`（セレクトフィールド・複数選択）で運用する。
選択式にしているのは、テキスト入力だと打ち間違えたときにエラーも警告も出ないまま
一覧から消えてしまい、入稿者が気づけないため。

| slug | label（microCMS の選択肢） |
|---|---|
| `money` | お金の不安 |
| `paperwork` | 手続きの不安 |
| `onsite` | 現地の不安 |
| `planning` | 段取りの不安 |

一覧ページを持たない表示専用のタグ（`台湾`、`はじめての旅行` など）は、
別フィールドの `freeTags`（カンマ区切りテキスト）に入れる。記事下部に `#台湾` と
表示されるだけでリンクにはならないので、分類の主役にはしないこと。

不安タグを増減するときは **2か所を揃える**。`src/lib/microcms/tags.ts` の
`ANXIETY_TAGS` と、microCMS の `tags` フィールドの選択肢。片方だけ変えると、
一覧ページはあるのに選べない（または選べるのに一覧に出ない）状態になる。
一覧ページ・sitemap・ブログトップのナビは `ANXIETY_TAGS` から自動生成される。

**(2) メディア名** — 確定・**対応済み**

「**たびのまえに**」。`src/lib/site.ts` の `BLOG_NAME` に定義してある。
ここを書き換えれば、ヘッダー・フッター・RSS・構造化データに一括で反映される。
URLは `/blog` のままなのでSEOコストはゼロ。

**(3) 価格情報の扱い** — 確定・**対応済み**

方針: **金額・相場は出す。ただし必ず注釈と根拠を添え、事実に基づく情報だけを載せる。**

これを運用ルールではなく仕組みで担保している。

| 仕組み | 実体 | 効果 |
|---|---|---|
| 記事単位の注釈バナー | `PriceDisclosure.tsx` | `priceCheckedAt` を設定すると記事冒頭に「◯年◯月時点」と出典が出る |
| 棚卸しの可視化 | `format.ts` の `isPriceStale()` | 調査から6か月を過ぎるとバナーが警告色になり、金額ブロックに「要更新」バッジが付く |
| 金額単位の注釈 | `PriceNote.tsx` / `PriceFigure` 型 | `source` と `surveyedAt` が**必須プロパティ**。注釈なしで金額だけ書くことが型レベルでできない |
| 根拠画像 | `PriceFigure.image` | 検索結果のスクリーンショットなどを金額の直下に置ける |

microCMS 側には `priceCheckedAt`（日付）と `priceSources`（カンマ区切りテキスト）を
追加済み。**金額を書いた記事はこの2つを必ず設定すること。**

> ⚠️ シードデータの `cheap-flight-timing` に入っている金額は**レイアウト確認用の
> サンプル値**であり、実際に調査した数値ではない。実記事では必ず自分で確認した
> 数値と出典に差し替えること。サンプルと分かるよう、値と出典の両方に「サンプル」と
> 明記してある。

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

編集方針（セクション7）は確定済み。残るのは認証情報と入稿が必要な作業。

1. **microCMS接続** — `docs/MICROCMS_SETUP.md` の手順を実施。オーナーがAPIキーを
   `.env.local` に設定する必要がある（**AIがキーを入力してはいけない**）
2. **実記事の入稿**（10本目安。仕様書3-3では管理画面の統計から人気目的地の上位を優先とある）
   - 各記事に不安タグを最低1つ選ぶ（セクション7-(1)の表を参照）
   - 金額を書く記事は `priceCheckedAt` と `priceSources` を必ず設定する
3. **本番環境の環境変数設定**（Netlify等。忘れると本番でシードデータが表示され続ける）
4. **Search Console にsitemap送信・インデックス登録リクエスト**（コードでは完結しない）
5. **シードデータの削除**（`src/data/blogPosts.ts` と `queries.ts` のフォールバック分岐）
6. **しおり情報タブでの関連記事の実表示確認**（Hasura接続が必要）
7. **料金記事の棚卸し運用を決める** — 仕組み（6か月で警告色）は入っているが、
   誰がいつ見直すかの運用は未定
8. ~~`docs/BLOG_SPECIFICATION.md` の更新~~ → 全章対応済み

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
スキーマJSONでは参照先APIを指定できないため、`articles` APIの
`category`（参照）→ `categories`、`spots`（複数参照）→ `spots` を管理画面で設定する。

**`freeTags` / `destination` はカンマ区切りテキスト**
microCMSに文字列配列型がないため。`mappers.ts` の `splitList()` が
カンマ・読点・改行で分割する。`tags`（セレクト）と `freeTags` は
`toTagList()` が `BlogPost.tags` の1本の配列にまとめる。

**`HtmlBody.tsx` はサニタイズしていない**
入稿者が運営のみである前提（仕様書2章）。外部ライターに入稿権限を渡す場合は
サニタイズ処理（sanitize-html等）の追加が必須。

**カテゴリ・目的地の絞り込みはメモリ上で行っている**
記事数が数十本の想定のため、microCMS の `filters` を使わず全件取得後に絞っている
（`queries.ts` の `getAllPosts` 参照）。数百本規模になったら `filters` に切り替えること。

**APIリクエスト数はプラン上限に注意**
microCMS はプランごとに月間APIリクエスト数の上限がある。
`getAllPosts` / `getAllCategories` / `getPostBySlug` は React の `cache()` で包んであり、
1ページの描画中に何度呼んでも通信は1回で済む（`generateMetadata` と本体の重複呼び出しを含む）。

シードデータでの実測値（1ビルド＝全ページ再生成あたりの関数実行回数）:

| | cache なし | cache あり |
|---|---|---|
| getAllPosts | 17 | 16 |
| getAllCategories | 12 | 6 |
| getPostBySlug | 8 | 4 |
| 合計 | 37 | 26 |

`cache()` はページ単位のスコープなので、ページ間の重複までは消せない。
記事数が増えて上限が近づいたら、`next/cache` の `unstable_cache` でページ横断の
キャッシュを入れることを検討する（`revalidatePath` との相互作用に注意）。

**Hobby プランでは webhook が使えない**
その場合 `MICROCMS_WEBHOOK_SECRET` は設定不要。記事は ISR により最大1時間で反映される。
すぐ反映したいときはホスティング管理画面から手動で再デプロイする。

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

## 11. 注意: 既存仕様書との関係

`docs/BLOG_SPECIFICATION.md` は全章とも実装・現在の方針に合わせて更新済み。
コンセプト（1章）、2軸の分類と金額の扱い（3章）、microCMS の構成（4・5・9章）は
いずれもこのドキュメントと一致している。

ただし、**仕様として書いてあるが未実装の機能がある。** 仕様書側にも明記してあるが、
読み飛ばしやすいのでここにも挙げておく。

| 仕様書の箇所 | 内容 | 状態 |
|---|---|---|
| 7-1・7-2・7-4 | 記事内のスポットをワンタップでしおりに追加 | 未実装。型・スキーマ・`SpotCard.tsx` までは用意済み |
| 6-1 | 目的地タグクラウド、カテゴリ別ピックアップ | 未実装 |
| 6-2 | ページネーション、目的地タグフィルター | 未実装 |
| 4-4 | 下書きプレビュー | 未実装 |
| 10章 | 将来的な拡張（動画埋め込み・レコメンド等） | 未着手 |

いずれも記事数が10本程度のあいだは不要と判断したもの。
