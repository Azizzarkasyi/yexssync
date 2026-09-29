import { useState, useEffect } from 'react';
import { useColorScheme as useRNColorScheme, Platform } from 'react-native';

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface SuperAdminTheme {
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;

  // Backgrounds - Aligned with Tenant Admin theme
  bg: string;
  bgColor: string;
  cardBg: string;
  cardBgHover: string;
  cardHeaderBg: string;
  subtleBg: string;

  // Text
  text: string;
  textDark: string;
  textSecondary: string;
  textMuted: string;

  // Borders
  border: string;
  borderColor: string;
  borderLight: string;

  // Inputs
  inputBg: string;
  inputBorder: string;
  placeholder: string;

  // Sidebar & Primary Accent (Matches Admin #2a75d3 / #3b82f6)
  primaryBlue: string;
  primaryBlueHover: string;
  accent: string;
  accentHover: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarTextActive: string;
  sidebarActiveBg: string;
  activeNavBg: string;
  cardIconBlueBg: string;

  // Badges & Status Indicators
  success: string;
  successBg: string;
  successText: string;
  warning: string;
  warningBg: string;
  warningText: string;
  danger: string;
  dangerBg: string;
  dangerText: string;
  infoBg: string;
  infoText: string;
  purpleBg: string;
  purpleText: string;
}

let globalThemeOverride: ThemeMode = 'auto';
const listeners = new Set<() => void>();

export function useSuperAdminTheme(): SuperAdminTheme {
  const systemScheme = useRNColorScheme();
  const [overrideMode, setOverrideMode] = useState<ThemeMode>(globalThemeOverride);
  const [webSystemDark, setWebSystemDark] = useState<boolean>(false);

  useEffect(() => {
    // Detect system dark mode on web
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
    const next: ThemeMode = isDark ? 'light' : 'dark';
    setMode(next);
  };

  // Synchronize document.documentElement class on Web for NativeWind and Tailwind
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

      // Backgrounds (Matched with Admin Dark)
      bg: '#0f172a',
      bgColor: '#0f172a',
      cardBg: '#1e293b',
      cardBgHover: '#263449',
      cardHeaderBg: '#1e293b',
      subtleBg: '#0f172a',

      // Text
      text: '#f8fafc',
      textDark: '#f8fafc',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',

      // Borders
      border: '#334155',
      borderColor: '#334155',
      borderLight: '#1e293b',

      // Inputs
      inputBg: '#0f172a',
      inputBorder: '#334155',
      placeholder: '#64748b',

      // Brand Blue / Accent (Matched with Admin #3b82f6)
      primaryBlue: '#3b82f6',
      primaryBlueHover: '#2563eb',
      accent: '#3b82f6',
      accentHover: '#2563eb',
      sidebarBg: '#1e293b',
      sidebarText: '#94a3b8',
      sidebarTextActive: '#3b82f6',
      sidebarActiveBg: 'rgba(59, 130, 246, 0.15)',
      activeNavBg: 'rgba(59, 130, 246, 0.15)',
      cardIconBlueBg: 'rgba(59, 130, 246, 0.15)',

      // Badges
      success: '#22c55e',
      successBg: 'rgba(34, 197, 94, 0.15)',
      successText: '#22c55e',
      warning: '#f59e0b',
      warningBg: 'rgba(245, 158, 11, 0.15)',
      warningText: '#fbbf24',
      danger: '#ef4444',
      dangerBg: 'rgba(239, 68, 68, 0.15)',
      dangerText: '#ef4444',
      infoBg: 'rgba(59, 130, 246, 0.15)',
      infoText: '#60a5fa',
      purpleBg: 'rgba(139, 92, 246, 0.15)',
      purpleText: '#a78bfa',
    };
  }

  // Light Mode (Harmonized with Tenant Admin: #2a75d3, #f0f5fa, #ffffff, #e0e0e0)
  return {
    isDark: false,
    mode: overrideMode,
    setMode,
    toggleTheme,

    // Backgrounds (Matched with Admin Light)
    bg: '#f0f5fa',
    bgColor: '#f0f5fa',
    cardBg: '#ffffff',
    cardBgHover: '#f8fafc',
    cardHeaderBg: '#f8f9fa',
    subtleBg: '#f8f9fa',

    // Text
    text: '#333333',
    textDark: '#333333',
    textSecondary: '#555555',
    textMuted: '#777777',

    // Borders
    border: '#e0e0e0',
    borderColor: '#e0e0e0',
    borderLight: '#f0f5fa',

    // Inputs
    inputBg: '#ffffff',
    inputBorder: '#e0e0e0',
    placeholder: '#999999',

    // Brand Blue / Accent (Matched with Admin #2a75d3)
    primaryBlue: '#2a75d3',
    primaryBlueHover: '#1f5ca8',
    accent: '#2a75d3',
    accentHover: '#1f5ca8',
    sidebarBg: '#ffffff',
    sidebarText: '#777777',
    sidebarTextActive: '#2a75d3',
    sidebarActiveBg: '#eaf3fc',
    activeNavBg: '#eaf3fc',
    cardIconBlueBg: '#eaf3fc',

    // Badges
    success: '#28a745',
    successBg: '#e6f6eb',
    successText: '#28a745',
    warning: '#ffc107',
    warningBg: '#fff8e6',
    warningText: '#b08000',
    danger: '#dc3545',
    dangerBg: '#fcebeb',
    dangerText: '#dc3545',
    infoBg: '#eaf3fc',
    infoText: '#2a75d3',
    purpleBg: '#f3e8ff',
    purpleText: '#7c3aed',
  };
}
