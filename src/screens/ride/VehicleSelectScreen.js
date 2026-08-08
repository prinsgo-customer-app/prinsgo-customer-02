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
import { COLORS } from '../../utils/theme';

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
      setEstimates(res?.data?.estimates ||  (res)?.estimates || []);
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

      const res = await bookRide({
        pickup: {
          address: pickup.address || 'Current Location',
          lat: pLat,
          lng: pLng,
        },
        drop: {
          address: drop.address || 'Drop Location',
          lat: dLat,
          lng: dLng,
        },
        vehicleType: selected,
        paymentMethod: 'cash',
      });

      const rideId = res?.data?.ride?._id;

      if (!rideId) {
        Alert.alert('Booking Failed', res?.data?.message || 'Ride ID not received from server');
        return;
      }

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
        <ActivityIndicator size="large" color={COLORS.primary} />
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
          <ActivityIndicator color={COLORS.textPrimary} />
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
    backgroundColor: COLORS.background,
    padding: 20,
    paddingTop: 60,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    color: COLORS.textPrimary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    marginBottom: 12,
    backgroundColor: COLORS.background,
  },
  selected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardBg,
  },
  icon: {
    fontSize: 35,
    marginRight: 15,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  duration: {
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
});
