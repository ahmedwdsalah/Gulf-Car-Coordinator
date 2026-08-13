import { Pressable, Text, View } from 'react-native';
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
    <View style={{ height: 84, flexDirection: 'row', backgroundColor: '#211C16', paddingBottom: 10 }}>
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
