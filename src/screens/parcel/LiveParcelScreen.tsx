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
import { getParcelById, cancelParcel } from '../../api/parcels';
import { joinParcelRoom, onDriverLocation } from '../../api/socket';
import { COLORS } from '../../utils/theme';

const STATUS_LABELS = {
  requested: 'Looking for a delivery partner...',
  accepted: 'Delivery partner is on the way to pickup',
  picked_up: 'Parcel picked up',
  in_transit: 'On the way to drop location',
  delivered: 'Parcel delivered',
  cancelled: 'Delivery cancelled',
};

export default function LiveParcelScreen({ route, navigation }) {
  const params = route?.params || {};
  const parcelId = params.parcelId || params.id || null;

  const [parcel, setParcel] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchParcel = useCallback(async () => {
    if (!parcelId) {
      setErrorMsg('Parcel ID is missing from navigation.');
      setLoading(false);
      return;
    }
    try {
      const res = await getParcelById(parcelId);
      const fetchedParcel = res?.data?.parcel;
      if (fetchedParcel) {
        setParcel(fetchedParcel);
      } else {
        setErrorMsg('Parcel data not found on server.');
      }
    } catch (err: unknown) {
      setErrorMsg((err as any)?.message || 'Failed to fetch parcel');
    } finally {
      setLoading(false);
    }
  }, [parcelId]);

  useEffect(() => {
    fetchParcel();

    if (parcelId) {
      try {
        joinParcelRoom(parcelId);
      } catch (e: unknown) {
        // ignore
      }
    }

    let unsubscribe = () => {};
    try {
      unsubscribe = onDriverLocation((location) => {
        if (location?.lat && location?.lng) {
          setDriverLocation({ lat: Number(location.lat), lng: Number(location.lng) });
        }
      });
    } catch (e: unknown) {
      // ignore
    }

    const timer = setInterval(fetchParcel, 5000);

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [fetchParcel, parcelId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: COLORS.textSecondary, fontWeight: 'bold' }}>
          Fetching your parcel...
        </Text>
      </View>
    );
  }

  if (errorMsg || !parcel) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.red }}>Oops! Something went wrong.</Text>
        <Text style={{ marginTop: 10, textAlign: 'center', paddingHorizontal: 20, color: COLORS.textSecondary }}>
          {errorMsg || 'No parcel found'}
        </Text>
        <TouchableOpacity style={styles.doneButton} onPress={() => navigation.replace('Home')}>
          <Text style={styles.doneText}>Go Back Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const safeLat = Number(parcel?.pickup?.lat) || 18.5204;
  const safeLng = Number(parcel?.pickup?.lng) || 73.8567;
  const canCancel = ['requested', 'accepted'].includes(parcel?.status);

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
        {parcel?.pickup?.lat && parcel?.pickup?.lng ? (
          <Marker
            coordinate={{ latitude: Number(parcel.pickup.lat), longitude: Number(parcel.pickup.lng) }}
            title="Pickup"
          />
        ) : null}

        {parcel?.drop?.lat && parcel?.drop?.lng ? (
          <Marker
            coordinate={{ latitude: Number(parcel.drop.lat), longitude: Number(parcel.drop.lng) }}
            title="Drop"
            pinColor="green"
          />
        ) : null}

        {driverLocation?.lat && driverLocation?.lng ? (
          <Marker
            coordinate={{ latitude: Number(driverLocation.lat), longitude: Number(driverLocation.lng) }}
            title="Delivery Partner"
            pinColor="blue"
          />
        ) : null}
      </MapView>

      <View style={styles.sheet}>
        <Text style={styles.status}>
          {STATUS_LABELS[parcel?.status] || parcel?.status || 'Processing...'}
        </Text>

        {parcel?.driver && typeof parcel.driver === 'object' ? (
          <View>
            <Text style={styles.driverName}>{parcel.driver?.name || 'Delivery Partner Assigned'}</Text>
            <Text style={styles.driverInfo}>{parcel.driver?.vehicleNumber || 'Vehicle details pending'}</Text>
          </View>
        ) : parcel?.status === 'requested' ? (
          <Text style={styles.driverInfo}>Looking for a nearby delivery partner...</Text>
        ) : null}

        {parcel?.receiverOtp && ['accepted', 'picked_up', 'in_transit'].includes(parcel?.status) ? (
          <View style={{ marginTop: 15, padding: 12, backgroundColor: COLORS.cardBg, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border }}>
            <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 'bold' }}>
              Share this OTP with the receiver — the delivery partner needs it to complete delivery:
            </Text>
            <Text style={styles.otp}>{String(parcel.receiverOtp)}</Text>
          </View>
        ) : null}

        {parcel?.status === 'delivered' ? (
          <TouchableOpacity style={styles.doneButton} onPress={() => navigation.replace('Home')}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        ) : canCancel ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              Alert.alert('Cancel Delivery', 'Do you want to cancel this parcel delivery?', [
                { text: 'No' },
                {
                  text: 'Yes, Cancel',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await cancelParcel(parcelId, 'Cancelled by customer');
                      navigation.replace('Home');
                    } catch (e: unknown) {
                      Alert.alert('Error', (e as any)?.message || 'Failed to cancel');
                    }
                  },
                },
              ]);
            }}
          >
            <Text style={styles.cancelText}>Cancel Delivery</Text>
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
  sheet: {
    backgroundColor: COLORS.background, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5,
  },
  status: { fontSize: 20, fontWeight: '800', marginBottom: 12, color: COLORS.textPrimary },
  driverName: { fontSize: 17, fontWeight: '700', marginBottom: 4, color: COLORS.textPrimary },
  driverInfo: { color: COLORS.textSecondary, marginBottom: 4, fontSize: 14 },
  otp: { marginTop: 4, fontSize: 28, color: COLORS.textPrimary, fontWeight: '900', letterSpacing: 4 },
  cancelButton: { marginTop: 20, backgroundColor: COLORS.red, padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelText: { color: COLORS.background, fontWeight: '700', fontSize: 16 },
  doneButton: { marginTop: 20, backgroundColor: COLORS.green, padding: 16, borderRadius: 12, alignItems: 'center' },
  doneText: { color: COLORS.background, fontWeight: '700', fontSize: 16 },
});
