import { DarkTheme, DefaultTheme, LocaleDirContext, ThemeProvider } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreenNative from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { useNotificationObserver } from '../lib/notifications';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { applyLanguageDirection, useAppLanguage, useOnboardingStore } from '../lib/onboarding';

SplashScreenNative.preventAutoHideAsync();
SplashScreenNative.setOptions({ fade: true, duration: 450 });

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrated = useOnboardingStore((state) => state.hydrated);
  const hydrate = useOnboardingStore((state) => state.hydrate);
  const [ready, setReady] = useState(false);
  const language = useAppLanguage();

  useEffect(() => { void hydrate(); }, [hydrate]);
  useEffect(() => {
    if (!hydrated) return;
    const language = useOnboardingStore.getState().language ?? 'ar';
    if (!applyLanguageDirection(language)) setReady(true);
  }, [hydrated]);
  useEffect(() => {
    if (ready) SplashScreenNative.hide();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <LocaleDirContext.Provider value={language === 'ar' ? 'rtl' : 'ltr'}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <RootNavigator />
        </ThemeProvider>
      </LocaleDirContext.Provider>
        <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  useNotificationObserver();
  return (
    <Stack screenOptions={{ headerShown: false, headerTintColor: '#F7F1E9' }}>
      <Stack.Screen name="index" options={{ title: '' }} />
      <Stack.Screen name="home" options={{ title: '' }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
    </Stack>
  );
}
