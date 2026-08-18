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
} from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { getActiveRide, getRideHistory } from '../api/rides';
import { getActiveParcels } from '../api/parcels';
import { getBanners, getToggles, getSettings } from '../api/auth';
import BottomNav from '../components/BottomNav';
import AnimatedCard from '../components/AnimatedCard';

const { width } = Dimensions.get('window');

const BANNER_MARGIN = 20;
const BANNER_WIDTH = width - BANNER_MARGIN * 2;
// Height adjusted for mobile card visibility (~110-120px height)
const BANNER_HEIGHT = Math.round(BANNER_WIDTH / 6.23);

const VEHICLE_ICONS = { bike: '🏍️', auto: '🛺', car_mini: '🚗', car_sedan: '🚘' };

const LOCAL_BANNERS = [
  {
    id: 'banner_ride',
    image: require('../../assets/images/banner/PrinsGo_Banner_01_Ride_20_OFF.png'),
    type: 'ride',
    title: 'Ride – Flat 20% OFF',
  },
  {
    id: 'banner_parcel',
    image: require('../../assets/images/banner/PrinsGo_Banner_02_Parcel_Delivery.png'),
    type: 'parcel',
    title: 'Parcel Delivery',
  },
  {
    id: 'banner_rental',
    image: require('../../assets/images/banner/PrinsGo_Banner_03_Rent_A_Car.png'),
    type: 'rentals',
    title: 'Rent a Car',
  },
  {
    id: 'banner_explore',
    image: require('../../assets/images/banner/PrinsGo_Banner_04_Explore_Your_City.png'),
    type: 'explore',
    title: 'Explore Your City',
  },
];

// Cloned array for seamless infinite looping: [B3, B0, B1, B2, B3, B0]
const LOOP_BANNERS = [
  { ...LOCAL_BANNERS[3], loopKey: 'clone_head_3' },
  { ...LOCAL_BANNERS[0], loopKey: 'real_0' },
  { ...LOCAL_BANNERS[1], loopKey: 'real_1' },
  { ...LOCAL_BANNERS[2], loopKey: 'real_2' },
  { ...LOCAL_BANNERS[3], loopKey: 'real_3' },
  { ...LOCAL_BANNERS[0], loopKey: 'clone_tail_0' },
];

const DEFAULT_EXPLORE_LOCATIONS = [
  {
    name: 'Bandhavgarh National Park',
    city: 'Umaria',
    desc: 'Famous royal Bengal tiger sanctuary nestled in Vindhya hills.',
    emoji: '🐅',
  },
  {
    name: 'Ghughwa Rashtriya Udyan',
    city: 'Dindori',
    desc: 'Incredible national plant fossil park dating back 6.5 million years.',
    emoji: '🦖',
  },
  {
    name: 'Bhedaghat Marble Rocks',
    city: 'Jabalpur',
    desc: 'Breathtaking gorges of marble sculpted by Narmada River.',
    emoji: '⛰️',
  },
  {
    name: 'Kanha National Park',
    city: 'Mandla',
    desc: 'Vast scenic preserve harboring rare swamp deer and barasingha.',
    emoji: '🦌',
  },
  {
    name: 'Amarkantak Source of Narmada',
    city: 'Anuppur',
    desc: 'The unique holy meeting point of Satpura & Vindhya mountain ranges.',
    emoji: '🕉️',
  },
];

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

  // Main scroll view and explore section references for banner tap navigation
  const mainScrollViewRef = useRef(null);
  const [exploreSectionY, setExploreSectionY] = useState(0);

  // Carousel slider state & refs
  const bannerScrollRef = useRef(null);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const currentIndexRef = useRef(1); // Real B0 index in LOOP_BANNERS
  const autoSlideTimerRef = useRef(null);
  const resetTimeoutRef = useRef(null);

  // Asset image failure state tracking
  const [imageErrors, setImageErrors] = useState({});

  // Feature toggles and admin settings
  const [rideEnabled, setRideEnabled] = useState(true);
  const [parcelEnabled, setParcelEnabled] = useState(true);
  const [rentalsEnabled, setRentalsEnabled] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [exploreSights, setExploreSights] = useState(DEFAULT_EXPLORE_LOCATIONS);

  // Home remote contents
  const [homeTitle, setHomeTitle] = useState('PrinsGo Premium');
  const [homeSubtitle, setHomeSubtitle] = useState('Your ride, parcel & rentals partner');

  // Suppress unused warning of home remote settings
  const suppressUnusedContents = () => {
    console.log(homeTitle, homeSubtitle);
  };

  useEffect(() => {
    suppressUnusedContents();
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

  // Auto slide carousel management
  const stopAutoSlide = () => {
    if (autoSlideTimerRef.current) {
      clearInterval(autoSlideTimerRef.current);
      autoSlideTimerRef.current = null;
    }
  };

  const startAutoSlide = () => {
    stopAutoSlide();
    autoSlideTimerRef.current = setInterval(() => {
      if (!bannerScrollRef.current) return;
      const nextIndex = currentIndexRef.current + 1;
      bannerScrollRef.current.scrollTo({
        x: nextIndex * BANNER_WIDTH,
        animated: true,
      });
      currentIndexRef.current = nextIndex;
      setActiveDotIndex((nextIndex - 1 + 4) % 4);

      if (nextIndex === 5) {
        // Smoothly wrapped to clone tail (clone of B0); reset position silently after animation
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = setTimeout(() => {
          bannerScrollRef.current?.scrollTo({
            x: 1 * BANNER_WIDTH,
            animated: false,
          });
          currentIndexRef.current = 1;
          setActiveDotIndex(0);
        }, 350);
      }
    }, 4500);
  };

  useEffect(() => {
    startAutoSlide();
    return () => {
      stopAutoSlide();
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const handleScrollBeginDrag = () => {
    stopAutoSlide();
  };

  const handleMomentumScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    let index = Math.round(offsetX / BANNER_WIDTH);

    if (index <= 0) {
      // Swiped left to clone head (clone of B3) -> jump instantly to real B3 at index 4
      bannerScrollRef.current?.scrollTo({
        x: 4 * BANNER_WIDTH,
        animated: false,
      });
      index = 4;
    } else if (index >= 5) {
      // Swiped right to clone tail (clone of B0) -> jump instantly to real B0 at index 1
      bannerScrollRef.current?.scrollTo({
        x: 1 * BANNER_WIDTH,
        animated: false,
      });
      index = 1;
    }

    currentIndexRef.current = index;
    setActiveDotIndex((index - 1 + 4) % 4);
    startAutoSlide();
  };

  const handleBannerPress = (banner) => {
    if (!banner) return;

    switch (banner.type) {
      case 'ride':
        if (!rideEnabled) {
          Alert.alert('Unavailable', 'Ride booking is temporarily disabled by admin.');
          return;
        }
        if (!requireLocation()) return;
        navigation.navigate('PlaceSearch', { mode: 'ride', currentLocation, field: 'drop' });
        break;

      case 'parcel':
        if (!parcelEnabled) {
          Alert.alert('Unavailable', 'Parcel delivery is temporarily disabled by admin.');
          return;
        }
        if (!requireLocation()) return;
        navigation.navigate('PlaceSearch', { mode: 'parcel', currentLocation, field: 'drop' });
        break;

      case 'rentals':
        if (!rentalsEnabled) {
          Alert.alert('Unavailable', 'Rentals service is temporarily disabled by admin.');
          return;
        }
        navigation.navigate('Rentals');
        break;

      case 'explore':
        if (exploreSectionY > 0 && mainScrollViewRef.current) {
          mainScrollViewRef.current.scrollTo({ y: exploreSectionY, animated: true });
        } else if (mainScrollViewRef.current) {
          mainScrollViewRef.current.scrollTo({ y: 700, animated: true });
        }
        break;

      default:
        break;
    }
  };

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

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
      const [togglesRes, settingsRes] = await Promise.all([
        getToggles().catch(() => ({ data: { toggles: [] } })),
        getSettings().catch(() => ({ data: { settings: {} } })),
      ]);

      const toggles = togglesRes.data?.toggles || [];
      const rideToggle = toggles.find((t) => t.key === 'ride_booking' || t.key === 'ride');
      const parcelToggle = toggles.find((t) => t.key === 'parcel_booking' || t.key === 'parcel');
      const rentalsToggle = toggles.find((t) => t.key === 'rentals');
      const maintenanceToggle = toggles.find((t) => t.key === 'maintenance_mode');

      if (rideToggle) setRideEnabled(rideToggle.isEnabled);
      if (parcelToggle) setParcelEnabled(parcelToggle.isEnabled);
      if (rentalsToggle) setRentalsEnabled(rentalsToggle.isEnabled);
      if (maintenanceToggle && maintenanceToggle.isEnabled) {
        setIsMaintenance(true);
      }

      const settings = settingsRes.data?.settings || {};
      if (settings.exploreLocations && Array.isArray(settings.exploreLocations) && settings.exploreLocations.length > 0) {
        setExploreSights(settings.exploreLocations);
      }

      if (settings.appName) setHomeTitle(settings.appName);
      if (settings.appTagline) setHomeSubtitle(settings.appTagline);

      // Default mode adjustment if one is disabled
      if (rideToggle && !rideToggle.isEnabled && parcelToggle?.isEnabled) {
        setMode('parcel');
      } else if (rideToggle && !rideToggle.isEnabled && !parcelToggle?.isEnabled && rentalsToggle?.isEnabled) {
        setMode('rentals');
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
    } else if (mode === 'parcel') {
      if (!parcelEnabled) {
        Alert.alert('Unavailable', 'Parcel delivery is temporarily disabled by admin.');
        return;
      }
      navigation.navigate('ParcelDetails', {
        pickup: { address: 'Current Location', lat: currentLocation.lat, lng: currentLocation.lng },
        drop: { address: saved.address, lat: saved.lat, lng: saved.lng },
      });
    } else {
      if (!rentalsEnabled) {
        Alert.alert('Unavailable', 'Rentals service is temporarily disabled by admin.');
        return;
      }
      navigation.navigate('Rentals');
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
      <ScrollView
        ref={mainScrollViewRef}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.logo, { color: colors.textPrimary }]}>
              Prins<Text style={{ color: colors.primary }}>Go</Text>
            </Text>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Good Morning, {user?.name?.split(' ')[0] || 'User'} 👋
            </Text>
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

        {/* Current Location Pill Bar */}
        <View style={styles.locationPillBar}>
          <Text style={[styles.locationPillText, { color: colors.textSecondary }]} numberOfLines={1}>
            📍 {locationLoading ? 'Getting your location...' : locationError ? 'Location Error' : 'Current Location unlocked'}
          </Text>
          <TouchableOpacity style={[styles.locationChangeBtn, { backgroundColor: colors.cardBg }]} onPress={retryLocation}>
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>CHANGE</Text>
          </TouchableOpacity>
        </View>

        {/* Premium PNG Banners Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={bannerScrollRef}
            horizontal
            pagingEnabled
            snapToInterval={BANNER_WIDTH}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: BANNER_WIDTH, y: 0 }}
            onLayout={() => {
              bannerScrollRef.current?.scrollTo({ x: BANNER_WIDTH, animated: false });
            }}
            onScrollBeginDrag={handleScrollBeginDrag}
            onMomentumScrollEnd={handleMomentumScrollEnd}
          >
            {LOOP_BANNERS.map((banner) => (
              <TouchableOpacity
                key={banner.loopKey}
                activeOpacity={0.9}
                style={styles.bannerCard}
                onPress={() => handleBannerPress(banner)}
              >
                {!imageErrors[banner.id] ? (
                  <Image
                    source={banner.image}
                    style={styles.bannerImage}
                    resizeMode="cover"
                    onError={(err) => {
                      console.log('Banner image error:', banner.id, err?.nativeEvent);
                      handleImageError(banner.id);
                    }}
                    onError={() => handleImageError(banner.id)}
                  />
                ) : (
                  <View style={[styles.bannerFallbackCard, { backgroundColor: colors.cardBg }]}>
                    <Text style={[styles.bannerFallbackText, { color: colors.textPrimary }]}>
                      ⚠️ {banner.title}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Carousel Indicator Dots */}
          <View style={styles.dotIndicatorRow}>
            {LOCAL_BANNERS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: i === activeDotIndex ? 18 : 6,
                    backgroundColor: i === activeDotIndex ? colors.primary : (colors.border || '#D1D5DB'),
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Premium Service Selector Cards */}
        <View style={styles.serviceSelectionContainer}>
          <Text style={[styles.sectionTitleHeader, { color: colors.textPrimary }]}>Our Services</Text>
          <View style={styles.serviceSelectorRow}>
            {rideEnabled && (
              <TouchableOpacity
                style={[
                  styles.serviceSelectorCard,
                  { backgroundColor: colors.cardBg, borderColor: mode === 'ride' ? colors.primary : colors.border },
                ]}
                onPress={() => setMode('ride')}
              >
                <Text style={styles.serviceSelectorIcon}>🚕</Text>
                <Text style={[styles.serviceSelectorTitle, { color: colors.textPrimary }]}>Ride</Text>
                <Text style={[styles.serviceSelectorSubtitle, { color: colors.textSecondary }]}>Book a fast trip</Text>
              </TouchableOpacity>
            )}

            {parcelEnabled && (
              <TouchableOpacity
                style={[
                  styles.serviceSelectorCard,
                  { backgroundColor: colors.cardBg, borderColor: mode === 'parcel' ? colors.primary : colors.border },
                ]}
                onPress={() => setMode('parcel')}
              >
                <Text style={styles.serviceSelectorIcon}>📦</Text>
                <Text style={[styles.serviceSelectorTitle, { color: colors.textPrimary }]}>Parcel</Text>
                <Text style={[styles.serviceSelectorSubtitle, { color: colors.textSecondary }]}>Send items securely</Text>
              </TouchableOpacity>
            )}

            {rentalsEnabled && (
              <TouchableOpacity
                style={[
                  styles.serviceSelectorCard,
                  { backgroundColor: colors.cardBg, borderColor: mode === 'rentals' ? colors.primary : colors.border },
                ]}
                onPress={() => setMode('rentals')}
              >
                <Text style={styles.serviceSelectorIcon}>🚗</Text>
                <Text style={[styles.serviceSelectorTitle, { color: colors.textPrimary }]}>Rentals</Text>
                <Text style={[styles.serviceSelectorSubtitle, { color: colors.textSecondary }]}>Hourly / Daily car</Text>
              </TouchableOpacity>
            )}
          </View>
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

        {/* Quick Booking Premium Card */}
        <View style={{ paddingHorizontal: 20, marginVertical: 10 }}>
          <Text style={[styles.sectionTitleHeader, { color: colors.textPrimary, marginBottom: 12 }]}>Where are you going?</Text>
          <AnimatedCard
            onPress={() => {
              if (!requireLocation()) return;
              if (mode === 'ride') {
                if (!rideEnabled) {
                  Alert.alert('Unavailable', 'Ride booking is temporarily disabled.');
                  return;
                }
                navigation.navigate('PlaceSearch', { mode: 'ride', currentLocation, field: 'drop' });
              } else if (mode === 'parcel') {
                if (!parcelEnabled) {
                  Alert.alert('Unavailable', 'Parcel delivery is temporarily disabled.');
                  return;
                }
                navigation.navigate('PlaceSearch', { mode: 'parcel', currentLocation, field: 'drop' });
              } else {
                if (!rentalsEnabled) {
                  Alert.alert('Unavailable', 'Rentals are temporarily disabled.');
                  return;
                }
                navigation.navigate('Rentals');
              }
            }}
            style={{ marginVertical: 0, padding: 18, borderWidth: 1, borderColor: colors.border }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.pinDot, { backgroundColor: colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textLight, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                  CHOOSE DESTINATION
                </Text>
                <Text style={[styles.searchBoxText, { color: colors.textSecondary, fontSize: 15 * fontSizeMultiplier, marginTop: 4 }]}>
                  {t('searchPlaceholder')}
                </Text>
              </View>
              <Text style={{ fontSize: 18 }}>🔍</Text>
            </View>
          </AnimatedCard>
        </View>

        {/* Quick Actions (2-row horizontal selector) */}
        <Text style={[styles.sectionTitleHeader, { color: colors.textPrimary, paddingHorizontal: 20, marginTop: 14, marginBottom: -10 }]}>Quick Actions</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickItem} onPress={() => handleQuickAddress('home')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Text style={styles.quickIcon}>🏠</Text></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => handleQuickAddress('work')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Text style={styles.quickIcon}>💼</Text></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Work</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Offers')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Text style={styles.quickIcon}>🎁</Text></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Offers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Safety')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Text style={styles.quickIcon}>🛡️</Text></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Safety</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('History')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Text style={styles.quickIcon}>📋</Text></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Wallet')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Text style={styles.quickIcon}>💳</Text></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Claims')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Text style={styles.quickIcon}>⚖️</Text></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Claims</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Help')}>
            <View style={[styles.quickIconWrap, { backgroundColor: colors.cardBg }]}><Text style={styles.quickIcon}>🎧</Text></View>
            <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Help</Text>
          </TouchableOpacity>
        </View>

        {/* Services Showcase Sections */}
        <View style={styles.sectionShowcase}>
          <Text style={[styles.sectionTitleHeader, { color: colors.textPrimary, marginBottom: 12 }]}>Explore Options</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            <TouchableOpacity style={[styles.showcaseCard, { backgroundColor: colors.cardBg }]} onPress={() => navigation.navigate('PlaceSearch', { mode: 'ride', currentLocation })}>
              <Text style={styles.showcaseEmoji}>⚡</Text>
              <Text style={[styles.showcaseTitle, { color: colors.textPrimary }]}>Book Ride</Text>
              <Text style={[styles.showcaseDesc, { color: colors.textSecondary }]}>Instant booking with verified drivers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.showcaseCard, { backgroundColor: colors.cardBg }]} onPress={() => navigation.navigate('ComingSoon', { title: 'Schedule Ride' })}>
              <Text style={styles.showcaseEmoji}>📅</Text>
              <Text style={[styles.showcaseTitle, { color: colors.textPrimary }]}>Schedule Trip</Text>
              <Text style={[styles.showcaseDesc, { color: colors.textSecondary }]}>Set date & pick time in advance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.showcaseCard, { backgroundColor: colors.cardBg }]} onPress={() => navigation.navigate('ComingSoon', { title: 'Multiple Stops Ride' })}>
              <Text style={styles.showcaseEmoji}>📍</Text>
              <Text style={[styles.showcaseTitle, { color: colors.textPrimary }]}>Multiple Stops</Text>
              <Text style={[styles.showcaseDesc, { color: colors.textSecondary }]}>Add up to 3 intermediate halts</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Explore Your City Section */}
        <View
          onLayout={(e) => setExploreSectionY(e.nativeEvent.layout.y)}
          style={[styles.section, { marginTop: 24, marginBottom: 14 }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: 16 * fontSizeMultiplier, marginBottom: 4 }]}>
            Explore Your City 🗺️
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }}>
            Configure and discover famous sights powered by Admin panel
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14 }}
          >
            {exploreSights.map((place, idx) => (
              <View
                key={idx}
                style={[
                  styles.exploreCard,
                  { backgroundColor: colors.cardBg, borderColor: colors.border },
                ]}
              >
                <View style={[styles.exploreIconWrap, { backgroundColor: colors.background }]}>
                  <Text style={{ fontSize: 24 }}>{place.emoji || '📍'}</Text>
                </View>
                <Text style={[styles.exploreName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {place.name}
                </Text>
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
                  📍 {place.city || 'Madhya Pradesh'}
                </Text>
                <Text style={[styles.exploreDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {place.desc || place.description}
                </Text>
              </View>
            ))}
          </ScrollView>
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
              <AnimatedCard key={ride._id} delay={idx * 100} style={{ padding: 14 }} onPress={() => navigation.navigate('History')}>
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

  locationPillBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 4,
  },
  locationPillText: { fontSize: 13, flex: 1 },
  locationChangeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },

  carouselContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  bannerCard: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1A2238',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: 14,
  },
  bannerFallbackCard: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerFallbackText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  dotIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },

  serviceSelectionContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  sectionTitleHeader: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  serviceSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  serviceSelectorCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  serviceSelectorIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  serviceSelectorTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  serviceSelectorSubtitle: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },

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
    flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 10, marginVertical: 14,
  },
  quickItem: { alignItems: 'center' },
  quickIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  quickIcon: { fontSize: 22 },
  quickLabel: { fontSize: 12, fontWeight: '600' },

  sectionShowcase: {
    paddingHorizontal: 20,
    marginVertical: 14,
  },
  showcaseCard: {
    width: 140,
    padding: 12,
    borderRadius: 12,
  },
  showcaseEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  showcaseTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  showcaseDesc: {
    fontSize: 10,
    marginTop: 2,
    lineHeight: 13,
  },

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

  // Explore Your City styles
  exploreCard: {
    width: 200,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  exploreIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  exploreName: { fontSize: 14, fontWeight: '700' },
  exploreDesc: { fontSize: 11, marginTop: 4, lineHeight: 15 },

  // Maintenance Style
  maintenanceCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  maintenanceIcon: { fontSize: 80, marginBottom: 20 },
  maintenanceTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  maintenanceBody: { fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
});
