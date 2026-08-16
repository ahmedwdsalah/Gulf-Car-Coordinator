import { create } from 'zustand';
import * as FileSystem from 'expo-file-system/legacy';
import { reloadAppAsync } from 'expo';
import { I18nManager, Platform } from 'react-native';
import { setAppLanguage } from './i18n';
import { hasStoredSession } from './auth';

const LANGUAGE_KEY = 'onboarding-language';
const LANGUAGE_FILE = `${FileSystem.documentDirectory}${LANGUAGE_KEY}.txt`;
const PERMISSION_KEY = 'onboarding-permission';
const PERMISSION_FILE = `${FileSystem.documentDirectory}${PERMISSION_KEY}.txt`;

export function applyLanguageDirection(language: 'en' | 'ar') {
  const isArabic = language === 'ar';
  setAppLanguage(language);
  if (Platform.OS !== 'web' && isArabic !== I18nManager.isRTL) {
    I18nManager.allowRTL(isArabic);
    I18nManager.forceRTL(isArabic);
    void reloadAppAsync('Language direction changed');
    return true;
  }
  return false;
}

export async function restartWithLanguage(language: 'en' | 'ar') {
  await FileSystem.writeAsStringAsync(LANGUAGE_FILE, language);
  return applyLanguageDirection(language);
}

type OnboardingState = {
  language: 'en' | 'ar' | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  notificationsSkipped: boolean;
  permissionSeen: boolean;
  signedIn: boolean;
  setSignedIn: (signedIn: boolean) => void;
  setLanguage: (language: 'en' | 'ar') => Promise<void>;
  skipNotifications: () => void;
  setPermissionSeen: () => Promise<void>;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  language: null,
  hydrated: false,
  hydrate: async () => {
    try {
      const [languageInfo, permissionInfo, signedIn] = await Promise.all([
        FileSystem.getInfoAsync(LANGUAGE_FILE),
        FileSystem.getInfoAsync(PERMISSION_FILE),
        hasStoredSession(),
      ]);
      const language = languageInfo.exists
        ? await FileSystem.readAsStringAsync(LANGUAGE_FILE)
        : null;
      const permissionSeen = permissionInfo.exists
        ? await FileSystem.readAsStringAsync(PERMISSION_FILE)
        : null;
      const selectedLanguage = language === 'en' || language === 'ar' ? language : null;
      setAppLanguage(selectedLanguage ?? 'ar');
      set({
        language: selectedLanguage,
        permissionSeen: permissionSeen === 'true',
        signedIn,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },
  notificationsSkipped: false,
  permissionSeen: false,
  signedIn: false,
  setSignedIn: (signedIn) => set({ signedIn }),
  setLanguage: async (language) => {
    await FileSystem.writeAsStringAsync(LANGUAGE_FILE, language);
    setAppLanguage(language);
    set({ language });
  },
  skipNotifications: () => set({ notificationsSkipped: true }),
  setPermissionSeen: async () => {
    await FileSystem.writeAsStringAsync(PERMISSION_FILE, 'true');
    set({ permissionSeen: true });
  },
}));

export function useAppLanguage() {
  return useOnboardingStore((state) => state.language) ?? 'ar';
}
