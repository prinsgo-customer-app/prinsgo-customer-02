import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getWorkers, getWorkersCategories } from '../../api/workers';
import AnimatedCard from '../../components/AnimatedCard';

export default function WorkerListScreen({ route, navigation }) {
  const { colors } = useTheme();

  const initialCategory = route?.params?.categoryId || '';
  const initialSearch = route?.params?.searchQuery || '';

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('popular');

  // Debounce for search
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [catRes, workerRes] = await Promise.all([
        getWorkersCategories().catch(() => ({ data: { categories: [] } })),
        getWorkers({
          categoryId: selectedCategory,
          search: debouncedSearch,
          sort: sortBy
        }).catch(() => ({ data: { workers: [] } })),
      ]);
      setCategories(catRes.data?.categories || []);
      setWorkers(workerRes.data?.workers || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load workers list.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, debouncedSearch, sortBy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderCategory = ({ item }) => {
    const isActive = selectedCategory === item._id;
    return (
      <TouchableOpacity
        style={[
          styles.categoryBtn,
          {
            backgroundColor: isActive ? colors.primary : colors.cardBg,
            borderColor: colors.border
          }
        ]}
        onPress={() => setSelectedCategory(item._id)}
      >
        <Text style={{ color: isActive ? '#fff' : colors.textPrimary, fontWeight: '700' }}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderWorker = ({ item }) => (
    <AnimatedCard
      style={[styles.workerCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
      onPress={() => navigation.navigate('WorkerDetails', { workerId: item._id })}
    >
      <View style={styles.workerRow}>
        <View style={[styles.workerImagePlaceholder, { backgroundColor: colors.background }]}>
          <Text style={{ fontSize: 24 }}>🧑‍🔧</Text>
        </View>
        <View style={{ flex: 1, paddingLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.workerName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
            {item.verified && (
              <View style={[styles.badge, { backgroundColor: colors.green + '20' }]}>
                <Text style={{ fontSize: 10, color: colors.green, fontWeight: 'bold' }}>✓ Verified</Text>
              </View>
            )}
          </View>
          <Text style={[styles.workerCategory, { color: colors.textSecondary }]}>{item.category || item.workerServiceCategories?.[0]?.name}</Text>
          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '700', marginTop: 4 }}>
            ⭐ {item.rating || 'New'} • {item.completedJobs || 0} jobs
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.priceTag, { color: colors.textPrimary }]}>₹{item.basePrice || item.startingPrice || 0}</Text>
          <Text style={{ fontSize: 10, color: colors.textLight }}>Starts at</Text>
          <TouchableOpacity
            style={[styles.bookBtnSmall, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('WorkerDetails', { workerId: item._id })}
          >
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textPrimary }}>Book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedCard>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Professionals</Text>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search for a professional..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        {/* Categories Horizontal List */}
        <View style={{ marginBottom: 16 }}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ _id: '', name: 'All' }, ...categories.filter(c => c.isActive !== false)]}
            keyExtractor={item => item._id || 'all'}
            renderItem={renderCategory}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          />
        </View>

        {/* Sort Controls */}
        <View style={styles.sortContainer}>
          <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>{workers.length} professionals found</Text>
          <TouchableOpacity onPress={() => {
            const nextSort = sortBy === 'popular' ? 'rating' : sortBy === 'rating' ? 'price' : 'popular';
            setSortBy(nextSort);
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
              Sort: {sortBy === 'popular' ? 'Top Rated' : sortBy === 'rating' ? 'Highest Rating' : 'Lowest Price'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Workers List */}
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={workers}
            keyExtractor={item => item._id}
            renderItem={renderWorker}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>👷</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No professionals available in this category yet.
                </Text>
              </View>
            }
          />
        )}
      </View>
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
  content: { flex: 1, paddingTop: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  resultsCount: { fontSize: 12, fontWeight: '600' },
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
});
