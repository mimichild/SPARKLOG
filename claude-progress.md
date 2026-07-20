# 進度日誌

<!-- 寫法與完整範例見 docs/harness/PLAYBOOK.md §5。
     規則：新的工作階段記錄插在「## 工作階段日誌」標題正下方（最新在最上面），編號遞增。
     「目前已驗證狀態」每次收尾都要更新，永遠反映最新事實。 -->

## 目前已驗證狀態

- 儲存庫根目錄：/Users/mimi/Documents/SPARKNOTE
- 標準啟動路徑：`RUN_START_COMMAND=1 ./init.sh`（實際指令見 init.sh 的 START_CMD）
- 標準驗證路徑：./init.sh（pnpm install + pnpm exec jest；2026-07-17 為 39 tests passed）
- 目前最高優先級未完成功能：ios-004 EAS iOS 雲端建置成功（blocked：需先申請 Apple Developer Program 帳號）
- 目前 blocker：ios-004/ios-005 需要 Apple Developer Program（$99/年），尚未申請
- 背景：Expo SDK 56（其他四個專案是 54）；ios-001～ios-003 皆已 passing；雷達/預警功能已於 0c60085 移除

## 工作階段日誌

### 工作階段 004

- 日期：2026-07-20
- 本輪目標：完成 ios-003（模擬器驗證 ZIP 匯出/匯入）
- 已完成：
  - 匯出備份正常，解壓縮確認 backup.json 內容正確（3 筆 stores）
  - 第一次匯入誤選到容器內殘留的舊備份檔（2026-07-17，session 開始前就存在），資料庫變成不相干的 2 筆記錄；排查後確認是選錯檔案，不是匯出/匯入邏輯有問題
  - 重新選對正確的 2026-07-20 備份檔匯入，sqlite3 確認 3 筆記錄正確還原
- 執行過的驗證：模擬器手動操作＋解壓縮 ZIP 檢查內容＋sqlite3 直接查詢資料庫內容＋Metro log 檢查
- 已擷取證據：見 feature_list.json ios-003 evidence；截圖 docs/ios-003-import-result.png
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：ios-004/ios-005 卡在 Apple Developer 帳號
- 下一步最佳動作：等使用者申請好 Apple Developer Program 後才能繼續 ios-004；SPARKNOTE 不需要 native-001（無原生層修復需求）

### 工作階段 003

- 日期：2026-07-20
- 本輪目標：完成 ios-002（模擬器驗證核心流程：資料庫讀寫與定位權限）
- 已完成：新增一筆店家紀錄，畫面正常無閃退；sqlite3 直接查容器內 sparknotes.db 確認寫入成功，含正確的 latitude/longitude（定位功能正常）；完全關閉 App 重開後 3 筆記錄皆仍存在
- 執行過的驗證：模擬器手動操作＋sqlite3 直接查詢資料庫內容＋simctl terminate/launch 持久化測試
- 已擷取證據：見 feature_list.json ios-002 evidence；截圖 docs/ios-002-store-persist.png
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：無新增
- 下一步最佳動作：開始 ios-003（模擬器驗證 ZIP 匯出/匯入）

### 工作階段 002

- 日期：2026-07-20
- 本輪目標：完成 ios-001（本專案第一次 iOS 模擬器建置，SDK 56）
- 已完成：`npx expo run:ios` 第一次執行，Build Succeeded；App 啟動後停在設定頁（可能是自動導覽或殘留狀態），重開 App 進程後正常顯示首頁，無紅屏；SDK 56 沒有踩到 SPARKPLATE/SPARKSHAPE 那種原生層編譯問題
- 執行過的驗證：模擬器手動建置＋截圖
- 已擷取證據：見 feature_list.json ios-001 evidence；截圖 docs/ios-001-simulator-home.png
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：無新增
- 下一步最佳動作：開始 ios-002（模擬器驗證核心流程：資料庫讀寫與定位權限）

### 工作階段 001

- 日期：2026-07-17
- 本輪目標：導入 harness-engineering 工作流（/harness-init）
- 已完成：安裝 harness 範本（保留既有 CLAUDE.md 與 Expo SDK 56 提醒，AGENTS.md 合併為 harness 路由）；init.sh 設定為 pnpm exec jest；修復過時測試 settingsStore.test.ts（雷達功能 0c60085 已整個移除、store 只剩 themeColor，並加驗已移除欄位不再暴露），39 tests 全過；寫入 5 項功能
- 執行過的驗證：./init.sh
- 已擷取證據：見下方工作階段記錄與 git commit
- 提交記錄：chore: 導入 harness-engineering 工作流（本輪 commit）
- 已知風險或未解決問題：SDK 56 與其他專案不同，iOS 建置行為可能有差異；ios-004/005 依賴 Apple Developer 帳號
- 下一步最佳動作：開始 ios-001（先照 SPARKWEAR/docs/ios-testing/README.md 確認本機環境）
