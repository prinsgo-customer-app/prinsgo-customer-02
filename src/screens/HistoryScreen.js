import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getRideHistory } from '../api/rides';
import { getParcelHistory } from '../api/parcels';
import { generateRideInvoice, generateParcelInvoice } from '../utils/invoice';
import BottomNav from '../components/BottomNav';
import AnimatedCard from '../components/AnimatedCard';
import { useTheme } from '../context/ThemeContext';
import { formatId } from '../utils/idGenerator';

const VEHICLE_ICONS = {
  bike: 'compass',
  auto: 'layers',
  car_mini: 'navigation',
  car_sedan: 'navigation',
};

const STATUS_CHIPS = {
  searching: { label: 'Searching', bg: '#e2e8f0', color: '#475569' },
  'driver-assigned': { label: 'Driver Assigned', bg: '#eff6ff', color: '#1d4ed8' },
  arriving: { label: 'Arriving', bg: '#fef3c7', color: '#d97706' },
  'in-progress': { label: 'In Progress', bg: '#f0fdf4', color: '#16a34a' },
  completed: { label: 'Completed', bg: '#ecfdf5', color: '#047857' },
  delivered: { label: 'Delivered', bg: '#ecfdf5', color: '#047857' },
  cancelled: { label: 'Cancelled', bg: '#fef2f2', color: '#b91c1c' },
  'refund-pending': { label: 'Refund Pending', bg: '#fff7ed', color: '#c2410c' },
  refunded: { label: 'Refunded', bg: '#f0fdfa', color: '#0f766e' },
};

export default function HistoryScreen({ route }) {
  const { colors } = useTheme();

  const [category, setCategory] = useState(route?.params?.initialTab || 'rides'); // 'rides' | 'parcels'
  const [subFilter, setSubFilter] = useState('all'); // 'all' | 'active' | 'completed' | 'cancelled'
  const [rawItems, setRawItems] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const load = useCallback(async (cat) => {
    try {
      if (cat === 'rides') {
        const res = await getRideHistory(1, 40);
        setRawItems(res.data?.rides || []);
      } else {
        const res = await getParcelHistory(1, 40);
        setRawItems(res.data?.parcels || []);
      }
    } catch (err) {
      setRawItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(category);
  }, [category, load]);

  // Apply Sub-Filters dynamically on the loaded rawItems
  useEffect(() => {
    let filtered = [...rawItems];
    if (subFilter !== 'all') {
      filtered = rawItems.filter((item) => {
        const status = item.status?.toLowerCase();
        if (subFilter === 'active') {
          return status !== 'completed' && status !== 'delivered' && status !== 'cancelled' && status !== 'refunded';
        }
        if (subFilter === 'completed') {
          return status === 'completed' || status === 'delivered';
        }
        if (subFilter === 'cancelled') {
          return status === 'cancelled';
        }
        return true;
      });
    }
    setItems(filtered);
  }, [rawItems, subFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    load(category);
  };

  const downloadInvoice = async (item) => {
    setDownloadingId(item._id);
    try {
      if (category === 'rides') {
        await generateRideInvoice(item);
      } else {
        await generateParcelInvoice(item);
      }
    } catch (err) {
      Alert.alert('Invoice Generation Failed', "Could not render or share the invoice. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const isInvoiceDownloadable = (item) => {
    const status = item.status?.toLowerCase();
    return status === 'completed' || status === 'delivered';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Redesigned Header Area */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Bookings & Invoices</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
          Manage your rides, parcel couriers, and dynamic invoices
        </Text>
      </View>

      {/* Category Segment Control */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <TouchableOpacity
          style={[styles.tab, category === 'rides' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setCategory('rides')}
        >
          <View style={styles.tabContent}>
            <Feather name="navigation" size={14} color={category === 'rides' ? colors.primary : colors.textLight} />
            <Text style={[styles.tabText, category === 'rides' ? { color: colors.textPrimary, fontWeight: '700' } : { color: colors.textLight }]}>Rides</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, category === 'parcels' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setCategory('parcels')}
        >
          <View style={styles.tabContent}>
            <Feather name="box" size={14} color={category === 'parcels' ? colors.primary : colors.textLight} />
            <Text style={[styles.tabText, category === 'parcels' ? { color: colors.textPrimary, fontWeight: '700' } : { color: colors.textLight }]}>Parcels</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Filter Chips Sub-tabs (All, Active, Completed, Cancelled) */}
      <View style={styles.chipsRow}>
        {['all', 'active', 'completed', 'cancelled'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              { borderColor: colors.border },
              subFilter === f && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setSubFilter(f)}
          >
            <Text style={[styles.filterChipText, { color: colors.textSecondary }, subFilter === f && { color: '#0A0F24', fontWeight: '700' }]}>
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="calendar" size={36} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No {subFilter !== 'all' ? `${subFilter} ` : ''}{category === 'rides' ? 'rides' : 'parcels'} found.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const chip = STATUS_CHIPS[item.status?.toLowerCase()] || { label: item.status, bg: colors.cardBg, color: colors.textSecondary };
            return (
              <AnimatedCard style={styles.card}>

                {/* ID & Status Line */}
                <View style={styles.cardTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name={category === 'rides' ? 'navigation' : 'box'} size={12} color={colors.primary} />
                    <Text style={[styles.date, { color: colors.textLight }]}>
                      ID: {category === 'rides' ? formatId('RID', item._id) : formatId('PRC', item._id)}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
                    <Text style={[styles.statusText, { color: chip.color }]}>{chip.label.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Details Section */}
                <View style={styles.routeDetails}>
                  {category === 'rides' ? (
                    <>
                      <View style={styles.routeRow}>
                        <View style={[styles.routeDot, { backgroundColor: colors.green }]} />
                        <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>From: {item.pickup?.address}</Text>
                      </View>
                      <View style={styles.routeRow}>
                        <View style={[styles.routeDot, { backgroundColor: colors.red }]} />
                        <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>To: {item.drop?.address}</Text>
                      </View>
                      <View style={styles.pricingRow}>
                        <Text style={{ fontSize: 11, color: colors.textLight }}>VEHICLE: {item.vehicleType?.toUpperCase()}</Text>
                        <Text style={[styles.fare, { color: colors.textPrimary }]}>₹{Math.round(item.fare?.totalFare || 0)}</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.routeRow}>
                        <View style={[styles.routeDot, { backgroundColor: colors.green }]} />
                        <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>Pickup: {item.pickup?.address}</Text>
                      </View>
                      <View style={styles.routeRow}>
                        <View style={[styles.routeDot, { backgroundColor: colors.red }]} />
                        <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>Recipient: {item.drop?.contactName} · {item.drop?.address}</Text>
                      </View>
                      <View style={styles.pricingRow}>
                        <Text style={{ fontSize: 11, color: colors.textLight }}>METHOD: {item.paymentMethod?.toUpperCase()}</Text>
                        <Text style={[styles.fare, { color: colors.textPrimary }]}>₹{Math.round(item.charges?.totalCharge || 0)}</Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Download/Invoice Button if completed */}
                {isInvoiceDownloadable(item) && (
                  <TouchableOpacity
                    style={[styles.invoiceButton, { borderTopColor: colors.border }]}
                    onPress={() => downloadInvoice(item)}
                    disabled={downloadingId === item._id}
                  >
                    {downloadingId === item._id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Feather name="file-text" size={14} color={colors.primary} />
                        <Text style={[styles.invoiceButtonText, { color: colors.primary }]}>Download Premium Invoice</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </AnimatedCard>
            );
          }}
        />
      )}
      <BottomNav active="History" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 54 },
  title: { fontSize: 20, fontWeight: '800' },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 14 },
  tab: { flex: 1, paddingVertical: 12 },
  tabContent: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  tabText: { fontSize: 13, fontWeight: '600' },
  chipsRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  filterChip: { borderWidth: 1, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 14 },
  filterChipText: { fontSize: 10, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyText: { fontSize: 13, fontWeight: '700' },

  card: { borderRadius: 16, padding: 14, marginBottom: 12, borderHeight: 1, marginVertical: 0 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  date: { fontSize: 11, fontWeight: '700' },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '800' },

  routeDetails: { gap: 6 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeDot: { width: 6, height: 6, borderRadius: 3 },
  address: { fontSize: 12 },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  fare: { fontSize: 15, fontWeight: '800' },

  invoiceButton: {
    marginTop: 12, borderTopWidth: 1, paddingTop: 10, alignItems: 'center', justifyContent: 'center',
  },
  invoiceButtonText: { fontSize: 12, fontWeight: '800' },
});
