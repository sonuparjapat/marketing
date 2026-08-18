import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getPublicSettings } from '../api/services';

export const defaultColors = {
  bg: '#14171f',
  bg2: '#1b1f29',
  fg: '#f5f4f0',
  muted: '#9b9fab',
  faint: '#6b6f7b',
  accent: '#d4af6a',
  line: '#2a2e38',
};

export type ThemeColors = typeof defaultColors;
export const spacing = { xs: 6, sm: 12, md: 20, lg: 32, xl: 48 };

const ThemeContext = createContext<ThemeColors>(defaultColors);

const isHex = (v: string | undefined): v is string => !!v && /^#[0-9a-fA-F]{6}$/.test(v);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colors, setColors] = useState<ThemeColors>(defaultColors);

  useEffect(() => {
    getPublicSettings()
      .then((settings) => {
        setColors((prev) => ({
          ...prev,
          bg: isHex(settings.primary_color) ? settings.primary_color : prev.bg,
          accent: isHex(settings.accent_color) ? settings.accent_color : prev.accent,
        }));
      })
      .catch(() => {
        // Keep defaults if the API is unreachable.
      });
  }, []);

  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
