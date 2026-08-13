import { Href, router } from 'expo-router';
import { useEffect, useState } from 'react';
import SplashScreen from '../components/SplashScreen';
import { useOnboardingStore } from '../lib/onboarding';

export default function StartupRoute() {
  const [ready, setReady] = useState(false);
  const language = useOnboardingStore((state) => state.language);
  const hydrated = useOnboardingStore((state) => state.hydrated);
  const permissionSeen = useOnboardingStore((state) => state.permissionSeen);

  useEffect(() => {
    const finish = setTimeout(() => setReady(true), 4200);
    return () => clearTimeout(finish);
  }, []);
  useEffect(() => {
    if (hydrated && ready) {
      router.replace((permissionSeen ? '/login' : language ? '/permission' : '/language') as Href, { withAnchor: true });
    }
  }, [hydrated, language, permissionSeen, ready]);

  return <SplashScreen />;
}
