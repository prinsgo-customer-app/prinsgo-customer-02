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
import { COLORS } from '../../utils/theme';

const STATUS_LABELS = {
  requested: 'Searching for a driver...',
  accepted: 'Driver is on the way',
  driver_arrived: 'Driver has arrived',
  started: 'Trip in progress',
  completed: 'Trip completed',
  cancelled: 'Trip cancelled',
};

export default function LiveRideScreen({ route, navigation }) {
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
      setLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    fetchRide();

    if (rideId) {
      try {
        joinRideRoom(rideId);
      } catch (_e) {
        console.log("Socket Join Error: Failed to join ride room");
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
    } catch (_e) {
      console.log("Socket Location Error: Failed to setup location listener");
    }

    const timer = window.setInterval(fetchRide, 5000);

    return () => {
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [fetchRide, rideId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: COLORS.textSecondary, fontWeight: 'bold' }}>Fetching your ride...</Text>
      </View>
    );
  }

  if (errorMsg || !ride) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.red }}>Oops! Something went wrong.</Text>
        <Text style={{ marginTop: 10, textAlign: 'center', paddingHorizontal: 20, color: COLORS.textSecondary }}>{errorMsg || "No Ride Found"}</Text>
        <Text style={{ marginTop: 10, color: COLORS.textLight }}>Ride ID: {rideId || 'None'}</Text>
        <TouchableOpacity style={styles.goHomeBtn} onPress={() => navigation.replace('Home')}>
          <Text style={styles.goHomeText}>Go Back Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

        {ride?.startOtp && (ride?.status === 'accepted' || ride?.status === 'driver_arrived') ? (
          <View style={{ marginTop: 15, padding: 12, backgroundColor: COLORS.cardBg, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border }}>
            <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 'bold' }}>Share this OTP with your driver:</Text>
            <Text style={styles.otp}>{String(ride.startOtp)}</Text>
          </View>
        ) : null}

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
  container: { flex: 1, backgroundColor: COLORS.background },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: COLORS.background },
  sheet: { backgroundColor: COLORS.background, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5 },
  status: { fontSize: 20, fontWeight: '800', marginBottom: 12, color: COLORS.textPrimary },
  driverName: { fontSize: 17, fontWeight: '700', marginBottom: 4, color: COLORS.textPrimary },
  driverInfo: { color: COLORS.textSecondary, marginBottom: 4, fontSize: 14 },
  otp: { marginTop: 4, fontSize: 28, color: COLORS.textPrimary, fontWeight: '900', letterSpacing: 4 },
  cancelButton: { marginTop: 20, backgroundColor: COLORS.red, padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelText: { color: COLORS.background, fontWeight: '700', fontSize: 16 },
  goHomeBtn: { marginTop: 20, backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  goHomeText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 16 },
});
