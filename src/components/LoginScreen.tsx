import { Ionicons } from '@expo/vector-icons';
import { Host, TextInput as ExpoTextInput } from '@expo/ui';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinkSquare } from 'reicon-react-native';
import * as Haptics from 'expo-haptics';
import { i18n } from '../lib/i18n';
import ConnectionScreen from '../app/connection';
import LoginSheet from './LoginSheet';
import { useAppLanguage } from '../lib/onboarding';
import { AuthError, useAuthMutations } from '../lib/auth';

type Props = { onDone: () => void | Promise<void> };

export default function LoginScreen({ onDone }: Props) {
  const language = useAppLanguage();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const auth = useAuthMutations({
    onLoginSuccess: onDone,
    onLoginError: (error) => {
      const code = error instanceof AuthError ? error.code : 'REQUEST_FAILED';
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert(i18n.t('signIn'), i18n.t(`authError.${code}`, { defaultValue: i18n.t('authError.REQUEST_FAILED') }));
    },
    onResetSuccess: () => Alert.alert(i18n.t('resetRequest'), i18n.t('forgotPasswordSubmitted')),
    onResetError: () => Alert.alert(i18n.t('resetRequest'), i18n.t('forgotPasswordFailed')),
  });
  const canSignIn = identifier.trim().length > 0 && password.length > 0;
  const [isSheetPresented, setIsSheetPresented] = useState(false);
  const isArabic = language === 'ar';
  const direction = { writingDirection: isArabic ? 'rtl' : 'ltr', textAlign: 'left' } as const;
  const inputDirection = { writingDirection: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' } as const;
  const handleSignIn = async () => {
    if (auth.login.isPending || !canSignIn) return;
    auth.login.mutate({ username: identifier, password });
  };
  const handleForgotPassword = async () => {
    if (!identifier.trim()) {
      Alert.alert(i18n.t('resetRequest'), i18n.t('forgotPasswordRequiresUsername'));
      return;
    }
    if (auth.reset.isPending) return;
    auth.reset.mutate(identifier);
  };

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
            <Host style={styles.nativeInputHost} ignoreSafeArea="all">
              <ExpoTextInput onChangeText={setIdentifier} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textAlign={inputDirection.textAlign} style={styles.nativeInput} textStyle={styles.nativeInputText} />
            </Host>
          </View>
          <Text style={[styles.label, direction]}>{i18n.t('password')}</Text>
          <View style={styles.passwordField}>
            <Host style={styles.nativePasswordHost} ignoreSafeArea="all">
              <ExpoTextInput onChangeText={setPassword} secureTextEntry={secure} autoCapitalize="none" autoCorrect={false} textAlign={inputDirection.textAlign} style={styles.nativePasswordInput} textStyle={styles.nativeInputText} />
            </Host>
            <Pressable onPress={() => setSecure((value) => !value)} hitSlop={10}><Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={22} color="#FFFFFF" /></Pressable>
          </View>
          <Pressable onPress={() => void handleForgotPassword()} disabled={auth.reset.isPending} style={[styles.forgot, auth.reset.isPending && styles.buttonDisabled]}><Text style={styles.forgotText}>{i18n.t(auth.reset.isPending ? 'forgotPasswordSending' : 'forgotPassword')}</Text></Pressable>
          <Pressable onPress={() => void handleSignIn()} disabled={!canSignIn || auth.login.isPending} style={[styles.button, (!canSignIn || auth.login.isPending) && styles.buttonDisabled]}>{auth.login.isPending ? <ActivityIndicator color="#1A1612" /> : <><Text style={styles.buttonText}>{i18n.t('signIn')}</Text><Ionicons name={isArabic ? 'arrow-back' : 'arrow-forward'} size={20} color="#1A1612" /></>}</Pressable>
        </View>
      </View>
      <LoginSheet isPresented={isSheetPresented} onDismiss={() => setIsSheetPresented(false)}><ConnectionScreen embedded /></LoginSheet>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#1A1612' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  sheetTrigger: { position: 'absolute', top: 56, zIndex: 1, padding: 8 },
  sheetTriggerRight: { right: 16, left: undefined },
  sheetTriggerLeft: { left: 16, right: undefined },
  sheetHost: { position: 'absolute', width: 1, height: 1 },
  logo: { alignSelf: 'center', width: 150, height: 150, marginBottom: 26 },
  form: {},
  label: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 8, textAlign: 'left' },
  inputField: { height: 56, backgroundColor: '#211C16', borderWidth: 1, borderColor: '#3A3128', borderRadius: 16 },
  inputSpacing: { marginBottom: 18 },
  nativeInputHost: { flex: 1 },
  nativePasswordHost: { flex: 1, minWidth: 0, height: 56 },
  nativeInput: { flex: 1, paddingHorizontal: 16 },
  nativePasswordInput: { flex: 1, width: '100%', height: 56, paddingHorizontal: 0 },
  nativeInputText: { color: '#FFF', fontSize: 18, writingDirection: 'rtl' },
  passwordField: { height: 56, flexDirection: 'row', alignItems: 'center', backgroundColor: '#211C16', borderWidth: 1, borderColor: '#3A3128', borderRadius: 16, paddingHorizontal: 16 },
  forgot: { alignSelf: 'flex-end', paddingVertical: 14 },
  forgotText: { color: '#C89A63', fontSize: 14, fontWeight: '600' },
  button: { height: 58, borderRadius: 29, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#1A1612', fontSize: 17, fontWeight: '700' },
});
