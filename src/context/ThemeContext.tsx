import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSettings, saveSettings } from '@/storage/settingsStorage';

interface ThemeContextValue {
  themeColor: string;
  setThemeColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeColor: '#6c63ff',
  setThemeColor: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeColor, setThemeColorState] = useState('#6c63ff');

  useEffect(() => {
    getSettings().then((s) => setThemeColorState(s.themeColor));
  }, []);

  const setThemeColor = async (color: string) => {
    setThemeColorState(color);
    const s = await getSettings();
    await saveSettings({ ...s, themeColor: color });
  };

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
