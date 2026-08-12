import LottieView from 'lottie-react-native';

import cart from '../../assets/animations/cart.json';

export default function SplashScreen() {
  return (
    <LottieView
      source={cart}
      autoPlay
      resizeMode="contain"
      loop
      style={{
        flex: 1,
        width: '100%',
        backgroundColor: '#1A1612',
      }}
    />
  );
}
