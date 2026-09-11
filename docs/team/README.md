# 旅のしおり 運営チーム（AIエージェント体制）

「旅のしおり」を5つの役割のエージェントで日々運営し、**後藤さんに1日1回まとまった日報を届ける**ための仕組み。

## 体制図

```
                        後藤さん（オーナー / 意思決定）
                                  ▲
                                  │ 日報 1通 / 日
                        ┌─────────┴─────────┐
                        │  全体統括 gm-chief │
                        └─────────┬─────────┘
                 ┌────────────┬───┴────┬────────────┐
            🎧 cs-support  🛡 ops-security  💡 product-planner  ⚖️ legal
            カスタマー      保守運用        企画開発            法務
            サポート        セキュリティ
```

## 役割一覧

| エージェント | 役割 | 主な担当範囲 | 定義ファイル |
|---|---|---|---|
| `cs-support` | カスタマーサポート | お問い合わせ対応案、ユーザーの声の集約、FAQ整備、文言改善 | [.claude/agents/cs-support.md](../../.claude/agents/cs-support.md) |
| `ops-security` | 保守運用 | 脆弱性点検、バグ検出、依存パッケージ、認証・API安全性 | [.claude/agents/ops-security.md](../../.claude/agents/ops-security.md) |
| `product-planner` | 企画開発 | 新機能アイデア（毎日3案）、仕様ドラフト、優先順位づけ | [.claude/agents/product-planner.md](../../.claude/agents/product-planner.md) |
| `legal` | 法務 | 利用規約・プライバシーポリシー点検、条文改定案、法改正ウォッチ | [.claude/agents/legal.md](../../.claude/agents/legal.md) |
| `gm-chief` | 全体統括 | 4部門の報告を束ね、最重要3件と判断待ちを整理して後藤さんへ報告 | [.claude/agents/gm-chief.md](../../.claude/agents/gm-chief.md) |

## 動かし方

### 手動で回す（まずはこれで試す）
Claude Code で次のように打つ。

```
/daily-standup
```

統括が4部門を並列で起動し、日報を `docs/team/reports/YYYY-MM-DD.md` に保存して GitHub Issue に投稿する。

### 特定の担当だけ呼ぶ
```
ops-security エージェントで、直近のコミットのセキュリティ影響を見て
legal エージェントで、AdSense導入にともなう規約の不足を洗い出して
```

### Obsidian に毎朝届ける

日報は Obsidian のノートとして読む前提で作られる。フロントマター（`title` / `date` / `tags` / `重要度` / `判断待ち`）が付くので、Obsidian のプロパティとして表示され、タグで絞り込める。

**保存先**

| 実行環境 | 保存先 |
|---|---|
| 後藤さんのMac（ローカル実行） | `/Users/gm510/Documents/Obsidian Vault/旅のしおり/日時報告/YYYY-MM-DD.md` |
| クラウド（Claude Code on the web / Routine） | `docs/team/reports/YYYY-MM-DD.md` にコミット |

クラウドで実行した日報を Vault に流し込むには、Mac 側で一度だけ次を設定する。Obsidian はシンボリックリンクを辿るので、`git pull` するだけで日報が Vault に現れる。

```bash
cd "/Users/gm510/Documents/Obsidian Vault/旅のしおり"
rm -rf 日時報告                                     # 中身がある場合は先に退避
ln -s ~/path/to/tabinoshiori/docs/team/reports 日時報告
```

あとは Obsidian の Git プラグインで自動 pull を有効にするか、毎朝 `git pull` を走らせる。

**分量**は日報全体で2万字以内（日本語で読んで約30分）に制限している。超える日は、事実と判断待ちを残し、解説と重複を削る。ルールは `.claude/skills/daily-standup/SKILL.md` の「分量のルール」にある。

### 毎日自動で回す（3つの選択肢）

| 方式 | 必要な準備 | 向いている場合 |
|---|---|---|
| **A. Claude Code の Routine（推奨）** | 不要。Claude に「毎朝8時に /daily-standup を実行して」と依頼するだけ | すぐ始めたい。追加コストや鍵の管理をしたくない |
| **B. GitHub Actions（cron）** | リポジトリに `ANTHROPIC_API_KEY` を Secrets 登録し、`claude-code-action` のワークフローを追加 | GitHub上で完結させたい。実行ログをActionsに残したい |
| **C. 手動運用** | 不要 | 毎日は不要で、気が向いたときだけ回したい |

いずれの方式でも、エージェントの定義（`.claude/agents/`）と手順（`.claude/skills/daily-standup/`）はこのリポジトリの中にあるので共通で使える。

## 出力物の置き場所

| ファイル | 内容 | 更新する担当 |
|---|---|---|
| `docs/team/reports/YYYY-MM-DD.md` | 日報（統括サマリ＋各部門の全文）。Obsidian の `旅のしおり/日時報告` へ同期する | gm-chief |
| `docs/team/ideas.md` | 新機能アイデアの台帳（提案中/採用/保留/却下） | product-planner |
| `docs/team/faq-draft.md` | FAQ・返信テンプレートの下書き | cs-support |
| `docs/team/legal-log.md` | 規約改定の検討記録 | legal |
| GitHub Issue | 個別の対応案件。ラベル `team/cs` `team/ops` `team/product` `team/legal` `daily-report` | 全員 |

## 安全のためのルール

エージェントは自動で次のことを**しない**。

- `src/` 配下（アプリ本体）の変更を後藤さんの承認なしに行う
- `main` ブランチへの直接コミット
- 本番環境・本番データベースへの操作
- ユーザーや外部への実際の連絡（文面の作成までが仕事）
- 秘密情報（APIキー・トークン）の値をレポートに書き写す

日報とドキュメント（`docs/team/`）の更新、GitHub Issue の作成・コメントのみ自動で行ってよい。

## 運用のコツ

- 日報が「特記事項なし」ばかりになったら、担当の観点が狭い。定義ファイルの「毎日見るもの」を足す。
- 同じ指摘が3日続いたら統括が必ずエスカレーションする設計になっている。そこは後藤さんが決めるべき場所。
- 判断待ちの表は、Yes/Noか3択で答えられる形で来る。溜めずにその場で返すのが一番速い。
