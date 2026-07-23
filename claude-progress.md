# 進度日誌

<!-- 寫法與完整範例見 docs/harness/PLAYBOOK.md §5。
     規則：新的工作階段記錄插在「## 工作階段日誌」標題正下方（最新在最上面），編號遞增。
     「目前已驗證狀態」每次收尾都要更新，永遠反映最新事實。 -->

## 目前已驗證狀態

- 儲存庫根目錄：/Users/mimi/Documents/SPARKLOG（2026-07-21 從 SPARKNOTE 改名，GitHub repo 與本機資料夾同步改名，git remote 已更新為 git@github.com:mimichild/SPARKLOG.git）
- 標準啟動路徑：`RUN_START_COMMAND=1 ./init.sh`（實際指令見 init.sh 的 START_CMD）
- 標準驗證路徑：./init.sh（pnpm install + pnpm exec jest；2026-07-23 為 56 tests passed）
- monetization-001：passing（2026-07-23，使用者實機逐一測試個別鎖點確認無誤）；分頁列底部安全區已改成依「有無廣告」動態計算（見工作階段 010）；AdMob 真實 iOS App ID 已設定（ca-app-pub-8914492142878610~8412301462），廣告單元 ID 待提供；Android 維持 Google 測試 ID
- 目前最高優先級未完成功能：無（下一輪從 feature_list.json 選下一個 not_started 功能）
- 目前 blocker：無
- 背景：**App 已於 2026-07-21 正式改名為「SPARK LOG」**，解決了 bundleIdentifier com.sparknotes.app 撞名（疑似跟 SparkNotes 品牌衝突）導致 ios-004 卡住的問題，改成 com.sparklog.app 後建置成功；GitHub repo／本機資料夾也已同步改名成 SPARKLOG；Android APK 也已建置成功並修好三個實機才會踩到的問題（applicationId 未更新、大備份匯入 OOM、adaptive icon 圖層未更新，詳見工作階段 006）；Expo SDK 56（其他四個專案是 54）；ios-001～ios-005 皆已 passing（含 TestFlight 實機驗證）；雷達/預警功能已於 0c60085 移除

## 工作階段日誌

### 工作階段 011

- 日期：2026-07-23
- 本輪目標：使用者申請好真實 AdMob 帳號，把 iOS App ID 換成正式的
- 已完成：`app.json` config plugin 的 `iosAppId` 換成 `ca-app-pub-8914492142878610~8412301462`；`androidAppId` 維持 Google 官方測試 ID（Android 一律視為 Pro，`AdBanner` 永遠不會渲染，不需要申請真的 Android 廣告版位）
- 執行過的驗證：`python3 -c "json.load(...)"` 確認 app.json 仍是合法 JSON
- 已知風險或未解決問題：這個改動屬於原生設定（會寫入 iOS Info.plist 的 GADApplicationIdentifier），純 JS 的 `eas update` OTA 推不動，需要重新 `expo prebuild`/整套 build 才會生效；廣告單元 ID（`BANNER_AD_UNIT_ID`）還沒換，目前仍是 Google 測試版位，待使用者在 AdMob 後台建立橫幅版位後提供
- 下一步最佳動作：收到廣告單元 ID 後更新 `src/constants/monetization.ts`；之後找時間跑一次原生 build 讓新 App ID 生效

### 工作階段 010

- 日期：2026-07-23
- 本輪目標：分頁列底部安全區改成依「有沒有廣告」動態決定（跟 SPARKWEAR/SPARKPLATE/SPARKFIT/SPARKSHAPE 同步處理）
- 已完成：`app/main/_layout.tsx` 加 `useSafeAreaInsets()` + `useIsPro()`，`bottomInset = isPro ? insets.bottom : 0`，動態加到 `tabBarStyle.height`/`paddingBottom`；三個分頁畫面（categories/rankings/records）原本就用 `edges={['top']}`（bottom 已排除），沒有重複扣打問題，不用額外修
- 執行過的驗證：`npx tsc --noEmit`（無錯誤）；`npx jest`（11 suites、56 tests 全過）
- 已知風險或未解決問題：Pro（無廣告）分支目前無法在模擬器上實測（RevenueCat 尚未設定金鑰），邏輯依賴標準 `useSafeAreaInsets()` 疊加，未做額外模擬器驗證
- 下一步最佳動作：下次工作階段開始時照常從 feature_list.json 選下一個 not_started 功能

### 工作階段 009

- 日期：2026-07-23
- 本輪目標：複製其他四個 SPARK App 的付費功能範本到 SPARKLOG（monetization-001，5 個 App 的最後一個）
- 已完成：
  - 安裝 `react-native-google-mobile-ads`（鎖定 16.3.4）與 `react-native-purchases`
  - 新增 `src/constants/monetization.ts`、`src/services/purchases.ts`、`src/hooks/useIsPro.ts`、`src/hooks/useProGate.ts`、`src/components/AdBanner.tsx`
  - `src/store/settingsStore.ts`（zustand persist middleware）加 `isProUnlocked`/`setProUnlocked`；有獨立的 `app/settings.tsx` 路由，升級提示直接 `router.push('/settings')`
  - 主題色/匯出/匯入接上 `requirePro` 鎖，加 PRO 解鎖區塊（升級 Pro／恢復購買）
  - 廣告放置：首頁、三個分頁（掛在 `app/main/_layout.tsx` 共用一條；這個分頁列原本完全沒設定明確高度，套用跟 SPARKWEAR 一樣的固定高度 50＋lineHeight 置中修法）
  - 寫測試時發現這個專案的 `@testing-library/react-native` 是 14.x 版本，`render`/`renderHook`/`act` 全部要 `await` 才會正常運作（不 await 會讓 `result` 變成 `undefined`/`null`，錯誤訊息完全看不出跟這個有關），用最小重現案例（`renderHook(() => useState(0))`）才排除掉，寫進 `feedback_sparklog_testing_library_async` 記憶避免下次又卡住
  - 新增對應單元測試，56 tests 全過；`npx tsc --noEmit -p .` 完全無錯誤
  - `npx expo prebuild --platform ios && pod install` 成功；第一次 `npx expo run:ios` 建置失敗，錯誤是 `missing required module 'SwiftShims'`——根因是這個資料夾以前叫 SPARKNOTE 改名成 SPARKLOG，`node_modules/expo-modules-jsi/apple/.DerivedData` 底下殘留一份用舊路徑編譯的 Swift module cache；刪掉這個過期快取資料夾後重新建置成功，首頁正常顯示、AdMob 測試廣告有載入
- 執行過的驗證：`./init.sh`（56 tests passed）、`npx tsc --noEmit -p .`（無錯誤）、模擬器手動操作（僅確認首頁與廣告；進入設定頁測試個別鎖點時連續兩次都點不準座標，沒能完成，跟 SPARKFIT 那輪遇到類似狀況）
- 已擷取證據：見 feature_list.json monetization-001 evidence
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：個別鎖點（主題色/匯出/匯入的升級提示、恢復購買、Android 全功能開放、三個分頁的廣告位置）都還沒實際點過確認，只有單元測試佐證
- 下一步最佳動作：使用者有空時自己測一輪 SPARKSHAPE/SPARKFIT/SPARKLOG 剩下的個別鎖點（SPARKPLATE 已經使用者確認過）→ 5 個 App 的 monetization-001 全部改 passing，這個階段的付費功能主線工作即完成

### 工作階段 008

- 日期：2026-07-21
- 本輪目標：完成 ios-005（TestFlight 內部測試）剩餘步驟——加入測試群組＋實機驗證
- 已完成：
  - 使用者於 App Store Connect 把 Build 2 加入內部測試群組，iPhone 用 TestFlight 成功安裝並開啟 SPARKLOG
  - 實機重跑核心流程（新增店家紀錄、定位權限彈窗、關閉重開確認資料持久化），使用者確認「測試都沒問題」
- 執行過的驗證：見上述，皆為使用者實機手動操作
- 已擷取證據：見 feature_list.json ios-005 evidence
- 提交記錄：（本輪 commit）
- 已知風險或未解決問題：無
- 下一步最佳動作：目前 feature_list.json 全部 passing，無待辦項目；有新需求再開新 feature

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
