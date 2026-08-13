import { Stack } from 'expo-router';

export const unstable_settings = { initialRouteName: 'language' };

export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, headerTintColor: '#F7F1E9' }}>
    <Stack.Screen name="language" options={{ title: '' }} />
    <Stack.Screen name="permission" options={{ headerShown: true, title: '', headerBackTitle: '', gestureEnabled: true, headerShadowVisible: false, headerStyle: { backgroundColor: '#1A1612' } }} />
    <Stack.Screen name="login" options={{ title: '' }} />
  </Stack>;
}
