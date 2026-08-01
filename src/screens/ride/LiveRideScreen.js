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
  const { rideId } = route.params || {};

  const [ride, setRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRide = useCallback(async () => {
    if (!rideId) return;
    try {
      const res = await getRideById(rideId);
      const fetchedRide = res?.data?.ride;

      if (fetchedRide) {
        setRide(fetchedRide);
        if (fetchedRide.status === 'completed') {
          navigation.replace('RateRide', { rideId });
        }
      }
    } catch (err) {
      console.log("LiveRide Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [rideId, navigation]);

  useEffect(() => {
    fetchRide();

    if (rideId) {
      try {
        joinRideRoom(rideId);
      } catch (e) {
        console.log("Socket Join Error:", e);
      }
    }

    let unsubscribe = () => {};
    try {
      unsubscribe = onDriverLocation((location) => {
        // Sirf valid location aane par hi update karein warna Map crash hoga
        if (location?.lat && location?.lng) {
          setDriverLocation({
            lat: Number(location.lat),
            lng: Number(location.lng),
          });
        }
      });
    } catch (e) {
      console.log("Socket Location Error:", e);
    }

    const timer = setInterval(fetchRide, 5000);

    return () => {
      clearInterval(timer);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [fetchRide, rideId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1877F2" />
        <Text style={{ marginTop: 12, color: '#666' }}>Fetching ride details...</Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>No Ride Found</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.replace('Home')}>
          <Text style={{ color: '#1877F2', fontWeight: 'bold' }}>Go Back Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Fallback coordinates taaki Map kabhi crash na ho
  const safeLat = Number(ride?.pickup?.lat) || 18.5204;
  const safeLng = Number(ride?.pickup?.lng) || 73.8567;

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
        {ride?.pickup?.lat && ride?.pickup?.lng && (
          <Marker
            coordinate={{
              latitude: Number(ride.pickup.lat),
              longitude: Number(ride.pickup.lng),
            }}
            title="Pickup"
          />
        )}

        {ride?.drop?.lat && ride?.drop?.lng && (
          <Marker
            coordinate={{
              latitude: Number(ride.drop.lat),
              longitude: Number(ride.drop.lng),
            }}
            title="Drop"
            pinColor="green"
          />
        )}

        {driverLocation?.lat && driverLocation?.lng && (
          <Marker
            coordinate={{
              latitude: Number(driverLocation.lat),
              longitude: Number(driverLocation.lng),
            }}
            title="Driver"
            pinColor="blue"
          />
        )}
      </MapView>

      <View style={styles.sheet}>
        <Text style={styles.status}>
          {STATUS_LABELS[ride?.status] || ride?.status || 'Processing...'}
        </Text>

        {/* 🚨 CRASH FIX: Checking properly if driver object exists */}
        {ride?.driver && typeof ride.driver === 'object' ? (
          <>
            <Text style={styles.driverName}>
              {ride.driver?.name || 'Driver Assigned'}
            </Text>
            <Text style={styles.driverInfo}>
              {ride.driver?.vehicleNumber || 'Vehicle details pending'}
            </Text>
            <Text style={styles.driverInfo}>
              ⭐ {ride.driver?.rating ? Number(ride.driver.rating).toFixed(1) : "5.0"}
            </Text>
          </>
        ) : ride?.status === 'requested' ? (
          <Text style={styles.driverInfo}>Looking for nearby drivers...</Text>
        ) : null}

        {/* OTP Dikhane ka Sahi Logic */}
        {ride?.startOtp ? (
          ['accepted', 'driver_arrived'].includes(ride?.status) && (
            <Text style={styles.otp}>
              OTP : {String(ride.startOtp)}
            </Text>
          )
        ) : null}

        {['requested', 'accepted'].includes(ride?.status) && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              Alert.alert(
                "Cancel Ride",
                "Do you want to cancel this ride?",
                [
                  { text: "No" },
                  {
                    text: "Yes",
                    onPress: async () => {
                      try {
                        await cancelRide(rideId, "Cancelled by customer");
                        navigation.replace("Home");
                      } catch (e) {
                        Alert.alert("Error", e?.response?.data?.message || e.message);
                      }
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.cancelText}>Cancel Ride</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sheet: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5 },
  status: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#0A0F24' },
  driverName: { fontSize: 17, fontWeight: '700', marginBottom: 4, color: '#0A0F24' },
  driverInfo: { color: '#666', marginBottom: 4, fontSize: 14 },
  otp: { marginTop: 10, fontSize: 24, color: '#1877F2', fontWeight: '800', letterSpacing: 2 },
  cancelButton: { marginTop: 20, backgroundColor: '#E53935', padding: 15, borderRadius: 10, alignItems: 'center' },
  cancelText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
