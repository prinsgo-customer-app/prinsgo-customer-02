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
import { generateRideInvoice, generateParcelInvoice } from '../utils/invoice';
import BottomNav from '../components/BottomNav';
import { COLORS } from '../utils/theme';
import { formatId } from '../utils/idGenerator';

const STATUS_COLORS = {
  completed: COLORS.green,
  delivered: COLORS.green,
  cancelled: COLORS.red,
};

export default function HistoryScreen({ route }) {
  const [tab, setTab] = useState(route?.params?.initialTab || 'rides');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const load = useCallback(async (mode) => {
    try {
      if (mode === 'rides') {
        const res = await getRideHistory(1, 30);
        setItems(res.data.rides || []);
      } else {
        const res = await getParcelHistory(1, 30);
        setItems(res.data.parcels || []);
      }
    } catch (err) {
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
        await generateRideInvoice(item);
      } else {
        await generateParcelInvoice(item);
      }
    } catch (err) {
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
                <Text style={styles.date}>
                  ID: {tab === 'rides' ? formatId('RID', item._id) : formatId('PRC', item._id)} · {new Date(item.createdAt).toLocaleDateString()}
                </Text>
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
  header: { paddingHorizontal: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 15, color: COLORS.textLight, fontWeight: '600' },
  tabTextActive: { color: COLORS.textPrimary, fontWeight: '800' },
  emptyText: { textAlign: 'center', color: COLORS.textLight, marginTop: 60, fontSize: 15, fontWeight: '500' },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    backgroundColor: COLORS.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  date: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  status: { fontSize: 13, fontWeight: '800', textTransform: 'capitalize' },
  address: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4, fontWeight: '500', lineHeight: 20 },
  fare: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary, marginTop: 8 },
  invoiceButton: {
    marginTop: 14, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 14, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 6
  },
  invoiceButtonText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800' },
});
