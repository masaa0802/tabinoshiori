# 旅のしおり 運営チーム（AIエージェント体制）

「旅のしおり」を5つの役割のエージェントで日々運営し、**後藤さんのMacで毎朝8時に日報を作る**ための仕組み。

日報は3か所に出る。役割が違うので中身も違う。

| 出口 | 中身 | 読む場面 |
|---|---|---|
| [Artifact](https://claude.ai/artifact/7N3PrVv91SkUWTfgKMPXxc) | 日報の全体。スマホで読む形 | 毎朝これを見る |
| `docs/team/reports/` | 全文。各部門の生報告つき | 掘るとき |
| `docs/team/digests/` からVaultへコピー | 要点だけ。1,500字 | Obsidianで後から振り返るとき |

Artifact は毎朝**同じURLに上書き**される。ブックマークかピン留めしておけば、朝それを開くだけで最新が出る。

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

### 1. Obsidian の保存先を用意する

Vault に次のディレクトリがあれば、それだけでよい。**ふつうのディレクトリで構わない。** スクリプトが毎朝ここへ要点ノートをコピーする。

```
~/Documents/Obsidian Vault/旅のしおり/日時報告/
```

別の場所に置きたい場合は、環境変数で指定する。

```bash
export TABINOSHIORI_VAULT="$HOME/Documents/Obsidian Vault/別の場所"
```

シンボリックリンクで `docs/team/digests` を指す方法もあるが、その場合は新しいノートを見るたび `git pull` が必要になる。**実ディレクトリのほうが手間がない。**

要点ノートのフロントマターには `重要度` `判断待ち` `稼働部門` が入る。Obsidian 側で「判断待ちが残っている日」「保守運用が動いた日」を Dataview や検索で引ける。判断待ちは `- [ ]` のチェックリストなので、決めたらその場で消せる。

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

## 根拠のルール

**根拠のない指摘は書かない。** 指摘1件につき、次のどれかを必ず添える。

| 種別 | 中身 |
|---|---|
| 実コード | 該当箇所の実際のコード引用とファイル名・行番号 |
| 実行結果 | 実行したコマンドとその出力 |
| 再現手順 | 番号つきの操作列か curl。期待される結果と実際に起きることを併記 |
| 実データ | 実物のデータ（問い合わせ本文、管理画面の実数） |
| 証拠なし | 証拠が取れていないことの明示と、取る方法 |

実行していないコマンドの出力、読んでいないファイルの行番号、存在しないデータは書かない。**問い合わせ本文の創作は捏造にあたるので絶対にしない。**

統括は各部門の根拠をそのまま信じず、重要度の高いものは自分で裏を取る。部門の報告と実物が食い違ったら実物を採用し、食い違いを日報に書く。日報の冒頭に「N件が実物の証拠つき」「M種類の証拠が未取得」を出す。

現在の未取得は3種類ある。実際の問い合わせ本文（Googleフォームの回答が参照できない）、バグの動画（ローカル実行後にPlaywrightで撮影可能）、利用状況の数値（管理画面へのアクセスがない）。ルールの詳細は `.claude/skills/daily-standup/SKILL.md` の「根拠のルール」にある。

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
| `docs/team/reports/YYYY-MM-DD.md` | 日報の全文（統括サマリ＋各部門の生報告） | gm-chief |
| `docs/team/digests/YYYY-MM-DD.md` | 要点1,500字。Obsidian の `旅のしおり/日時報告` に現れる | gm-chief |
| `docs/team/artifact.html` | スマホ向け日報の見た目。毎朝これを差し替えて再公開する | gm-chief |
| `docs/team/artifact-url.txt` | 上書き先の Artifact URL。変えない | — |
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
