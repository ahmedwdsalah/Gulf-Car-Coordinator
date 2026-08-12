import { Color } from 'expo-router';
import { ScrollView, View, Text, Pressable } from 'react-native';

const c = Color.android.dynamic;

const NEARBY_PLACES = [
  { name: 'Philz Coffee', type: 'Coffee Shop', distance: '0.2 mi' },
  { name: 'Golden Gate Park', type: 'Park', distance: '0.8 mi' },
  { name: 'Whole Foods Market', type: 'Grocery', distance: '0.3 mi' },
  { name: 'UCSF Medical Center', type: 'Hospital', distance: '1.2 mi' },
  { name: 'Public Library', type: 'Library', distance: '0.5 mi' },
];

const CATEGORIES = [
  { label: 'Restaurants' },
  { label: 'Gas' },
  { label: 'Coffee' },
  { label: 'Hotels' },
];

const FAVORITES = [
  { letter: 'H', label: 'Home', bg: c.primaryContainer, fg: c.onPrimaryContainer },
  { letter: 'W', label: 'Work', bg: c.secondaryContainer, fg: c.onSecondaryContainer },
  { letter: 'G', label: 'Gym', bg: c.tertiaryContainer, fg: c.onTertiaryContainer },
];

export default function Sheet() {
  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 10, gap: 16 }}>
      {/* Drag handle */}
      <View style={{ alignItems: 'center', paddingBottom: 16 }}>
        <View style={{
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: c.outlineVariant,
        }} />
      </View>

      {/* Category chips */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {CATEGORIES.map((cat) => (
          <Pressable key={cat.label} style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            borderCurve: 'continuous',
            backgroundColor: c.secondaryContainer,
          }}>
            <Text style={{ fontSize: 14, color: c.onSecondaryContainer }}>{cat.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Favorites */}
      <View style={{
        backgroundColor: c.surfaceContainerLow,
        borderRadius: 16,
        borderCurve: 'continuous',
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: c.onSurface }}>Favorites</Text>
          <Pressable>
            <Text style={{ fontSize: 14, fontWeight: '500', color: c.primary }}>More</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          {FAVORITES.map((fav) => (
            <Pressable key={fav.label} style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              borderCurve: 'continuous',
              backgroundColor: fav.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 22, fontWeight: '600', color: fav.fg }}>{fav.letter}</Text>
              <Text style={{ fontSize: 11, color: fav.fg, marginTop: 2 }}>{fav.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Nearby */}
      <Text style={{ fontSize: 16, fontWeight: '600', color: c.onSurface, marginTop: 4 }}>Nearby</Text>
      <View style={{
        borderRadius: 16,
        backgroundColor: c.onSecondaryContainer,
      }}>
        {NEARBY_PLACES.map((place, i) => (
          <Pressable key={place.name} style={{ padding: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: c.primary }}>{place.distance}</Text>
            <Text style={{ fontSize: 16, color: c.onSurface, marginTop: 2 }}>{place.name}</Text>
            <Text style={{ fontSize: 14, color: c.onSurfaceVariant, marginTop: 1 }}>{place.type}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
