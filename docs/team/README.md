# 旅のしおり 運営チーム（AIエージェント体制）

「旅のしおり」を5つの役割のエージェントで日々運営し、**後藤さんのMacで毎朝8時に日報を作り、Obsidianに保存する**ための仕組み。

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

| エージェント | 役割 | 主な担当範囲 | モデル |
|---|---|---|---|
| [`cs-support`](../../.claude/agents/cs-support.md) | カスタマーサポート | お問い合わせ対応案、ユーザーの声の集約、FAQ整備、文言改善 | Sonnet |
| [`ops-security`](../../.claude/agents/ops-security.md) | 保守運用 | 脆弱性点検、バグ検出、依存パッケージ、認証・API安全性 | Sonnet |
| [`product-planner`](../../.claude/agents/product-planner.md) | 企画開発 | 新機能アイデア、仕様ドラフト、優先順位づけ | Sonnet |
| [`legal`](../../.claude/agents/legal.md) | 法務 | 利用規約・プライバシーポリシー点検、条文改定案、法改正ウォッチ | Sonnet |
| [`gm-chief`](../../.claude/agents/gm-chief.md) | 全体統括 | 4部門の報告を束ね、最重要3件と判断待ちを整理して後藤さんへ報告 | 実行時のモデル |

## セットアップ（Mac側で一度だけ）

### 1. Obsidian の保存先をリポジトリにつなぐ

Obsidian はシンボリックリンクを辿るので、日報がそのままノートとして見える。

```bash
cd "$HOME/Documents/Obsidian Vault/旅のしおり"
mv 日時報告 日時報告.bak 2>/dev/null   # 既存の中身があれば退避
ln -s "$HOME/path/to/tabinoshiori/docs/team/reports" 日時報告
```

リンクを張らず実ファイルとして置きたい場合は、この手順を飛ばしてよい。スクリプトが Vault のディレクトリへコピーする。

### 2. launchd に毎朝8時の実行を登録する

```bash
REPO="$HOME/path/to/tabinoshiori"
sed "s|__REPO__|$REPO|" "$REPO/scripts/com.tabinoshiori.daily-standup.plist" \
  > ~/Library/LaunchAgents/com.tabinoshiori.daily-standup.plist
launchctl load ~/Library/LaunchAgents/com.tabinoshiori.daily-standup.plist
```

### 3. 動作確認

登録を待たずに一度手で走らせる。

```bash
./scripts/daily-standup.sh
tail -f ~/Library/Logs/tabinoshiori/$(date +%F).log
```

### 止めるとき

```bash
launchctl unload ~/Library/LaunchAgents/com.tabinoshiori.daily-standup.plist
```

### 覚えておくこと

- Mac がスリープしていた場合、8時ではなく**起きた直後**に実行される
- 日曜は実行しない（スクリプトが自分で判断する）
- 同じ日の日報が既にあれば何もしない（二重起動の防止）
- `claude` コマンドがログイン済みである必要がある。Claude Code を一度起動して認証を通しておく
- 読み取り系のコマンドは `.claude/settings.json` で許可済み。それでも権限で止まる場合は、スクリプトの `--permission-mode acceptEdits` を `bypassPermissions` に変える（すべての確認を飛ばすので、内容を理解してから行う）

## 手動で回す

```
/daily-standup                                       # 統括が担当部門を動かして日報を作る
ops-security エージェントで、直近のコミットのセキュリティ影響を見て
legal エージェントで、AdSense導入にともなう規約の不足を洗い出して
```

## トークン消費を抑える設計

初日に4部門を全力で走らせたときの実測は、部門合計で **446,214トークン**（カスタマーサポート122k / 企画開発139k / 法務94k / 保守運用92k）だった。毎日これを回すと月1300万トークンを超える。そこで4つの制限を入れている。

| 制限 | 内容 | 定義場所 |
|---|---|---|
| 曜日ローテーション | 平日は1部門だけ深掘りする。4部門そろうのは土曜だけ。日曜は休み | `.claude/skills/daily-standup/SKILL.md` |
| モデルの割り当て | 部門担当は Sonnet、統括だけ上位モデル | 各エージェントの `model:` |
| 差分に限定 | 平日は前回レポート以降に変わったところだけ見る。全面走査は土曜 | SKILL.md「点検範囲を差分に限定する」 |
| 分量上限 | 日報は8,000字（約10分）。土曜だけ2万字まで | SKILL.md「分量のルール」 |

これで平日は1日あたり10万トークン前後に収まる見込み。実際の消費はログで確認し、多すぎるようならローテーションを隔日にするか、統括も Sonnet に落とす。

**割り込みルール**: Critical や高リスクの未解決事項があるときは、曜日に関係なく該当部門を動かす。安く済ませることより、危険を見逃さないことを優先する。

## 出力物の置き場所

| ファイル | 内容 | 更新する担当 |
|---|---|---|
| `docs/team/reports/YYYY-MM-DD.md` | 日報（統括サマリ＋各部門の全文）。Obsidian の `旅のしおり/日時報告` に現れる | gm-chief |
| `docs/team/ideas.md` | 新機能アイデアの台帳（提案中/採用/保留/却下） | product-planner |
| `docs/team/faq-draft.md` | FAQ・返信テンプレートの下書き | cs-support |
| `docs/team/legal-log.md` | 規約改定の検討記録 | legal |
| `~/Library/Logs/tabinoshiori/YYYY-MM-DD.log` | 実行ログ | スクリプト |
| GitHub Issue | 個別の対応案件。ラベル `team/cs` `team/ops` `team/product` `team/legal` | 全員 |

## 安全のためのルール

エージェントは自動で次のことを**しない**。

- `src/` 配下（アプリ本体）の変更を後藤さんの承認なしに行う
- `main` ブランチへの直接コミット（スクリプトは毎回 `claude/daily-report-YYYYMMDD` を main から切る）
- 本番環境・本番データベースへの操作
- ユーザーや外部への実際の連絡（文面の作成までが仕事）
- 秘密情報（APIキー・トークン）の値をレポートに書き写す

## 運用のコツ

- 日報が「特記事項なし」ばかりになったら、担当の観点が狭い。定義ファイルの「毎日見るもの」を足す。
- 同じ指摘が3日続いたら統括が必ずエスカレーションする設計になっている。そこは後藤さんが決めるべき場所。
- 判断待ちの表は、Yes/Noか3択で答えられる形で来る。溜めずにその場で返すのが一番速い。
- 日報が届かない日が続いたら、まず `~/Library/Logs/tabinoshiori/` のログを見る。
