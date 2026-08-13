import LottieView from 'lottie-react-native';
import { Text, View } from 'react-native';

import seatBelt from '../../assets/animations/Seat-Belt.json';
import { i18n } from '../lib/i18n';

export default function SplashScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1612' }}>
      <LottieView source={seatBelt} autoPlay resizeMode="contain" loop style={{ width: 300, height: 300 }} />
      <Text style={{ marginTop: 18, color: '#FFFFFF', fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
        {i18n.t('fastenSeatBelt')}
      </Text>
    </View>
  );
}
