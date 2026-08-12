import { useEffect } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useIsFocused, useRouter } from 'expo-router';

const SF_COORDINATES = {
  latitude: 37.7749,
  longitude: -122.4194,
};

const MARKERS = [
  { id: '1', coordinate: { latitude: 37.7849, longitude: -122.4094 }, title: 'Coffee House', description: 'Open until 9 PM' },
  { id: '2', coordinate: { latitude: 37.7699, longitude: -122.4294 }, title: 'Golden Gate Park', description: 'Park & Recreation' },
  { id: '3', coordinate: { latitude: 37.7789, longitude: -122.4144 }, title: 'Central Market', description: 'Groceries & More' },
];

export default function MapsPage() {
  const isFocused = useIsFocused();
  const router = useRouter();

  useEffect(() => {
    if (isFocused) {
      router.push('/sheet');
    }
  }, [isFocused]);

  return (
    <MapView
      style={{ flex: 1 }}
      provider={PROVIDER_GOOGLE}
      initialCamera={{
        center: SF_COORDINATES,
        heading: 0,
        pitch: 0,
        zoom: 10,
      }}
      zoomControlEnabled={false}
      toolbarEnabled={false}
    >
      {MARKERS.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={marker.coordinate}
          title={marker.title}
          description={marker.description}
        />
      ))}
    </MapView>
  );
}
