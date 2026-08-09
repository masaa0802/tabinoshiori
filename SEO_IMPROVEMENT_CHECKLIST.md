# SEO改善チェックリスト

このドキュメントは、travel-plannerのSEO改善施策の進捗を管理するためのチェックリストです。

最終更新日: 2026-08-09

---

## 🔴 最優先(即効性が高く必須)

### 1. 基本設定の最適化
**効果**: 検索エンジンが言語を正しく認識、基本的なSEO効果
**ステータス**: ✅ 完了

- [x] html langを"ja"に修正 (`src/app/layout.tsx:79`)
- [x] メタデータの拡張(タイトルテンプレート、description、keywords、OGP、Twitter Card、robots、canonical) (`src/app/layout.tsx:19`)
- [x] 各ページのメタデータ設定(`/privacy` `/terms` `/contact` `/group/new` `/`)
- [x] 環境変数テンプレート更新 (`.env.example`)

#### 残タスク
- [ ] **本番環境変数の設定確認**(要対応): ローカル`.env`には`NEXT_PUBLIC_BASE_URL` / `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`が未設定。Vercel側の環境変数で実際の本番ドメインが設定されているか確認すること。未設定だとcanonical/OGP URLがプレースホルダー`https://travel-planner.vercel.app`にフォールバックする。
- [x] OGP画像の作成・配置 → ✅ 完了(1200x630px, 軽量化済み)

---

### 2. sitemap.xml の生成
**ステータス**: ✅ 完了 (`src/app/sitemap.ts`)

静的5ページ(`/` `/group/new` `/contact` `/privacy` `/terms`)を登録済み。動的な`/group/[token]/...`は非公開ページのため意図的に除外(妥当)。

---

### 3. robots.txt の作成
**ステータス**: ✅ 完了 (`src/app/robots.ts`)

`/group/`配下(個人の旅行プラン)をdisallowし、sitemapの場所を明示済み。

---

## 🟡 高優先(トラフィック増加に直結)

### 4. OGP/Twitter Cardタグの追加
**ステータス**: ✅ 完了

- [x] 基本的なOGP/Twitter Cardタグ設定
- [x] OGP画像を1200x630pxに適正化(旧: 2400x1200px・4.27MBだった)

---

### 5. 構造化データ(JSON-LD)実装
**ステータス**: ✅ 完了

- [x] SoftwareApplication schema (`src/app/layout.tsx`)
- [x] FAQPage schema (`src/app/page.tsx`)

#### 残タスク(任意)
- [ ] BreadcrumbList schema(パンくずがあるページ向け、現状優先度低)
- [ ] Google Rich Results Testでの検証

---

### 6. manifest.json / アイコン
**ステータス**: ✅ 完了

- [x] `src/app/manifest.ts` 作成
- [x] apple-touch-icon 追加

---

## 🟢 中優先(長期的な改善)

### 7. パフォーマンス最適化(Core Web Vitals)
**ステータス**: 🟡 一部着手

- [x] トップページのヒーロー背景画像を`next/image`化(LCP改善)
- [ ] Core Web Vitalsの計測(PageSpeed Insights / Search Console)
- [ ] フォントの最適化(font-display、サブセット化)
- [ ] JavaScriptバンドルサイズの最適化

---

### 8. セマンティックHTML/アクセシビリティ
**ステータス**: 🟡 概ね良好、要確認箇所あり

- [x] 見出し階層(h1は各ページ1つ、確認済み: トップページ)
- [ ] 画像のalt属性の網羅チェック(`ActivityDetailModal.tsx` `DocumentViewerModal.tsx`で素の`<img>`タグ使用、altの有無を要確認。ただし非公開ページのためSEO影響は限定的)
- [ ] Lighthouse Accessibilityスコアの計測

---

## 📊 その他の推奨施策

### Google Search Console 登録
**ステータス**: ⏳ 未着手(要確認)

- [ ] Google Search Consoleへの登録有無を確認
- [ ] サイトマップの送信
- [ ] インデックスカバレッジ・検索パフォーマンスの監視

### Google Analytics 設定
**ステータス**: ✅ 設定済み(GA_MEASUREMENT_ID: G-BN1E62264W)

### コンテンツSEO(中長期・効果大)
**ステータス**: ⏳ 未着手

現状、検索流入の入口が実質トップページ1枚のみ。動的な旅行プランページは非公開のため正しくnoindexだが、裏を返すとロングテールキーワードの受け皿がない。

- [ ] 使い方ガイド・活用例コンテンツの追加検討
- [ ] 旅行先別テンプレート/しおり例ページの検討
- [ ] 「旅行しおり 作り方」等のロングテールキーワード向けコンテンツ検討

---

## 🔗 関連ファイル

- メインレイアウト: `src/app/layout.tsx`
- トップページ: `src/app/page.tsx`
- sitemap: `src/app/sitemap.ts`
- robots: `src/app/robots.ts`
- manifest: `src/app/manifest.ts`
- 環境変数テンプレート: `.env.example`
- ページメタデータ: `src/app/privacy/page.tsx` / `src/app/terms/page.tsx` / `src/app/contact/layout.tsx` / `src/app/group/new/layout.tsx`

---

## 📝 メモ

### 2026-08-09
- チェックリストを実態に合わせて更新(sitemap/robots/JSON-LDは既に実装済みだった)
- OGP画像を1200x630pxに作り直し(旧ファイルはサイズ・比率が不正)
- manifest.ts / apple-touch-iconを追加
- トップページのヒーロー背景を`next/image`化してLCP改善

### 次回対応予定
1. Vercel本番環境変数(`NEXT_PUBLIC_BASE_URL` / `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`)の設定確認
2. Google Search Console登録状況の確認・サイトマップ送信
3. コンテンツSEO(ロングテール記事・ガイド)の検討
