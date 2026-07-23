import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useIsPro } from './useIsPro';

/**
 * 免費使用者點到 Pro 專屬功能時的統一互動：跳出升級提示，引導到設定頁的
 * PRO 解鎖區塊，而不是讓按鈕默默沒反應或只顯示鎖頭圖示不解釋。
 * 用法：`if (!requirePro('主題色')) return;` 接在功能執行前面。
 */
export function useProGate() {
  const isProUnlocked = useIsPro();

  function requirePro(featureLabel: string): boolean {
    if (isProUnlocked) return true;
    Alert.alert(
      `${featureLabel}為 Pro 專屬功能`,
      '升級 Pro 即可解鎖，要現在升級嗎？',
      [
        { text: '之後再說', style: 'cancel' },
        { text: '升級 Pro', onPress: () => router.push('/settings') },
      ],
    );
    return false;
  }

  return { isProUnlocked, requirePro };
}
