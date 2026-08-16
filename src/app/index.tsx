import { Href, router } from 'expo-router';
import LanguageScreen from '../components/LanguageScreen';
import LoginScreen from '../components/LoginScreen';
import PermissionScreen from '../components/PermissionScreen';
import { useOnboardingStore } from '../lib/onboarding';
import HomeRoute from './home';

export default function StartupRoute() {
  const language = useOnboardingStore((state) => state.language);
  const hydrated = useOnboardingStore((state) => state.hydrated);
  const permissionSeen = useOnboardingStore((state) => state.permissionSeen);
  const signedIn = useOnboardingStore((state) => state.signedIn);
  const setPermissionSeen = useOnboardingStore((state) => state.setPermissionSeen);

  if (!hydrated) return null;
  if (signedIn) return <HomeRoute />;
  if (!language) return <LanguageScreen />;
  if (!permissionSeen) {
    return <PermissionScreen onDone={async () => { await setPermissionSeen(); router.replace('/login' as Href); }} />;
  }

  return <LoginScreen onDone={() => void router.replace('/home' as Href)} />;
}
