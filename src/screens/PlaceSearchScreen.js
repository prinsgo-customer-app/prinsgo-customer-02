import React, { useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { searchPlaces, placeDetails } from '../api/places';
import { COLORS } from '../utils/theme';

export default function PlaceSearchScreen({ route, navigation }) {
  const { mode, currentLocation } = route.params;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  let debounceTimer;
  const onChangeText = (text) => {
    setQuery(text);
    clearTimeout(debounceTimer);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchPlaces(text, currentLocation?.lat, currentLocation?.lng);
        setResults(res.data.predictions || []);
      } catch (err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const selectPlace = async (item) => {
    try {
      const res = await placeDetails(item.placeId || item.place_id);
      const drop = {
        address: res.data.address || item.description,
        lat: res.data.lat,
        lng: res.data.lng,
      };
      if (mode === 'ride') {
        navigation.replace('VehicleSelect', { pickup: currentLocation, drop });
      } else {
        navigation.replace('ParcelDetails', { pickup: currentLocation, drop });
      }
    } catch (err) {
      // ignore
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        autoFocus
        style={styles.input}
        placeholder="Search for a location"
        placeholderTextColor={COLORS.textLight}
        value={query}
        onChangeText={onChangeText}
      />
      {loading && <ActivityIndicator style={{ marginTop: 10 }} color={COLORS.primary} />}
      <FlatList
        data={results}
        keyExtractor={(item, idx) => item.placeId || item.place_id || String(idx)}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => selectPlace(item)}>
            <Text style={styles.rowText}>{item.description || item.address}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 60, paddingHorizontal: 16 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowText: { fontSize: 15, color: COLORS.textPrimary },
});
