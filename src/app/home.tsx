import { View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import DriverTabs from '../components/DriverTabs';
import HomeScreen from '../components/HomeScreen';
import ProfileScreen from '../components/ProfileScreen';
import OrdersScreen from '../components/OrdersScreen';
import { useBootstrapQuery, useRegisterPushTokenMutation } from '../lib/auth';
import { registerForPushNotificationsAsync } from '../lib/notifications';
import { startLocationTrackingAsync } from '../lib/tracking';

export default function HomeRoute() {
  const bootstrap = useBootstrapQuery();
  const pushToken = useRegisterPushTokenMutation();
  const pushRegistrationStarted = useRef(false);
  const trackingStartStarted = useRef(false);
  useEffect(() => {
    if (pushRegistrationStarted.current) return;
    pushRegistrationStarted.current = true;
    void registerForPushNotificationsAsync().then((token) => {
      if (token) pushToken.mutate(token);
    });

    const subscription = Notifications.addPushTokenListener(({ data }) => {
      pushToken.mutate(data.toString());
    });

    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!bootstrap.data || trackingStartStarted.current) return;
    trackingStartStarted.current = true;
    void startLocationTrackingAsync().catch(() => {
      trackingStartStarted.current = false;
    });
  }, [bootstrap.data]);
  const [activeTab, setActiveTab] = useState('Home');
  const tabStyle = { position: 'absolute' as const, top: 0, right: 0, bottom: 0, left: 0 };

  return <View style={{ flex: 1, position: 'relative' }}>
    <View pointerEvents={activeTab === 'Home' ? 'auto' : 'none'} style={[tabStyle, { opacity: activeTab === 'Home' ? 1 : 0 }]}><HomeScreen /></View>
    <View pointerEvents={activeTab === 'Requests' ? 'auto' : 'none'} style={[tabStyle, { opacity: activeTab === 'Requests' ? 1 : 0 }]}><OrdersScreen /></View>
    <View pointerEvents={activeTab === 'Settings' ? 'auto' : 'none'} style={[tabStyle, { opacity: activeTab === 'Settings' ? 1 : 0 }]}><ProfileScreen /></View>
    <View style={{ position: 'absolute', right: 0, bottom: 0, left: 0, zIndex: 10 }}><DriverTabs active={activeTab} onSelect={setActiveTab} /></View>
  </View>;
}
