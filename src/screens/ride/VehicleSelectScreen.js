import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { estimateFare, bookRide } from '../../api/rides';

const VEHICLE_LABELS = {
  bike: { label: 'Bike', icon: '🏍️' },
  auto: { label: 'Auto', icon: '🛺' },
  car_mini: { label: 'Mini', icon: '🚗' },
  car_sedan: { label: 'Sedan', icon: '🚘' },
};

export default function VehicleSelectScreen({ route, navigation }) {
  const { pickup, drop } = route.params || {};
  const [estimates, setEstimates] = useState([]);
  const [selected, setSelected] = useState('car_mini');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    loadEstimate();
  }, []);

  const loadEstimate = async () => {
    if (!pickup?.lat || !drop?.lat) {
      Alert.alert('Missing Location', 'Pickup or drop location is missing. Please go back and try again.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }
    try {
      const res = await estimateFare(pickup.lat, pickup.lng, drop.lat, drop.lng);
      // Optional chaining used to prevent crashes
      setEstimates(res?.data?.estimates || res?.estimates || []);
    } catch (err) {
      console.log("Estimate Error:", err);
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to fetch estimates');
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async () => {
    setBooking(true);
    try {
      const res = await bookRide(
        { address: pickup?.address || 'Current location', lat: pickup?.lat, lng: pickup?.lng },
        { address: drop?.address || 'Selected Drop', lat: drop?.lat, lng: drop?.lng },
        selected,
        'cash'
      );

      // 🚨 CRASH FIX: Safely extract rideId whether using Axios or standard Fetch
      const rideId = res?.data?.ride?._id || res?.ride?._id;

      if (!rideId) {
        // Agar backend se ID nahi aayi toh crash hone se roko aur error dikhao
        const errorMsg = res?.data?.message || res?.message || 'Failed to generate Ride ID from server.';
        Alert.alert('Booking Failed', errorMsg);
        setBooking(false);
        return;
      }

      // Agar sab theek hai toh LiveRide par bhejo
      navigation.replace('LiveRide', { rideId: rideId });

    } catch (err) {
      console.log("Booking Crash Error:", err);
      // Backend ka real error message screen par dikhane ke liye:
      Alert.alert('Booking failed', err?.response?.data?.message || err.message || 'Something went wrong');
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1877F2" />
        <Text style={{ marginTop: 10, color: '#666' }}>Finding best prices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a ride</Text>
      <FlatList
        data={estimates}
        keyExtractor={(item) => item.vehicleType}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, selected === item.vehicleType && styles.cardSelected]}
            onPress={() => setSelected(item.vehicleType)}
          >
            <Text style={styles.icon}>{VEHICLE_LABELS[item.vehicleType]?.icon || '🚕'}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.vehicleLabel}>{VEHICLE_LABELS[item.vehicleType]?.label || item.vehicleType}</Text>
              <Text style={styles.vehicleSub}>{Math.round(item.durationMin || 0)} min away</Text>
            </View>
            <Text style={styles.fare}>₹{Math.round(item.totalFare || 0)}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={[styles.bookButton, booking && { opacity: 0.7 }]}
        onPress={confirmBooking}
        disabled={booking}
      >
        {booking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.bookButtonText}>Book {VEHICLE_LABELS[selected]?.label || 'Ride'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 20, color: '#0A0F24' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#eaeaea',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardSelected: { borderColor: '#1877F2', backgroundColor: '#f0f6ff' },
  icon: { fontSize: 32 },
  vehicleLabel: { fontSize: 17, fontWeight: '700', color: '#0A0F24' },
  vehicleSub: { fontSize: 13, color: '#666', marginTop: 2 },
  fare: { fontSize: 18, fontWeight: '800', color: '#0A0F24' },
  bookButton: {
    backgroundColor: '#1877F2',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    elevation: 3,
  },
  bookButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
