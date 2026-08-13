import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinkSquare } from 'reicon-react-native';
import { i18n } from '../lib/i18n';
import ConnectionScreen from '../app/connection';
import LoginSheet from './LoginSheet';
import { useAppLanguage } from '../lib/onboarding';

type Props = { onDone: () => void };

export default function LoginScreen({ onDone }: Props) {
  const language = useAppLanguage();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [isSheetPresented, setIsSheetPresented] = useState(false);
  const isArabic = language === 'ar';
  const direction = { writingDirection: isArabic ? 'rtl' : 'ltr', textAlign: 'left' } as const;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open sheet"
          onPress={() => setIsSheetPresented(true)}
          style={[styles.sheetTrigger, isArabic ? styles.sheetTriggerLeft : styles.sheetTriggerRight]}
        >
          <LinkSquare size={24} color="#F7F1E9" weight="Outline" />
        </Pressable>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.form}>
          <Text style={[styles.label, direction]}>{i18n.t('usernameOrEmail')}</Text>
          <View style={[styles.inputField, styles.inputSpacing]}>
            <TextInput value={identifier} onChangeText={setIdentifier} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" style={[styles.input, direction]} />
            {!identifier && <Text pointerEvents="none" style={[styles.placeholder, direction]}>{i18n.t('usernameOrEmailPlaceholder')}</Text>}
          </View>
          <Text style={[styles.label, direction]}>{i18n.t('password')}</Text>
          <View style={styles.passwordField}>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry={secure} autoCapitalize="none" style={[styles.passwordInput, direction]} />
            {!password && <Text pointerEvents="none" style={[styles.passwordPlaceholder, direction]}>{i18n.t('passwordPlaceholder')}</Text>}
            <Pressable onPress={() => setSecure((value) => !value)} hitSlop={10}><Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={22} color="#FFFFFF" /></Pressable>
          </View>
          <Pressable style={styles.forgot}><Text style={styles.forgotText}>{i18n.t('forgotPassword')}</Text></Pressable>
          <Pressable onPress={onDone} style={styles.button}><Text style={styles.buttonText}>{i18n.t('signIn')}</Text><Ionicons name={isArabic ? 'arrow-back' : 'arrow-forward'} size={20} color="#1A1612" /></Pressable>
        </View>
      </View>
      <LoginSheet isPresented={isSheetPresented} onDismiss={() => setIsSheetPresented(false)}><ConnectionScreen embedded /></LoginSheet>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#1A1612' }, content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 }, sheetTrigger: { position: 'absolute', top: 56, zIndex: 1, padding: 8 }, sheetTriggerRight: { right: 16, left: undefined }, sheetTriggerLeft: { left: 16, right: undefined }, sheetHost: { position: 'absolute', width: 1, height: 1 }, logo: { alignSelf: 'center', width: 150, height: 150, marginBottom: 26 }, form: {}, label: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 8, textAlign: 'left' }, inputField: { height: 56, backgroundColor: '#211C16', borderWidth: 1, borderColor: '#3A3128', borderRadius: 16 }, inputSpacing: { marginBottom: 18 }, input: { flex: 1, color: '#FFF', paddingHorizontal: 16, fontSize: 16, textAlign: 'left' }, placeholder: { position: 'absolute', left: 16, right: 16, top: 18, color: '#8C8175', fontSize: 16, textAlign: 'left' }, passwordField: { height: 56, flexDirection: 'row', alignItems: 'center', backgroundColor: '#211C16', borderWidth: 1, borderColor: '#3A3128', borderRadius: 16, paddingHorizontal: 16 }, passwordInput: { flex: 1, color: '#FFF', fontSize: 16, textAlign: 'left' }, passwordPlaceholder: { position: 'absolute', left: 16, right: 48, color: '#8C8175', fontSize: 16, textAlign: 'left' }, forgot: { alignSelf: 'flex-end', paddingVertical: 14 }, forgotText: { color: '#C89A63', fontSize: 14, fontWeight: '600' }, button: { height: 58, borderRadius: 29, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 }, buttonText: { color: '#1A1612', fontSize: 17, fontWeight: '700' } });
