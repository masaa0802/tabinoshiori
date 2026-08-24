# ブログ機能 仕様書・設計書

> **⚠️ この仕様書は着手前に書かれたもので、現在の実装と一部が乖離しています。**
>
> 実装の現状・検証済みの範囲・未解決の判断は `docs/BLOG_HANDOVER.md` を参照してください。
> 主な乖離点:
>
> 1. **CMSがContentful前提のまま**（4章・5章・9章）。実装は microCMS に移行済み。
>    フィールド定義の考え方は流用できますが、パッケージ名・環境変数名・APIの呼び方は全て異なります。
>    接続手順は `docs/MICROCMS_SETUP.md` を参照。
> 2. **ブログの位置づけ**（1章）が「しおり作成の質を上げるための情報インフラ」のままです。
>    現在の意向は「旅行初心者の不安を取り除く、広い読者向けメディア」で、方向性が異なります。
>    この点は未確定のため、`docs/BLOG_HANDOVER.md` セクション7の判断を待ってから
>    この仕様書を更新してください。
> 3. **6-1・6-2の一部、および7-1・7-2は未実装**です。詳細は
>    `docs/BLOG_HANDOVER.md` セクション11を参照。

## 目次
1. [概要・目的](#1-概要目的)
2. [ビジネス要件](#2-ビジネス要件)
3. [コンテンツ戦略](#3-コンテンツ戦略)
4. [システム設計](#4-システム設計)
5. [Contentfulコンテンツモデル](#5-contentfulコンテンツモデル)
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
- **記事作成者**: 運営のみ（Contentful CMSから入稿）
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
Contentful CMS（記事入稿・管理）
  │
  │ Contentful Delivery API（公開記事）
  │ Contentful Preview API（下書きプレビュー）
  ▼
Next.js（ISR / SSG）
  ├── /blog               → 記事一覧（ISR: 1時間）
  ├── /blog/[slug]        → 記事詳細（ISR: 1時間）
  └── /blog/category/[slug] → カテゴリ別一覧
  │
  │ しおり連携
  ▼
Hasura GraphQL（既存）
  └── activities テーブルにスポットを追加
```

### 4-2. レンダリング戦略
| ページ | 方式 | 理由 |
|---|---|---|
| 記事詳細 | ISR（revalidate: 3600） | SEO最優先・更新頻度が低い |
| 記事一覧 | ISR（revalidate: 3600） | 同上 |
| カテゴリ一覧 | ISR（revalidate: 3600） | 同上 |
| しおり追加ボタン | Client Component | グループトークンをブラウザで取得 |

### 4-3. キャッシュ戦略
- Contentfulのwebhookでリビルドをトリガー（記事公開・更新時に即時反映）
- Netlifyの`revalidate`またはOn-demand ISRで対応

---

## 5. Contentfulコンテンツモデル

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
- 旅程の`destination`フィールドと一致するブログ記事をContentful APIで取得
- 最大3件を情報タブ内に表示
- 「もっと見る」でブログ一覧へ遷移

```
旅程の目的地: 「メキシコ」
  ↓
Contentful APIで destination: 「メキシコ」の記事を検索
  ↓
情報タブに「メキシコ関連のおすすめ記事」として表示
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
- `/sitemap.xml` に全ブログ記事を含める
- Contentful更新時に自動再生成（ISR）

### 8-4. パフォーマンス
- アイキャッチ画像は`next/image`で最適化（WebP変換・サイズ自動調整）
- Contentfulの画像URLにパラメータを付与（`?w=800&fm=webp&q=80`）
- Core Web Vitals目標: LCP < 2.5s、CLS < 0.1

---

## 9. 技術仕様

### 9-1. 使用パッケージ
| パッケージ | 用途 |
|---|---|
| `contentful` | Contentful Delivery / Preview API クライアント |
| `@contentful/rich-text-react-renderer` | Rich TextをReactコンポーネントに変換 |
| `@contentful/rich-text-types` | 型定義 |

### 9-2. 環境変数
| 変数名 | 説明 |
|---|---|
| `CONTENTFUL_SPACE_ID` | ContentfulのSpace ID |
| `CONTENTFUL_ACCESS_TOKEN` | Delivery API用トークン（公開記事） |
| `CONTENTFUL_PREVIEW_TOKEN` | Preview API用トークン（下書きプレビュー） |
| `CONTENTFUL_WEBHOOK_SECRET` | Webhook検証用シークレット |

### 9-3. ディレクトリ構成
```
src/
├── app/
│   └── blog/
│       ├── page.tsx                  # ブログトップ
│       ├── [slug]/
│       │   └── page.tsx              # 記事詳細
│       └── category/
│           └── [slug]/
│               └── page.tsx          # カテゴリ一覧
├── lib/
│   └── contentful/
│       ├── client.ts                 # APIクライアント初期化
│       ├── queries.ts                # 記事取得関数
│       └── types.ts                 # 型定義
└── components/
    └── blog/
        ├── ArticleCard.tsx           # 記事カード
        ├── RichTextRenderer.tsx      # リッチテキスト描画
        ├── SpotCard.tsx              # スポットカード（しおり追加ボタン含む）
        ├── AddToItineraryModal.tsx   # 旅程選択モーダル
        └── RelatedArticles.tsx      # 関連記事
```

### 9-4. Contentfulクライアント
```typescript
// src/lib/contentful/client.ts
import { createClient } from 'contentful';

export const contentfulClient = createClient({
  space: process.env.CONTENTFUL_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
});

export const contentfulPreviewClient = createClient({
  space: process.env.CONTENTFUL_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_PREVIEW_TOKEN!,
  host: 'preview.contentful.com',
});
```

### 9-5. ISR + Webhook構成
```
記事を公開・更新（Contentful）
  └─ Webhookを発火
       └─ /api/revalidate（Next.js Route Handler）
            └─ revalidatePath('/blog')
               revalidatePath('/blog/[slug]')
```

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
- **アフィリエイトリンク管理**: Contentful内で予約リンクを管理・記事に挿入
- **PR記事タグ**: スポンサードコンテンツの明示表示
- **広告枠**: 記事一覧・詳細ページへのGoogle AdSense設置

### フェーズ5: UGC（将来検討）
- ユーザーが「自分のしおりをブログとして公開」する機能
- 運営がキュレーションして注目しおりをピックアップ
- ユーザーアカウント導入が前提条件

---

## 付録: Contentfulセットアップ手順

1. [contentful.com](https://contentful.com) でSpaceを作成
2. Content Modelで `BlogPost`・`Category`・`Spot` を作成（上記スキーマ参照）
3. Settings → API Keys から `Space ID` と `Access Token` を取得
4. Netlifyの環境変数に追加
5. Settings → Webhooks でNetlifyのrevalidateエンドポイントを登録
