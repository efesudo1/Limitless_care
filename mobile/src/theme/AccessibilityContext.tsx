import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AccessibilityPrefs = {
  highContrast: boolean;
  fontScale: 1 | 1.3 | 1.6;
  autoSpeakOnScreenEnter: boolean;
};

const DEFAULT_PREFS: AccessibilityPrefs = {
  highContrast: false,
  fontScale: 1,
  autoSpeakOnScreenEnter: false,
};

const STORAGE_KEY = 'lc.accessibility.prefs.v1';

type Ctx = {
  prefs: AccessibilityPrefs;
  setPrefs: (next: Partial<AccessibilityPrefs>) => Promise<void>;
};

const AccessibilityCtx = createContext<Ctx | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefsState] = useState<AccessibilityPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setPrefsState({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
      } catch {
        // sessiz
      }
    })();
  }, []);

  const setPrefs = useCallback(async (next: Partial<AccessibilityPrefs>) => {
    setPrefsState((cur) => {
      const merged = { ...cur, ...next };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged)).catch(() => undefined);
      return merged;
    });
  }, []);

  const value = useMemo(() => ({ prefs, setPrefs }), [prefs, setPrefs]);
  return <AccessibilityCtx.Provider value={value}>{children}</AccessibilityCtx.Provider>;
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityCtx);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}

// Yüksek kontrast ihtiyacı için palette overrider — geri uyumluluk için
// `colors`'ı doğrudan değiştirmiyoruz; ekranlar tercih ederse useAccessibility().prefs.highContrast
// ile manuel olarak yüksek kontrast renkleri kullanabilir.
export const highContrastColors = {
  background: '#000000',
  surface: '#000000',
  surfaceMuted: '#1A1A1A',
  primary: '#FFEB00',
  primaryDark: '#FFC800',
  primaryContrast: '#000000',
  textPrimary: '#FFFFFF',
  textSecondary: '#FFFF00',
  textMuted: '#CCCCCC',
  textOnPrimary: '#000000',
  border: '#FFFFFF',
  focusRing: '#FFEB00',
};
