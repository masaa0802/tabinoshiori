# SEO改善チェックリスト

このドキュメントは、travel-plannerのSEO改善施策の進捗を管理するためのチェックリストです。

最終更新日: 2025-12-27

---

## 🔴 最優先（即効性が高く必須）

### 1. 基本設定の最適化
**効果**: 検索エンジンが言語を正しく認識、基本的なSEO効果
**工数**: 小（30分程度）
**ステータス**: ✅ 完了

#### 完了項目
- [x] html langを"ja"に修正 (`src/app/layout.tsx:30`)
- [x] メタデータの拡張
  - [x] タイトルテンプレート設定
  - [x] description詳細化
  - [x] SEOキーワード追加
  - [x] OGP（Open Graph Protocol）タグ
  - [x] Twitter Card対応
  - [x] robots設定
  - [x] Google Search Console検証タグ対応
  - [x] カノニカルURL設定
- [x] 各ページのメタデータ設定
  - [x] `/privacy` - プライバシーポリシー
  - [x] `/terms` - 利用規約
  - [x] `/contact` - お問い合わせ
  - [x] `/group/new` - グループ作成
- [x] 環境変数テンプレート更新 (`.env.example`)

#### 残タスク
- [ ] 環境変数の本番設定 (`.env`)
  - [ ] `NEXT_PUBLIC_BASE_URL` に本番URLを設定
  - [ ] `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` にGoogle Search Console検証コードを設定
- [ ] OGP画像の作成
  - [ ] 1200x630pxの画像を作成
  - [ ] `/public/og-image.png` に配置
  - [ ] 内容: 「旅のしおり」ロゴ + キャッチコピー

---

### 2. sitemap.xml の生成
**効果**: Googleのクロール効率が大幅向上、インデックス速度アップ
**工数**: 小（30分程度）
**ステータス**: ⏳ 未着手

#### タスク
- [ ] `src/app/sitemap.ts` の作成
- [ ] 静的ページの登録
  - [ ] `/` (トップページ)
  - [ ] `/contact`
  - [ ] `/privacy`
  - [ ] `/terms`
  - [ ] `/group/new`
- [ ] 動的ページの対応検討
  - [ ] `/group/[token]/travelplanner/[travelPlannerId]`
  - [ ] その他の動的ルート
- [ ] changefreq と priority の設定
- [ ] ビルドテスト

---

### 3. robots.txt の作成
**効果**: 適切なクローリング、sitemap.xmlとセット必須
**工数**: 極小（10分程度）
**ステータス**: ⏳ 未着手

#### タスク
- [ ] `public/robots.txt` の作成
- [ ] クローラーガイダンスの記述
- [ ] sitemap.xmlの場所を明示
- [ ] 動作確認

---

## 🟡 高優先（トラフィック増加に直結）

### 4. OGP/Twitter Cardタグの追加
**効果**: SNS経由のトラフィック増加、ブランディング向上
**工数**: 中（1時間程度）
**ステータス**: ✅ 完了（基本設定済み）

#### 完了項目
- [x] 基本的なOGPタグの設定
- [x] Twitter Cardタグの設定

#### 残タスク
- [ ] OGP画像の作成・配置（「1. 基本設定の最適化」を参照）
- [ ] 各動的ページでの動的OGP設定（必要に応じて）

---

### 5. 構造化データ（JSON-LD）実装
**効果**: 検索結果での目立ち度UP、CTR向上
**工数**: 中（1-2時間）
**ステータス**: ⏳ 未着手

#### タスク
- [ ] トップページに組織情報のスキーマ追加
  - [ ] Organization schema
  - [ ] WebSite schema
- [ ] 旅行関連のスキーマ検討
  - [ ] TravelAction schema
  - [ ] Event schema（旅行イベント用）
- [ ] パンくずリストのスキーマ
  - [ ] BreadcrumbList schema
- [ ] FAQ schema（必要に応じて）
- [ ] Google Rich Results Testでの検証

---

## 🟢 中優先（長期的な改善）

### 6. パフォーマンス最適化
**効果**: SEOランキング要因、UX改善
**工数**: 大（ページによる）
**ステータス**: ⏳ 未着手

#### タスク
- [ ] Core Web Vitalsの計測
  - [ ] LCP (Largest Contentful Paint)
  - [ ] FID (First Input Delay)
  - [ ] CLS (Cumulative Layout Shift)
- [ ] 画像の最適化
  - [ ] WebP/AVIF形式への変換
  - [ ] next/imageの活用確認
  - [ ] 遅延ロード（lazy loading）の実装
- [ ] フォントの最適化
  - [ ] font-displayの設定
  - [ ] フォントサブセット化
- [ ] JavaScriptバンドルサイズの最適化
  - [ ] 不要な依存関係の削除
  - [ ] コード分割の最適化
- [ ] PageSpeed Insightsでの検証

---

### 7. セマンティックHTML/アクセシビリティ
**効果**: 長期的なSEO基盤強化
**工数**: 中〜大
**ステータス**: ⏳ 未着手

#### タスク
- [ ] 見出し階層の最適化
  - [ ] h1-h6の適切な使用確認
  - [ ] 各ページでh1は1つのみ
- [ ] 画像のalt属性追加
  - [ ] 全画像にalt属性を設定
  - [ ] 装飾的な画像はalt=""
- [ ] セマンティックタグの活用
  - [ ] `<nav>`, `<main>`, `<article>`, `<section>` など
- [ ] ARIAラベルの追加（必要に応じて）
- [ ] キーボードナビゲーションの確認
- [ ] Lighthouse Accessibilityスコアの改善

---

## 📊 その他の推奨施策

### Google Search Console 登録
**ステータス**: ⏳ 未着手

- [ ] Google Search Consoleへの登録
- [ ] サイトマップの送信
- [ ] インデックスカバレッジの確認
- [ ] 検索パフォーマンスの監視

### Google Analytics 設定
**ステータス**: ✅ 設定済み

- [x] Google Analytics設定（GA_MEASUREMENT_ID: G-BN1E62264W）

### その他
- [ ] ファビコン (favicon.ico) の作成
- [ ] Apple Touch Icon の作成
- [ ] manifest.json の作成（PWA対応）
- [ ] canonical URLの動的設定（重複コンテンツ対策）

---

## 🔗 関連ファイル

- メインレイアウト: `src/app/layout.tsx`
- 環境変数テンプレート: `.env.example`
- ページメタデータ:
  - `src/app/privacy/page.tsx`
  - `src/app/terms/page.tsx`
  - `src/app/contact/layout.tsx`
  - `src/app/group/new/layout.tsx`

---

## 📝 メモ

### 2025-12-27
- 基本設定の最適化を完了
- html langを"ja"に修正
- メタデータを大幅に拡張（OGP, Twitter Card, robots等）
- 主要ページにメタデータを追加
- 環境変数テンプレートを更新

### 次回対応予定
1. sitemap.xml の生成
2. robots.txt の作成
3. 構造化データの実装
