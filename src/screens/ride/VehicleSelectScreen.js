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
  const { pickup, drop } = route.params;
  const [estimates, setEstimates] = useState([]);
  const [selected, setSelected] = useState('car_mini');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    loadEstimate();
  }, []);

  const loadEstimate = async () => {
    try {
      const res = await estimateFare(pickup.lat, pickup.lng, drop.lat, drop.lng);
      setEstimates(res.data.estimates || []);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async () => {
    setBooking(true);
    try {
      const res = await bookRide(
        { address: pickup.address || 'Current location', lat: pickup.lat, lng: pickup.lng },
        { address: drop.address, lat: drop.lat, lng: drop.lng },
        selected,
        'cash'
      );
      navigation.replace('LiveRide', { rideId: res.data.ride._id });
    } catch (err) {
      Alert.alert('Booking failed', err.message);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1877F2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a ride</Text>
      <FlatList
        data={estimates}
        keyExtractor={(item) => item.vehicleType}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, selected === item.vehicleType && styles.cardSelected]}
            onPress={() => setSelected(item.vehicleType)}
          >
            <Text style={styles.icon}>{VEHICLE_LABELS[item.vehicleType]?.icon}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.vehicleLabel}>{VEHICLE_LABELS[item.vehicleType]?.label}</Text>
              <Text style={styles.vehicleSub}>{Math.round(item.durationMin || 0)} min away</Text>
            </View>
            <Text style={styles.fare}>₹{Math.round(item.totalFare)}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={[styles.bookButton, booking && { opacity: 0.6 }]}
        onPress={confirmBooking}
        disabled={booking}
      >
        {booking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.bookButtonText}>Book {VEHICLE_LABELS[selected]?.label}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#0A0F24' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardSelected: { borderColor: '#1877F2', backgroundColor: '#f0f6ff' },
  icon: { fontSize: 28 },
  vehicleLabel: { fontSize: 16, fontWeight: '600', color: '#0A0F24' },
  vehicleSub: { fontSize: 13, color: '#888' },
  fare: { fontSize: 16, fontWeight: '700', color: '#0A0F24' },
  bookButton: {
    backgroundColor: '#1877F2',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
