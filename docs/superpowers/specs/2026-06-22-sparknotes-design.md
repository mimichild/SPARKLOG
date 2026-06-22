# SPARKNOTES — 設計文件

**日期：** 2026-06-22
**平台：** iOS + Android（React Native + Expo）
**資料儲存：** 本機（無後端）

---

## 一、技術棧

| 項目 | 套件 / 版本 |
|------|------------|
| 框架 | React Native 0.76 + Expo SDK 52 |
| 語言 | TypeScript 5.x |
| 導覽 | React Navigation v7（Stack + Bottom Tabs） |
| 本機資料庫 | expo-sqlite 14.x |
| 設定儲存 | AsyncStorage（主題色、通知設定） |
| GPS / 地理圍欄 | expo-location 17.x |
| 背景任務 | expo-task-manager 12.x |
| 本機通知 | expo-notifications 0.29.x |
| 相機 / 相片 | expo-image-picker 15.x |
| 匯出 / 分享 | expo-file-system 17.x + expo-sharing 12.x |
| 匯入 | expo-document-picker 12.x |

---

## 二、資料模型

### Store（店家）

```ts
interface Store {
  id: string;           // UUID
  name: string;         // 必填
  categoryId: string;   // 必填，外鍵 → Category.id
  rating: 1 | 2 | 3 | 4 | 5;  // 必填
  address: string;      // 必填
  latitude: number;     // 必填，用於地理圍欄
  longitude: number;    // 必填
  photos: string[];     // 選填，本機檔案路徑陣列
  notes: string;        // 選填
  priceRange: string;   // 選填，如「$」「$$」「$$$」
  createdAt: string;    // ISO 8601 timestamp
}
```

### Category（分類）

```ts
interface Category {
  id: string;
  name: string;   // 例：咖啡廳、餐廳、飲料店、服飾
  emoji: string;  // 例：☕ 🍽 🧋 👗
  order: number;  // 排序
}
```

### Settings（設定，AsyncStorage）

```ts
interface AppSettings {
  themeColor: string;         // hex 色碼，例：#6c63ff
  notificationsEnabled: boolean;
  alertRatingThreshold: number;  // 預警門檻，例：2（≤2星觸發）
  alertRadiusMeters: number;     // 預警半徑，例：500
}
```

---

## 三、導覽架構

```
Stack Navigator（根）
├── SettingsScreen       — 設定頁（從首頁按設定按鈕進入）
├── AddStoreScreen       — 新增店家（Modal，從評選頁懸浮按鈕進入）
├── StoreDetailScreen    — 店家詳情（點卡片進入）
├── CategoryDetailScreen — 分類內容（點分類標籤進入）
└── MainTabs（Bottom Tab Navigator，始終可見）
    ├── Tab 1：HomeScreen      — 首頁（大標題 + 設定按鈕）
    ├── Tab 2：EvaluationScreen — 評選
    ├── Tab 3：CategoriesScreen — 分類
    └── Tab 4：RankingsScreen   — 排行
```

**底部導覽列圖示：** 🏠 首頁 ／ 📝 評選 ／ 📂 分類 ／ 🏆 排行

**進入流程：** APP 開啟 → 直接顯示首頁 Tab（底部導覽列始終可見，可隨時切換）

---

## 四、畫面規格

### 4.1 HomeScreen（首頁）
- 全頁居中顯示 APP 大標題「SPARKNOTES」，字色套用主題色
- 標題下方放設定按鈕（⚙️ 設定），點擊導覽至 SettingsScreen（Stack push）
- 底部導覽列的第一個 Tab，APP 開啟時預設顯示此頁

### 4.2 EvaluationScreen（評選）
- 頂部導覽列左側顯示頁面標題「評選」，右上角搜尋按鈕 🔍 → 展開關鍵字搜尋列，即時過濾店名
- 右下角懸浮按鈕（FAB）顯示 ＋，浮在底部 Tab 列上方，點擊 → 開啟 AddStoreScreen（Modal）
- 店家列表，依 `createdAt` 時間**倒序**排列
- 每筆卡片：
  - 左側 52×52 縮圖：有上傳主圖則顯示第一張照片；無照片則顯示灰色虛線佔位框（📷 圖示）
  - 店名（粗體）+ 分類・地址（次要文字）
  - 愛心評分：3–5 心顯示主題色，1–2 心顯示白色，未填顯示深灰；共 5 顆，已填實心 ♥，未填深灰 ♥
  - 右側相對時間（如「2天前」）
- 點卡片 → StoreDetailScreen；長按 → 刪除確認

### 4.3 CategoriesScreen（分類）
- 顯示所有分類標籤（emoji + 名稱 + 數量）
- 右上角「＋」新增分類；長按標籤可編輯 / 刪除
- 點分類 → CategoryDetailScreen（含排序切換：新→舊 / 舊→新）

### 4.4 RankingsScreen（排行）
- 愛心篩選列（1–5 心，可多選）
- 分類篩選列（全部 + 各分類，可多選）
- 結果列表：符合條件的店家，依愛心數高→低排序，同愛心數依時間倒序
- 卡片樣式與評選頁相同（縮圖 + 愛心 + 時間）

### 4.5 AddStoreScreen（新增店家，Modal）
- 必填：店名、分類（Picker）、愛心評分（1–5 點擊選愛心，顏色規則同卡片）、地址（文字輸入 + 「使用目前位置」按鈕自動填入）
- 選填：照片（可多張，來自相機或相簿）、備註、價位（$／$$／$$$）
- 送出後關閉 Modal，EvaluationScreen 列表自動更新

### 4.6 StoreDetailScreen（店家詳情）
- 顯示完整欄位資訊
- 右上角「編輯」按鈕（複用 AddStoreScreen 的表單，預填資料）
- 照片輪播
- 顯示地址，點擊可開啟系統地圖 APP

### 4.7 SettingsScreen（設定）

**主題顏色**
- 6 個預設色圓點 + 自訂色（開啟系統色彩選取器）
- 選色後全 APP 主題色即時更新

**雷店預警通知**
- 通知開關（Toggle）
- 警示星級門檻（下拉：1星 / 2星以下 / 3星以下）
- 警示半徑（下拉：100m / 300m / 500m / 1km）

**資料管理**
- 📤 匯出資料 → 將所有 Store + Category 序列化為 JSON，透過系統分享介面匯出
- 📥 匯入資料 → 透過 expo-document-picker 選取 JSON 檔案，合併或覆蓋本機資料（需確認彈窗）

---

## 五、地理圍欄通知架構

```
背景任務（expo-task-manager）
  └── LOCATION_TASK_NAME
        每 X 分鐘取得一次位置（expo-location background mode）
        → 查詢 SQLite：rating ≤ alertRatingThreshold 的所有店家
        → 計算距離（Haversine 公式）
        → 距離 ≤ alertRadiusMeters → 發送本機通知
              標題：⚠️ 雷店就在附近！
              內容：「{店名}（{rating}心）距離你只有 {距離}m，小心別踩雷」
        → 避免重複通知：記錄最近一次通知時間，同一家店 1 小時內不重複
```

**權限需求：**
- iOS：`NSLocationAlwaysAndWhenInUseUsageDescription`
- Android：`ACCESS_BACKGROUND_LOCATION`
- 通知權限：`expo-notifications` 啟動時請求

---

## 六、資料匯出格式（JSON）

```json
{
  "version": 1,
  "exportedAt": "2026-06-22T10:00:00Z",
  "categories": [
    { "id": "...", "name": "咖啡廳", "emoji": "☕", "order": 0 }
  ],
  "stores": [
    {
      "id": "...",
      "name": "路易莎咖啡",
      "categoryId": "...",
      "rating": 5,
      "address": "台北市信義區...",
      "latitude": 25.033,
      "longitude": 121.564,
      "photos": [],
      "notes": "老闆很親切",
      "priceRange": "$",
      "createdAt": "2026-06-20T08:30:00Z"
    }
  ]
}
```

---

## 七、預設分類

APP 初次安裝時預建以下分類，使用者可自行編輯：

| Emoji | 名稱 |
|-------|------|
| 🍽 | 餐廳 |
| ☕ | 咖啡廳 |
| 🧋 | 飲料店 |
| 👗 | 服飾 |
| 🍰 | 甜點店 |
| 🏋️ | 運動用品專賣店 |

---

## 八、不在範圍內（Out of Scope）

- 雲端同步 / 多裝置共用
- 使用者帳號 / 登入
- 社交分享（分享給朋友）
- 地圖畫面（僅通知聯動，不內建地圖 View）
- 深色 / 淺色模式切換（固定深色主題）
