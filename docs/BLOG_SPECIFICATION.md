# ブログ機能 仕様書・設計書

> **技術面（4章・5章・8章・9章・付録）は実装に合わせて更新済み。CMS は microCMS。**
>
> 実装の現状・検証済みの範囲・残作業は `docs/BLOG_HANDOVER.md` を、
> 接続手順は `docs/MICROCMS_SETUP.md` を参照してください。
>
> まだ実装と食い違っている箇所が2つあります。
>
> 1. **ブログの位置づけ**（1章・2章）が「しおり作成の質を上げるための情報インフラ」の
>    ままです。現在のコンセプトは「旅行初心者の不安を取り除く、広い読者向けメディア」で、
>    方向性が異なります。3章のカテゴリ設計も、実装では「情報の種類」と「不安の種類」の
>    2軸になっています（`docs/BLOG_HANDOVER.md` セクション7）。
> 2. **未実装の機能があります。** 7-1・7-2 の「記事内のスポットをワンタップでしおりに
>    追加」、6-1 の目的地タグクラウドとカテゴリ別ピックアップ、6-2 のページネーション。
>    4-4 の下書きプレビューも作っていません。

## 目次
1. [概要・目的](#1-概要目的)
2. [ビジネス要件](#2-ビジネス要件)
3. [コンテンツ戦略](#3-コンテンツ戦略)
4. [システム設計](#4-システム設計)
5. [microCMSコンテンツモデル](#5-microcmsコンテンツモデル)
6. [ページ・機能仕様](#6-ページ機能仕様)
7. [しおりとの連携仕様](#7-しおりとの連携仕様)
8. [SEO設計](#8-seo設計)
9. [技術仕様](#9-技術仕様)
10. [将来的な拡張](#10-将来的な拡張)

---

## 1. 概要・目的

### プロダクトビジョン
旅のしおりのブログ機能は、単なるコンテンツ発信にとどまらず、**「しおり作成の質を上げるための情報インフラ」** として位置づける。

ユーザーが旅行先を決め、しおりを作る際に「現地のリアルな情報」をアプリ内で取得できることで：
- しおりの完成度・満足度が向上する
- アプリへの依存度・愛着が高まる
- 旅行前の情報収集がアプリ内で完結する体験を作る

### 運営方針
- **記事作成者**: 運営のみ（microCMS から入稿）
- **公開形態**: 全記事一般公開（SEO最優先）
- **更新頻度目標**: 週1〜2記事（立ち上げ期）

---

## 2. ビジネス要件

### 2-1. 集客（SEO）
旅行関連キーワードで検索流入を獲得し、新規ユーザーをアプリへ誘導する。

```
検索ユーザー
  → 「メキシコ 旅行 おすすめスポット」で検索
  → ブログ記事に流入
  → 記事末尾の「旅のしおりで計画する」CTAからアプリへ
  → グループ作成・しおり作成
```

**ターゲットキーワード例**
| カテゴリ | キーワード例 |
|---|---|
| 目的地ガイド | 「〇〇 観光 おすすめ」「〇〇 旅行 持ち物」 |
| 旅行計画 | 「旅行 スケジュール 立て方」「グループ旅行 計画」 |
| アクティビティ | 「〇〇 グルメ 地元民おすすめ」「〇〇 絶景スポット」 |
| アプリ活用 | 「旅のしおり 使い方」「旅行 持ち物リスト テンプレート」 |

### 2-2. ユーザーリテンション
記事と旅程を連携させることで、しおり作成中のユーザーが記事を参照し続ける動線を作る。

- 旅程の目的地に合わせて関連記事をレコメンド
- 記事内のスポットをワンタップでしおりに追加
- 「この記事を参考にしたしおり」の体験を作る

### 2-3. 将来的な収益化
- **アフィリエイト**: 記事内に宿泊（booking.com）・交通（各社）・ツアー（Viator等）の予約リンクを埋め込む
- **タイアップ記事**: 旅行関連企業とのPR記事（記事内でタグ表示）
- **広告枠**: 記事ページへのディスプレイ広告設置

### 2-4. ブランド構築
リアルで質の高い旅行情報を継続発信することで「旅のしおり = 旅行計画の信頼できる情報源」としてのポジションを確立する。

---

## 3. コンテンツ戦略

### 3-1. 記事カテゴリ
| カテゴリ | 内容 | 優先度 |
|---|---|---|
| 目的地ガイド | 都市・地域の総合ガイド（見どころ・食・移動） | 最高 |
| スポット特集 | テーマ別おすすめスポット（絶景・グルメ・穴場など） | 高 |
| 旅行ハック | 費用節約・荷物削減・移動効率化などの実用情報 | 高 |
| モデルコース | 日数別おすすめ旅程（2泊3日など） | 中 |
| アプリ活用ガイド | 旅のしおりの使い方・活用事例 | 中 |

### 3-2. 記事の構成方針
- **一次情報重視**: 実際に行った・調べた情報をベースに
- **しおりとの接点**: 各記事に「しおりに追加できるスポット」を必ず含める
- **行動を促す**: 記事の終わりに「このルートで旅のしおりを作る」CTAを設置

### 3-3. 立ち上げコンテンツ計画
| フェーズ | 本数 | 内容 |
|---|---|---|
| ローンチ時 | 10記事 | 人気目的地（管理画面の統計から上位を優先）のガイド |
| 〜3ヶ月 | +20記事 | モデルコース・テーマ別スポット特集 |
| 〜6ヶ月 | +30記事 | 長尾キーワード狙い・旅行ハック系 |

---

## 4. システム設計

### 4-1. アーキテクチャ

```
microCMS（記事入稿・管理／SaaS）
  ├─ blogs / categories / spots … リスト形式のAPIを3つ
  └─ 画像は images.microcms-assets.io から配信
        │
        │ microcms-js-sdk（GET のみ。書き込み権限は不要）
        │ 環境変数が未設定ならローカルのシードデータにフォールバック
        ▼
src/lib/microcms/   ← server-only。APIキーはここから外に出ない
  client.ts    SDK初期化・エンドポイント名の定義
  queries.ts   記事取得。CMSの切り替えはこのファイル内で完結する
  mappers.ts   microCMSレスポンス → BlogPost 型への変換
  types.ts     型定義
  format.ts    読了時間・日付・画像URL・料金の鮮度判定
               （クライアントからも読むので server-only にしない）
  jsonLd.ts    構造化データ生成
  tags.ts      「不安の種類」タグの定義
        │
        ├─ Server Component から直接呼ぶ（すべて SSG + ISR 1時間）
        │    /blog                  記事一覧
        │    /blog/[slug]           記事詳細
        │    /blog/category/[slug]  カテゴリ別一覧（情報の種類）
        │    /blog/tag/[slug]       タグ別一覧（不安の種類）
        │    /blog/feed.xml         RSS
        │    /sitemap.xml  /robots.txt
        │    LPの <BlogHighlights />
        │
        └─ Client Component からは Route Handler 経由（直接importは不可）
             /api/blog/related
               └─ しおり「情報」タブの <RelatedArticles />

microCMS webhook（任意。Hobbyプランでは利用できない）
  └─ /api/revalidate  HMAC-SHA256で署名検証 → 該当ページを再生成
```

**しおり連携（Hasura）について**

現状、ブログから Hasura への書き込みは無い。
情報タブの関連記事は、Hasura から取得したしおりの `destination` を
`RelatedArticles` に渡し、`/api/blog/related` で該当記事を引いているだけ。

7章の「記事内のスポットをワンタップでしおりに追加」（`activities` テーブルへの
書き込み）は**未実装**。`Spot` の型・スキーマ・表示用の `SpotCard.tsx` までは
用意してあるが、追加ボタンと旅程選択モーダルは作っていない。

### 4-2. レンダリング戦略
| ページ | 方式 | 理由 |
|---|---|---|
| 記事詳細 | ISR（revalidate: 3600） | SEO最優先・更新頻度が低い |
| 記事一覧 | ISR（revalidate: 3600） | 同上 |
| カテゴリ一覧 | ISR（revalidate: 3600） | 同上 |
| タグ一覧 | ISR（revalidate: 3600） | 同上 |
| 情報タブの関連記事 | Client Component + Route Handler | server-only のため直接取得できない |

`export const revalidate = 3600;` はリテラルで書くこと。
定数を import して代入すると `Invalid segment configuration export detected` で
ビルドが落ちる。

### 4-3. キャッシュ戦略
- 基本は ISR。記事の更新は最大1時間で反映される
- microCMS の webhook で `/api/revalidate` を叩くと即時反映できる。
  ただし **Hobby プランでは webhook を使えない**ため、その場合は ISR のみ。
  すぐ反映したいときはホスティング管理画面から手動で再デプロイする
- microCMS はプランごとにAPIリクエスト数の上限がある。
  `getAllPosts` / `getAllCategories` / `getPostBySlug` は React の `cache()` で
  包んであり、1ページの描画中に何度呼んでも通信は1回で済む

### 4-4. 下書きプレビューについて

**未実装。** microCMS には下書きプレビュー用の API がある（`draftKey` を付けて取得）が、
プレビュー用のルートは作っていない。必要になったら追加する。

---

## 5. microCMSコンテンツモデル

> エンドポイント名は `blogs` / `categories` / `spots`。
> `src/lib/microcms/client.ts` の `MICROCMS_ENDPOINTS` と一致している必要がある。
> 3つともリスト形式で作成すること（形式は後から変更できない）。
>
> 実際に管理画面へインポートできるスキーマJSONを `microcms/schemas/` に置いてある。
> 以下の表は、そのJSONの内容を読みやすくしたもの。

### 5-1. BlogPost（記事）
| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| title | Short text | ✓ | 記事タイトル |
| slug | Short text | ✓ | URL用スラッグ（例: mexico-travel-guide） |
| excerpt | Short text | ✓ | 一覧表示用の抜粋（120文字以内） |
| coverImage | Media | ✓ | アイキャッチ画像 |
| body | Rich Text | ✓ | 本文（見出し・画像・リンク・埋め込み可） |
| category | Reference → Category | ✓ | カテゴリ |
| tags | Short text (list) | | タグ（複数可） |
| destination | Short text (list) | | 関連する目的地名（例: メキシコ、東京） |
| spots | Reference (list) → Spot | | 記事内で紹介するスポット |
| seoTitle | Short text | | OGPタイトル（未設定時はtitleを使用） |
| seoDescription | Short text | | metaディスクリプション（160文字以内） |
| ogImage | Media | | OGP画像（未設定時はcoverImageを使用） |
| publishedAt | Date & time | ✓ | 公開日（表示・ソートに使用） |
| featured | Boolean | | トップ表示フラグ |

### 5-2. Category（カテゴリ）
| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| name | Short text | ✓ | カテゴリ名（例: 目的地ガイド） |
| slug | Short text | ✓ | URL用スラッグ |
| description | Short text | | カテゴリの説明 |
| order | Integer | | 表示順 |

### 5-3. Spot（スポット）
しおりへの追加ボタンのデータソースとなる。

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| name | Short text | ✓ | スポット名 |
| description | Short text | ✓ | 簡単な説明（しおり追加時に表示） |
| placeId | Short text | | Google Maps Place ID |
| lat | Number | | 緯度 |
| lng | Number | | 経度 |
| address | Short text | | 住所 |
| activityType | Short text | | アクティビティ種別（観光・グルメ・宿泊など） |
| photo | Media | | スポット写真 |

---

## 6. ページ・機能仕様

### 6-1. ブログトップ（/blog）

**表示内容**
- ヒーロー: 注目記事（featuredフラグ）を大きく表示
- 新着記事: 最新6件をカード表示
- カテゴリ別ピックアップ: カテゴリごとに3件ずつ
- 目的地タグクラウド: クリックで絞り込み

**カード表示項目**
- アイキャッチ画像
- カテゴリバッジ
- タイトル
- 抜粋
- 公開日
- 読了時間（本文の文字数から自動計算）

### 6-2. 記事一覧（/blog/category/[slug]）
- カテゴリフィルター（タブ切り替え）
- 目的地タグフィルター
- 12件ずつページネーション
- 並び順: 新着順（デフォルト）

### 6-3. 記事詳細（/blog/[slug]）

**ページ構成**
```
┌─────────────────────────────────────┐
│  パンくずリスト                       │
│  アイキャッチ画像                     │
│  カテゴリ / 公開日 / 読了時間          │
│  タイトル                            │
├─────────────────────────────────────┤
│  本文（リッチテキスト）               │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ 📍 スポットカード              │   │
│  │ スポット名・説明               │   │
│  │ [＋ しおりに追加] ボタン       │   │
│  └──────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  CTA: 「このルートで旅のしおりを作る」 │
├─────────────────────────────────────┤
│  タグ一覧                           │
│  関連記事（同カテゴリ or 同目的地）   │
└─────────────────────────────────────┘
```

**CTA（Call to Action）**
- 記事末尾に固定: 「旅のしおりで計画を作る →」
- ヘッダー下にスクロール追従バナー（モバイル）: 「このスポットをしおりに追加」

---

## 7. しおりとの連携仕様

### 7-1. スポット追加フロー

```
ユーザーが記事を読む（ブログページ）
  │
  ├─ グループトークンがある場合（旅行計画中）
  │    └─ [＋ しおりに追加] ボタンが有効
  │         └─ 旅程選択モーダル表示
  │              └─ アクティビティとして追加（GraphQL mutation）
  │
  └─ グループトークンがない場合
       └─ [旅のしおりで計画する] → グループ作成ページへ
```

**グループトークンの取得方法**
- `localStorage`に保存された最後のグループトークンを参照
- または、しおりページからブログを開いた場合はURLパラメータで渡す（`?token=xxx`）

### 7-2. 旅程選択モーダル

スポット追加ボタンを押したとき：
1. そのグループの旅程一覧を取得
2. ユーザーが旅程を選択
3. 日付を選択（または未定）
4. アクティビティとして追加完了

### 7-3. 旅程画面からのブログ連携

**情報タブ内の「関連記事」セクション**
- 旅程の `destination` と一致するブログ記事を `/api/blog/related` 経由で取得
- 最大3件を情報タブの末尾に表示。0件のときはセクションごと描画しない
- 「もっと見る」でブログ一覧へ遷移

`RelatedArticles` は Client Component のため、`queries.ts`（server-only）を
直接 import できない。必ず Route Handler を挟むこと。

```
旅程の目的地: 「メキシコ」
  ↓
/api/blog/related?destination=メキシコ
  ↓
サーバー側で microCMS から取得し、destination が部分一致する記事を返す
  ↓
情報タブに「メキシコの旅行に役立つ記事」として表示
```

### 7-4. 追加されるアクティビティのデータ形式

```typescript
{
  name: spot.name,          // スポット名
  location: spot.address,   // 住所
  place_id: spot.placeId,   // Google Maps Place ID
  lat: spot.lat,
  lng: spot.lng,
  type: spot.activityType,  // 観光・グルメ等
  notes: `「${articleTitle}」より追加`, // 参照元記事名
  date: selectedDate,       // 選択した日付
  itinerary_id: selectedItineraryId,
}
```

---

## 8. SEO設計

### 8-1. メタタグ・OGP
```typescript
// 記事詳細ページ
export const generateMetadata = async ({ params }) => ({
  title: `${post.seoTitle ?? post.title} | 旅のしおり`,
  description: post.seoDescription,
  openGraph: {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription,
    images: [post.ogImage?.url ?? post.coverImage.url],
    type: 'article',
    publishedTime: post.publishedAt,
  },
  twitter: { card: 'summary_large_image' },
});
```

### 8-2. 構造化データ（JSON-LD）
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "記事タイトル",
  "image": "アイキャッチURL",
  "datePublished": "2026-01-01",
  "publisher": {
    "@type": "Organization",
    "name": "旅のしおり"
  }
}
```

### 8-3. サイトマップ
- `/sitemap.xml` に `/blog`・全記事・全カテゴリ・全タグを含める
- 記事の `lastModified` は `updatedAt` 基準
- ISR（1時間）で自動再生成。webhook があれば即時

### 8-4. パフォーマンス
- アイキャッチ画像は`next/image`で最適化（WebP変換・サイズ自動調整）
- microCMS の画像URLにパラメータを付与（`?w=800&fm=webp&q=80`）。
  `format.ts` の `optimizedImageUrl()` が microCMS のURLのときだけ付ける
- Core Web Vitals目標: LCP < 2.5s、CLS < 0.1

---

## 9. 技術仕様

### 9-1. 使用パッケージ
| パッケージ | 用途 |
|---|---|
| `microcms-js-sdk` | microCMS の API クライアント |
| `server-only` | APIキーがクライアントバンドルに載るのを防ぐマーカー |

リッチテキスト用のライブラリは使っていない。microCMS のリッチエディタは HTML 文字列を
返すため、`HtmlBody.tsx` が `dangerouslySetInnerHTML` で描画している。
`@tailwindcss/typography` も導入していないので、本文のスタイルは子要素セレクタで当てている。

> `HtmlBody.tsx` はサニタイズしていない。入稿者が運営のみである前提（2章）。
> 外部ライターに入稿権限を渡す場合はサニタイズ処理の追加が必須。

### 9-2. 環境変数
| 変数名 | 必須 | 説明 |
|---|---|---|
| `MICROCMS_SERVICE_DOMAIN` | 必須 | サービスID。管理画面URL `https://<ここ>.microcms.io` の部分 |
| `MICROCMS_API_KEY` | 必須 | APIキー。GET 権限のみで足りる |
| `MICROCMS_WEBHOOK_SECRET` | 任意 | webhook 署名検証用。microCMS が発行するものではなく自分で決める値 |
| `NEXT_PUBLIC_BASE_URL` | 任意 | 未設定なら `https://tabinoshiori.jp` にフォールバック |

必須2つが未設定のあいだは `src/data/blogPosts.ts` のシードデータで動作し、
サーバーログに警告が出る。設定はソースコードではなくホスティングの管理画面で行う。
手順は `docs/MICROCMS_SETUP.md` を参照。

### 9-3. ディレクトリ構成
```
src/
├── app/
│   ├── blog/
│   │   ├── page.tsx                  # ブログトップ
│   │   ├── layout.tsx                # ブログ共通ヘッダー／フッター
│   │   ├── [slug]/page.tsx           # 記事詳細
│   │   ├── category/[slug]/page.tsx  # カテゴリ別一覧（情報の種類）
│   │   ├── tag/[slug]/page.tsx       # タグ別一覧（不安の種類）
│   │   └── feed.xml/route.ts         # RSS
│   └── api/
│       ├── blog/related/route.ts     # 情報タブ用。クライアントから呼ぶ
│       └── revalidate/route.ts       # microCMS webhook 受け口
├── lib/
│   ├── site.ts                       # サイトURL・名称の定数
│   └── microcms/
│       ├── client.ts                 # SDK初期化・エンドポイント名（server-only）
│       ├── queries.ts                # 記事取得（server-only）
│       ├── mappers.ts                # レスポンス → BlogPost 型
│       ├── types.ts                  # 型定義
│       ├── format.ts                 # 読了時間・日付・画像URL・料金の鮮度
│       ├── jsonLd.ts                 # 構造化データ
│       └── tags.ts                   # 「不安の種類」タグの定義
├── components/blog/
│   ├── ArticleCard.tsx               # 記事カード
│   ├── ArticleBody.tsx               # 本文描画の出し分け
│   ├── HtmlBody.tsx                  # microCMSのHTMLを描画
│   ├── SpotCard.tsx                  # スポットカード（しおり追加ボタンは未実装）
│   ├── PriceNote.tsx                 # 金額ブロック。出典・調査時点が型で必須
│   ├── PriceDisclosure.tsx           # 記事冒頭の料金注釈バナー
│   ├── BlogHighlights.tsx            # LPの新着記事セクション
│   └── RelatedArticles.tsx           # 情報タブの関連記事（Client Component）
├── data/blogPosts.ts                 # シードデータ。実記事投入後は削除
└── microcms/
    ├── schemas/*.json                # 管理画面にインポートできるAPIスキーマ
    └── seed-csv/*.csv                # シードデータのCSVインポート用
```

未実装: `AddToItineraryModal.tsx`（旅程選択モーダル）。7章を参照。

### 9-4. microCMSクライアント
```typescript
// src/lib/microcms/client.ts
import "server-only";
import { createClient } from "microcms-js-sdk";

export const MICROCMS_ENDPOINTS = {
  blogs: "blogs",
  categories: "categories",
  spots: "spots",
} as const;

const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;

export const isMicroCMSConfigured = Boolean(serviceDomain && apiKey);

export const microcmsClient = isMicroCMSConfigured
  ? createClient({ serviceDomain: serviceDomain as string, apiKey: apiKey as string })
  : null;
```

**`server-only` を外さないこと。** クライアントコンポーネントから記事を取得する場合は
`/api/blog/related` のような Route Handler を経由する。直接 import するとビルドが落ちる。

### 9-5. ISR + Webhook構成
```
記事を公開・更新（microCMS）
  └─ Webhookを発火（Hobbyプランでは使えない）
       └─ /api/revalidate（Next.js Route Handler）
            ├─ X-MICROCMS-Signature を HMAC-SHA256 で検証
            │    不一致・欠落は 401
            └─ revalidatePath('/blog')
               revalidatePath('/')
               revalidatePath('/sitemap.xml')
               revalidatePath(`/blog/${contentId}`)
```

webhook を使わない場合は ISR のみで、最大1時間で反映される。

---

## 10. 将来的な拡張

### フェーズ2: 記事品質向上
- **動画埋め込み対応**: YouTube・Instagram Reels
- **マップ埋め込み**: 記事内にGoogleマップでルートを表示
- **モデルコース機能**: 記事の全スポットを一括でしおりに追加

### フェーズ3: パーソナライゼーション
- **レコメンドエンジン**: ユーザーの目的地・過去のしおりから関連記事をサジェスト
- **「いいね」機能**: 気になる記事を保存（グループトークンに紐付け）

### フェーズ4: 収益化
- **アフィリエイトリンク管理**: microCMS 内で予約リンクを管理・記事に挿入
- **PR記事タグ**: スポンサードコンテンツの明示表示
- **広告枠**: 記事一覧・詳細ページへのGoogle AdSense設置

### フェーズ5: UGC（将来検討）
- ユーザーが「自分のしおりをブログとして公開」する機能
- 運営がキュレーションして注目しおりをピックアップ
- ユーザーアカウント導入が前提条件

---

## 付録: microCMS セットアップ手順

手順の詳細は **`docs/MICROCMS_SETUP.md`** にある。概要は以下のとおり。

1. [microcms.io](https://microcms.io) でサービスを作成
2. `blogs` / `categories` / `spots` をリスト形式で作成し、
   `microcms/schemas/*.json` からスキーマをインポート
3. `blogs` の参照フィールド（`category` → categories、`spots` → spots）を
   管理画面で手動設定する。スキーマJSONでは参照先を指定できないため
4. サービス設定 → APIキー から GET 権限のキーを取得
5. ホスティングの環境変数に `MICROCMS_SERVICE_DOMAIN` と `MICROCMS_API_KEY` を
   設定して再デプロイ
6. （任意）Webhook を登録。Hobby プランでは利用できない
