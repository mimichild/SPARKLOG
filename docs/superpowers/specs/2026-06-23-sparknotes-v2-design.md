# SPARKNOTES v2 — 設計文件

**日期：** 2026-06-23
**平台：** iOS + Android（React Native + Expo）
**資料儲存：** 本機（無後端）

> 本專案是既有 SPARKNOTES（React Navigation + Context，commit 7d6f465~42a0182）的重新設計版本。
> 沿用 `/Users/mimi/Documents/REUSABLE_INFRA.md` 的可複用基礎建設骨架（Expo Router + Zustand），
> 在同一個目錄（`/Users/mimi/Documents/SPARKNOTE`）覆蓋重建，取代舊的導覽架構與部分資料模型。

---

## 一、技術棧

| 項目 | 套件 / 版本 |
|------|------------|
| 框架 | React Native + Expo SDK 54 |
| 路由 | Expo Router v6（file-based routing） |
| 語言 | TypeScript（strict） |
| 全域狀態 | Zustand v5（主題色、設定，搭配 persist middleware 寫入 AsyncStorage） |
| 本機資料庫 | expo-sqlite（店家、分類） |
| 地圖選點 | react-native-maps（嵌入式地圖＋可拖曳大頭針，免 API Key） |
| GPS / 地理圍欄 | expo-location + expo-task-manager（background mode） |
| 本機通知 | expo-notifications |
| 相片 | expo-image-picker |
| 匯出 / 分享 | expo-file-system + expo-sharing |
| 匯入 | expo-document-picker |
| 測試 | Jest + jest-expo + @testing-library/react-native，沿用 REUSABLE_INFRA 的 native mock 模板 |

**分層架構**（沿用 REUSABLE_INFRA 第13節）：

```
db（SQLite）
  └─ services/    純函式，接受外部依賴作為參數，不持有狀態
       └─ hooks/   封裝 useState + useCallback，提供 reload()
            └─ app/（screens，Expo Router）  消費 hooks，只做 UI 渲染
```

全域 UI 狀態（主題色、設定）走 Zustand，不走 Context API。

---

## 二、資料模型

```ts
interface Store {
  id: string;
  name: string;                // 必填
  categoryId: string;          // 必填
  rating: 1 | 2 | 3 | 4 | 5;   // 必填
  latitude: number;            // 必填，地圖選點取得
  longitude: number;           // 必填
  address: string;             // 自動產生（反向地理編碼顯示用），非使用者手動輸入
  photos: string[];            // 選填，本機檔案路徑陣列，可多張
  event: string;               // 選填，自由文字，記錄該次上門發生的事
  notes: string;               // 選填，備註
  createdAt: string;           // ISO 8601 timestamp
}

interface Category {
  id: string;
  name: string;   // 例：咖啡廳、餐廳、飲料店、服飾
  emoji: string;  // 例：☕ 🍽 🧋 👗
  order: number;
}

interface AppSettings {
  themeColor: string;             // hex 色碼，重點色（按鈕／選中狀態／高分愛心），預設 #6c63ff
  radarEnabled: boolean;          // 是否開啟心級雷達
  radarRatingThreshold: number;   // 幾顆心以下觸發雷達，預設 2（≤2星）
  radarRadiusMeters: number;      // 雷達半徑（公尺），預設 500
}
```

**新增店家流程：**
1. 填店名（必填）
2. 選分類（必填，橫向選擇現有分類）
3. 點選心級 1–5（必填）
4. 點「選擇位置」→ 開啟嵌入式地圖（react-native-maps），預設定位到使用者目前位置，可拖曳大頭針微調至店家實際位置 → 確認後背景以反向地理編碼產生 `address` 顯示字串，同時存下 `latitude`/`longitude`（地理圍欄比對用這組座標，不比對地址文字）
5. 選填：照片（多張，相機或相簿）、事件（自由文字）、備註
6. 底部「取消」／「儲存」

---

## 三、主題

整個 APP 採**單一淺色主題**（白色／淺灰背景＋深色文字），**不提供深色模式切換**。設定裡的「主題顏色」只控制重點色：按鈕、選中狀態、3–5 心的愛心填色等。1–2 心愛心固定使用警示色（如紅／橙），未填愛心固定使用淺灰色，不受主題色影響。

---

## 四、導覽架構

```
app/
├── index.tsx              — HomeScreen（首頁，獨立 landing 頁，不屬於 Tab）
├── settings.tsx            — SettingsScreen
├── store/
│   ├── [id].tsx              — StoreDetailScreen
│   └── add.tsx                — AddStoreScreen（Modal，新增／編輯共用）
├── category/
│   └── [id].tsx               — CategoryDetailScreen（該分類下的店家列表）
└── main/
    ├── _layout.tsx           — 底部 Tab Navigator
    ├── records.tsx            — 紀錄頁（Tab 1）
    ├── categories.tsx         — 分類頁（Tab 2）
    └── rankings.tsx            — 排行頁（Tab 3）
```

**進入流程：** APP 開啟 → HomeScreen → 按「進入主頁」→ main/records（進入 Tab 結構，三個 Tab 互切不退出、不回首頁）→ 三個 Tab 頂部都統一有「←返回首頁」按鈕，按下才跳出 Tab 結構回到 HomeScreen。

---

## 五、畫面規格

### 5.1 HomeScreen（首頁）
- 置中顯示 APP 大標題，字色套用主題色
- 「⚙️ 設定」按鈕 → SettingsScreen
- 「進入主頁」按鈕 → main/records

### 5.2 紀錄頁（main/records）
- 左上「←返回首頁」、右上「🔍搜尋」（展開關鍵字搜尋列，即時過濾店名）
- 列表依 `createdAt` 倒序排列；每筆卡片：縮圖（無照片顯示淺灰虛線佔位框）＋店名（粗體）＋分類＋愛心評分＋相對時間
- 右下角懸浮按鈕「＋」→ store/add（新增）
- 點卡片 → StoreDetailScreen；長按 → 刪除確認彈窗

### 5.3 分類頁（main/categories）
- 左上「←返回首頁」、右上「✏️編輯」（新增分類／長按既有分類可編輯或刪除）
- 顯示所有分類標籤（emoji＋名稱＋店家數量）
- 點分類 → category/[id]

### 5.4 分類詳情（category/[id]）
- 左上「←返回分類頁」、右上「🔍搜尋」（搜尋此分類內店家）
- 該分類下的店家列表（樣式同紀錄頁卡片），可切換新→舊／舊→新排序

### 5.5 排行頁（main/rankings）
- 左上「←返回首頁」
- 上方篩選列：心級篩選（1–5，多選標籤）＋分類篩選（多選標籤）
- 結果列表：符合條件的店家，依愛心數高→低排序，同分依時間倒序

### 5.6 新增／編輯店家（store/add，Modal）
- 必填：店名、分類、心級
- 「選擇位置」按鈕 → 嵌入式地圖選點（拖曳大頭針）
- 選填：照片（多張）、事件、備註
- 底部「取消」／「儲存」

### 5.7 店家詳情（store/[id]）
- 顯示完整欄位（照片輪播、店名、分類、心級、地址、事件、備註）
- 編輯按鈕 → store/add（帶入 storeId，預填資料）
- 刪除入口（確認彈窗）
- 點地址 → 開啟系統地圖 APP

### 5.8 設定頁（settings）
- **主題顏色**：6 個預設色圓點＋自訂色（系統色彩選取器）
- **心級雷達**：總開關（Toggle）
- **雷達門檻**：下拉選單（1星 / 2星以下 / 3星以下）
- **雷達半徑**：下拉選單（100m / 300m / 500m / 1km）
- **資料管理**：📤 匯出（序列化為 JSON，系統分享介面）／📥 匯入（選取 JSON 檔，彈窗選擇「合併」或「覆蓋」現有資料）

---

## 六、地理圍欄通知架構

```
背景任務（expo-task-manager + expo-location background mode）
  每 X 分鐘取得一次目前位置
  → 若 radarEnabled = false，跳過
  → 查詢 SQLite：rating ≤ radarRatingThreshold 的所有店家
  → 以 latitude/longitude 用 Haversine 公式計算距離（不比對地址文字）
  → 距離 ≤ radarRadiusMeters → 發送本機通知
        標題：⚠️ 雷店就在附近！
        內容：「{店名}（{rating}心）距離你只有 {距離}m，小心別踩雷」
  → 同一家店 1 小時內不重複通知
```

**權限需求：**
- iOS：`NSLocationAlwaysAndWhenInUseUsageDescription`
- Android：`ACCESS_BACKGROUND_LOCATION`
- 通知權限：APP 啟動時請求

---

## 七、資料匯出格式（JSON）

```json
{
  "version": 1,
  "exportedAt": "2026-06-23T10:00:00Z",
  "categories": [
    { "id": "...", "name": "咖啡廳", "emoji": "☕", "order": 0 }
  ],
  "stores": [
    {
      "id": "...",
      "name": "路易莎咖啡",
      "categoryId": "...",
      "rating": 5,
      "latitude": 25.033,
      "longitude": 121.564,
      "address": "台北市信義區...",
      "photos": [],
      "event": "跟朋友一起吃生日蛋糕",
      "notes": "老闆很親切",
      "createdAt": "2026-06-20T08:30:00Z"
    }
  ]
}
```

匯入時跳確認彈窗，使用者選擇「合併」（保留現有＋加入匯入資料）或「覆蓋」（清空現有後寫入匯入資料）。

---

## 八、預設分類

APP 初次安裝時預建以下分類，使用者可自行編輯／刪除：

| Emoji | 名稱 |
|-------|------|
| 🍽 | 餐廳 |
| ☕ | 咖啡廳 |
| 🧋 | 飲料店 |
| 👗 | 服飾 |
| 🍰 | 甜點店 |

---

## 九、不在範圍內（Out of Scope）

- 雲端同步／多裝置共用
- 使用者帳號／登入
- 社交分享（分享給朋友）
- 地址文字輸入／地址自動完成搜尋（用拖曳大頭針選點取代，且 Google Places API 需額外計費，故不採用）
- 深色模式（單一淺色主題，僅可自訂重點色）
- 地圖內建瀏覽畫面（僅新增店家時的選點地圖，詳情頁地址點擊改用系統地圖 APP 開啟）
