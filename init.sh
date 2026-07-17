#!/usr/bin/env bash
# 標準啟動與驗證路徑。每個工作階段開始時執行 ./init.sh。
# 導入專案時只需要修改下面三個變數。
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# ── 依專案修改這三個變數 ──────────────────────────────────────
INSTALL_CMD=(pnpm install)
VERIFY_CMD=(pnpm exec jest) # package.json 沒有 test script，直接跑 jest
START_CMD=(pnpm start)     # expo start
# ─────────────────────────────────────────────────────────

on_fail() {
  echo ""
  echo "!! init.sh 失敗，基準狀態已損壞。"
  echo "!! 規則：先修復到 ./init.sh 通過，才能繼續任何功能開發。"
  echo "!! 不要在損壞的起始狀態上疊加新功能。"
}
trap on_fail ERR

echo "==> 目前目錄: $PWD"

echo "==> 安裝相依"
"${INSTALL_CMD[@]}"

echo "==> 執行基準驗證"
"${VERIFY_CMD[@]}"

echo "==> 啟動指令（未執行）:"
printf '    %s' "${START_CMD[*]}"
printf '\n'

if [ "${RUN_START_COMMAND:-0}" = "1" ]; then
  echo "==> 啟動應用"
  exec "${START_CMD[@]}"
fi

echo "==> 基準驗證通過。若要直接啟動應用：RUN_START_COMMAND=1 ./init.sh"
