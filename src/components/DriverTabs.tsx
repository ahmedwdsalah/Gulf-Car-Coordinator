import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bill, Gear, Home } from 'reicon-react-native';
import { i18n } from '../lib/i18n';
import { useAppLanguage } from '../lib/onboarding';

const TABS = [
  ['', 'Home'],
  ['', 'Requests'],
  ['', 'Settings'],
] as const;

export default function DriverTabs({ active = 'Timesheet', onSelect }: { active?: string; onSelect?: (label: string) => void }) {
  useAppLanguage();
  return (
    <View style={{ height: 84, flexDirection: 'row', paddingBottom: 10, position: 'relative' }}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(33,28,22,0)', 'rgba(33,28,22,0.72)', '#211C16', '#211C16']}
        locations={[0, 0.28, 0.58, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />
      {TABS.map(([icon, label]) => {
        const selected = label === active;
        return (
          <Pressable key={label} onPress={() => onSelect?.(label)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            {label === 'Home' ? <Home size={24} color="#F7F1E9" weight={selected ? 'Filled' : 'Outline'} /> : label === 'Requests' ? <Bill size={24} color="#F7F1E9" weight={selected ? 'Filled' : 'Outline'} /> : <Gear size={24} color="#F7F1E9" weight={selected ? 'Filled' : 'Outline'} />}
            <Text style={{ color: '#F7F1E9', fontSize: 10, fontWeight: selected ? '700' : '500' }}>{i18n.t(label.toLowerCase())}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
