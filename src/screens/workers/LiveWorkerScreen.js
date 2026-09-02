import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { getWorkerBookingById } from '../../api/workers';
import { joinWorkerRoom, onWorkerStatusUpdate } from '../../api/socket';
import { COLORS } from '../../utils/theme';
import { formatId } from '../../utils/idGenerator';

const STATUS_LABELS = {
  requested: 'Looking for a professional...',
  accepted: 'Worker has accepted your request',
  assigned: 'Worker is on the way',
  on_the_way: 'Worker is arriving shortly',
  arrived: 'Worker has arrived',
  started: 'Service in progress',
  completed: 'Service completed',
  cancelled: 'Booking cancelled',
};

export default function LiveWorkerScreen({ route, navigation }) {
  const params = route?.params || {};
  const bookingId = params.bookingId || params.id || null;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchBooking = useCallback(async () => {
    if (!bookingId) {
      setErrorMsg("Booking ID is missing from navigation.");
      setLoading(false);
      return;
    }

    try {
      const res = await getWorkerBookingById(bookingId);
      const fetchedBooking = res?.data?.booking || res?.data?.workerBooking || res?.data?.job || res?.data;

      if (fetchedBooking) {
        setBooking(fetchedBooking);
        if (fetchedBooking.status === 'completed') {
          navigation.replace('History', { initialTab: 'workers' });
        }
      } else {
        setErrorMsg("Booking data not found on server.");
      }
    } catch (err) {
      console.log("LiveWorker Fetch Error:", err);
      setErrorMsg(err?.response?.data?.message || err?.message || "Failed to fetch booking");
    } finally {
      setLoading(false);
    }
  }, [bookingId, navigation]);

  useEffect(() => {
    fetchBooking();

    if (bookingId) {
      try {
        joinWorkerRoom(bookingId);
      } catch (e) {
        console.log("Socket Join Error:", e);
      }
    }

    let unsubscribe = () => {};
    try {
      unsubscribe = onWorkerStatusUpdate((update) => {
        if (update && (update.workerId === bookingId || update.bookingId === bookingId || update.id === bookingId)) {
          setBooking(prev => prev ? { ...prev, status: update.status } : prev);
        }
      });
    } catch (e) {
      console.log("Socket Update Error:", e);
    }

    const timer = setInterval(fetchBooking, 5000);

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [fetchBooking, bookingId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: COLORS.textSecondary, fontWeight: 'bold' }}>Loading your booking...</Text>
      </View>
    );
  }

  if (errorMsg || !booking) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.red }}>Oops! Something went wrong.</Text>
        <Text style={{ marginTop: 10, textAlign: 'center', paddingHorizontal: 20, color: COLORS.textSecondary }}>{errorMsg || "No Booking Found"}</Text>
        <Text style={{ marginTop: 10, color: COLORS.textLight }}>Booking ID: {formatId('WRK', bookingId) || 'None'}</Text>
        <TouchableOpacity style={styles.goHomeBtn} onPress={() => navigation.replace('MainTabs')}>
          <Text style={styles.goHomeText}>Go Back Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const safeLat = Number(booking?.location?.lat || booking?.address?.lat) || 18.5204;
  const safeLng = Number(booking?.location?.lng || booking?.address?.lng) || 73.8567;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: safeLat,
          longitude: safeLng,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        <Marker
            coordinate={{
              latitude: safeLat,
              longitude: safeLng,
            }}
            title="Service Location"
            pinColor="green"
        />
      </MapView>

      <View style={styles.sheet}>
        <Text style={{ color: COLORS.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4 }}>
          JOB STATUS (ID: {formatId('WRK', booking?._id)})
        </Text>
        <Text style={styles.status}>
          {STATUS_LABELS[booking?.status] || booking?.status || 'Processing...'}
        </Text>

        {booking?.worker && typeof booking.worker === 'object' ? (
          <View>
            <Text style={styles.driverName}>
              {booking.worker?.name || 'Professional Assigned'}
            </Text>
            <Text style={styles.driverInfo}>
              Category: {booking.category || 'Service'}
            </Text>
            <Text style={styles.driverInfo}>
              Rating: ⭐ {booking.worker?.rating ? Number(booking.worker.rating).toFixed(1) : "5.0"}
            </Text>
          </View>
        ) : booking?.status === 'requested' || booking?.status === 'pending' ? (
          <Text style={styles.driverInfo}>Looking for nearby professionals...</Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          {(booking?.status === 'requested' || booking?.status === 'pending' || booking?.status === 'accepted' || booking?.status === 'assigned') ? (
            <TouchableOpacity
              style={[styles.cancelButton, { flex: 1, marginTop: 0 }]}
              onPress={() => {
                Alert.alert(
                  "Cancel Booking",
                  "Do you want to cancel this booking?",
                  [
                    { text: "No" },
                    {
                      text: "Yes, Cancel",
                      style: 'destructive',
                      onPress: async () => {
                          navigation.replace("MainTabs");
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.cancelText}>Cancel Booking</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: COLORS.background },
  sheet: { backgroundColor: COLORS.background, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5 },
  status: { fontSize: 20, fontWeight: '800', marginBottom: 12, color: COLORS.textPrimary },
  driverName: { fontSize: 17, fontWeight: '700', marginBottom: 4, color: COLORS.textPrimary },
  driverInfo: { color: COLORS.textSecondary, marginBottom: 4, fontSize: 14 },
  cancelButton: { marginTop: 20, backgroundColor: COLORS.red, padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelText: { color: COLORS.background, fontWeight: '700', fontSize: 16 },
  goHomeBtn: { marginTop: 20, backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  goHomeText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 16 },
});
