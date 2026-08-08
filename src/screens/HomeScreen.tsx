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
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { getActiveRide, getRideHistory } from '../api/rides';
import { getActiveParcels } from '../api/parcels';
import { getBanners, getToggles } from '../api/auth';
import BottomNav from '../components/BottomNav';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';

const VEHICLE_ICONS = { bike: '🏍️', auto: '🛺', car_mini: '🚗', car_sedan: '🚘' };

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const { fontSizeMultiplier } = useAccessibility();

  const [mode, setMode] = useState('ride');
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<any>(null);
  const [checkingActive, setCheckingActive] = useState(true);
  const [recentBookings, setRecentBookings] = useState<any>([]);

  // Admin dynamic integrations
  const [banners, setBanners] = useState<any>([]);
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
      } catch (err: any) {
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
    } catch (err: any) {
      // ignore
    } finally {
      setCheckingActive(false);
    }
  };

  const loadRecentBookings = async () => {
    try {
      const res = await getRideHistory(1, 3);
      setRecentBookings(res.data?.rides || []);
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
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
      <View style={[styles.maintenanceCenter, { backgroundColor: colors.background }]}>
        <Text style={styles.maintenanceIcon}>🚧</Text>
        <Text style={[styles.maintenanceTitle, { color: colors.textPrimary }]}>System Maintenance</Text>
        <Text style={[styles.maintenanceBody, { color: colors.textSecondary }]}>
          PrinsGo is currently undergoing scheduled upgrades to serve you better. We will be back online shortly. Thank you for your patience!
        </Text>
      </View>
    );
  }

  if (checkingActive) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.logo, { color: colors.textPrimary }]}>
              Prins<Text style={{ color: colors.primary }}>Go</Text>
            </Text>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Hi {user?.name?.split(' ')[0] || ''} 👋</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.cardBg }]} onPress={() => navigation.navigate('Notifications')}>
              <Text style={styles.iconButtonText}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.avatarButton, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Profile')}>
              <Text style={[styles.avatarInitial, { color: colors.textPrimary }]}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
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
              <View key={banner._id} style={[styles.banner, { backgroundColor: colors.textPrimary }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bannerTag, { color: colors.primary }]}>SPECIAL OFFER</Text>
                  <Text style={[styles.bannerTitle, { color: colors.background }]}>{banner.title}</Text>
                  {banner.linkValue ? (
                    <View style={styles.couponPill}>
                      <Text style={[styles.couponText, { color: colors.background }]}>{banner.linkValue}</Text>
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
          <View style={[styles.banner, { marginHorizontal: 20, backgroundColor: colors.textPrimary }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTag, { color: colors.primary }]}>WELCOME TO PRINSGO</Text>
              <Text style={[styles.bannerTitle, { color: colors.background }]}>Fast, Safe & reliable doorstep delivery.</Text>
            </View>
            <Text style={styles.bannerEmoji}>⚡</Text>
          </View>
        )}

        {/* Ride / Parcel tabs */}
        <View style={styles.tabRow}>
          {rideEnabled ? (
            <TouchableOpacity
              style={[styles.tab, mode === 'ride' && { borderBottomColor: colors.primary }]}
              onPress={() => setMode('ride')}
            >
              <Text style={[styles.tabText, mode === 'ride' ? { color: colors.textPrimary, fontWeight: '700' } : { color: colors.textLight }]}>
                🚗 {t('ride')}
              </Text>
            </TouchableOpacity>
          ) : null}
          {parcelEnabled ? (
            <TouchableOpacity
              style={[styles.tab, mode === 'parcel' && { borderBottomColor: colors.primary }]}
              onPress={() => setMode('parcel')}
            >
              <Text style={[styles.tabText, mode === 'parcel' ? { color: colors.textPrimary, fontWeight: '700' } : { color: colors.textLight }]}>
                📦 {t('parcel')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {locationLoading ? (
          <View style={styles.locationBanner}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.locationBannerText, { color: colors.textLight }]}>Getting your location…</Text>
          </View>
        ) : locationError ? (
          <TouchableOpacity style={[styles.locationBannerError, { backgroundColor: colors.cardBg }]} onPress={retryLocation}>
            <Text style={[styles.locationBannerErrorText, { color: colors.orange }]}>⚠️ {locationError} Tap to retry.</Text>
          </TouchableOpacity>
        ) : null}

        {/* Search box using AnimatedCard */}
        <View style={{ paddingHorizontal: 20, marginVertical: 10 }}>
          <AnimatedCard
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
            style={{ marginVertical: 0, padding: 18 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.pinDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.searchBoxText, { color: colors.textSecondary, fontSize: 15 * fontSizeMultiplier }]}>
                {t('searchPlaceholder')}
              </Text>
            </View>
          </AnimatedCard>
        </View>

        {/* Quick access */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickItem} onPress={() => handleQuickAddress('home')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Text style={styles.quickIcon}>🏠</Text></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => handleQuickAddress('work')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Text style={styles.quickIcon}>💼</Text></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Work</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('History')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Text style={styles.quickIcon}>🕓</Text></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Wallet')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Text style={styles.quickIcon}>💳</Text></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Wallet</Text>
          </TouchableOpacity>
        </View>

        {recentBookings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: 16 * fontSizeMultiplier }]}>{t('recentBookings')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={[styles.sectionLink, { color: colors.textPrimary }]}>{t('seeAll')}</Text>
              </TouchableOpacity>
            </View>
            {recentBookings.map((ride, idx) => (
              <AnimatedCard key={ride._id} delay={idx * 100} onPress={() => {}} style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={styles.recentIcon}>{VEHICLE_ICONS[ride.vehicleType] || '🚗'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.recentAddress, { color: colors.textPrimary, fontSize: 14 * fontSizeMultiplier }]} numberOfLines={1}>{ride.drop?.address}</Text>
                    <Text style={[styles.recentDate, { color: colors.textLight }]}>
                      {new Date(ride.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.recentFare, { color: colors.textPrimary }]}>₹{Math.round(ride.fare?.totalFare || 0)}</Text>
                    <Text style={[styles.recentStatus, { color: ride.status === 'completed' ? colors.green : ride.status === 'cancelled' ? colors.red : colors.textLight }]}>
                      {ride.status}
                    </Text>
                  </View>
                </View>
              </AnimatedCard>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Reusable Bottom Navigation */}
      <BottomNav active="Home" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 4,
  },
  logo: { fontSize: 22, fontWeight: '800' },
  greeting: { fontSize: 14, marginTop: 4 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  iconButtonText: { fontSize: 18 },
  avatarButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontWeight: '700', fontSize: 16 },

  bannersScroll: { paddingLeft: 20, paddingRight: 10, marginTop: 16, height: 160 },
  banner: {
    flexDirection: 'row',
    borderRadius: 18,
    width: 280,
    marginRight: 14,
    padding: 18,
    alignItems: 'center',
    overflow: 'hidden',
  },
  bannerTag: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  bannerTitle: { fontSize: 16, fontWeight: '800', marginTop: 4, lineHeight: 21 },
  couponPill: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 10, marginTop: 8, alignSelf: 'flex-start',
  },
  couponText: { fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },
  bannerEmoji: { fontSize: 44, marginLeft: 8 },
  bannerImage: { width: 60, height: 60, borderRadius: 10, marginLeft: 8 },

  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, marginBottom: 6 },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 15, fontWeight: '600' },

  locationBanner: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 10, gap: 8,
  },
  locationBannerText: { fontSize: 13 },
  locationBannerError: {
    marginHorizontal: 20, marginBottom: 10, borderRadius: 8, padding: 10,
  },
  locationBannerErrorText: { fontSize: 12 },

  pinDot: { width: 10, height: 10, borderRadius: 5 },
  searchBoxText: { fontSize: 15 },

  quickRow: {
    flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 10, marginBottom: 28,
  },
  quickItem: { alignItems: 'center' },
  quickIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  quickIcon: { fontSize: 22 },
  quickLabel: { fontSize: 12, fontWeight: '600' },

  section: { paddingHorizontal: 20 },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionLink: { fontSize: 13, fontWeight: '600' },
  recentIcon: { fontSize: 22 },
  recentAddress: { fontSize: 14, fontWeight: '600' },
  recentDate: { fontSize: 12, marginTop: 2 },
  recentFare: { fontSize: 14, fontWeight: '700' },
  recentStatus: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize', marginTop: 2 },

  // Maintenance Style
  maintenanceCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  maintenanceIcon: { fontSize: 80, marginBottom: 20 },
  maintenanceTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  maintenanceBody: { fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
});
