import React, { useState, useRef, useEffect } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';

export default function PlaceSearchScreen({ route, navigation }) {
  const { mode, currentLocation } = route.params;
  const { colors } = useTheme();
  const { fontSizeMultiplier } = useAccessibility();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const debounceTimerRef = useRef(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const onChangeText = (text) => {
    setQuery(text);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (text.trim().length < 2) {
      setResults([]);
      setErrorMsg(null);
      return;
    }
    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await searchPlaces(text, currentLocation?.lat, currentLocation?.lng);
        const list = res.data?.predictions || [];
        setResults(list);
        if (list.length === 0) {
          setErrorMsg("No matching locations found. Please try again or type a popular landmark.");
        }
      } catch (err) {
        setResults([]);
        setErrorMsg("Location service temporarily unavailable. Please type your location manually.");
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const selectPlace = async (item) => {
    try {
      const res = await placeDetails(item.placeId || item.place_id);
      const drop = {
        address: res.data?.address || item.description,
        lat: res.data?.lat,
        lng: res.data?.lng,
      };
      if (mode === 'ride') {
        navigation.replace('VehicleSelect', { pickup: currentLocation, drop });
      } else {
        navigation.replace('ParcelDetails', { pickup: currentLocation, drop });
      }
    } catch (err) {
      setErrorMsg("Failed to retrieve location details. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Back Link */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.textPrimary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: 18 * fontSizeMultiplier }]}>
          {mode === 'ride' ? 'Select Destination' : 'Select Delivery Point'}
        </Text>
      </View>

      <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          autoFocus
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder="Type an address or city..."
          placeholderTextColor={colors.textLight}
          value={query}
          onChangeText={onChangeText}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setErrorMsg(null); }}>
            <Text style={[styles.clearText, { color: colors.textLight }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>Searching address...</Text>
        </View>
      )}

      {errorMsg && (
        <View style={[styles.errorContainer, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{errorMsg}</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item, idx) => item.placeId || item.place_id || String(idx)}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          !loading && !errorMsg && query.trim().length >= 2 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textLight }]}>No results. Try typing another landmark.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => selectPlace(item)}
          >
            <View style={styles.rowLayout}>
              <Text style={styles.markerIcon}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowText, { color: colors.textPrimary, fontSize: 15 * fontSizeMultiplier }]}>
                  {item.description || item.address}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <View style={styles.madeInIndiaContainer}>
        <Text style={[styles.madeInIndiaText, { color: colors.textLight }]}>Made in India 🇮🇳</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 54,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  clearText: {
    fontSize: 16,
    fontWeight: '600',
    padding: 4,
  },
  row: { paddingVertical: 16, borderBottomWidth: 1 },
  rowLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markerIcon: {
    fontSize: 18,
  },
  rowText: { fontSize: 15, fontWeight: '500' },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    padding: 14,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 14,
  },
  madeInIndiaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  madeInIndiaText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
