import { DarkTheme, DefaultTheme, LocaleDirContext, ThemeProvider } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { AppState, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreenNative from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { useNotificationObserver } from '../lib/notifications';
import '../lib/tracking';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { applyLanguageDirection, useAppLanguage, useOnboardingStore } from '../lib/onboarding';
import { focusManager, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { AuthError, resolveProvisioning } from '../lib/auth';
import { i18n } from '../lib/i18n';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (!(error instanceof AuthError) || error.status !== 401) return;
      queryClient.removeQueries();
      useOnboardingStore.getState().setSignedIn(false);
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnReconnect: false,
    },
  },
});

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
    focusManager.setFocused(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
    return () => {
      subscription.remove();
      focusManager.setFocused(undefined);
    };
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const boot = async () => {
      const language = useOnboardingStore.getState().language ?? 'ar';
      if (applyLanguageDirection(language)) return;
      const initialUrl = await Linking.getInitialURL().catch(() => null);
      if (initialUrl?.startsWith('gulfcar://provision')) {
        await resolveProvisioning(initialUrl).catch(() => undefined);
      }
      if (!cancelled) setReady(true);
    };
    void boot();
    return () => { cancelled = true; };
  }, [hydrated]);
  useEffect(() => {
    if (ready) SplashScreenNative.hide();
  }, [ready]);
  useEffect(() => {
    if (!ready) return;
    const handleUrl = (url: string) => {
      if (!url.startsWith('gulfcar://provision')) return;
      void resolveProvisioning(url).catch(() => undefined);
    };
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, [ready]);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <LocaleDirContext.Provider value={language === 'ar' ? 'rtl' : 'ltr'}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <RootNavigator />
        </ThemeProvider>
      </LocaleDirContext.Provider>
        <StatusBar style="light" />
    </SafeAreaProvider>
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={errorStyles.container}>
      <Text style={errorStyles.title}>{i18n.t('unexpectedError')}</Text>
      <Pressable accessibilityRole="button" onPress={() => void retry()} style={errorStyles.button}>
        <Text style={errorStyles.buttonText}>{i18n.t('tryAgain')}</Text>
      </Pressable>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1612', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#F7F1E9', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  button: { minHeight: 48, marginTop: 20, paddingHorizontal: 28, borderRadius: 24, backgroundColor: '#C89A63', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#1A1612', fontSize: 16, fontWeight: '700' },
});

function RootNavigator() {
  useNotificationObserver();
  return (
    <Stack screenOptions={{ headerShown: false, headerTintColor: '#F7F1E9' }}>
      <Stack.Screen name="index" options={{ title: '' }} />
      <Stack.Screen name="home" options={{ title: '', animation: 'fade' }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
    </Stack>
  );
}
