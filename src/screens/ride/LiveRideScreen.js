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
  // Crash preventer: Securely extract rideId
  const params = route?.params || {};
  const rideId = params.rideId || params.id || null;

  const [ride, setRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRide = useCallback(async () => {
    if (!rideId) {
      setErrorMsg("Ride ID is missing from navigation.");
      setLoading(false);
      return;
    }
    
    try {
      const res = await getRideById(rideId);
      // Handles both axios 'res.data.ride' and standard fetch 'res.ride'
      const fetchedRide = res?.data?.ride || res?.ride;

      if (fetchedRide) {
        setRide(fetchedRide);
        if (fetchedRide.status === 'completed') {
          navigation.replace('RateRide', { rideId });
        }
      } else {
        setErrorMsg("Ride data not found on server.");
      }
    } catch (err) {
      console.log("LiveRide Fetch Error:", err);
      setErrorMsg(err?.response?.data?.message || err?.message || "Failed to fetch ride");
    } finally {
      // Yeh line ensure karegi ki spinner kabhi stuck na ho
      setLoading(false);
    }
  }, [rideId]); // Navigation removed from dependencies to prevent infinite re-renders

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
      unsubscribe();
    };
  }, [fetchRide, rideId]);

  // UI 1: Loading State (Ab text bhi dikhega)
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1877F2" />
        <Text style={{ marginTop: 12, color: '#666', fontWeight: 'bold' }}>Fetching your ride...</Text>
      </View>
    );
  }

  // UI 2: Error State (White screen ki jagah reason dikhega)
  if (errorMsg || !ride) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'red' }}>Oops! Something went wrong.</Text>
        <Text style={{ marginTop: 10, textAlign: 'center', paddingHorizontal: 20 }}>{errorMsg || "No Ride Found"}</Text>
        <Text style={{ marginTop: 10, color: '#888' }}>Ride ID: {rideId || 'None'}</Text>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.replace('Home')}>
          <Text style={styles.cancelText}>Go Back Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // MapView Crash Preventer (Fallback coordinates)
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
        {/* Strict boolean checks to prevent MapView children crashes */}
        {ride?.pickup?.lat && ride?.pickup?.lng ? (
          <Marker
            coordinate={{
              latitude: Number(ride.pickup.lat),
              longitude: Number(ride.pickup.lng),
            }}
            title="Pickup"
          />
        ) : null}

        {ride?.drop?.lat && ride?.drop?.lng ? (
          <Marker
            coordinate={{
              latitude: Number(ride.drop.lat),
              longitude: Number(ride.drop.lng),
            }}
            title="Drop"
            pinColor="green"
          />
        ) : null}

        {driverLocation?.lat && driverLocation?.lng ? (
          <Marker
            coordinate={{
              latitude: Number(driverLocation.lat),
              longitude: Number(driverLocation.lng),
            }}
            title="Driver"
            pinColor="blue"
          />
        ) : null}
      </MapView>

      <View style={styles.sheet}>
        <Text style={styles.status}>
          {STATUS_LABELS[ride?.status] || ride?.status || 'Processing...'}
        </Text>

        {/* Safe Driver Rendering */}
        {ride?.driver && typeof ride.driver === 'object' ? (
          <View>
            <Text style={styles.driverName}>
              {ride.driver?.name || 'Driver Assigned'}
            </Text>
            <Text style={styles.driverInfo}>
              {ride.driver?.vehicleNumber || 'Vehicle details pending'}
            </Text>
            <Text style={styles.driverInfo}>
              ⭐ {ride.driver?.rating ? Number(ride.driver.rating).toFixed(1) : "5.0"}
            </Text>
          </View>
        ) : ride?.status === 'requested' ? (
          <Text style={styles.driverInfo}>Looking for nearby drivers...</Text>
        ) : null}

        {/* OTP DISPLAY LOGIC (Customer ki screen par dikhega) */}
        {ride?.startOtp && (ride?.status === 'accepted' || ride?.status === 'driver_arrived') ? (
          <View style={{ marginTop: 15, padding: 10, backgroundColor: '#f0f6ff', borderRadius: 8 }}>
            <Text style={{ fontSize: 13, color: '#666', fontWeight: 'bold' }}>Share this OTP with your driver:</Text>
            <Text style={styles.otp}>{String(ride.startOtp)}</Text>
          </View>
        ) : null}

        {/* Cancel Button */}
        {(ride?.status === 'requested' || ride?.status === 'accepted') ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              Alert.alert(
                "Cancel Ride",
                "Do you want to cancel this ride?",
                [
                  { text: "No" },
                  {
                    text: "Yes, Cancel",
                    style: 'destructive',
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
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  sheet: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5 },
  status: { fontSize: 20, fontWeight: '800', marginBottom: 12, color: '#0A0F24' },
  driverName: { fontSize: 17, fontWeight: '700', marginBottom: 4, color: '#0A0F24' },
  driverInfo: { color: '#666', marginBottom: 4, fontSize: 14 },
  otp: { marginTop: 4, fontSize: 28, color: '#1877F2', fontWeight: '900', letterSpacing: 4 },
  cancelButton: { marginTop: 20, backgroundColor: '#E53935', padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
