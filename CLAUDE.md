# 旅のしおり（travel-planner）

旅行計画を作成・共有できる Next.js 製 Web アプリ。

## 技術スタック
- Next.js 16 (App Router) / React 19 / TypeScript / TailwindCSS / Radix UI
- GraphQL（Apollo Server & Client）+ Hasura（`hasura-project/`）
- Google Maps API、Cloudinary（画像）、Google AdSense（広告）、Google Analytics

## よく使うコマンド
```bash
npm run dev     # 開発サーバー（Turbopack）
npm run build   # ビルド
npm run lint    # ESLint
npx tsc --noEmit  # 型チェック
```

## ディレクトリの要点
- `src/app/` ページとAPIルート（`api/graphql`, `api/upload`, `api/proxy` など）
- `src/app/admin/` 管理画面（`middleware.ts` で `admin_session` Cookie を検証）
- `src/components/` UIコンポーネント
- `src/graphql/` クエリ・ミューテーション定義、`src/types/generated/` は自動生成
- `database/` `hasura-project/` スキーマとメタデータ
- `docs/` 仕様書

## 運営チーム（AIエージェント）
このリポジトリは5つの役割のエージェントで日々運営している。詳細は [docs/team/README.md](docs/team/README.md)。

- `cs-support` カスタマーサポート / `ops-security` 保守運用 / `product-planner` 企画開発 / `legal` 法務 / `gm-chief` 全体統括
- 日次報告は `/daily-standup` で実行し、`docs/team/reports/` に保存する
- 毎朝8時の自動実行は `scripts/daily-standup.sh` を launchd から呼ぶ（後藤さんのMac上）。日報はObsidianへ保存される
- トークン消費を抑えるため、平日は曜日ごとに1部門だけ深掘りする。4部門そろうのは土曜のみ

エージェントは `src/` 配下の変更、`main` への直接コミット、本番環境への操作を承認なしに行わない。

## プルリクエストの作法
PRの説明文には、冒頭に**デプロイプレビューのURL**を必ず記載する。
Netlifyのサイト名は `mitsukuru`、本番は `https://tabinoshiori.jp`。

```
https://deploy-preview-<PR番号>--mitsukuru.netlify.app
```

変更内容に応じて、確認すべきページへの直リンクも並べる（例: `/blog`、`/blog/<slug>`）。
レビュー側がURLを組み立てずに済むようにすること。
