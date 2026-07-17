# 進度日誌

<!-- 寫法與完整範例見 docs/harness/PLAYBOOK.md §5。
     規則：新的工作階段記錄插在「## 工作階段日誌」標題正下方（最新在最上面），編號遞增。
     「目前已驗證狀態」每次收尾都要更新，永遠反映最新事實。 -->

## 目前已驗證狀態

- 儲存庫根目錄：/Users/mimi/Documents/SPARKNOTE
- 標準啟動路徑：`RUN_START_COMMAND=1 ./init.sh`（實際指令見 init.sh 的 START_CMD）
- 標準驗證路徑：./init.sh（pnpm install + pnpm exec jest；2026-07-17 為 39 tests passed）
- 目前最高優先級未完成功能：ios-001 iOS 模擬器啟動 App 並截圖存證
- 目前 blocker：無
- 背景：Expo SDK 56（其他四個專案是 54）；從未 build 過 iOS；雷達/預警功能已於 0c60085 移除

## 工作階段日誌

### 工作階段 001

- 日期：2026-07-17
- 本輪目標：導入 harness-engineering 工作流（/harness-init）
- 已完成：安裝 harness 範本（保留既有 CLAUDE.md 與 Expo SDK 56 提醒，AGENTS.md 合併為 harness 路由）；init.sh 設定為 pnpm exec jest；修復過時測試 settingsStore.test.ts（雷達功能 0c60085 已整個移除、store 只剩 themeColor，並加驗已移除欄位不再暴露），39 tests 全過；寫入 5 項功能
- 執行過的驗證：./init.sh
- 已擷取證據：見下方工作階段記錄與 git commit
- 提交記錄：chore: 導入 harness-engineering 工作流（本輪 commit）
- 已知風險或未解決問題：SDK 56 與其他專案不同，iOS 建置行為可能有差異；ios-004/005 依賴 Apple Developer 帳號
- 下一步最佳動作：開始 ios-001（先照 SPARKWEAR/docs/ios-testing/README.md 確認本機環境）
