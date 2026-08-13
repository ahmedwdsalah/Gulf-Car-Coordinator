import { I18nManager, Image, Pressable, Text, View } from 'react-native';
import { useEffect } from 'react';

import { registerForPushNotificationsAsync } from '../lib/notifications';
import { useOnboardingStore } from '../lib/onboarding';
import { i18n, setAppLanguage } from '../lib/i18n';

type Props = {
  onDone: () => void | Promise<void>;
};

export default function PermissionScreen({ onDone }: Props) {
  const language = useOnboardingStore((state) => state.language) ?? 'ar';
  const skipNotifications = useOnboardingStore((state) => state.skipNotifications);
  const isArabic = language === 'ar' || I18nManager.isRTL;
  useEffect(() => setAppLanguage(language), [language]);

  const handleEnable = async () => {
    await registerForPushNotificationsAsync();
    await onDone();
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#1A1612',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 372,
          backgroundColor: '#211C16',
          borderRadius: 28,
          borderCurve: 'continuous',
          padding: 12,
        }}
      >
        <Image
          source={require('../../assets/notification-demo.jpeg')}
          style={{ width: '100%', height: 188, borderRadius: 20, resizeMode: 'cover' }}
        />
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: '#FFFFFF',
            marginTop: 20,
            width: '100%',
            paddingHorizontal: 12,
            textAlign: 'left',
            writingDirection: isArabic ? 'rtl' : 'ltr',
          }}
        >
          {i18n.t('stayUpdated')}
        </Text>
        <Text
          style={{
            fontSize: 20,
            lineHeight: 29,
            color: '#9A9188',
            marginTop: 10,
            width: '100%',
            paddingHorizontal: 12,
            textAlign: 'left',
            writingDirection: isArabic ? 'rtl' : 'ltr',
          }}
        >
          {i18n.t('notificationDescription')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 24, alignSelf: 'stretch' }}>
            <Pressable onPress={() => { skipNotifications(); void onDone(); }} style={{ flex: 1, paddingVertical: 16, borderRadius: 28, backgroundColor: '#2A241D', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>{i18n.t('notNow')}</Text>
            </Pressable>
            <Pressable onPress={handleEnable} style={{ flex: 1, paddingVertical: 16, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1612' }}>{i18n.t('allow')}</Text>
            </Pressable>
        </View>
      </View>
    </View>
  );
}
