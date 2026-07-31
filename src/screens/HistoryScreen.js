import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { getRideHistory } from '../api/rides';
import { getParcelHistory } from '../api/parcels';

const STATUS_COLORS = {
  completed: '#16A34A',
  delivered: '#16A34A',
  cancelled: '#DC2626',
};

export default function HistoryScreen() {
  const [tab, setTab] = useState('rides');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
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
          <ActivityIndicator size="large" color="#1877F2" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No {tab === 'rides' ? 'ride' : 'parcel'} history yet.
            </Text>
          }
          renderItem={({ item }) =>
            tab === 'rides' ? (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  <Text style={[styles.status, { color: STATUS_COLORS[item.status] || '#888' }]}>
                    {item.status}
                  </Text>
                </View>
                <Text style={styles.address}>From: {item.pickup?.address}</Text>
                <Text style={styles.address}>To: {item.drop?.address}</Text>
                <Text style={styles.fare}>₹{Math.round(item.fare?.totalFare || 0)}</Text>
              </View>
            ) : (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  <Text style={[styles.status, { color: STATUS_COLORS[item.status] || '#888' }]}>
                    {item.status}
                  </Text>
                </View>
                <Text style={styles.address}>To: {item.drop?.contactName} · {item.drop?.address}</Text>
                <Text style={styles.fare}>₹{Math.round(item.charges?.totalCharge || 0)}</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 50 },
  title: { fontSize: 22, fontWeight: '700', color: '#0A0F24' },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#1877F2' },
  tabText: { fontSize: 14, color: '#888', fontWeight: '600' },
  tabTextActive: { color: '#1877F2' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 60 },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  date: { fontSize: 12, color: '#999' },
  status: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  address: { fontSize: 13, color: '#333', marginBottom: 2 },
  fare: { fontSize: 15, fontWeight: '700', color: '#0A0F24', marginTop: 6 },
});
