import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { getActiveRide } from '../api/rides';
import { getActiveParcels } from '../api/parcels';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [mode, setMode] = useState('ride');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [checkingActive, setCheckingActive] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setCurrentLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    })();
    checkActiveTrips();
  }, []);

  const checkActiveTrips = async () => {
    try {
      const rideRes = await getActiveRide();
      if (rideRes.data.ride) {
        navigation.replace('LiveRide', { rideId: rideRes.data.ride._id });
        return;
      }
      const parcelRes = await getActiveParcels();
      if (parcelRes.data.parcels?.length > 0) {
        navigation.replace('LiveParcel', { parcelId: parcelRes.data.parcels[0]._id });
        return;
      }
    } catch (err) {
      // no active trip or network issue - ignore
    } finally {
      setCheckingActive(false);
    }
  };

  const handleQuickAddress = (label) => {
    const saved = user?.savedAddresses?.find((a) => a.label === label);
    if (!saved) {
      Alert.alert(
        `No ${label} address saved`,
        `Add your ${label} address in Profile first, then it'll show up here.`,
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Go to Profile', onPress: () => navigation.navigate('Profile') },
        ]
      );
      return;
    }
    if (mode === 'ride') {
      navigation.navigate('VehicleSelect', {
        pickup: currentLocation,
        drop: { address: saved.address, lat: saved.lat, lng: saved.lng },
      });
    } else {
      navigation.navigate('ParcelDetails', {
        pickup: currentLocation,
        drop: { address: saved.address, lat: saved.lat, lng: saved.lng },
      });
    }
  };

  if (checkingActive) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1877F2" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi {user?.name?.split(' ')[0] || ''} 👋</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, mode === 'ride' && styles.tabActive]}
          onPress={() => setMode('ride')}
        >
          <Text style={[styles.tabText, mode === 'ride' && styles.tabTextActive]}>🚗 Ride</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, mode === 'parcel' && styles.tabActive]}
          onPress={() => setMode('parcel')}
        >
          <Text style={[styles.tabText, mode === 'parcel' && styles.tabTextActive]}>
            📦 Parcel
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.searchBox}
        onPress={() =>
          navigation.navigate('PlaceSearch', { mode, currentLocation, field: 'drop' })
        }
      >
        <Text style={styles.searchBoxText}>
          Where {mode === 'ride' ? 'to' : "are you sending"}?
        </Text>
      </TouchableOpacity>

      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickItem} onPress={() => handleQuickAddress('home')}>
          <Text style={styles.quickIcon}>🏠</Text>
          <Text style={styles.quickLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickItem} onPress={() => handleQuickAddress('work')}>
          <Text style={styles.quickIcon}>💼</Text>
          <Text style={styles.quickLabel}>Work</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('History')}>
          <Text style={styles.quickIcon}>🕓</Text>
          <Text style={styles.quickLabel}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Wallet')}>
          <Text style={styles.quickIcon}>💳</Text>
          <Text style={styles.quickLabel}>Wallet</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  greeting: { fontSize: 20, fontWeight: '700', color: '#0A0F24' },
  profileIcon: { fontSize: 26 },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16 },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#1877F2' },
  tabText: { fontSize: 15, color: '#888', fontWeight: '600' },
  tabTextActive: { color: '#1877F2' },
  searchBox: {
    marginHorizontal: 20,
    backgroundColor: '#f2f4f7',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
  },
  searchBoxText: { color: '#555', fontSize: 15 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 10 },
  quickItem: { alignItems: 'center' },
  quickIcon: { fontSize: 24, marginBottom: 4 },
  quickLabel: { fontSize: 12, color: '#555' },
});
