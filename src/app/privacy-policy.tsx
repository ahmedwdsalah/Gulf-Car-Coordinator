import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { i18n } from '../lib/i18n';

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: i18n.t('privacyPolicy'), headerShown: true, headerBackTitle: '', headerTitleStyle: { color: '#F7F1E9', fontWeight: '700' }, headerStyle: { backgroundColor: '#1A1612' }, gestureEnabled: true }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>{i18n.t('privacyHeading')}</Text>
        <Text style={styles.body}>{i18n.t('privacyIntro')}</Text>
        <Text style={styles.section}>{i18n.t('privacyInformationTitle')}</Text>
        <Text style={styles.body}>{i18n.t('privacyInformationBody')}</Text>
        <Text style={styles.section}>{i18n.t('privacyLocationTitle')}</Text>
        <Text style={styles.body}>{i18n.t('privacyLocationBody')}</Text>
        <Text style={styles.section}>{i18n.t('privacyProtectionTitle')}</Text>
        <Text style={styles.body}>{i18n.t('privacyProtectionBody')}</Text>
        <Text style={styles.section}>{i18n.t('privacyChoicesTitle')}</Text>
        <Text style={styles.body}>{i18n.t('privacyChoicesBody')}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#1A1612' }, content: { padding: 24, paddingBottom: 80 }, heading: { color: '#F7F1E9', fontSize: 25, fontWeight: '800', marginBottom: 18, textAlign: 'left' }, section: { color: '#C89A63', fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 8, textAlign: 'left' }, body: { color: '#E8DED2', fontSize: 15, lineHeight: 24, textAlign: 'left' } });
