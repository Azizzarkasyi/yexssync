import { useState, useEffect } from 'react';
import { useColorScheme as useRNColorScheme, Platform } from 'react-native';

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface AdminTheme {
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;

  // Colors based on Tenant Admin HTML prototype
  primaryBlue: string;
  primaryBlueHover: string;
  sidebarBg: string;
  bgColor: string;
  textDark: string;
  textMuted: string;
  success: string;
  successBg: string;
  danger: string;
  dangerBg: string;
  warning: string;
  warningBg: string;
  warningText: string;
  cardBg: string;
  borderColor: string;
  subtleBg: string;
  activeNavBg: string;
  cardIconBlueBg: string;
  inputBg: string;
  placeholder: string;
}

let globalThemeOverride: ThemeMode = 'auto';
const listeners = new Set<() => void>();

export function useAdminTheme(): AdminTheme {
  const systemScheme = useRNColorScheme();
  const [overrideMode, setOverrideMode] = useState<ThemeMode>(globalThemeOverride);
  const [webSystemDark, setWebSystemDark] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setWebSystemDark(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => {
        setWebSystemDark(e.matches);
        listeners.forEach((l) => l());
      };

      try {
        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
      } catch {
        mediaQuery.addListener(listener);
        return () => mediaQuery.removeListener(listener);
      }
    }
  }, []);

  useEffect(() => {
    const handler = () => setOverrideMode(globalThemeOverride);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const setMode = (mode: ThemeMode) => {
    globalThemeOverride = mode;
    setOverrideMode(mode);
    listeners.forEach((l) => l());
  };

  const isSystemDark = Platform.OS === 'web' ? webSystemDark : systemScheme === 'dark';

  const isDark =
    overrideMode === 'dark' || (overrideMode === 'auto' && isSystemDark);

  const toggleTheme = () => {
    if (overrideMode === 'auto') {
      setMode(isSystemDark ? 'light' : 'dark');
    } else if (overrideMode === 'dark') {
      setMode('light');
    } else {
      setMode('dark');
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDark]);

  if (isDark) {
    return {
      isDark: true,
      mode: overrideMode,
      setMode,
      toggleTheme,
      primaryBlue: '#3b82f6',
      primaryBlueHover: '#2563eb',
      sidebarBg: '#1e293b',
      bgColor: '#0f172a',
      textDark: '#f8fafc',
      textMuted: '#94a3b8',
      success: '#22c55e',
      successBg: 'rgba(34, 197, 94, 0.15)',
      danger: '#ef4444',
      dangerBg: 'rgba(239, 68, 68, 0.15)',
      warning: '#f59e0b',
      warningBg: 'rgba(245, 158, 11, 0.15)',
      warningText: '#fbbf24',
      cardBg: '#1e293b',
      borderColor: '#334155',
      subtleBg: '#0f172a',
      activeNavBg: 'rgba(59, 130, 246, 0.15)',
      cardIconBlueBg: 'rgba(59, 130, 246, 0.15)',
      inputBg: '#0f172a',
      placeholder: '#64748b',
    };
  }

  // Light Mode (Exact from HTML Prototype)
  return {
    isDark: false,
    mode: overrideMode,
    setMode,
    toggleTheme,
    primaryBlue: '#2a75d3',
    primaryBlueHover: '#1f5ca8',
    sidebarBg: '#ffffff',
    bgColor: '#f0f5fa',
    textDark: '#333333',
    textMuted: '#777777',
    success: '#28a745',
    successBg: '#e6f6eb',
    danger: '#dc3545',
    dangerBg: '#fcebeb',
    warning: '#ffc107',
    warningBg: '#fff8e6',
    warningText: '#b08000',
    cardBg: '#ffffff',
    borderColor: '#e0e0e0',
    subtleBg: '#f8f9fa',
    activeNavBg: '#eaf3fc',
    cardIconBlueBg: '#eaf3fc',
    inputBg: '#ffffff',
    placeholder: '#999999',
  };
}
