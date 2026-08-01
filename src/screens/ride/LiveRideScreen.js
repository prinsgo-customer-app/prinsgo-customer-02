import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
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

      console.log("Ride Data =>", JSON.stringify(res.data.ride, null, 2));

      setRide(res.data.ride);

      if (res.data.ride.status === 'completed') {
        navigation.replace('RateRide', { rideId });
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    fetchRide();

    joinRideRoom(rideId);

    const unsubscribe = onDriverLocation((location) => {
      if (!location) return;

      setDriverLocation({
        lat: Number(location.lat),
        lng: Number(location.lng),
      });
    });

    const timer = setInterval(fetchRide, 5000);

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1877F2" />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.center}>
        <Text>No Ride Found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
<View
  style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  }}
>
  <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
    Live Ride
  </Text>

  <Text style={{ marginTop: 20 }}>
    Ride ID: {ride?._id}
  </Text>

  <Text style={{ marginTop: 10 }}>
    Status: {ride?.status}
  </Text>
</View>>

      <View style={styles.sheet}>
        <Text style={styles.status}>
          {STATUS_LABELS[ride.status] || ride.status}
        </Text>

        {ride.driver && (
          <>
            <Text style={styles.driverName}>
              {ride.driver.name || 'Driver'}
            </Text>

            <Text style={styles.driverInfo}>
              {ride.driver.vehicleNumber || '-'}
            </Text>

            <Text style={styles.driverInfo}>
              ⭐ {ride.driver.rating ? Number(ride.driver.rating).toFixed(1) : "0.0"}
            </Text>
          </>
        )}

        {ride.startOtp &&
          ['accepted', 'driver_arrived'].includes(ride.status) && (
            <Text style={styles.otp}>
              OTP : {ride.startOtp}
            </Text>
          )}

        {['requested', 'accepted'].includes(ride.status) && (
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
                        await cancelRide(
                          rideId,
                          "Cancelled by customer"
                        );

                        navigation.replace("Home");
                      } catch (e) {
                        Alert.alert("Error", e.message);
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
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sheet: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  status: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },

  driverName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 5,
  },

  driverInfo: {
    color: '#666',
    marginBottom: 3,
  },

  otp: {
    marginTop: 15,
    fontSize: 22,
    color: '#1877F2',
    fontWeight: '700',
  },

  cancelButton: {
    marginTop: 20,
    backgroundColor: '#E53935',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  cancelText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
