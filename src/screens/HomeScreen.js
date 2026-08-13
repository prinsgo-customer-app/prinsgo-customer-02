import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import * as Location from 'expo-location';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { getActiveRide, getRideHistory } from '../api/rides';
import { getActiveParcels } from '../api/parcels';
import { getBanners, getToggles, getSettings } from '../api/auth';
import BottomNav from '../components/BottomNav';
import AnimatedCard from '../components/AnimatedCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Premium Vector Icons map for service categories
const SERVICE_ICONS = {
  ride: 'navigation',
  parcel: 'box',
  delivery: 'truck',
  bike: 'compass',
  auto: 'layers',
  car: 'truck',
  rental: 'key',
  default: 'grid',
};

// Recommended Banner Dimensions for Admin:
// - Aspect Ratio 16:9: Recommended 1280x720px (or 640x360px), max file size 500KB.
// - Aspect Ratio 2:1: Recommended 1200x600px (or 600x300px), max file size 500KB.

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const { fontSizeMultiplier } = useAccessibility();

  const [mode, setMode] = useState('ride');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [checkingActive, setCheckingActive] = useState(true);
  const [recentBookings, setRecentBookings] = useState([]);

  // Admin dynamic integrations
  const [banners, setBanners] = useState([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const bannerRef = useRef(null);

  const [services, setServices] = useState([
    { id: 'ride', key: 'ride', name: 'Ride Booking', icon: 'ride', description: 'Premium on-demand rides', isEnabled: true, order: 1 },
    { id: 'parcel', key: 'parcel', name: 'Parcel Delivery', icon: 'parcel', description: 'Secure doorstep logistics', isEnabled: true, order: 2 },
  ]);

  const [rideEnabled, setRideEnabled] = useState(true);
  const [parcelEnabled, setParcelEnabled] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [exploreSights, setExploreSights] = useState([]);

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

  // Banner auto-slide timer
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = (activeBannerIndex + 1) % banners.length;
      setActiveBannerIndex(nextIndex);
      bannerRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [activeBannerIndex, banners]);

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
      const [bannersRes, togglesRes, settingsRes] = await Promise.all([
        getBanners().catch(() => ({ data: { banners: [] } })),
        getToggles().catch(() => ({ data: { toggles: [] } })),
        getSettings().catch(() => ({ data: { settings: {} } })),
      ]);

      const activeBanners = (bannersRes.data?.banners || []).filter(b => b.status !== 'inactive');
      setBanners(activeBanners);

      const toggles = togglesRes.data?.toggles || [];
      const rideToggle = toggles.find((t) => t.key === 'ride_booking');
      const parcelToggle = toggles.find((t) => t.key === 'parcel_booking');
      const maintenanceToggle = toggles.find((t) => t.key === 'maintenance_mode');

      if (rideToggle) setRideEnabled(rideToggle.isEnabled);
      if (parcelToggle) setParcelEnabled(parcelToggle.isEnabled);
      if (maintenanceToggle && maintenanceToggle.isEnabled) {
        setIsMaintenance(true);
      }

      const settings = settingsRes.data?.settings || {};

      // Admin controlled custom services list
      if (settings.services && Array.isArray(settings.services) && settings.services.length > 0) {
        setServices(settings.services.sort((a, b) => a.order - b.order));
      } else {
        // Built-in premium services list
        setServices([
          { id: 'ride', key: 'ride', name: 'Ride Booking', icon: 'ride', description: 'Premium on-demand rides', isEnabled: rideToggle ? rideToggle.isEnabled : true, order: 1 },
          { id: 'parcel', key: 'parcel', name: 'Parcel Delivery', icon: 'parcel', description: 'Secure doorstep logistics', isEnabled: parcelToggle ? parcelToggle.isEnabled : true, order: 2 },
          { id: 'rental', key: 'rental', name: 'Rental Fleet', icon: 'rental', description: 'Hourly luxury chauffeur cars', isEnabled: true, order: 3 },
        ]);
      }

      // Load admin-configured explore locations
      if (settings.exploreLocations && Array.isArray(settings.exploreLocations) && settings.exploreLocations.length > 0) {
        setExploreSights(settings.exploreLocations.filter(loc => loc.status !== 'disabled'));
      } else {
        setExploreSights([]); // Show beautiful empty state when no destinations are configured
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
      <View style={[styles.maintenanceCenter, { backgroundColor: colors.background }]}>
        <Feather name="alert-triangle" size={64} color={colors.primary} style={{ marginBottom: 20 }} />
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

  const renderBannerItem = ({ item }) => {
    const isAspect21 = item.aspectRatio === '2:1';
    const containerHeight = isAspect21 ? 140 : 160;
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => item.destination && navigation.navigate(item.destination)}
        style={[
          styles.banner,
          {
            backgroundColor: item.backgroundStyle || colors.cardBg,
            borderColor: colors.border,
            borderWidth: 1,
            height: containerHeight,
          },
        ]}
      >
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {item.tag && <Text style={[styles.bannerTag, { color: colors.primary }]}>{item.tag.toUpperCase()}</Text>}
          <Text style={[styles.bannerTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>
          {item.subtitle && <Text style={[styles.bannerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{item.subtitle}</Text>}
          {item.linkValue && (
            <View style={[styles.couponPill, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={[styles.couponText, { color: colors.primary }]}>{item.linkValue}</Text>
            </View>
          )}
        </View>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
        ) : (
          <View style={[styles.bannerFallbackIcon, { backgroundColor: colors.background }]}>
            <Feather name="gift" size={32} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
              <Feather name="bell" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.avatarButton, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Profile')}>
              <Text style={[styles.avatarInitial, { color: '#0A0F24' }]}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Advertising Carousel */}
        {banners.length > 0 ? (
          <View style={styles.carouselContainer}>
            <FlatList
              ref={bannerRef}
              data={banners}
              renderItem={renderBannerItem}
              keyExtractor={(item) => item._id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveBannerIndex(index);
              }}
              style={{ width: SCREEN_WIDTH }}
            />
            {/* Pagination Indicators */}
            <View style={styles.paginationDots}>
              {banners.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: idx === activeBannerIndex ? colors.primary : colors.textLight,
                      width: idx === activeBannerIndex ? 16 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        ) : (
          /* Premium Brand Fallback Banner (No Lightning!) */
          <View style={[styles.carouselContainer, { paddingHorizontal: 20 }]}>
            <View style={[styles.banner, { width: '100%', backgroundColor: colors.cardBg, borderColor: colors.border, borderWidth: 1, height: 140 }]}>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={[styles.bannerTag, { color: colors.primary }]}>WELCOME TO PRINSGO</Text>
                <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>Premium Doorstep Delivery & Rides</Text>
                <Text style={[styles.bannerSubtitle, { color: colors.textSecondary }]}>Fast, safe, and highly secure logistics</Text>
              </View>
              <View style={[styles.bannerFallbackIcon, { backgroundColor: colors.background }]}>
                <Feather name="compass" size={32} color={colors.primary} />
              </View>
            </View>
          </View>
        )}

        {/* Premium Service Selection Area */}
        <View style={styles.servicesHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: 16 * fontSizeMultiplier }]}>Our Premium Services</Text>
        </View>
        <View style={styles.serviceRow}>
          {services.map((srv) => (
            <TouchableOpacity
              key={srv.id}
              style={[
                styles.serviceCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: mode === srv.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                if (!srv.isEnabled) {
                  Alert.alert('Unavailable', `${srv.name} is temporarily disabled by admin.`);
                  return;
                }
                setMode(srv.key);
              }}
            >
              <View style={[styles.serviceIconWrap, { backgroundColor: colors.background }]}>
                <Feather name={SERVICE_ICONS[srv.icon] || SERVICE_ICONS.default} size={22} color={mode === srv.key ? colors.primary : colors.textPrimary} />
              </View>
              <Text style={[styles.serviceName, { color: colors.textPrimary }]} numberOfLines={1}>{srv.name}</Text>
              <Text style={[styles.serviceDesc, { color: colors.textSecondary }]} numberOfLines={1}>{srv.description}</Text>
            </TouchableOpacity>
          ))}
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

        {/* Premium Location Search Card */}
        <View style={{ paddingHorizontal: 20, marginVertical: 12 }}>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.pinDot, { backgroundColor: colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.searchBoxText, { color: colors.textPrimary, fontWeight: '700', fontSize: 15 * fontSizeMultiplier }]}>
                  Where to?
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {mode === 'ride' ? 'Book premium chauffeur-driven rides' : 'Request safe doorstep courier transport'}
                </Text>
              </View>
              <Feather name="search" size={20} color={colors.primary} />
            </View>
          </AnimatedCard>
        </View>

        {/* Grouped Quick Action Buttons */}
        <View style={styles.quickGrid}>
          <TouchableOpacity style={styles.quickItem} onPress={() => handleQuickAddress('home')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Feather name="home" size={20} color={colors.primary} /></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => handleQuickAddress('work')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Feather name="briefcase" size={20} color={colors.primary} /></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Work</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Offers')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Feather name="gift" size={20} color={colors.primary} /></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Offers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Safety')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Feather name="shield" size={20} color={colors.primary} /></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Safety</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickGrid}>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('History')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Feather name="list" size={20} color={colors.primary} /></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Wallet')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Feather name="credit-card" size={20} color={colors.primary} /></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Claims')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Feather name="file-text" size={20} color={colors.primary} /></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Claims</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Help')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Feather name="help-circle" size={20} color={colors.primary} /></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Help</Text>
          </TouchableOpacity>
        </View>

        {/* Explore Your City Section — REDESIGNED WITH NO HARDCODED OR CLIPPED CARDS */}
        <View style={[styles.section, { marginTop: 24, marginBottom: 14 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: 16 * fontSizeMultiplier, marginBottom: 4 }]}>
            Explore Your City 🗺️
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }}>
            Discover famous sights and travel landmarks verified by our team
          </Text>

          {exploreSights.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 14, paddingRight: 20 }}
            >
              {exploreSights.map((place, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.exploreCard,
                    { backgroundColor: colors.cardBg, borderColor: colors.border },
                  ]}
                >
                  {place.imageUrl ? (
                    <Image source={{ uri: place.imageUrl }} style={styles.exploreImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.explorePlaceholderImage, { backgroundColor: colors.background }]}>
                      <Feather name="map-pin" size={24} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.exploreBody}>
                    <Text style={[styles.exploreName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {place.name}
                    </Text>
                    <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                      📍 {place.city || 'Local Landmark'}
                    </Text>
                    <Text style={[styles.exploreDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {place.desc || place.description}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            /* Premium Empty State instead of ugly hardcoded placeholders */
            <View style={[styles.emptyExploreState, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Feather name="map" size={32} color={colors.textLight} />
              <Text style={[styles.emptyExploreText, { color: colors.textSecondary }]}>
                No local travel destinations configured.
              </Text>
              <Text style={{ color: colors.textLight, fontSize: 11, marginTop: 4 }}>
                Check back soon for city travel guides.
              </Text>
            </View>
          )}
        </View>

        {/* Recent Bookings History list */}
        {recentBookings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: 16 * fontSizeMultiplier }]}>Recent Trips</Text>
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>{t('seeAll')}</Text>
              </TouchableOpacity>
            </View>
            {recentBookings.map((ride, idx) => (
              <AnimatedCard key={ride._id} delay={idx * 100} style={{ padding: 14 }} onPress={() => navigation.navigate('History')}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.recentIconWrap, { backgroundColor: colors.cardBg }]}>
                    <Feather name={ride.vehicleType === 'bike' ? 'compass' : 'navigation'} size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.recentAddress, { color: colors.textPrimary, fontSize: 14 * fontSizeMultiplier }]} numberOfLines={1}>
                      {ride.drop?.address}
                    </Text>
                    <Text style={[styles.recentDate, { color: colors.textLight }]}>
                      {new Date(ride.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.recentFare, { color: colors.textPrimary }]}>₹{Math.round(ride.fare?.totalFare || 0)}</Text>
                    <View style={[styles.statusChip, { backgroundColor: ride.status === 'completed' ? colors.green + '15' : colors.red + '15' }]}>
                      <Text style={[styles.recentStatus, { color: ride.status === 'completed' ? colors.green : colors.red }]}>
                        {ride.status}
                      </Text>
                    </View>
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
  logo: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  greeting: { fontSize: 14, marginTop: 4 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontWeight: '700', fontSize: 16 },

  carouselContainer: {
    marginTop: 16,
    position: 'relative',
    alignItems: 'center',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  banner: {
    flexDirection: 'row',
    borderRadius: 18,
    width: SCREEN_WIDTH - 40,
    marginHorizontal: 20,
    padding: 18,
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  bannerTag: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  bannerTitle: { fontSize: 16, fontWeight: '800', lineHeight: 21 },
  bannerSubtitle: { fontSize: 12, marginTop: 2 },
  couponPill: {
    borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 10, marginTop: 8, alignSelf: 'flex-start',
  },
  couponText: { fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  bannerImage: { width: 80, height: 80, borderRadius: 12, marginLeft: 12 },
  bannerFallbackIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },

  servicesHeaderRow: { paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  serviceRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 8 },
  serviceCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  serviceIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  serviceName: { fontSize: 13, fontWeight: '700' },
  serviceDesc: { fontSize: 11, marginTop: 2 },

  locationBanner: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginVertical: 10, gap: 8,
  },
  locationBannerText: { fontSize: 13 },
  locationBannerError: {
    marginHorizontal: 20, marginVertical: 10, borderRadius: 8, padding: 10,
  },
  locationBannerErrorText: { fontSize: 12 },

  pinDot: { width: 10, height: 10, borderRadius: 5 },
  searchBoxText: { fontSize: 15 },

  quickGrid: {
    flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 12, marginBottom: 16,
  },
  quickItem: { alignItems: 'center', flex: 1 },
  quickIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  quickLabel: { fontSize: 12, fontWeight: '600' },

  section: { paddingHorizontal: 20 },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  sectionLink: { fontSize: 13, fontWeight: '700' },
  recentIconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  recentAddress: { fontSize: 14, fontWeight: '600' },
  recentDate: { fontSize: 12, marginTop: 2 },
  recentFare: { fontSize: 14, fontWeight: '800' },
  statusChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginTop: 4 },
  recentStatus: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  // Explore Your City styles
  exploreCard: {
    width: 210,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  exploreImage: { width: '100%', height: 100 },
  explorePlaceholderImage: { width: '100%', height: 100, justifyContent: 'center', alignItems: 'center' },
  exploreBody: { padding: 12 },
  exploreName: { fontSize: 14, fontWeight: '700' },
  exploreDesc: { fontSize: 11, marginTop: 4, lineHeight: 15 },
  emptyExploreState: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  emptyExploreText: { fontSize: 13, fontWeight: '700', marginTop: 8 },

  // Maintenance Style
  maintenanceCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  maintenanceTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  maintenanceBody: { fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
});
