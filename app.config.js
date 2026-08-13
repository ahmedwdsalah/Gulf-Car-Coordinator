import { withDangerousMod } from 'expo/config-plugins';
import fs from 'node:fs';

export default ({ config }) => {
  const plugins = config.plugins.map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'react-native-maps') {
      return [
        'react-native-maps',
        {
          ...plugin[1],
          androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
          iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      ];
    }
    return plugin;
  });
  return withDangerousMod(
    { ...config, plugins, extra: { ...config.extra, googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY } },
    ['ios', (nativeConfig) => {
      const podfile = `${nativeConfig.modRequest.platformProjectRoot}/Podfile`;
      const source = fs.readFileSync(podfile, 'utf8');
      const versions = "$RNMapsGoogleMapsVersion = '10.13.0'\n$RNMapsGoogleMapsUtilsVersion = '7.0.0'\n";
      if (!source.includes('$RNMapsGoogleMapsVersion')) {
        fs.writeFileSync(podfile, source.replace("require 'json'\n", `require 'json'\n${versions}`));
      }
      return nativeConfig;
    }],
  );
};
