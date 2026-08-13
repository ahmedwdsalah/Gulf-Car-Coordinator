import { Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Building, Lock, Qr, Server, Wifi } from 'reicon-react-native';
import { i18n } from '../lib/i18n';

export default function ConnectionScreen({ embedded = false }: { embedded?: boolean }) {
  return (
    <View style={styles.screen}>
      {!embedded && <Stack.Screen options={{ title: i18n.t('connectionSettings'), headerShown: true, headerBackTitle: '', headerTitleStyle: { color: '#F7F1E9', fontWeight: '700' }, headerStyle: { backgroundColor: '#1A1612' }, gestureEnabled: true }} />}
      <View style={styles.device}><Building size={24} color="#A8743B" /><View style={styles.copy}><Text style={styles.deviceTitle}>Gulf Car</Text><Text style={styles.muted}>{i18n.t('currentDeviceConfiguration')}</Text></View><Wifi size={24} color="#58A65C" /></View>
      <Text style={styles.label}>{i18n.t('administratorSetupCode')}</Text>
      <View style={styles.inputRow}><Lock size={22} color="#8C8175" /><TextInput placeholder={i18n.t('setupCodePlaceholder')} placeholderTextColor="#8C8175" style={styles.input} /><Qr size={24} color="#8C8175" /></View>
      <Pressable style={styles.verify}><Lock size={16} color="#A8743B" /><Text style={styles.verifyText}>{i18n.t('verifyUnlockSettings')}</Text></Pressable>
      <Text style={styles.label}>{i18n.t('hrAccountServer')}</Text>
      <View style={styles.disabled}><Server size={20} color="#8C8175" /><Text style={styles.disabledText}>https://hr.gulfcar.com.sa/api/v1/mobile</Text></View>
      <Text style={styles.label}>{i18n.t('gpsUploadGateway')}</Text>
      <View style={styles.disabled}><Wifi size={20} color="#8C8175" /><Text style={styles.disabledText}>https://gps.gulfcar.com.sa/location</Text></View>
      <Pressable style={styles.restore}><Text style={styles.restoreText}>{i18n.t('restoreDefaults')}</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#1A1612', padding: 20 }, title: { color: '#F7F1E9', fontSize: 22, fontWeight: '700', marginBottom: 24 }, device: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#211C16', borderWidth: 1, borderColor: '#3A3128', borderRadius: 16, padding: 16, marginBottom: 22 }, copy: { flex: 1 }, deviceTitle: { color: '#F7F1E9', fontSize: 16, fontWeight: '700', textAlign: 'left' }, muted: { color: '#A99E92', marginTop: 4, textAlign: 'left' }, label: { color: '#F7F1E9', marginBottom: 8, textAlign: 'left' }, inputRow: { height: 54, backgroundColor: '#211C16', borderWidth: 1, borderColor: '#6A5747', borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 }, input: { flex: 1, color: '#F7F1E9', textAlign: 'left' }, verify: { height: 44, backgroundColor: '#2A241D', borderWidth: 1, borderColor: '#C89A63', borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginVertical: 14 }, verifyText: { color: '#C89A63', fontWeight: '700', textAlign: 'left' }, disabled: { height: 54, backgroundColor: '#211C16', borderWidth: 1, borderColor: '#3A3128', borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, marginBottom: 12 }, disabledText: { color: '#6F6257', textAlign: 'left' }, restore: { alignItems: 'center', marginTop: 16 }, restoreText: { color: '#C89A63', fontWeight: '600', textAlign: 'left' } });
