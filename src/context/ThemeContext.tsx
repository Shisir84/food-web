import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeSettings, BackgroundConfig } from '../types/index.ts';
import { api } from '../services/api.ts';

export const THEME_PRESETS: { name: string; label: string; theme: ThemeSettings }[] = [
  {
    name: 'Midnight Orange',
    label: 'Midnight Orange (Default)',
    theme: {
      bgPrimary: '#0B0B0D',
      bgSecondary: '#151518',
      bgCard: '#151518',
      accentPrimary: '#FF7900',
      accentHighlight: '#FF9D00',
      textMain: '#FFFFFF',
      textSecondary: '#B8B8C0',
      borderColor: '#2B2B30',
      presetName: 'Midnight Orange',
    },
  },
  {
    name: 'Midnight Blue',
    label: 'Midnight Blue',
    theme: {
      bgPrimary: '#0B0F19',
      bgSecondary: '#111827',
      bgCard: '#151F33',
      accentPrimary: '#2563EB',
      accentHighlight: '#38BDF8',
      textMain: '#FFFFFF',
      textSecondary: '#94A3B8',
      borderColor: '#1E293B',
      presetName: 'Midnight Blue',
    },
  },
  {
    name: 'Emerald Night',
    label: 'Emerald Night',
    theme: {
      bgPrimary: '#0A130F',
      bgSecondary: '#11221A',
      bgCard: '#162C22',
      accentPrimary: '#10B981',
      accentHighlight: '#34D399',
      textMain: '#FFFFFF',
      textSecondary: '#9CA3AF',
      borderColor: '#1E3A2F',
      presetName: 'Emerald Night',
    },
  },
  {
    name: 'Purple Neon',
    label: 'Purple Neon',
    theme: {
      bgPrimary: '#0F0A1A',
      bgSecondary: '#1A122B',
      bgCard: '#24193D',
      accentPrimary: '#8B5CF6',
      accentHighlight: '#C084FC',
      textMain: '#FFFFFF',
      textSecondary: '#A78BFA',
      borderColor: '#2E1F4D',
      presetName: 'Purple Neon',
    },
  },
  {
    name: 'Clean Light',
    label: 'Clean Light',
    theme: {
      bgPrimary: '#F8FAFC',
      bgSecondary: '#FFFFFF',
      bgCard: '#FFFFFF',
      accentPrimary: '#FF7900',
      accentHighlight: '#FF9D00',
      textMain: '#0F172A',
      textSecondary: '#475569',
      borderColor: '#E2E8F0',
      presetName: 'Clean Light',
    },
  },
];

interface ThemeContextType {
  theme: ThemeSettings;
  previewTheme: (newTheme: ThemeSettings) => void;
  saveTheme: (newTheme: ThemeSettings) => Promise<void>;
  resetDefault: () => Promise<void>;
  toggleMode: () => Promise<void>;
  getBackgroundStyle: (config?: BackgroundConfig) => React.CSSProperties;
  presets: typeof THEME_PRESETS;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeVariables(t: ThemeSettings) {
  const root = document.documentElement;
  root.style.setProperty('--bg-primary', t.bgPrimary);
  root.style.setProperty('--bg-secondary', t.bgSecondary);
  root.style.setProperty('--bg-card', t.bgCard);
  root.style.setProperty('--accent-primary', t.accentPrimary);
  root.style.setProperty('--accent-highlight', t.accentHighlight);
  root.style.setProperty('--text-main', t.textMain);
  root.style.setProperty('--text-secondary', t.textSecondary);
  root.style.setProperty('--border-color', t.borderColor);

  if (t.mode === 'light') {
    root.classList.add('light-mode');
    root.classList.remove('dark-mode');
  } else {
    root.classList.add('dark-mode');
    root.classList.remove('light-mode');
  }
}

export function getBackgroundStyle(config?: BackgroundConfig): React.CSSProperties {
  if (!config) return {};

  if (config.type === 'solid' && config.color) {
    return {
      backgroundColor: config.color,
      opacity: config.opacity !== undefined ? config.opacity : 1,
    };
  }

  if (config.type === 'gradient' && config.gradient) {
    const { direction, from, via, to } = config.gradient;
    let dir = '135deg';
    if (direction === 'to-r') dir = 'to right';
    if (direction === 'to-b') dir = 'to bottom';
    if (direction === 'to-br') dir = 'to bottom right';
    if (direction === 'to-bl') dir = 'to bottom left';

    const stops = via ? `${from}, ${via}, ${to}` : `${from}, ${to}`;
    return {
      backgroundImage: `linear-gradient(${dir}, ${stops})`,
      opacity: config.opacity !== undefined ? config.opacity : 1,
    };
  }

  if (config.type === 'image' && config.imageUrl) {
    return {
      backgroundImage: `url(${config.imageUrl})`,
      backgroundPosition: config.position || 'center',
      backgroundSize: config.size || 'cover',
      backgroundRepeat: config.repeat || 'no-repeat',
      opacity: config.opacity !== undefined ? config.opacity : 1,
      filter: config.blur ? `blur(${config.blur}px)` : undefined,
    };
  }

  return {};
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeSettings>(THEME_PRESETS[0].theme);
  const [savedTheme, setSavedTheme] = useState<ThemeSettings>(THEME_PRESETS[0].theme);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSavedTheme() {
      try {
        const remoteTheme = await api.getTheme();
        if (remoteTheme && remoteTheme.bgPrimary) {
          setTheme(remoteTheme);
          setSavedTheme(remoteTheme);
          applyThemeVariables(remoteTheme);
        } else {
          applyThemeVariables(THEME_PRESETS[0].theme);
        }
      } catch (err) {
        console.warn('Failed to load remote theme, applying default:', err);
        applyThemeVariables(THEME_PRESETS[0].theme);
      } finally {
        setIsLoading(false);
      }
    }
    loadSavedTheme();
  }, []);

  const previewTheme = (newTheme: ThemeSettings) => {
    setTheme(newTheme);
    applyThemeVariables(newTheme);
  };

  const saveTheme = async (newTheme: ThemeSettings) => {
    try {
      const res = await api.saveTheme(newTheme);
      setTheme(res.theme);
      setSavedTheme(res.theme);
      applyThemeVariables(res.theme);
    } catch (e) {
      // Revert to last saved
      setTheme(savedTheme);
      applyThemeVariables(savedTheme);
      throw e;
    }
  };

  const resetDefault = async () => {
    try {
      const res = await api.resetAdminTheme();
      setTheme(res.theme);
      setSavedTheme(res.theme);
      applyThemeVariables(res.theme);
    } catch {
      const defaultTheme = THEME_PRESETS[0].theme;
      await saveTheme(defaultTheme);
    }
  };

  const toggleMode = async () => {
    const isDark = theme.mode !== 'light';
    const nextMode = isDark ? 'light' : 'dark';
    const matchedPreset = isDark ? THEME_PRESETS[4].theme : THEME_PRESETS[0].theme;
    const newTheme: ThemeSettings = {
      ...theme,
      mode: nextMode,
      bgPrimary: matchedPreset.bgPrimary,
      bgSecondary: matchedPreset.bgSecondary,
      bgCard: matchedPreset.bgCard,
      textMain: matchedPreset.textMain,
      textSecondary: matchedPreset.textSecondary,
      borderColor: matchedPreset.borderColor,
    };
    await saveTheme(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        previewTheme,
        saveTheme,
        resetDefault,
        toggleMode,
        getBackgroundStyle,
        presets: THEME_PRESETS,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
