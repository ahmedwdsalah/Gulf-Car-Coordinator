import { ArrowsLeft, ArrowsRight, Clock, Document, Gps, Gear, HelpCircle, InfoCircle, Language, Location, Logout, Message, Radar, Trash } from 'reicon-react-native';
import { Host, Picker, Slider, Switch as ExpoSwitch } from '@expo/ui';
import * as Updates from 'expo-updates';
import { Blur, Canvas, ColorMatrix, Group, Image as SkiaImage, Paint, RoundedRect, useImage, rect, rrect } from '@shopify/react-native-skia';
import React from 'react';
import { ActivityIndicator, Alert, I18nManager, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated, { Extrapolation, interpolate, interpolateColor, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { i18n } from '../lib/i18n';
import { restartWithLanguage, useOnboardingStore } from '../lib/onboarding';
import { router } from 'expo-router';
import { useAuthMutations } from '../lib/auth';

function SettingIcon({ name, color }: { name: string; color: string }) {
  const props = { size: 24, color, weight: 'Outline' as const };
  switch (name) {
    case 'help-circle-outline': return <HelpCircle {...props} />;
    case 'chatbubble-outline': return <Message {...props} />;
    case 'mail-outline': return <Message {...props} />;
    case 'information-circle-outline': return <InfoCircle {...props} />;
    case 'language-outline': return <Language {...props} />;
    case 'log-out-outline': return <Logout {...props} />;
    case 'trash-outline': return <Trash {...props} />;
    case 'document-text-outline': return <Document {...props} />;
    case 'locate-outline': return <Gps {...props} />;
    case 'radio-button-on-outline': return <Radar {...props} />;
    case 'navigate-outline': return <Location {...props} />;
    case 'time-outline': return <Clock {...props} />;
    default: return <Gear {...props} />;
  }
}

function Switch({ value, onValueChange }: { value: boolean; onValueChange: (value: boolean) => void }) {
  return <Host matchContents><ExpoSwitch value={value} onValueChange={onValueChange} /></Host>;
}

function Ionicons({ name, color }: { name: string; size: number; color: string }) {
  return name === 'chevron-forward' ? <ArrowsLeft size={24} color="#FFFFFF" /> : name === 'chevron-back' ? <ArrowsRight size={24} color="#FFFFFF" /> : <SettingIcon name={name} color="#FFFFFF" />;
}

const AVATAR_SIZE = 148;
const CANVAS_HEIGHT = 220;
const MAX_SCROLL = 70;
const items = [
  ['advancedTrackingSettings', [['locate-outline', 'automaticStopDetection', 'automaticStopDetectionDescription'], ['radio-button-on-outline', 'trackingRadius', 'trackingRadiusDescription'], ['navigate-outline', 'locationAccuracy', 'locationAccuracyDescription'], ['time-outline', 'trackingInterval', 'trackingIntervalDescription']]],
  ['account', [['language-outline', 'language', 'languageDescription'], ['chatbubble-outline', 'scheduledUpdates', ''], ['mail-outline', 'connection', '']]],
  ['privacySecurity', [['document-text-outline', 'privacyPolicy', ''], ['log-out-outline', 'signOut', ''], ['trash-outline', 'deleteAccount', '']]],
] as const;

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const avatar = useImage(require('../../assets/logo.png'));
  const [advanced, setAdvanced] = React.useState({ automaticStop: true, radius: '50', accuracy: 'Balanced', interval: '10' });
  const setLanguage = useOnboardingStore((state) => state.setLanguage);
  const language = useOnboardingStore((state) => state.language);
  const setSignedIn = useOnboardingStore((state) => state.setSignedIn);
  const auth = useAuthMutations({ onLogoutSuccess: () => { setSignedIn(false); router.replace('/'); } });
  const isRTL = I18nManager.isRTL;
  const avatarSize = useDerivedValue(() => interpolate(scrollY.value, [0, MAX_SCROLL / 2], [AVATAR_SIZE, 0]));
  const avatarX = useDerivedValue(() => (width - avatarSize.value) / 2);
  const avatarY = useDerivedValue(() => interpolate(scrollY.value, [0, MAX_SCROLL], [MAX_SCROLL, 0], { extrapolateRight: Extrapolation.CLAMP }));
  const blur = useDerivedValue(() => interpolate(scrollY.value, [0, 30, 35], [0, 12, 0]));
  const tint = useDerivedValue(() => interpolateColor(scrollY.value, [0, 30], ['transparent', '#000']));
  const colorMatrix = useDerivedValue(() => { const p = interpolate(scrollY.value, [0, MAX_SCROLL], [0, 1], { extrapolateRight: Extrapolation.CLAMP }); return [1,0,0,0,0, 0,1,0,0,0, 0,0,1,0,0, 0,0,0,25 * (1-p),-8 * (1-p)]; });
  const avatarBounds = useDerivedValue(() => rrect(rect(avatarX.value, avatarY.value, avatarSize.value, avatarSize.value), avatarSize.value / 2, avatarSize.value / 2));
  const canvasStyle = useAnimatedStyle(() => ({ height: interpolate(scrollY.value, [0, MAX_SCROLL], [CANVAS_HEIGHT, 1]), transform: [{ translateY: interpolate(scrollY.value, [0, MAX_SCROLL], [0, MAX_SCROLL]) }] }));
  const headerStyle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [20, MAX_SCROLL - 10], [0, 1], { extrapolateLeft: Extrapolation.CLAMP, extrapolateRight: Extrapolation.CLAMP }), transform: [{ translateY: -10 * (1 - interpolate(scrollY.value, [20, MAX_SCROLL - 10], [0, 1], { extrapolateLeft: Extrapolation.CLAMP, extrapolateRight: Extrapolation.CLAMP })) }] }));
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => { scrollY.value = event.nativeEvent.contentOffset.y; };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.compactHeader, { paddingTop: insets.top + 8 }, headerStyle]}><Text style={styles.compactTitle}>{i18n.t('settings')}</Text></Animated.View>
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <Animated.View style={canvasStyle}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Group layer={<Paint><Blur blur={blur} /><ColorMatrix matrix={colorMatrix} /></Paint>}>
              <Group clip={avatarBounds}><SkiaImage image={avatar} x={avatarX} y={avatarY} width={avatarSize} height={avatarSize} fit="contain" /><RoundedRect x={avatarX} y={avatarY} width={avatarSize} height={avatarSize} r={avatarSize} color={tint} /></Group>
              <RoundedRect x={(width - 110) / 2} y={18} width={110} height={28} r={28} color="#000000" />
            </Group>
          </Canvas>
        </Animated.View>
        <View style={styles.profileIntro}><Text style={styles.name}>{i18n.t('settings')}</Text></View>
        <View style={styles.content}>{items.map(([section, sectionItems]) => <View key={section} style={styles.section}><Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{i18n.t(section)}</Text><View style={styles.sectionContent}>{sectionItems.map(([icon, title, description], index) => { return <View key={title}><TouchableOpacity style={styles.item} disabled={title === 'signOut' && auth.logout.isPending} activeOpacity={0.7} onPress={() => { if (title === 'signOut') Alert.alert(i18n.t('signOut'), i18n.t('signOutDescription'), [{ text: i18n.t('cancel'), style: 'cancel' }, { text: i18n.t('signOut'), style: 'destructive', onPress: () => auth.logout.mutate() }]); else if (title === 'connection') router.push('/connection'); else if (title === 'scheduledUpdates') router.push('/scheduled-updates'); else if (title === 'privacyPolicy') router.push('/privacy-policy'); else if (title === 'deleteAccount') Alert.alert(i18n.t('deleteAccount'), i18n.t('deleteAccountConfirm'), [{ text: i18n.t('cancel'), style: 'cancel' }, { text: i18n.t('deleteAccount'), style: 'destructive' }]); }}><View style={styles.itemLeft}><View style={styles.icon}><Ionicons name={icon} size={22} color={title === 'deleteAccount' ? '#EF4444' : '#6B7280'} /></View><View style={styles.itemText}><Text style={[styles.title, title === 'deleteAccount' && { color: '#EF4444' }, isRTL && styles.rtlText]}>{i18n.t(title)}</Text>{description ? <Text style={[styles.description, isRTL && styles.rtlText]}>{i18n.t(description)}</Text> : null}</View></View>{title === 'automaticStopDetection' ? <Host matchContents><ExpoSwitch value={advanced.automaticStop} onValueChange={(value) => setAdvanced((state) => ({ ...state, automaticStop: value }))} /></Host> : title === 'trackingRadius' ? <Host matchContents><Picker selectedValue={advanced.radius} onValueChange={(value) => setAdvanced((state) => ({ ...state, radius: value }))}><Picker.Item label={i18n.t('metersValue', { value: '25' })} value="25" /><Picker.Item label={i18n.t('metersValue', { value: '50' })} value="50" /><Picker.Item label={i18n.t('metersValue', { value: '75' })} value="75" /><Picker.Item label={i18n.t('metersValue', { value: '100' })} value="100" /><Picker.Item label={i18n.t('metersValue', { value: '150' })} value="150" /><Picker.Item label={i18n.t('metersValue', { value: '200' })} value="200" /></Picker></Host> : title === 'trackingInterval' ? <Host matchContents><Picker selectedValue={advanced.interval} onValueChange={(value) => setAdvanced((state) => ({ ...state, interval: value }))}><Picker.Item label={i18n.t('secondsValue', { value: '5' })} value="5" /><Picker.Item label={i18n.t('secondsValue', { value: '10' })} value="10" /><Picker.Item label={i18n.t('secondsValue', { value: '15' })} value="15" /><Picker.Item label={i18n.t('secondsValue', { value: '30' })} value="30" /><Picker.Item label={i18n.t('secondsValue', { value: '45' })} value="45" /><Picker.Item label={i18n.t('secondsValue', { value: '60' })} value="60" /></Picker></Host> : title === 'locationAccuracy' ? <Host matchContents><Picker selectedValue={advanced.accuracy} onValueChange={(value) => setAdvanced((state) => ({ ...state, accuracy: value }))}><Picker.Item label={i18n.t('balanced')} value="Balanced" /><Picker.Item label={i18n.t('high')} value="High" /></Picker></Host> : title === 'language' ? <Host matchContents><Picker selectedValue={language ?? 'ar'} onValueChange={(value) => { const nextLanguage = value === 'ar' ? 'ar' : 'en'; if (nextLanguage === language) return; Alert.alert(i18n.t('restartApp'), i18n.t(nextLanguage === 'ar' ? 'restartForArabic' : 'restartForEnglish'), [{ text: i18n.t('cancel'), style: 'cancel' }, { text: i18n.t('ok'), onPress: () => void setLanguage(nextLanguage).then(() => restartWithLanguage(nextLanguage)) }]); }}><Picker.Item label={i18n.t('english')} value="en" /><Picker.Item label={i18n.t('arabic')} value="ar" /></Picker></Host> : title === 'signOut' && auth.logout.isPending ? <ActivityIndicator color="#9CA3AF" /> : <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={20} color="#9CA3AF" />}</TouchableOpacity>{index < sectionItems.length - 1 && <View style={styles.separator} />}</View>; })}</View></View>)}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#1A1612' }, compactHeader: { position: 'absolute', zIndex: 2, top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#211C16' }, headerSide: { width: 40 }, headerRight: { alignItems: 'flex-end' }, compactTitle: { color: '#F7F1E9', fontSize: 18, fontWeight: '700', textAlign: 'center' }, compactSubtitle: { color: '#A99E92', fontSize: 13, marginTop: 2, textAlign: 'center' }, profileIntro: { alignItems: 'center', paddingBottom: 28 }, name: { color: '#F7F1E9', fontSize: 26, fontWeight: '700' }, subtitle: { color: '#A99E92', fontSize: 15, marginTop: 4 }, content: { padding: 24, paddingBottom: 40 }, section: { marginBottom: 28 }, sectionTitle: { color: '#F7F1E9', fontSize: 20, fontWeight: '600', marginBottom: 14 }, sectionContent: { backgroundColor: '#211C16', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#3A3128' }, item: { minHeight: 76, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, itemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' }, rtlText: { writingDirection: 'rtl', textAlign: 'left' }, icon: { width: 30, alignItems: 'center' }, itemText: { flex: 1, marginStart: 12 }, title: { color: '#F7F1E9', fontSize: 16, fontWeight: '600' }, description: { color: '#A99E92', fontSize: 13, marginTop: 3 }, nativeControl: { width: 110, height: 40, justifyContent: 'center' }, valueText: { color: '#C89A63', fontSize: 14, fontWeight: '600' }, separator: { height: 1, backgroundColor: '#3A3128', marginStart: 38 } });
