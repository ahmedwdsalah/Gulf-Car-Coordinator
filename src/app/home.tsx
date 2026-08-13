import { View } from 'react-native';
import { useState } from 'react';
import DriverTabs from '../components/DriverTabs';
import HomeScreen from '../components/HomeScreen';
import ProfileScreen from '../components/ProfileScreen';
import OrdersScreen from '../components/OrdersScreen';

export default function HomeRoute() {
  const [activeTab, setActiveTab] = useState('Home');

  return <View style={{ flex: 1, position: 'relative' }}>
    <View style={{ flex: 1, display: activeTab === 'Home' ? 'flex' : 'none' }}><HomeScreen /></View>
    <View style={{ flex: 1, display: activeTab === 'Requests' ? 'flex' : 'none' }}><OrdersScreen /></View>
    <View style={{ flex: 1, display: activeTab === 'Settings' ? 'flex' : 'none' }}><ProfileScreen /></View>
    <View style={{ position: 'absolute', right: 0, bottom: 0, left: 0, zIndex: 10 }}><DriverTabs active={activeTab} onSelect={setActiveTab} /></View>
  </View>;
}
