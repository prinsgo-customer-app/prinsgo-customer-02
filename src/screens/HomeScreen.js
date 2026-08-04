import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { getActiveRide, getRideHistory } from '../api/rides';
import { getActiveParcels } from '../api/parcels';
import { getBanners, getToggles } from '../api/auth';
import { COLORS } from '../utils/theme';

const VEHICLE_ICONS = { bike: '🏍️', auto: '🛺', car_mini: '🚗', car_sedan: '🚘' };
const STATUS_COLORS = { completed: COLORS.green, cancelled: COLORS.red };

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [mode, setMode] = useState('ride');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [checkingActive, setCheckingActive] = useState(true);
  const [recentBookings, setRecentBookings] = useState([]);

  // Admin dynamic integrations
  const [banners, setBanners] = useState([]);
  const [rideEnabled, setRideEnabled] = useState(true);
  const [parcelEnabled, setParcelEnabled] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission denied. Enable it in phone Settings to book rides.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setCurrentLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch (err) {
        setLocationError("Couldn't get your location. Make sure GPS is on and try again.");
      } finally {
        setLocationLoading(false);
      }
    })();
    checkActiveTrips();
    loadRecentBookings();
    loadAdminConfig();
  }, []);

  const checkActiveTrips = async () => {
    try {
      const rideRes = await getActiveRide();
      if (rideRes.data?.ride) {
        navigation.replace('LiveRide', { rideId: rideRes.data.ride._id });
        return;
      }
      const parcelRes = await getActiveParcels();
      if (parcelRes.data?.parcels?.length > 0) {
        navigation.replace('LiveParcel', { parcelId: parcelRes.data.parcels[0]._id });
        return;
      }
    } catch (err) {
      // ignore
    } finally {
      setCheckingActive(false);
    }
  };

  const loadRecentBookings = async () => {
    try {
      const res = await getRideHistory(1, 3);
      setRecentBookings(res.data?.rides || []);
    } catch (err) {
      // ignore
    }
  };

  const loadAdminConfig = async () => {
    try {
      const [bannersRes, togglesRes] = await Promise.all([
        getBanners(),
        getToggles(),
      ]);

      setBanners(bannersRes.data?.banners || []);

      const toggles = togglesRes.data?.toggles || [];
      const rideToggle = toggles.find((t) => t.key === 'ride_booking');
      const parcelToggle = toggles.find((t) => t.key === 'parcel_booking');
      const maintenanceToggle = toggles.find((t) => t.key === 'maintenance_mode');

      if (rideToggle) setRideEnabled(rideToggle.isEnabled);
      if (parcelToggle) setParcelEnabled(parcelToggle.isEnabled);
      if (maintenanceToggle && maintenanceToggle.isEnabled) {
        setIsMaintenance(true);
      }

      // Default mode adjustment if one is disabled
      if (rideToggle && !rideToggle.isEnabled && parcelToggle?.isEnabled) {
        setMode('parcel');
      }
    } catch (err) {
      // ignore configuration fetch errors
    }
  };

  const retryLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Enable it in phone Settings to book rides.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrentLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (err) {
      setLocationError("Couldn't get your location. Make sure GPS is on and try again.");
    } finally {
      setLocationLoading(false);
    }
  };

  const requireLocation = () => {
    if (currentLocation) return true;
    Alert.alert(
      'Still getting your location',
      locationError || 'Please wait a moment for GPS to lock, then try again.',
      locationError ? [{ text: 'Retry', onPress: retryLocation }, { text: 'Cancel', style: 'cancel' }] : undefined
    );
    return false;
  };

  const handleQuickAddress = (label) => {
    if (!requireLocation()) return;
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
      if (!rideEnabled) {
        Alert.alert('Unavailable', 'Ride booking is temporarily disabled by admin.');
        return;
      }
      navigation.navigate('VehicleSelect', {
        pickup: {
          address: 'Current Location',
          lat: currentLocation.lat,
          lng: currentLocation.lng,
        },
        drop: {
          address: saved.address,
          lat: saved.lat,
          lng: saved.lng,
        },
      });
    } else {
      if (!parcelEnabled) {
        Alert.alert('Unavailable', 'Parcel delivery is temporarily disabled by admin.');
        return;
      }
      navigation.navigate('ParcelDetails', {
        pickup: { address: 'Current Location', lat: currentLocation.lat, lng: currentLocation.lng },
        drop: { address: saved.address, lat: saved.lat, lng: saved.lng },
      });
    }
  };

  if (isMaintenance) {
    return (
      <View style={styles.maintenanceCenter}>
        <Text style={styles.maintenanceIcon}>🚧</Text>
        <Text style={styles.maintenanceTitle}>System Maintenance</Text>
        <Text style={styles.maintenanceBody}>
          PrinsGo is currently undergoing scheduled upgrades to serve you better. We will be back online shortly. Thank you for your patience!
        </Text>
      </View>
    );
  }

  if (checkingActive) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              Prins<Text style={styles.logoAccent}>Go</Text>
            </Text>
            <Text style={styles.greeting}>Hi {user?.name?.split(' ')[0] || ''} 👋</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
              <Text style={styles.iconButtonText}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarButton} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Banners Slider */}
        {banners.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bannersScroll}
            snapToInterval={280}
            decelerationRate="fast"
          >
            {banners.map((banner) => (
              <View key={banner._id} style={styles.banner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTag}>SPECIAL OFFER</Text>
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  {banner.linkValue ? (
                    <View style={styles.couponPill}>
                      <Text style={styles.couponText}>{banner.linkValue}</Text>
                    </View>
                  ) : null}
                </View>
                {banner.imageUrl ? (
                  <Image source={{ uri: banner.imageUrl }} style={styles.bannerImage} />
                ) : (
                  <Text style={styles.bannerEmoji}>🎁</Text>
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          /* Fallback Placeholder Banner */
          <View style={[styles.banner, { marginHorizontal: 20 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTag}>WELCOME TO PRINSGO</Text>
              <Text style={styles.bannerTitle}>Fast, Safe & reliable doorstep delivery.</Text>
            </View>
            <Text style={styles.bannerEmoji}>⚡</Text>
          </View>
        )}

        {/* Ride / Parcel tabs */}
        <View style={styles.tabRow}>
          {rideEnabled ? (
            <TouchableOpacity
              style={[styles.tab, mode === 'ride' && styles.tabActive]}
              onPress={() => setMode('ride')}
            >
              <Text style={[styles.tabText, mode === 'ride' && styles.tabTextActive]}>🚗 Ride</Text>
            </TouchableOpacity>
          ) : null}
          {parcelEnabled ? (
            <TouchableOpacity
              style={[styles.tab, mode === 'parcel' && styles.tabActive]}
              onPress={() => setMode('parcel')}
            >
              <Text style={[styles.tabText, mode === 'parcel' && styles.tabTextActive]}>
                📦 Parcel
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {locationLoading ? (
          <View style={styles.locationBanner}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.locationBannerText}>Getting your location…</Text>
          </View>
        ) : locationError ? (
          <TouchableOpacity style={styles.locationBannerError} onPress={retryLocation}>
            <Text style={styles.locationBannerErrorText}>⚠️ {locationError} Tap to retry.</Text>
          </TouchableOpacity>
        ) : null}

        {/* Search box */}
        <TouchableOpacity
          style={styles.searchBox}
          onPress={() => {
            if (!requireLocation()) return;
            if (mode === 'ride' && !rideEnabled) {
              Alert.alert('Unavailable', 'Ride booking is temporarily disabled by admin.');
              return;
            }
            if (mode === 'parcel' && !parcelEnabled) {
              Alert.alert('Unavailable', 'Parcel delivery is temporarily disabled by admin.');
              return;
            }
            navigation.navigate('PlaceSearch', { mode, currentLocation, field: 'drop' });
          }}
        >
          <View style={styles.pinDot} />
          <Text style={styles.searchBoxText}>
            Where {mode === 'ride' ? 'to' : 'are you sending'}?
          </Text>
        </TouchableOpacity>

        {/* Quick access */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickItem} onPress={() => handleQuickAddress('home')}>
            <View style={styles.quickIconWrap}><Text style={styles.quickIcon}>🏠</Text></View>
            <Text style={styles.quickLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => handleQuickAddress('work')}>
            <View style={styles.quickIconWrap}><Text style={styles.quickIcon}>💼</Text></View>
            <Text style={styles.quickLabel}>Work</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('History')}>
            <View style={styles.quickIconWrap}><Text style={styles.quickIcon}>🕓</Text></View>
            <Text style={styles.quickLabel}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Wallet')}>
            <View style={styles.quickIconWrap}><Text style={styles.quickIcon}>💳</Text></View>
            <Text style={styles.quickLabel}>Wallet</Text>
          </TouchableOpacity>
        </View>

        {recentBookings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Bookings</Text>
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={styles.sectionLink}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentBookings.map((ride) => (
              <View key={ride._id} style={styles.recentCard}>
                <Text style={styles.recentIcon}>{VEHICLE_ICONS[ride.vehicleType] || '🚗'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentAddress} numberOfLines={1}>{ride.drop?.address}</Text>
                  <Text style={styles.recentDate}>
                    {new Date(ride.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.recentFare}>₹{Math.round(ride.fare?.totalFare || 0)}</Text>
                  <Text style={[styles.recentStatus, { color: STATUS_COLORS[ride.status] || COLORS.textLight }]}>
                    {ride.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom nav bar */}
      <View style={styles.bottomNav}>
        <View style={styles.bottomNavItem}>
          <Text style={styles.bottomNavIconActive}>🏠</Text>
          <Text style={styles.bottomNavLabelActive}>Home</Text>
        </View>
        <TouchableOpacity style={styles.bottomNavItem} onPress={() => navigation.navigate('History')}>
          <Text style={styles.bottomNavIcon}>📋</Text>
          <Text style={styles.bottomNavLabel}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => {
            if (!requireLocation()) return;
            navigation.navigate('PlaceSearch', { mode, currentLocation, field: 'drop' });
          }}
        >
          <View style={styles.bottomNavCenterButton}>
            <Text style={styles.bottomNavCenterIcon}>🔍</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomNavItem} onPress={() => navigation.navigate('Wallet')}>
          <Text style={styles.bottomNavIcon}>💳</Text>
          <Text style={styles.bottomNavLabel}>Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomNavItem} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.bottomNavIcon}>👤</Text>
          <Text style={styles.bottomNavLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 4,
  },
  logo: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  logoAccent: { color: COLORS.primary },
  greeting: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.cardBg,
    justifyContent: 'center', alignItems: 'center',
  },
  iconButtonText: { fontSize: 18 },
  avatarButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 16 },

  bannersScroll: { paddingLeft: 20, paddingRight: 10, marginTop: 16, height: 160 },
  banner: {
    flexDirection: 'row',
    backgroundColor: COLORS.textPrimary,
    borderRadius: 18,
    width: 280,
    marginRight: 14,
    padding: 18,
    alignItems: 'center',
    overflow: 'hidden',
  },
  bannerTag: { color: COLORS.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  bannerTitle: { color: COLORS.background, fontSize: 16, fontWeight: '800', marginTop: 4, lineHeight: 21 },
  couponPill: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 10, marginTop: 8, alignSelf: 'flex-start',
  },
  couponText: { color: COLORS.background, fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },
  bannerEmoji: { fontSize: 44, marginLeft: 8 },
  bannerImage: { width: 60, height: 60, borderRadius: 10, marginLeft: 8 },

  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, marginBottom: 6 },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 15, color: COLORS.textLight, fontWeight: '600' },
  tabTextActive: { color: COLORS.textPrimary, fontWeight: '700' },

  locationBanner: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 10, gap: 8,
  },
  locationBannerText: { color: COLORS.textLight, fontSize: 13 },
  locationBannerError: {
    marginHorizontal: 20, marginBottom: 10, backgroundColor: '#FFF3E0', borderRadius: 8, padding: 10,
  },
  locationBannerErrorText: { color: COLORS.orange, fontSize: 12 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, backgroundColor: COLORS.cardBg, borderRadius: 14,
    padding: 18, marginBottom: 22,
  },
  pinDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  searchBoxText: { color: COLORS.textSecondary, fontSize: 15 },

  quickRow: {
    flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 10, marginBottom: 28,
  },
  quickItem: { alignItems: 'center' },
  quickIconWrap: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.cardBg,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  quickIcon: { fontSize: 22 },
  quickLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },

  section: { paddingHorizontal: 20 },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  sectionLink: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  recentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, marginBottom: 10, backgroundColor: COLORS.background
  },
  recentIcon: { fontSize: 22 },
  recentAddress: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  recentDate: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  recentFare: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  recentStatus: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize', marginTop: 2 },

  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', backgroundColor: COLORS.background,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingTop: 10, paddingBottom: 22, paddingHorizontal: 8,
    justifyContent: 'space-around', alignItems: 'center',
  },
  bottomNavItem: { alignItems: 'center', flex: 1 },
  bottomNavIcon: { fontSize: 20, opacity: 0.5 },
  bottomNavIconActive: { fontSize: 20 },
  bottomNavLabel: { fontSize: 11, color: COLORS.textLight, marginTop: 3, fontWeight: '600' },
  bottomNavLabelActive: { fontSize: 11, color: COLORS.textPrimary, marginTop: 3, fontWeight: '700' },
  bottomNavCenterButton: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginTop: -26,
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  bottomNavCenterIcon: { fontSize: 20 },

  // Maintenance Style
  maintenanceCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: COLORS.background },
  maintenanceIcon: { fontSize: 80, marginBottom: 20 },
  maintenanceTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  maintenanceBody: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
});
