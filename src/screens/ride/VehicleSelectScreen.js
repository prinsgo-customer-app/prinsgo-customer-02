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

// API services
import { estimateFare } from '../../api/rides';
import { bookRideApi } from '../../services/rideService';

const VEHICLE_LABELS = {
  bike: { label: 'Bike', icon: '🏍️' },
  auto: { label: 'Auto', icon: '🛺' },
  car_mini: { label: 'Mini Car', icon: '🚗' },
  car_sedan: { label: 'Sedan', icon: '🚘' },
};

export default function VehicleSelectScreen({ route, navigation }) {
  const { pickup, drop } = route.params || {};

  const [estimates, setEstimates] = useState([]);
  const [selected, setSelected] = useState('bike');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    getFare();
  }, []);

  const getFare = async () => {
    const pLat = pickup?.lat || pickup?.latitude;
    const pLng = pickup?.lng || pickup?.longitude;
    const dLat = drop?.lat || drop?.latitude;
    const dLng = drop?.lng || drop?.longitude;

    if (!pLat || !pLng || !dLat || !dLng) {
      Alert.alert('Location Error', 'Pickup or drop location missing', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const res = await estimateFare(pLat, pLng, dLat, dLng);
      setEstimates(res?.data?.estimates || res?.estimates || []);
    } catch (error) {
      console.log('FARE ERROR', error);
      Alert.alert('Error', 'Unable to calculate fare');
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async () => {
    if (!pickup || !drop || !selected) {
      Alert.alert('Booking Error', 'Pickup, drop and vehicle required');
      return;
    }

    setBooking(true);

    try {
      const pLat = pickup?.lat || pickup?.latitude;
      const pLng = pickup?.lng || pickup?.longitude;
      const dLat = drop?.lat || drop?.latitude;
      const dLng = drop?.lng || drop?.longitude;

      // New API service call
      const res = await bookRideApi({
        pickupAddress: pickup.address || 'Current Location',
        pickupLat: pLat,
        pickupLng: pLng,
        dropAddress: drop.address || 'Drop Location',
        dropLat: dLat,
        dropLng: dLng,
        vehicleType: selected,
        paymentMethod: 'cash',
      });

      const rideId = res?.ride?._id || res?.data?.ride?._id;

      if (!rideId) {
        Alert.alert(
          'Booking Failed',
          res?.message || res?.data?.message || 'Ride ID not received from server'
        );
        return;
      }

      // Booking success -> Go to Live Ride screen
      navigation.replace('LiveRide', {
        rideId: rideId,
      });
    } catch (error) {
      console.log('BOOK ERROR', error);
      Alert.alert('Booking Error', error?.message || 'Something went wrong');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1877F2" />
        <Text style={styles.loadingText}>Finding best fare...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Ride</Text>

      <FlatList
        data={estimates}
        keyExtractor={(item) => item.vehicleType}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              selected === item.vehicleType && styles.selected,
            ]}
            onPress={() => setSelected(item.vehicleType)}
          >
            <Text style={styles.icon}>
              {VEHICLE_LABELS[item.vehicleType]?.icon || '🚕'}
            </Text>

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {VEHICLE_LABELS[item.vehicleType]?.label || item.vehicleType}
              </Text>

              <Text style={styles.duration}>{item.durationMin || 0} min</Text>
            </View>

            <Text style={styles.price}>
              ₹{Math.round(item.totalFare || 0)}
            </Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={confirmBooking}
        disabled={booking}
      >
        {booking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Book Ride</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 15,
    marginBottom: 12,
  },
  selected: {
    borderColor: '#1877F2',
    backgroundColor: '#eef6ff',
  },
  icon: {
    fontSize: 35,
    marginRight: 15,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  duration: {
    color: '#666',
    marginTop: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
  },
  button: {
    backgroundColor: '#1877F2',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
