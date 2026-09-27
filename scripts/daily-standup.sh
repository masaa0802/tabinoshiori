#!/usr/bin/env bash
#
# 旅のしおり 日次報告をローカル（macOS）で実行する。
# launchd から毎朝8時に呼ばれる。手動実行も可能。
#
#   ./scripts/daily-standup.sh
#
# 設定は環境変数で上書きできる。
#   TABINOSHIORI_VAULT    Obsidian の保存先ディレクトリ
#   TABINOSHIORI_LOG_DIR  ログの保存先
#   TABINOSHIORI_MODEL    統括が使うモデル（既定 opus）
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VAULT_DIR="${TABINOSHIORI_VAULT:-$HOME/Documents/Obsidian Vault/旅のしおり/日時報告}"
LOG_DIR="${TABINOSHIORI_LOG_DIR:-$HOME/Library/Logs/tabinoshiori}"
MODEL="${TABINOSHIORI_MODEL:-opus}"
TODAY="$(date +%F)"
BRANCH="claude/daily-report-$(date +%Y%m%d)"
REPORT="docs/team/reports/$TODAY.md"
DIGEST="docs/team/digests/$TODAY.md"

mkdir -p "$LOG_DIR"
exec >> "$LOG_DIR/$TODAY.log" 2>&1

echo "=== $(date '+%F %T') 日次報告 開始 ==="
cd "$REPO_ROOT"

# 日曜は休み
if [ "$(date +%u)" = "7" ]; then
  echo "日曜のため実行しない"
  exit 0
fi

# 二重起動の防止
if [ -f "$REPORT" ]; then
  echo "$TODAY の日報はすでに存在する。何もしない"
  exit 0
fi

# 作業ブランチを main から切る（main へは直接コミットしない）
git fetch origin main
git checkout -B "$BRANCH" origin/main

# 統括を起動。git 操作はこのスクリプトが持つことをスキルへ伝える
export TABINOSHIORI_AUTOMATED=1
claude -p "/daily-standup" \
  --model "$MODEL" \
  --permission-mode acceptEdits \
  --output-format text

if [ ! -f "$REPORT" ]; then
  echo "日報が生成されなかった。ログを確認すること"
  exit 1
fi

echo "全文: $REPORT（$(wc -c < "$REPORT") バイト）"

# Obsidian Vault へは「要点」だけを置く。全文はリポジトリに残す
if [ ! -f "$DIGEST" ]; then
  echo "要点ノートが生成されなかった: $DIGEST"
elif [ -d "$VAULT_DIR" ]; then
  cp "$DIGEST" "$VAULT_DIR/"
  echo "Vault に要点をコピー: $VAULT_DIR/$TODAY.md（$(wc -c < "$DIGEST") バイト）"
else
  echo "Vault が見つからない: $VAULT_DIR（リポジトリ側にのみ保存した）"
fi

git add docs/team
if git diff --cached --quiet; then
  echo "コミットする変更なし"
else
  git commit -m "日報 $TODAY"
  git push -u origin "$BRANCH"
fi

echo "=== $(date '+%F %T') 完了 ==="
