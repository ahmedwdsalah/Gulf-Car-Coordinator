import { Href, router } from 'expo-router';
import LoginScreen from '../../components/LoginScreen';

export default function LoginRoute() {
  return <LoginScreen onDone={() => void router.replace('/home' as Href)} />;
}
