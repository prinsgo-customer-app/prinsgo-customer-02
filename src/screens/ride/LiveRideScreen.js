import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { getRideById, cancelRide } from '../../api/rides';
import { joinRideRoom, onDriverLocation } from '../../api/socket';

const STATUS_LABELS = {
  requested: 'Searching for a driver...',
  accepted: 'Driver is on the way',
  driver_arrived: 'Driver has arrived',
  started: 'Trip in progress',
  completed: 'Trip completed',
  cancelled: 'Trip cancelled',
};

export default function LiveRideScreen({ route, navigation }) {
  const { rideId } = route.params;
  const [ride, setRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRide = useCallback(async () => {
    try {
      const res = await getRideById(rideId);
      setRide(res.data.ride);
      if (res.data.ride.status === 'completed') {
        navigation.replace('RateRide', { rideId });
      }
    } catch (err) {
      // ignore transient errors
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    fetchRide();
    joinRideRoom(rideId);
    const unsubscribe = onDriverLocation(({ lat, lng }) => setDriverLocation({ lat, lng }));

    const poll = setInterval(fetchRide, 6000);
    return () => {
      unsubscribe();
      clearInterval(poll);
    };
  }, [rideId]);

  const handleCancel = () => {
    Alert.alert('Cancel ride?', 'Are you sure you want to cancel this ride?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelRide(rideId, 'Cancelled by customer');
            navigation.replace('Home');
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  if (loading || !ride) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1877F2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: ride.pickup.lat,
          longitude: ride.pickup.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={{ latitude: ride.pickup.lat, longitude: ride.pickup.lng }} title="Pickup" />
        <Marker
          coordinate={{ latitude: ride.drop.lat, longitude: ride.drop.lng }}
          title="Drop"
          pinColor="green"
        />
        {driverLocation && (
          <Marker
            coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}
            title="Driver"
            pinColor="blue"
          />
        )}
      </MapView>

      <View style={styles.sheet}>
        <Text style={styles.status}>{STATUS_LABELS[ride.status] || ride.status}</Text>

        {ride.driver && (
          <View style={styles.driverRow}>
            <Text style={styles.driverName}>{ride.driver.name}</Text>
            <Text style={styles.driverMeta}>
              {ride.driver.vehicleNumber} • ⭐ {ride.driver.rating?.toFixed(1) || '—'}
            </Text>
          </View>
        )}

        {ride.startOtp && ['accepted', 'driver_arrived'].includes(ride.status) && (
          <Text style={styles.otp}>Share OTP with driver: {ride.startOtp}</Text>
        )}

        {['requested', 'accepted'].includes(ride.status) && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel ride</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { flex: 1 },
  sheet: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  status: { fontSize: 17, fontWeight: '700', color: '#0A0F24', marginBottom: 10 },
  driverRow: { marginBottom: 10 },
  driverName: { fontSize: 15, fontWeight: '600' },
  driverMeta: { fontSize: 13, color: '#888' },
  otp: { fontSize: 15, fontWeight: '600', color: '#1877F2', marginBottom: 10 },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#e53935',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  cancelText: { color: '#e53935', fontWeight: '700' },
});
