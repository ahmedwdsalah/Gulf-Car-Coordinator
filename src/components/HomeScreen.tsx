import React from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Constants from 'expo-constants';
import MapView, { Marker, PROVIDER_GOOGLE, type UserLocationChangeEvent } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as ExpoLocation from 'expo-location';
import * as Haptics from 'expo-haptics';
import { notifyNewMovementRequest } from '../lib/notifications';
import { Archive, Arrow, Bell, Clock, Location, MapAlt, Power, TickCircle, WifiOff } from 'reicon-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type Order } from '../lib/orders';
import { useAttendanceStateQuery, useAttendanceToggleMutation, useMovementRequestsQuery } from '../lib/auth';
import { i18n } from '../lib/i18n';
import { useAppLanguage } from '../lib/onboarding';

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

const HomeScreen = React.memo(function HomeScreen() {
  const language = useAppLanguage();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const mapRef = React.useRef<MapView>(null);
  const nativeLocationCentered = React.useRef(false);
  const [locationRegion, setLocationRegion] = React.useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null);
  const [focusedRoute, setFocusedRoute] = React.useState<Order | null>(null);
  const requests = useMovementRequestsQuery('active');
  const attendance = useAttendanceStateQuery();
  const attendanceToggle = useAttendanceToggleMutation();
  const seenRequestIds = React.useRef<Set<number> | null>(null);
  React.useEffect(() => {
    if (!requests.data) return;
    const currentIds = new Set(requests.data.map((request) => request.id));
    if (!seenRequestIds.current) {
      seenRequestIds.current = currentIds;
      return;
    }
    for (const request of requests.data) {
      if (seenRequestIds.current.has(request.id)) continue;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      void notifyNewMovementRequest(request).catch(() => undefined);
    }
    seenRequestIds.current = currentIds;
  }, [requests.data]);
  const isOnline = attendance.data?.checked_in ?? false;
  const assigned = React.useMemo(() => (requests.data ?? []).map((request) => ({
    id: request.id,
    version: request.version,
    status: request.status,
    name: request.passenger_names,
    time: request.scheduled_at ? new Date(request.scheduled_at).toLocaleTimeString(language === 'ar' ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—',
    from: request.pickup.label,
    to: request.dropoff.label,
    fromCoordinate: { latitude: request.pickup.lat, longitude: request.pickup.lng },
    toCoordinate: { latitude: request.dropoff.lat, longitude: request.dropoff.lng },
  })), [language, requests.data]);
  const displayedAssigned = assigned;
  const firstRoute = focusedRoute;
  const googleMapsApiKey = Constants.expoConfig?.extra?.googleMapsApiKey;
  const todayLabel = new Intl.DateTimeFormat(language === 'ar' ? 'ar' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const weekDatesLabel = getCurrentWeekLabel(language);
  const greetingLabel = i18n.t(getGreetingKey(new Date().getHours()));
  const refreshHome = React.useCallback(() => {
    void Promise.all([requests.refetch(), attendance.refetch()]);
  }, [attendance.refetch, requests.refetch]);

  const showCurrentLocation = React.useCallback(async () => {
    setFocusedRoute(null);
    nativeLocationCentered.current = false;
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== ExpoLocation.PermissionStatus.GRANTED) return;
    const position = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced })
      .catch(() => ExpoLocation.getLastKnownPositionAsync());
    if (!position) return;
    const region = { latitude: position.coords.latitude, longitude: position.coords.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 };
    setLocationRegion(region);
    mapRef.current?.animateCamera({ center: region, zoom: 18 }, { duration: 500 });
  }, []);
  const centerOnNativeLocation = React.useCallback((event: UserLocationChangeEvent) => {
    if (focusedRoute) return;
    if (nativeLocationCentered.current) return;
    if (!event.nativeEvent.coordinate) return;
    nativeLocationCentered.current = true;
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const region = { latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 };
    setLocationRegion(region);
    mapRef.current?.animateCamera({ center: region, zoom: 18 }, { duration: 500 });
  }, [focusedRoute]);
  const focusRoute = React.useCallback((order: Order) => {
    setFocusedRoute(order);
    mapRef.current?.fitToCoordinates([order.fromCoordinate, order.toCoordinate], {
      edgePadding: { top: 80, right: 48, bottom: 180, left: 48 },
      animated: true,
    });
  }, []);
  const fitRoute = React.useCallback((coordinates: { latitude: number; longitude: number }[]) => {
    mapRef.current?.fitToCoordinates(coordinates, { edgePadding: { top: 80, right: 48, bottom: 180, left: 48 }, animated: true });
  }, []);
  const handleDirectionsReady = React.useCallback(({ coordinates }: { coordinates: { latitude: number; longitude: number }[] }) => {
    fitRoute(coordinates);
  }, [fitRoute]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.dateRow}>
          <Text style={styles.date}>{todayLabel}</Text>
          <View style={styles.headerActions}>
            <Pressable hitSlop={12} onPress={() => void showCurrentLocation()}>
              <Location size={25} color="#FFFFFF" weight="Outline" />
            </Pressable>
            <Pressable hitSlop={12}>
              <Bell size={25} color="#FFFFFF" weight="Outline" />
            </Pressable>
          </View>
        </View>
        <Text
          style={styles.greeting}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.55}
          maxFontSizeMultiplier={1.2}
        >
          {greetingLabel}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={requests.isRefetching || attendance.isRefetching} onRefresh={refreshHome} tintColor="#C89A63" />}
      >
      <View style={styles.mapArea}>
        <View style={StyleSheet.absoluteFill}>
          <MapView
            ref={mapRef}
            onUserLocationChange={centerOnNativeLocation}
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFill}
            {...(locationRegion ? { initialRegion: locationRegion } : {})}
            customMapStyle={MAP_STYLE}
            rotateEnabled={false}
            pitchEnabled={false}
            toolbarEnabled={false}
            showsUserLocation
            showsMyLocationButton={false}
            mapType="satellite"
          >
            {googleMapsApiKey && firstRoute ? <MapViewDirections
              origin={firstRoute.fromCoordinate}
              destination={firstRoute.toCoordinate}
              apikey={googleMapsApiKey}
              mode="DRIVING"
              language={language}
              precision="low"
              strokeWidth={5}
              strokeColor="#C89A63"
              onReady={handleDirectionsReady}
            /> : null}
            {firstRoute ? <Marker
              identifier="route-origin"
              coordinate={firstRoute.fromCoordinate}
              title={firstRoute.from}
              description={i18n.t('from')}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <RouteBadge type="from" />
            </Marker> : null}
            {firstRoute ? <Marker
              identifier="route-destination"
              coordinate={firstRoute.toCoordinate}
              title={firstRoute.to}
              description={i18n.t('to')}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <RouteBadge type="to" />
            </Marker> : null}
          </MapView>
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
              attendanceToggle.mutate();
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            disabled={attendanceToggle.isPending || attendance.isPending}
          >
            {attendanceToggle.isPending ? <ActivityIndicator color={isOnline ? '#FFFFFF' : '#55727A'} /> : isOnline ? <Power size={26} color="#FFFFFF" weight="Outline" /> : <WifiOff size={18} color="#000000" weight="Outline" />}
            {!isOnline && <Text style={styles.onlineButtonText}>{i18n.t('goOnline')}</Text>}
          </Pressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} directionalLockEnabled contentContainerStyle={styles.cards} style={styles.cardsViewport}>
        <View style={styles.cardsRow}>
          {assigned.length ? <>{assigned.map((order, index) => <VisitCard key={`${order.id ?? order.name}-${index}`} width={width - 68} {...order} onPress={() => focusRoute(order)} />)}<EmptyRideCard width={width - 68} /></> : <EmptyRideCard width={width - 68} />}
        </View>
      </ScrollView>
      <View style={styles.weekHeader}>
        <Text style={styles.weekTitle}>{i18n.t('thisWeek')}</Text>
        <Text style={styles.weekDates}>{weekDatesLabel}</Text>
      </View>
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
});

export default HomeScreen;

function VisitCard({ width, name, time, from, to, fromCoordinate, toCoordinate, status = 'assigned', onPress }: Order & { width: number; status?: 'assigned' | 'in_progress' | 'completed' | 'cancelled'; onPress?: () => void }) {
  const completed = status === 'completed';
  const statusColor = completed ? '#67C587' : '#D99A4A';
  const openRoute = () => Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${fromCoordinate.latitude},${fromCoordinate.longitude}&destination=${toCoordinate.latitude},${toCoordinate.longitude}&travelmode=driving`);

  return (
    <Pressable onPress={onPress} style={[styles.visitCard, { width }]}>
      <View pointerEvents="none" style={styles.cardInnerBlackStroke} />
      <View pointerEvents="none" style={styles.cardInnerWhiteStroke} />
      <View style={styles.visitHeader}>
        <View style={styles.visitNameGroup}>
          <Text style={styles.visitName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={1.2}>{name}</Text>
          <View style={styles.visitStatusRow}>
            {completed ? <TickCircle size={14} color={statusColor} weight="Outline" /> : <Archive size={14} color={statusColor} weight="Outline" />}
            <Text style={[styles.visitStatus, { color: statusColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} maxFontSizeMultiplier={1.2}>{i18n.t(status === 'in_progress' ? 'inProgress' : status)}</Text>
          </View>
        </View>
        <View style={styles.visitTimeRow}>
          <Clock size={15} color="#C89A63" weight="Outline" />
          <Text style={styles.visitTime} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} maxFontSizeMultiplier={1.2}>{time}</Text>
        </View>
      </View>
      <View style={styles.route}>
        <View style={styles.routeStops}>
          <View style={styles.routeStopRow}>
            <View style={styles.routeStopIcon}><RouteBadge type="from" /></View>
            <Text style={styles.routeOrigin} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} maxFontSizeMultiplier={1.2}>{from}</Text>
          </View>
          <View style={styles.routeConnector} />
          <View style={styles.routeStopRow}>
            <View style={styles.routeStopIcon}><RouteBadge type="to" /></View>
            <Text style={styles.routeDestination} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} maxFontSizeMultiplier={1.2}>{to}</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={i18n.t('openRoute')} onPress={() => void openRoute()} style={styles.routeButton}>
          <MapAlt size={19} color="#1A1612" weight="Outline" />
        </Pressable>
      </View>
    </Pressable>
  );
}

function getGreetingKey(hour: number) {
  if (hour < 12) return 'greetingMorning';
  if (hour < 18) return 'greetingAfternoon';
  return 'greetingEvening';
}

function getCurrentWeekLabel(language: 'ar' | 'en') {
  const today = new Date();
  const monday = new Date(today);
  const day = today.getDay();
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const format = new Intl.DateTimeFormat(language === 'ar' ? 'ar' : 'en-US', { day: 'numeric', month: 'short' });
  return `${format.format(monday)} - ${format.format(sunday)}`;
}

function RouteBadge({ type }: { type: 'from' | 'to' }) {
  return (
    <View style={[styles.routeBadge, type === 'to' ? styles.routeBadgeTo : styles.routeBadgeFrom]}>
      <View style={type === 'to' ? styles.routeBadgeDestination : styles.routeBadgeOrigin} />
    </View>
  );
}

function EmptyRideCard({ width }: { width: number }) {
  return <View style={[styles.emptyRideCard, { width }]}>
    <View pointerEvents="none" style={styles.cardInnerBlackStroke} />
    <View pointerEvents="none" style={styles.cardInnerWhiteStroke} />
    <Archive size={28} color="#8C8175" weight="Outline" />
    <Text style={styles.emptyRideText}>{i18n.t('noScheduledRides')}</Text>
  </View>;
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
  cardsViewport: { height: 190, marginTop: -64, zIndex: 3, elevation: 3 },
  cards: { gap: 10, paddingStart: 16, paddingEnd: 48 },
  cardsRow: { flexDirection: 'row', gap: 10 },
  visitCard: { height: 190, borderRadius: 16, backgroundColor: '#211C16', paddingHorizontal: 16, paddingVertical: 15, shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  cardInnerBlackStroke: { position: 'absolute', top: 1, right: 1, bottom: 1, left: 1, borderWidth: 1, borderColor: 'rgba(0,0,0,0.18)', borderRadius: 15 },
  cardInnerWhiteStroke: { position: 'absolute', top: 2, right: 2, bottom: 2, left: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 14 },
  visitHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  visitNameGroup: { flex: 1 },
  visitStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  visitStatus: { color: '#D99A4A', fontSize: 12, fontWeight: '700', textAlign: 'left', flexShrink: 1 },
  visitTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  visitTime: { color: '#E8DED2', fontSize: 15, lineHeight: 21, fontWeight: '700', flexShrink: 1 },
  route: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  routeStops: { flex: 1, gap: 20 },
  routeStopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeStopIcon: { width: 18, alignItems: 'center' },
  routeBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F7F1E9' },
  routeBadgeFrom: { backgroundColor: '#1A1612' },
  routeBadgeTo: { backgroundColor: '#C89A63' },
  routeBadgeOrigin: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#8C8175' },
  routeBadgeDestination: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1A1612', borderWidth: 2, borderColor: '#F7F1E9' },
  routeConnector: { position: 'absolute', left: 8.5, top: 17, width: 1, height: 28, backgroundColor: '#A7B5B8' },
  routeOrigin: { flex: 1, color: '#A99E92', fontSize: 14, lineHeight: 19, textAlign: 'left', flexShrink: 1 },
  routeDestination: { flex: 1, color: '#E8DED2', fontSize: 15, lineHeight: 20, fontWeight: '700', textAlign: 'left', flexShrink: 1 },
  routeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#C89A63', alignItems: 'center', justifyContent: 'center' },
  visitName: { color: '#F7F1E9', fontSize: 17, lineHeight: 21, fontWeight: '700', textAlign: 'left' },
  emptyRideCard: { minHeight: 150, borderRadius: 16, backgroundColor: '#211C16', paddingHorizontal: 16, paddingVertical: 15, borderWidth: 1, borderColor: '#3A3128', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  emptyRideText: { color: '#A99E92', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  visitDescription: { color: '#55727A', fontSize: 15, marginTop: 4 },
  weekHeader: { marginHorizontal: 18, marginTop: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  weekTitle: { color: '#F7F1E9', fontSize: 20, fontWeight: '800', textAlign: 'left' },
  weekDates: { color: '#A99E92', fontSize: 15, textAlign: 'right' },
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
