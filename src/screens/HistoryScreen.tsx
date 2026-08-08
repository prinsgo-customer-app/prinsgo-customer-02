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
import { getRideHistory } from '../api/rides';
import { getParcelHistory } from '../api/parcels';
import { printRideInvoice, printParcelInvoice } from '../utils/invoice';
import BottomNav from '../components/BottomNav';
import { COLORS } from '../utils/theme';

const STATUS_COLORS = {
  completed: COLORS.green,
  delivered: COLORS.green,
  cancelled: COLORS.red,
};

export default function HistoryScreen({ route }) {
  const [tab, setTab] = useState(route?.params?.initialTab || 'rides');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<any>(null);

  const load = useCallback(async (mode) => {
    try {
      if (mode === 'rides') {
        const res = await getRideHistory(1, 30);
        setItems(res.data.rides || []);
      } else {
        const res = await getParcelHistory(1, 30);
        setItems(res.data.parcels || []);
      }
    } catch (err: unknown) {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(tab);
  }, [tab, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(tab);
  };

  const downloadInvoice = async (item) => {
    setDownloadingId(item._id);
    try {
      if (tab === 'rides') {
        await printRideInvoice(item);
      } else {
        await printParcelInvoice(item);
      }
    } catch (err: unknown) {
      Alert.alert('Error', "Couldn't generate invoice. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const isCompleted = (item) => item.status === 'completed' || item.status === 'delivered';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'rides' && styles.tabActive]}
          onPress={() => setTab('rides')}
        >
          <Text style={[styles.tabText, tab === 'rides' && styles.tabTextActive]}>🚗 Rides</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'parcels' && styles.tabActive]}
          onPress={() => setTab('parcels')}
        >
          <Text style={[styles.tabText, tab === 'parcels' && styles.tabTextActive]}>📦 Parcels</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No {tab === 'rides' ? 'ride' : 'parcel'} history yet.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                <Text style={[styles.status, { color: STATUS_COLORS[item.status] || COLORS.textLight }]}>
                  {item.status}
                </Text>
              </View>
              {tab === 'rides' ? (
                <>
                  <Text style={styles.address}>From: {item.pickup?.address}</Text>
                  <Text style={styles.address}>To: {item.drop?.address}</Text>
                  <Text style={styles.fare}>₹{Math.round(item.fare?.totalFare || 0)}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.address}>To: {item.drop?.contactName} · {item.drop?.address}</Text>
                  <Text style={styles.fare}>₹{Math.round(item.charges?.totalCharge || 0)}</Text>
                </>
              )}
              {isCompleted(item) && (
                <TouchableOpacity
                  style={styles.invoiceButton}
                  onPress={() => downloadInvoice(item)}
                  disabled={downloadingId === item._id}
                >
                  {downloadingId === item._id ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Text style={styles.invoiceButtonText}>📄 Download Invoice</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
      <BottomNav active="History" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 50 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, color: COLORS.textLight, fontWeight: '600' },
  tabTextActive: { color: COLORS.textPrimary, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: COLORS.textLight, marginTop: 60 },
  card: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, marginBottom: 10, backgroundColor: COLORS.background },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  date: { fontSize: 12, color: COLORS.textLight },
  status: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  address: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  fare: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginTop: 6 },
  invoiceButton: {
    marginTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, alignItems: 'center',
  },
  invoiceButtonText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
});
