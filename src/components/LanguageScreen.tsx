import { Alert, Image, Pressable, Text, View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { restartWithLanguage, useOnboardingStore } from '../lib/onboarding';
import { i18n } from '../lib/i18n';

export default function LanguageScreen() {
  const setLanguage = useOnboardingStore((state) => state.setLanguage);
  const storedLanguage = useOnboardingStore((state) => state.language);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar' | null>(storedLanguage);
  const isArabic = selectedLanguage === 'ar' || !selectedLanguage;

  const selectLanguage = async (language: 'en' | 'ar') => {
    await setLanguage(language);
    setSelectedLanguage(language);
    Alert.alert(
      i18n.t('restartApp'),
      i18n.t(language === 'ar' ? 'restartForArabic' : 'restartForEnglish'),
      [{ text: i18n.t('ok'), onPress: () => void restartWithLanguage(language).then((reloaded) => { if (!reloaded) router.replace('/permission'); }) }],
      { cancelable: false },
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1A1612', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View style={{ width: '100%', maxWidth: 372, backgroundColor: '#211C16', borderRadius: 28, borderCurve: 'continuous', padding: 12 }}>
        <Image source={require('../../assets/logo.png')} style={{ width: '100%', height: 188, borderRadius: 20, resizeMode: 'contain', backgroundColor: '#2A241D' }} />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
          <Pressable onPress={() => void selectLanguage('en')} style={{ flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 18, backgroundColor: '#2A241D' }}>
            <Text style={{ fontSize: 28 }}>🇬🇧</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginTop: 8 }}>{i18n.t('english')}</Text>
          </Pressable>
          <Pressable onPress={() => void selectLanguage('ar')} style={{ flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 18, backgroundColor: '#2A241D' }}>
            <Text style={{ fontSize: 28 }}>🇸🇦</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginTop: 8 }}>{i18n.t('arabic')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
