import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreenNative from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import SheetFooter from '../components/SheetFooter';
import SplashScreen from '../components/SplashScreen';

LogBox.ignoreAllLogs(true);

SplashScreenNative.preventAutoHideAsync();
SplashScreenNative.setOptions({ fade: true, duration: 450 });

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hideNative = setTimeout(() => {
      SplashScreenNative.hideAsync();
    }, 1400);
    const showApp = setTimeout(() => {
      setReady(true);
    }, 3800);
    return () => {
      clearTimeout(hideNative);
      clearTimeout(showApp);
    };
  }, []);

  if (!ready) {
    return (
      <>
        <SplashScreen />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <>
      <ThemeProvider value={DarkTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ title: '' }} />
          <Stack.Screen
            name="sheet"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.1, 0.4, 1],
              sheetInitialDetentIndex: 1,
              sheetCornerRadius: 36,
              sheetElevation: 64,
              sheetLargestUndimmedDetentIndex: 1,
              unstable_sheetFooter: () => <SheetFooter />,
            }}
          />
        </Stack>
      </ThemeProvider>
      <StatusBar style="light" />
    </>
  );
}
