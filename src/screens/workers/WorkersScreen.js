import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '../../context/ThemeContext';
import { getWorkersCategories, getWorkers } from '../../api/workers';
import AnimatedCard from '../../components/AnimatedCard';
import BottomNav from '../../components/BottomNav';

export default function WorkersScreen({ navigation }) {
  const { colors } = useTheme();

  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [sortBy, setSortBy] = useState('popular');

  const loadLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const currentLoc = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setCurrentLocation(currentLoc);

      const [address] = await Location.reverseGeocodeAsync({
        latitude: currentLoc.lat,
        longitude: currentLoc.lng
      });

      if (address) {
        setLocationError(`${address.city || address.subregion || address.region || ''}`);
      } else {
        setLocationError('Current Location unlocked');
      }

    } catch (err) {
      setLocationError('Error fetching location');
    } finally {
      setLocationLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, workerRes] = await Promise.all([
        getWorkersCategories().catch(() => ({ data: { categories: [] } })),
        getWorkers({ categoryId: selectedCategory, search: searchQuery, sort: sortBy }).catch(() => ({ data: { workers: [] } })),
      ]);
      setCategories(catRes.data?.categories || []);
      setWorkers(workerRes.data?.workers || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load workers data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocation();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery, sortBy]);

  const handleSearchSubmit = () => {
    // Search is handled via the debouncer on text change automatically
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Workers</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Location Display */}
        <View style={styles.locationContainer}>
          <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
            📍 {locationLoading ? 'Getting location...' : currentLocation ? (locationError === 'Permission denied' || locationError === 'Error fetching location' ? locationError : locationError || 'Current Location unlocked') : locationError || 'Getting location...'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('PlaceSearch', { onSelect: (loc) => {
            setCurrentLocation({ lat: loc.lat, lng: loc.lng });
            setLocationError(loc.address || 'Selected Location');
          }})}>
            <Text style={[styles.changeText, { color: colors.primary }]}>CHANGE</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search for a service or worker..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Popular Services</Text>
          <TouchableOpacity onPress={() => {
            const nextSort = sortBy === 'popular' ? 'rating' : sortBy === 'rating' ? 'price' : 'popular';
            setSortBy(nextSort);
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
              Sort: {sortBy === 'popular' ? 'Top Rated' : sortBy === 'rating' ? 'Highest Rating' : 'Lowest Price'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Popular Services / Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <TouchableOpacity
            style={[
              styles.categoryBtn,
              { backgroundColor: selectedCategory === '' ? colors.primary : colors.cardBg, borderColor: colors.border }
            ]}
            onPress={() => setSelectedCategory('')}
          >
            <Text style={{ color: selectedCategory === '' ? '#fff' : colors.textPrimary, fontWeight: '700' }}>All</Text>
          </TouchableOpacity>
          {categories.filter(c => c.isActive !== false).map((cat, idx) => (
            <TouchableOpacity
              key={cat._id || idx}
              style={[
                styles.categoryBtn,
                { backgroundColor: selectedCategory === cat._id ? colors.primary : colors.cardBg, borderColor: colors.border }
              ]}
              onPress={() => setSelectedCategory(cat._id)}
            >
              <Text style={{ color: selectedCategory === cat._id ? '#fff' : colors.textPrimary, fontWeight: '700' }}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Verified Professionals */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 10 }]}>Verified Professionals</Text>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : workers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>👷</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No workers available in your area yet.</Text>
          </View>
        ) : (
          workers.map((worker) => (
            <AnimatedCard
              key={worker._id}
              style={[styles.workerCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
              onPress={() => navigation.navigate('WorkerDetails', { workerId: worker._id })}
            >
              <View style={styles.workerRow}>
                <View style={[styles.workerImagePlaceholder, { backgroundColor: colors.background }]}>
                  <Text style={{ fontSize: 24 }}>🧑‍🔧</Text>
                </View>
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.workerName, { color: colors.textPrimary }]}>{worker.name}</Text>
                    {worker.verified && (
                      <View style={[styles.badge, { backgroundColor: colors.green + '20' }]}>
                        <Text style={{ fontSize: 10, color: colors.green, fontWeight: 'bold' }}>✓ Verified</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.workerCategory, { color: colors.textSecondary }]}>{worker.category || worker.workerServiceCategories?.[0]?.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '700', marginTop: 4 }}>
                    ⭐ {worker.rating || 'New'} • {worker.completedJobs || 0} jobs done
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.priceTag, { color: colors.textPrimary }]}>₹{worker.basePrice || worker.startingPrice || 0}</Text>
                  <Text style={{ fontSize: 10, color: colors.textLight }}>Starts at</Text>
                  <TouchableOpacity
                    style={[styles.bookBtnSmall, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate('WorkerDetails', { workerId: worker._id })}
                  >
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textPrimary }}>Book</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </AnimatedCard>
          ))
        )}
      </ScrollView>

      {/* Reusable Bottom Navigation */}
      <BottomNav active="Home" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: { marginBottom: 6 },
  backText: { fontSize: 14, fontWeight: '600' },
  title: { fontWeight: '800', fontSize: 20 },
  container: { flex: 1 },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: { fontSize: 13, flex: 1, fontWeight: '500' },
  changeText: { fontSize: 11, fontWeight: '700' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  workerCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workerName: {
    fontSize: 16,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  workerCategory: {
    fontSize: 13,
    marginTop: 2,
  },
  priceTag: {
    fontSize: 16,
    fontWeight: '900',
  },
  bookBtnSmall: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
});
