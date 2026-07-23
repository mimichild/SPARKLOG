jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

import { Alert } from 'react-native';
import { renderHook, act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';
import { useProGate } from '@/hooks/useProGate';

const mockPush = router.push as jest.Mock;

describe('useProGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSettingsStore.setState({ isProUnlocked: false });
  });

  it('requirePro returns true and does not alert when already Pro', async () => {
    useSettingsStore.setState({ isProUnlocked: true });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { result } = await renderHook(() => useProGate());

    let allowed = false;
    await act(() => { allowed = result.current.requirePro('主題色'); });

    expect(allowed).toBe(true);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('requirePro returns false and shows an upgrade alert when not Pro', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { result } = await renderHook(() => useProGate());

    let allowed = true;
    await act(() => { allowed = result.current.requirePro('主題色'); });

    expect(allowed).toBe(false);
    expect(alertSpy).toHaveBeenCalledWith(
      '主題色為 Pro 專屬功能',
      expect.any(String),
      expect.any(Array),
    );
  });

  it('the alert "升級 Pro" button navigates to /settings', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const upgradeBtn = buttons?.find(b => b.text === '升級 Pro');
      upgradeBtn?.onPress?.();
    });
    const { result } = await renderHook(() => useProGate());

    await act(() => { result.current.requirePro('匯出備份'); });

    expect(alertSpy).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });
});
