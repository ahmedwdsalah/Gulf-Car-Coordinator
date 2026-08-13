import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { c } from '../lib/colors';

export default function SheetFooter() {
  return (
    <SafeAreaView style={{
      paddingHorizontal: 16,
      paddingBottom: 8,
      paddingTop: 8,
      experimental_backgroundImage:
        'linear-gradient(to bottom, transparent, rgba(0,0,0,0.40))',
    }}>
      <View style={{
        backgroundColor: c.surfaceContainerHighest,
        borderRadius: 28,
        borderCurve: 'continuous',
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
        boxShadow: '0 1px 8px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <View style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: c.onSurfaceVariant,
        }} />
        <Text style={{ fontSize: 16, color: c.onSurfaceVariant }}>
          Search here
        </Text>
      </View>
    </SafeAreaView>
  );
}
