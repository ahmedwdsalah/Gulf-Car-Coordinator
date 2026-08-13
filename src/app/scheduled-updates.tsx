import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Compass2, ShieldTick } from 'reicon-react-native';
import { i18n } from '../lib/i18n';

const plans = [
  { icon: Compass2, phase: '01', window: 'scheduledUpdatesNext', title: 'routingNavigationSdk', description: 'routingNavigationSdkDescription' },
  { icon: ShieldTick, phase: '02', window: 'scheduledUpdatesFollowing', title: 'stabilityImprovements', description: 'stabilityImprovementsDescription' },
] as const;

export default function ScheduledUpdatesScreen() {
  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: i18n.t('scheduledUpdates'), headerShown: true, headerBackTitle: '', headerTitleStyle: styles.headerTitle, headerStyle: styles.header, gestureEnabled: true, headerShadowVisible: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.roadmap}>
          <View style={styles.timeline} />
          {plans.map(({ icon: Icon, phase, window, title, description }, index) => (
            <View key={title} style={[styles.milestone, index > 0 && styles.milestoneSpacing]}>
              <View style={styles.marker}><Icon size={24} color="#C89A63" weight="Outline" /></View>
              <View style={styles.planContent}>
                <View style={styles.planMeta}><Text style={styles.phase}>{phase}</Text><Text style={styles.window}>{i18n.t(window)}</Text></View>
                <Text style={styles.planTitle}>{i18n.t(title)}</Text>
                <Text style={styles.planText}>{i18n.t(description)}</Text>
                <View style={styles.statusRow}><View style={styles.statusDot} /><Text style={styles.statusText}>{i18n.t('scheduledUpdatesInPlanning')}</Text></View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#1A1612' },
  header: { backgroundColor: '#1A1612' },
  headerTitle: { color: '#F7F1E9', fontWeight: '700' },
  content: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 64 },
  roadmap: { position: 'relative' },
  timeline: { position: 'absolute', top: 24, bottom: 24, start: 23, width: 1, backgroundColor: '#4D4034' },
  milestone: { flexDirection: 'row', alignItems: 'flex-start' },
  milestoneSpacing: { marginTop: 46 },
  marker: { width: 47, height: 47, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  planContent: { flex: 1, paddingStart: 20, paddingTop: 2 },
  planMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  phase: { color: '#6F6257', fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  window: { color: '#C89A63', fontSize: 12, fontWeight: '700', textAlign: 'right' },
  planTitle: { color: '#F7F1E9', fontSize: 22, lineHeight: 27, fontWeight: '800', letterSpacing: -0.4, marginTop: 11, textAlign: 'left' },
  planText: { color: '#A99E92', fontSize: 15, lineHeight: 23, marginTop: 10, textAlign: 'left' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 17 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C89A63' },
  statusText: { color: '#8C8175', fontSize: 12, fontWeight: '600', textAlign: 'left' },
});
