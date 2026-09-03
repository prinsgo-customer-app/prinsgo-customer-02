import React, { useEffect, useState, useCallback, } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { getRideHistory } from '../api/rides';
import { getParcelHistory } from '../api/parcels';
import { getWorkerHistory } from '../api/workers';
import { generateRideInvoice, generateParcelInvoice, generateWorkerInvoice } from '../utils/invoice';
import BottomNav from '../components/BottomNav';
import { COLORS } from '../utils/theme';
import { formatId } from '../utils/idGenerator';
import AnimatedCard from '../components/AnimatedCard';
import { joinWorkerRoom, onWorkerStatusUpdate } from '../api/socket';

const STATUS_COLORS = {
  completed: COLORS.green,
  delivered: COLORS.green,
  cancelled: COLORS.red,
  active: COLORS.primary,
  pending: COLORS.orange,
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const BookingCard = ({ item, tab, index, downloadInvoice, downloadingId, navigation }) => {
  const isCompleted = item.status === 'completed' || item.status === 'delivered';


  return (
    <AnimatedCard
      delay={index * 50}
      style={styles.card}
      onPress={() => {
        if (tab === 'workers') {
          navigation.navigate('LiveWorker', { bookingId: item._id });
        }
      }}
    >
      <View style={styles.cardTop}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>
            {tab === 'rides' ? '🚗 RIDE' : tab === 'workers' ? '🛠️ WORKER' : '📦 PARCEL'}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: (STATUS_COLORS[item.status] || COLORS.border) + '20' }
        ]}>
          <Text style={[styles.status, { color: STATUS_COLORS[item.status] || COLORS.textSecondary }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.idText}>ID: {tab === 'rides' ? formatId('RID', item._id) : tab === 'workers' ? formatId('WRK', item._id) : formatId('PRC', item._id)}</Text>

        <View style={styles.routeContainer}>
          {tab === 'rides' ? (
            <>
              <View style={styles.routePoint}>
                <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.address} numberOfLines={1}>{item.pickup?.address}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <View style={[styles.dot, { backgroundColor: COLORS.green }]} />
                <Text style={styles.address} numberOfLines={1}>{item.drop?.address}</Text>
              </View>
            </>
          ) : tab === 'workers' ? (
            <View style={styles.routePoint}>
              <View style={[styles.dot, { backgroundColor: COLORS.green }]} />
              <Text style={styles.address} numberOfLines={2}>Task: {item.taskDescription}</Text>
            </View>
          ) : (
            <View style={styles.routePoint}>
              <View style={[styles.dot, { backgroundColor: COLORS.green }]} />
              <Text style={styles.address} numberOfLines={2}>To: {item.drop?.contactName} · {item.drop?.address}</Text>
            </View>
          )}
        </View>

        <View style={styles.fareContainer}>
          <Text style={styles.fareLabel}>{tab === 'workers' ? 'Estimated Price' : 'Total Fare'}</Text>
          <Text style={styles.fare}>
            ₹{Math.round(tab === 'rides' ? (item.fare?.totalFare || 0) : tab === 'workers' ? (item.price || item.estimatedPrice || 0) : (item.charges?.totalCharge || 0))}
          </Text>
        </View>
      </View>

      {isCompleted && (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <TouchableOpacity
            style={[styles.invoiceButton, { flex: 1, marginTop: 0 }]}
            onPress={() => downloadInvoice(item)}
            disabled={downloadingId === item._id}
          >
            {downloadingId === item._id ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.invoiceButtonText}>Download Invoice</Text>
            )}
          </TouchableOpacity>

          {tab === 'workers' && (
             <TouchableOpacity
             style={[styles.invoiceButton, { flex: 1, marginTop: 0, backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
             onPress={() => navigation.navigate('WorkerReview', { bookingId: item._id })}
           >
             <Text style={[styles.invoiceButtonText, { color: COLORS.textPrimary }]}>Rate & Review</Text>
           </TouchableOpacity>
          )}
        </View>
      )}
    </AnimatedCard>
  );
};

export default function HistoryScreen({ route, navigation }) {
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
      } else if (mode === 'workers') {
        const res = await getWorkerHistory(1, 30);
        setItems(res.data.workers || []);
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

  useEffect(() => {
    if (tab !== 'workers') return;

    const unsubscribe = onWorkerStatusUpdate((update) => {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item._id === update.workerId || item._id === update.bookingId ? { ...item, status: update.status } : item
        )
      );
    });

    return () => {
      unsubscribe();
    };
  }, [tab]);

  useEffect(() => {
    if (tab !== 'workers' || items.length === 0) return;

    // Join rooms for all active worker bookings to get real-time updates
    items.forEach(item => {
      if (item.status !== 'completed' && item.status !== 'cancelled') {
        joinWorkerRoom(item._id);
      }
    });
  }, [items.length, tab]);

  const onRefresh = () => {
    setRefreshing(true);
    load(tab);
  };

  const downloadInvoice = async (item) => {
    setDownloadingId(item._id);
    try {
      if (tab === 'rides') {
        await generateRideInvoice(item);
      } else if (tab === 'workers') {
        await generateWorkerInvoice(item);
      } else {
        await generateParcelInvoice(item);
      }
    } catch (err) {
      Alert.alert('Error', "Couldn't generate invoice. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentTab, tab === 'rides' && styles.segmentTabActive]}
          onPress={() => setTab('rides')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, tab === 'rides' && styles.segmentTextActive]}>Rides</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentTab, tab === 'parcels' && styles.segmentTabActive]}
          onPress={() => setTab('parcels')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, tab === 'parcels' && styles.segmentTextActive]}>Parcels</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentTab, tab === 'workers' && styles.segmentTabActive]}
          onPress={() => setTab('workers')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, tab === 'workers' && styles.segmentTextActive]}>Workers</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <AnimatedFlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>{tab === 'rides' ? '🚖' : tab === 'workers' ? '🛠️' : '📦'}</Text>
              <Text style={styles.emptyTitle}>No {tab === 'rides' ? 'rides' : tab === 'workers' ? 'workers' : 'parcels'} yet</Text>
              <Text style={styles.emptyText}>
                Your past and upcoming bookings will appear here.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <BookingCard
              item={item}
              tab={tab}
              index={index}
              downloadInvoice={downloadInvoice}
              downloadingId={downloadingId}
              navigation={navigation}
            />
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
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentTabActive: {
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '700' },
  segmentTextActive: { color: '#000', fontWeight: '800' },
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  emptyText: { textAlign: 'center', color: COLORS.textLight, fontSize: 15, fontWeight: '500', lineHeight: 22 },
  card: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  badgeContainer: { backgroundColor: COLORS.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  status: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBody: { marginBottom: 4 },
  date: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '800', marginBottom: 4 },
  idText: { fontSize: 13, color: COLORS.textLight, fontWeight: '600', marginBottom: 16 },
  routeContainer: { marginBottom: 16 },
  routePoint: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  address: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600', flex: 1 },
  routeLine: { width: 2, height: 16, backgroundColor: COLORS.border, marginLeft: 4, marginVertical: 4 },
  fareContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  fareLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '700' },
  fare: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary },
  invoiceButton: {
    marginTop: 16, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
  },
  invoiceButtonText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800' },
});
