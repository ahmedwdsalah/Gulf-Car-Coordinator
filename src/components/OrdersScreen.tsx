import React from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapAlt, ClipboardText, Clock, Location, TickCircle, PlayCircle, CloseCircle, Clipboard, Archive } from 'reicon-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MODES, type Mode, type Order } from '../lib/orders';
import { useOrdersQuery } from '../lib/auth';
import { i18n } from '../lib/i18n';
import { useAppLanguage } from '../lib/onboarding';

const modeKey = (mode: Mode) => mode === 'In progress' ? 'inProgress' : mode.toLowerCase();

export default function OrdersScreen() {
  const language = useAppLanguage();
  const [mode, setMode] = React.useState<Mode>('Assigned');
  const requests = useOrdersQuery(language === 'ar' ? 'ar' : 'en', mode);
  const orders = requests.data ?? [];
  const renderOrder = React.useCallback(({ item }: { item: Order }) => <OrderCard {...item} mode={mode} />, [mode]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{i18n.t('myAssignedRequests')}</Text>
      <View style={styles.modeRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.segmented, language === 'ar' && styles.segmentedArabic]}>
          {MODES.map((item) => (
            <Pressable key={item} onPress={() => setMode(item)} style={[styles.segment, mode === item && styles.segmentActive]}>
              <Text style={[styles.segmentText, mode === item && styles.segmentTextActive]}>{i18n.t(modeKey(item))}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <LinearGradient pointerEvents="none" colors={language === 'ar' ? ['rgba(26,22,18,0)', '#1A1612'] : ['#1A1612', 'rgba(26,22,18,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.modeEdgeFade, styles.modeEdgeFadeLeft]} />
        <LinearGradient pointerEvents="none" colors={language === 'ar' ? ['#1A1612', 'rgba(26,22,18,0)'] : ['rgba(26,22,18,0)', '#1A1612']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.modeEdgeFade, styles.modeEdgeFadeRight]} />
      </View>
      {requests.isPending ? <View style={styles.empty}><ActivityIndicator size="large" color="#C89A63" /></View> : orders.length ? <View style={styles.listArea}><FlatList data={orders} renderItem={renderOrder} keyExtractor={(item) => String(item.id)} showsVerticalScrollIndicator={false} contentContainerStyle={styles.list} style={styles.listViewport} /><LinearGradient pointerEvents="none" colors={['rgba(26,22,18,0)', '#1A1612']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.listBottomFade} /></View> : <View style={styles.empty}><ClipboardText size={52} color="#A99E92" weight="Outline" /><Text style={styles.emptyTitle}>{i18n.t('noModeOrders', { mode: i18n.t(modeKey(mode)) })}</Text></View>}
    </SafeAreaView>
  );
}

const OrderCard = React.memo(function OrderCard({ name, time, from, to, fromCoordinate, toCoordinate, mode }: Order & { mode: Mode }) {
  const StatusIcon = mode === 'All' ? Clipboard : mode === 'Assigned' ? Archive : mode === 'In progress' ? PlayCircle : mode === 'Completed' ? TickCircle : CloseCircle;
  const statusColor = mode === 'All' ? '#C89A63' : mode === 'Assigned' ? '#D99A4A' : mode === 'In progress' ? '#5BB6D8' : mode === 'Completed' ? '#67C587' : '#D86D6D';
  const openRoute = () => Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${fromCoordinate.latitude},${fromCoordinate.longitude}&destination=${toCoordinate.latitude},${toCoordinate.longitude}&travelmode=driving`);

  return (
    <View style={styles.card}>
      <View pointerEvents="none" style={styles.cardInnerBlackStroke} />
      <View pointerEvents="none" style={styles.cardInnerWhiteStroke} />
      <View style={styles.cardHeader}>
        <View style={styles.nameGroup}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <View style={styles.statusRow}>
            <StatusIcon size={14} color={statusColor} weight="Outline" />
            <Text style={[styles.statusText, { color: statusColor }]}>{i18n.t(modeKey(mode))}</Text>
          </View>
        </View>
        <View style={styles.timeRow}>
          <Clock size={15} color="#C89A63" weight="Outline" />
          <Text style={styles.time}>{time}</Text>
        </View>
      </View>

      <View style={styles.route}>
        <View style={styles.routeStops}>
          <View style={styles.stopRow}>
            <View style={styles.stopIcon}><RouteBadge type="from" /></View>
            <Text style={styles.origin} numberOfLines={1}>{from}</Text>
          </View>
          <View style={styles.connector} />
          <View style={styles.stopRow}>
            <View style={styles.stopIcon}><RouteBadge type="to" /></View>
            <Text style={styles.destination} numberOfLines={1}>{to}</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={i18n.t('openRoute')} onPress={() => void openRoute()} style={styles.mapButton}>
          <MapAlt size={19} color="#1A1612" weight="Outline" />
        </Pressable>
      </View>
    </View>
  );
});

function RouteBadge({ type }: { type: 'from' | 'to' }) {
  return (
    <View style={[styles.routeBadge, type === 'to' ? styles.routeBadgeTo : styles.routeBadgeFrom]}>
      <View style={type === 'to' ? styles.routeBadgeDestination : styles.routeBadgeOrigin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1612', paddingHorizontal: 18 },
  title: { color: '#F7F1E9', fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 14 },
  modeRow: { height: 34, marginTop: 24, marginBottom: 18, marginHorizontal: -18, overflow: 'hidden' },
  modeEdgeFade: { position: 'absolute', top: 0, bottom: 0, width: 40 },
  modeEdgeFadeLeft: { left: 0 },
  modeEdgeFadeRight: { right: 0 },
  segmented: { gap: 8, paddingHorizontal: 22, alignItems: 'center' },
  segmentedArabic: { paddingLeft: 20 },
  segment: { minHeight: 34, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#2A241D' },
  segmentActive: { backgroundColor: '#C89A63' },
  segmentText: { color: '#A99E92', fontSize: 13, fontWeight: '700' },
  segmentTextActive: { color: '#1A1612' },
  list: { paddingBottom: 100 },
  listArea: { flex: 1, position: 'relative' },
  listViewport: { marginHorizontal: -18 },
  listBottomFade: { position: 'absolute', right: 0, bottom: 0, left: 0, height: 150 },
  loader: { paddingVertical: 20 },
  card: { minHeight: 150, borderRadius: 16, backgroundColor: '#211C16', paddingHorizontal: 16, paddingVertical: 15, marginHorizontal: 12, marginBottom: 12, shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  cardInnerBlackStroke: { position: 'absolute', top: 1, right: 1, bottom: 1, left: 1, borderWidth: 1, borderColor: 'rgba(0,0,0,0.18)', borderRadius: 15 },
  cardInnerWhiteStroke: { position: 'absolute', top: 2, right: 2, bottom: 2, left: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  nameGroup: { flex: 1 },
  name: { color: '#F7F1E9', fontSize: 17, lineHeight: 21, fontWeight: '700', textAlign: 'left' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  statusText: { fontSize: 12, fontWeight: '700', textAlign: 'left' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  time: { color: '#E8DED2', fontSize: 15, lineHeight: 21, fontWeight: '700' },
  route: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13 },
  routeStops: { flex: 1, gap: 20 },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stopIcon: { width: 18, alignItems: 'center' },
  routeBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F7F1E9' },
  routeBadgeFrom: { backgroundColor: '#1A1612' },
  routeBadgeTo: { backgroundColor: '#C89A63' },
  routeBadgeOrigin: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#8C8175' },
  routeBadgeDestination: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1A1612', borderWidth: 2, borderColor: '#F7F1E9' },
  connector: { position: 'absolute', left: 8.5, top: 17, width: 1, height: 28, backgroundColor: '#A7B5B8' },
  origin: { flex: 1, color: '#A99E92', fontSize: 14, lineHeight: 19, textAlign: 'left' },
  destination: { flex: 1, color: '#E8DED2', fontSize: 15, lineHeight: 20, fontWeight: '700', textAlign: 'left' },
  mapButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#C89A63', alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 0 },
  emptyTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginTop: 18, textAlign: 'center' },
  emptyText: { color: '#698087', fontSize: 14, marginTop: 5 },
});
