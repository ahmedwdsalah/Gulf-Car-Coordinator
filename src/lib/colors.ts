import { Color } from 'expo-router';
import { Platform } from 'react-native';

const M3_DYNAMIC_LIGHT = {
  primary: '#0061A4',
  onPrimary: '#FFFFFF',
  primaryContainer: '#CDE5FF',
  onPrimaryContainer: '#001D33',
  secondary: '#535F70',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#D7E3F8',
  onSecondaryContainer: '#101C2B',
  tertiary: '#6B5778',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#F2DBFF',
  onTertiaryContainer: '#251432',
  surfaceContainerLow: '#F7F7FA',
  surfaceContainerHighest: '#E5E5E9',
  onSurface: '#1A1B20',
  onSurfaceVariant: '#44474F',
  outlineVariant: '#C4C6CF',
};

export const c = Platform.OS === 'android' ? Color.android.dynamic : M3_DYNAMIC_LIGHT;
