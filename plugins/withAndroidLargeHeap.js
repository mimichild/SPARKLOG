const { withAndroidManifest } = require('@expo/config-plugins');

// 匯入/匯出備份時，程式會把整個 zip 讀成 base64 字串、解壓縮、逐張照片轉成
// base64 存進 SQLite，資料量大時（例如 146 家店、上百張照片、40MB+ 的
// 備份檔）很容易超過 Android 預設的 heap 上限，直接被系統丟出
// OutOfMemoryError，使用者只會看到籠統的「匯入失敗」。開啟 largeHeap 讓
// App 跟系統要更大的記憶體上限，避免處理大備份檔時 OOM。
function withAndroidLargeHeap(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (!application) {
      throw new Error(
        'withAndroidLargeHeap: 在 AndroidManifest.xml 裡找不到 <application> 標籤，可能是 Expo 樣板改了，請重新檢查 plugins/withAndroidLargeHeap.js'
      );
    }
    application.$['android:largeHeap'] = 'true';
    return config;
  });
}

module.exports = withAndroidLargeHeap;
