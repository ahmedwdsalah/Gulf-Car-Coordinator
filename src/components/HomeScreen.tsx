import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import * as ExpoLocation from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Archive, Arrow, Bell, Clock, Location, MapAlt, Power, WifiOff } from 'reicon-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ASSIGNED, localizeOrder, type Order } from '../lib/orders';
import { i18n } from '../lib/i18n';
import { useAppLanguage } from '../lib/onboarding';

const REGION = {
  latitude: 52,
  longitude: -105,
  latitudeDelta: 45,
  longitudeDelta: 70,
};

const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#eaf2ee' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#84979a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5faf8' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#cbded8' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#aee6ef' }] },
];

export default function HomeScreen() {
  const language = useAppLanguage();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const mapRef = React.useRef<MapView>(null);
  const [isOnline, setIsOnline] = React.useState(false);
  const assigned = ASSIGNED.map((order) => localizeOrder(order, language));

  const showCurrentLocation = async () => {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== ExpoLocation.PermissionStatus.GRANTED) return;
    const position = await ExpoLocation.getLastKnownPositionAsync();
    if (!position) return;
    mapRef.current?.animateCamera({ center: position.coords, zoom: 15 }, { duration: 500 });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.dateRow}>
          <Text style={styles.date}>{i18n.t('homeDate')}</Text>
          <View style={styles.headerActions}>
            <Pressable hitSlop={12} onPress={() => void showCurrentLocation()}>
              <Location size={25} color="#FFFFFF" weight="Outline" />
            </Pressable>
            <Pressable hitSlop={12}>
              <Bell size={25} color="#FFFFFF" weight="Outline" />
            </Pressable>
          </View>
        </View>
        <Text style={styles.greeting}>{i18n.t('greeting')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.mapArea}>
        <View style={StyleSheet.absoluteFill}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFill}
            initialRegion={REGION}
            customMapStyle={MAP_STYLE}
            rotateEnabled={false}
            pitchEnabled={false}
            toolbarEnabled={false}
            showsUserLocation
            showsMyLocationButton={false}
          />
          <LinearGradient
            pointerEvents="none"
            colors={[
              '#1A1612',
              '#1A1612',
              'rgba(26,22,18,0.98)',
              'rgba(26,22,18,0.92)',
              'rgba(26,22,18,0.82)',
              'rgba(26,22,18,0.68)',
              'rgba(26,22,18,0.52)',
              'rgba(26,22,18,0.36)',
              'rgba(26,22,18,0.22)',
              'rgba(26,22,18,0.10)',
              'rgba(26,22,18,0.03)',
              'rgba(26,22,18,0.015)',
              'rgba(26,22,18,0)',
              'rgba(26,22,18,0)',
              'rgba(26,22,18,0.015)',
              'rgba(26,22,18,0.03)',
              'rgba(26,22,18,0.10)',
              'rgba(26,22,18,0.22)',
              'rgba(26,22,18,0.36)',
              'rgba(26,22,18,0.52)',
              'rgba(26,22,18,0.68)',
              'rgba(26,22,18,0.82)',
              'rgba(26,22,18,0.92)',
              'rgba(26,22,18,0.98)',
              '#1A1612',
              '#1A1612',
              '#1A1612',
              '#1A1612',
            ]}
            locations={[0, 0.006, 0.012, 0.018, 0.024, 0.03, 0.036, 0.042, 0.048, 0.054, 0.06, 0.064, 0.068, 0.072, 0.928, 0.932, 0.936, 0.94, 0.946, 0.952, 0.958, 0.964, 0.97, 0.976, 0.982, 0.988, 0.994, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            dither
            style={StyleSheet.absoluteFill}
          />
        </View>
        <View style={[styles.onlineButtonAnchor, !isOnline && styles.onlineButtonAnchorCentered]} pointerEvents="box-none">
          <Pressable
            style={[styles.onlineButton, isOnline && styles.onlineButtonActive]}
            onPress={() => {
              setIsOnline((value) => !value);
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            {isOnline ? <Power size={26} color="#FFFFFF" weight="Outline" /> : <WifiOff size={18} color="#000000" weight="Outline" />}
            {!isOnline && <Text style={styles.onlineButtonText}>{i18n.t('goOnline')}</Text>}
          </Pressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} directionalLockEnabled contentContainerStyle={styles.cards} style={styles.cardsViewport}>
        <View style={styles.cardsRow}>
          <VisitCard width={width - 68} {...assigned[0]} />
          <VisitCard width={width - 68} {...assigned[1]} />
          <EmptyRideCard width={width - 68} />
        </View>
      </ScrollView>
      <View style={styles.weekHeader}>
        <View>
          <Text style={styles.weekTitle}>{i18n.t('thisWeek')}</Text>
          <Text style={styles.weekDates}>{i18n.t('weekDates')}</Text>
        </View>
      </View>
      <View style={styles.completedRow}>
        <Text style={styles.completedLabel}>{i18n.t('totalCompletedTime')}</Text>
        <Text style={styles.completedValue}>00:00</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.notificationsSection}>
        <Text style={styles.notificationsGroupTitle}>{i18n.t('today')}</Text>
        <NotificationRow title={i18n.t('notificationRideAssigned')} message={i18n.t('notificationRideAssignedMessage')} time="10:42" />
        <NotificationRow title={i18n.t('notificationRouteReady')} message={i18n.t('notificationRouteReadyMessage')} time="09:18" />
        <Text style={[styles.notificationsGroupTitle, styles.earlierTitle]}>{i18n.t('earlier')}</Text>
        <NotificationRow title={i18n.t('notificationShiftStarted')} message={i18n.t('notificationShiftStartedMessage')} time="Yesterday" />
      </View>
      </ScrollView>
    </View>
  );
}

function VisitCard({ width, name, time, from, to, fromCoordinate, toCoordinate }: Order & { width: number }) {
  const openRoute = () => Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${fromCoordinate.latitude},${fromCoordinate.longitude}&destination=${toCoordinate.latitude},${toCoordinate.longitude}&travelmode=driving`);

  return (
    <View style={[styles.visitCard, { width }]}>
      <View pointerEvents="none" style={styles.cardInnerBlackStroke} />
      <View pointerEvents="none" style={styles.cardInnerWhiteStroke} />
      <View style={styles.visitHeader}>
        <View style={styles.visitNameGroup}>
          <Text style={styles.visitName} numberOfLines={1}>{name}</Text>
          <View style={styles.visitStatusRow}>
            <Archive size={14} color="#D99A4A" weight="Outline" />
            <Text style={styles.visitStatus}>{i18n.t('assigned')}</Text>
          </View>
        </View>
        <View style={styles.visitTimeRow}>
          <Clock size={15} color="#C89A63" weight="Outline" />
          <Text style={styles.visitTime}>{time}</Text>
        </View>
      </View>
      <View style={styles.route}>
        <View style={styles.routeStops}>
          <View style={styles.routeStopRow}>
            <View style={styles.routeStopIcon}><View style={styles.routeOriginDot} /></View>
            <Text style={styles.routeOrigin} numberOfLines={1}>{from}</Text>
          </View>
          <View style={styles.routeConnector} />
          <View style={styles.routeStopRow}>
            <View style={styles.routeStopIcon}><Location size={18} color="#C89A63" weight="Outline" /></View>
            <Text style={styles.routeDestination} numberOfLines={1}>{to}</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={i18n.t('openRoute')} onPress={() => void openRoute()} style={styles.routeButton}>
          <MapAlt size={19} color="#1A1612" weight="Outline" />
        </Pressable>
      </View>
    </View>
  );
}

function EmptyRideCard({ width }: { width: number }) {
  return <View style={[styles.emptyRideCard, { width }]}><Text style={styles.emptyRideText}>{i18n.t('noScheduledRides')}</Text></View>;
}

function NotificationRow({ title, message, time }: { title: string; message: string; time: string }) {
  return (
    <View style={styles.notificationRow}>
      <Arrow size={20} color="#C89A63" weight="Outline" />
      <View style={styles.notificationCopy}>
        <Text style={styles.notificationTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.notificationMessage} numberOfLines={1}>{message}</Text>
      </View>
      <Text style={styles.notificationTime}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1612' },
  header: { height: 154, paddingHorizontal: 18, backgroundColor: '#1A1612' },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  date: { color: '#A99E92', fontSize: 14, fontWeight: '500', textAlign: 'left' },
  greeting: { color: '#F7F1E9', fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.7, textAlign: 'left' },
  content: { paddingBottom: 120 },
  mapArea: { height: 550, overflow: 'visible' },
  onlineButtonAnchor: { position: 'absolute', left: 16, bottom: 75 },
  onlineButtonAnchorCentered: { left: 0, right: 0, alignItems: 'center' },
  onlineButton: { height: 48, paddingHorizontal: 16, borderRadius: 25, borderWidth: 1, borderColor: '#D9DDD9', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#173947', shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  onlineButtonActive: { width: 48, paddingHorizontal: 0, backgroundColor: '#32882A', borderColor: '#32882A' },
  onlineButtonText: { color: '#55727A', fontSize: 16, fontWeight: '800', textAlign: 'left' },
  onlineButtonTextActive: { color: '#FFFFFF' },
  cardsViewport: { height: 162, marginTop: -64, zIndex: 3, elevation: 3 },
  cards: { gap: 10, paddingStart: 16, paddingEnd: 48 },
  cardsRow: { flexDirection: 'row', gap: 10 },
  visitCard: { minHeight: 150, borderRadius: 16, backgroundColor: '#211C16', paddingHorizontal: 16, paddingVertical: 15, shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  cardInnerBlackStroke: { position: 'absolute', top: 1, right: 1, bottom: 1, left: 1, borderWidth: 1, borderColor: 'rgba(0,0,0,0.18)', borderRadius: 15 },
  cardInnerWhiteStroke: { position: 'absolute', top: 2, right: 2, bottom: 2, left: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 14 },
  visitHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  visitNameGroup: { flex: 1 },
  visitStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  visitStatus: { color: '#D99A4A', fontSize: 12, fontWeight: '700', textAlign: 'left' },
  visitTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  visitTime: { color: '#E8DED2', fontSize: 15, lineHeight: 21, fontWeight: '700' },
  route: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13 },
  routeStops: { flex: 1, gap: 20 },
  routeStopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeStopIcon: { width: 18, alignItems: 'center' },
  routeOriginDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: '#8C8175' },
  routeConnector: { position: 'absolute', left: 8.5, top: 17, width: 1, height: 28, backgroundColor: '#A7B5B8' },
  routeOrigin: { flex: 1, color: '#A99E92', fontSize: 14, lineHeight: 19, textAlign: 'left' },
  routeDestination: { flex: 1, color: '#E8DED2', fontSize: 15, lineHeight: 20, fontWeight: '700', textAlign: 'left' },
  routeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#C89A63', alignItems: 'center', justifyContent: 'center' },
  visitName: { color: '#F7F1E9', fontSize: 17, lineHeight: 21, fontWeight: '700', textAlign: 'left' },
  emptyRideCard: { height: 136, borderRadius: 16, backgroundColor: '#F4F3EE', borderWidth: 1, borderColor: '#D9DDD9', alignItems: 'center', justifyContent: 'center' },
  emptyRideText: { color: '#698087', fontSize: 15, fontWeight: '700' },
  visitDescription: { color: '#55727A', fontSize: 15, marginTop: 4 },
  weekHeader: { marginHorizontal: 18, marginTop: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekTitle: { color: '#F7F1E9', fontSize: 20, fontWeight: '800', textAlign: 'left' },
  weekDates: { color: '#A99E92', fontSize: 15, marginTop: 3, textAlign: 'left' },
  completedRow: { marginHorizontal: 18, marginTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  completedLabel: { color: '#F7F1E9', fontSize: 18, fontWeight: '800', textAlign: 'left' },
  completedValue: { color: '#F7F1E9', fontSize: 24, fontWeight: '800' },
  divider: { height: 2, backgroundColor: '#3A3128', marginHorizontal: 18, marginTop: 18 },
  notificationsSection: { marginHorizontal: 18, marginTop: 28, paddingBottom: 28 },
  notificationsGroupTitle: { color: '#F7F1E9', fontSize: 18, fontWeight: '800', marginBottom: 10, textAlign: 'left' },
  earlierTitle: { marginTop: 24 },
  notificationRow: { minHeight: 68, borderBottomWidth: 1, borderBottomColor: '#3A3128', flexDirection: 'row', alignItems: 'center', gap: 12 },
  notificationCopy: { flex: 1, gap: 3 },
  notificationTitle: { color: '#F7F1E9', fontSize: 15, fontWeight: '800', textAlign: 'left' },
  notificationMessage: { color: '#A99E92', fontSize: 13, textAlign: 'left' },
  notificationTime: { color: '#8C8175', fontSize: 12, textAlign: 'right' },
});
