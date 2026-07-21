# 進度日誌

<!-- 寫法與完整範例見 docs/harness/PLAYBOOK.md §5。
     規則：新的工作階段記錄插在「## 工作階段日誌」標題正下方（最新在最上面），編號遞增。
     「目前已驗證狀態」每次收尾都要更新，永遠反映最新事實。 -->

## 目前已驗證狀態

- 儲存庫根目錄：/Users/mimi/Documents/SPARKLOG（2026-07-21 從 SPARKNOTE 改名，GitHub repo 與本機資料夾同步改名，git remote 已更新為 git@github.com:mimichild/SPARKLOG.git）
- 標準啟動路徑：`RUN_START_COMMAND=1 ./init.sh`（實際指令見 init.sh 的 START_CMD）
- 標準驗證路徑：./init.sh（pnpm install + pnpm exec jest；2026-07-21 為 39 tests passed）
- 目前最高優先級未完成功能：ios-005 TestFlight 內部測試（in_progress，已完成 eas submit，剩下加入測試群組＋實機驗證）
- 目前 blocker：實機驗證步驟需要使用者的實體 iPhone 才能繼續
- 背景：**App 已於 2026-07-21 正式改名為「SPARK LOG」**，解決了 bundleIdentifier com.sparknotes.app 撞名（疑似跟 SparkNotes 品牌衝突）導致 ios-004 卡住的問題，改成 com.sparklog.app 後建置成功；GitHub repo／本機資料夾也已同步改名成 SPARKLOG；Android APK 也已建置成功並修好三個實機才會踩到的問題（applicationId 未更新、大備份匯入 OOM、adaptive icon 圖層未更新，詳見工作階段 006）；Expo SDK 56（其他四個專案是 54）；ios-001～ios-004 皆已 passing；雷達/預警功能已於 0c60085 移除

## 工作階段日誌

### 工作階段 007

- 日期：2026-07-21
- 本輪目標：ios-005 中不需要實機的部分先做完（eas submit）
- 已完成：使用者於 Terminal.app 互動執行 `eas submit --platform ios --profile production --latest`，Build 6ac01601-2e58-4809-a87f-c74815011660 上傳成功
- 執行過的驗證：實際跑 eas submit，看到「Submitted your app to Apple App Store Connect!」完成訊息
- 已擷取證據：見 feature_list.json ios-005 evidence
- 提交記錄：c6b56e2
- 已知風險或未解決問題：ios-005 剩餘兩步需要使用者的實體 iPhone
- 下一步最佳動作：等使用者有 iPhone 可測時，完成 ios-005 剩餘步驟

### 工作階段 006

- 日期：2026-07-21
- 本輪目標：使用者要把改名後的 SPARK LOG 建成 Android APK、上傳雲端硬碟、裝到實機，並把舊 SPARKNOTE 的資料遷移過去
- 已完成：
  - 用 `/build-apk` skill 建置 APK、上傳到 `SPARK-Builds/SPARKLOG/`
  - **踩坑並修好三個實機才會暴露的問題**：
    1. **APK 內部 applicationId 沒更新**：本機 `android/` 資料夾是改名前產生的舊版，`build.gradle` 寫死 `com.sparknotes.app`，改 `app.json` 不會自動同步（跟 iOS 的 `ios/` 資料夾是同一個道理）。用 `adb install` 裝上去後系統把它當成「更新舊 App」，資料庫檔名卻已經改成新的 `sparklog.db`，導致資料讀不到、匯入也失敗。修法：`npx expo prebuild --platform android` 重新產生（不需要 `--clean`，一般 prebuild 就會套用 app.json 的新設定；只有第一次修正 stale applicationId 那次因為要整個重新產生資料夾用了 `--clean`，之後改設定用一般 prebuild 就夠，速度快很多）
    2. **匯入大備份檔案 OutOfMemoryError**：實測 43MB（146 家店、上百張照片）的備份檔匯入時，App 拋出 OOM（單次配置 58MB 超過預設 256MB heap 上限），使用者只看到籠統的「匯入失敗，請確認檔案是否正確」。用 `adb logcat` 才抓到真正的 OutOfMemoryError。修法：新增 `plugins/withAndroidLargeHeap.js`（`withAndroidManifest` mod）幫 `<application>` 加 `android:largeHeap="true"`
    3. **Android adaptive icon 圖層沒更新**：改名時只換了 `assets/icon.png`（iOS 用），Android 的 `android-icon-foreground/background/monochrome.png` 三張圖層因為沒有分層素材沒有動，導致 Android 上圖示還是舊的「NOTE」設計。用 ImageMagick（`brew install imagemagick`）從新 icon.png 重新產生三張圖層，注意要用 **floodfill**（不是全域顏色替換 `-opaque`）去背，否則會把筆記本上同色系的「LOG」文字也一起挖空
  - 全程用實機（Pixel 10）USB 連接 + `adb logcat` 抓真正的錯誤，不是憑空猜
  - 使用者確認：資料匯入成功（148 家店）、圖示正常顯示
- 執行過的驗證：`./init.sh`（39 tests passed）、實機安裝＋匯入＋圖示視覺確認
- 已擷取證據：三個 commit（applicationId 修復不需要 commit，因為 `android/` 本身被 gitignore；largeHeap plugin 與 icon 圖層都已 commit 並 push）
- 提交記錄：`c9e167d`（largeHeap）、`df053b5`（icon 圖層）
- 已知風險或未解決問題：雲端硬碟 `SPARK-Builds/SPARKLOG/` 資料夾裡還留著兩份建置失敗過程中產生的舊 APK，使用者尚未決定要不要清掉；手機上殘留一個「殼子是舊 SPARKNOTE、UI 是新的但資料是空的」的混亂安裝，使用者尚未決定要不要移除
- 下一步最佳動作：iOS 這邊還是卡在 ios-005（需要實體 iPhone）；Android 這條線目前沒有已知問題

### 工作階段 005

- 日期：2026-07-21
- 本輪目標：解決 ios-004 卡住的 bundle ID 撞名問題
- 已完成：
  - 用 `/research` 調查改名「SPARK LOG」的完整範圍（app.json 識別碼、程式碼裡的文字、圖示、README、跨專案影響），確認沒有其他 SPARK App 連結到 SPARKNOTE
  - 使用者確認要正式改名（不只是換技術識別碼），並提供做好的新圖示（「LOG」字樣，取代原本「NOTE」字樣）
  - 改動：`app.json`（name/slug/scheme/package/bundleIdentifier）、`package.json` name、`app/index.tsx` 首頁標題、`app/settings.tsx` 備份檔名與分享文字、`src/db/database.ts` 資料庫檔名、`assets/icon.png`＋`assets/favicon.png`、`README.md`、`feature_list.json` 的 project 欄位
  - `eas init` 重新連結（因為既有 EAS 專案綁定 GitHub repo，尚未改名前 slug 只能維持 sparknotes，純內部識別碼、不影響實際功能）
  - `eas build --platform ios --profile production`（互動模式）：Apple 接受新 bundle ID `com.sparklog.app`，建置成功
- 執行過的驗證：`./init.sh`（39 tests passed）、實際跑 EAS 雲端建置成功
- 已擷取證據：見 feature_list.json ios-004 evidence，含 build URL 與 .ipa 下載連結
- 提交記錄：（見本輪 commit，含 20d05b4 改名主要改動）
- 已知風險或未解決問題：Android adaptive icon 三張圖層仍是舊的「NOTE」設計（沒有分層素材可換）；GitHub repo／本機資料夾尚未改名
- 下一步最佳動作：GitHub repo／本機資料夾改名為 SPARKLOG；接著開始 ios-005（TestFlight 內部測試，需要實體 iPhone）

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
