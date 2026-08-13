import { Href, router } from 'expo-router';
import PermissionScreen from '../../components/PermissionScreen';
import { useOnboardingStore } from '../../lib/onboarding';

export default function PermissionRoute() {
  const setPermissionSeen = useOnboardingStore((state) => state.setPermissionSeen);
  return <PermissionScreen onDone={async () => { await setPermissionSeen(); router.replace('/login' as Href); }} />;
}
