import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Auth screens
import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OtpScreen from '../screens/auth/OtpScreen';

// Main screens
import HomeScreen from '../screens/HomeScreen';
import PlaceSearchScreen from '../screens/PlaceSearchScreen';
import VehicleSelectScreen from '../screens/ride/VehicleSelectScreen';
import LiveRideScreen from '../screens/ride/LiveRideScreen';
import RateRideScreen from '../screens/ride/RateRideScreen';
import ParcelDetailsScreen from '../screens/parcel/ParcelDetailsScreen';
import LiveParcelScreen from '../screens/parcel/LiveParcelScreen';
import WalletScreen from '../screens/WalletScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

// Newly implemented screens
import ClaimsScreen from '../screens/ClaimsScreen';
import OffersScreen from '../screens/OffersScreen';
import SafetyScreen from '../screens/SafetyScreen';
import HelpScreen from '../screens/HelpScreen';

import BottomNav from '../components/BottomNav';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Create Bottom Tabs utilizing the customizable tabs or bottom sheet trigger
function MainTabNavigator() {


  return (
    <Tab.Navigator
      tabBar={(props) => <BottomNav active={props.state.routes[props.state.index].name} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
    </Stack.Navigator>
  );
}

// Global configuration of Deep Linking

/** @type {import('@react-navigation/native').LinkingOptions<{}>} */
const deepLinkingConfig = {
  prefixes: ['prinsgo://', 'https://prinsgo.com', 'https://*.prinsgo.com'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          History: 'bookings',
          Wallet: 'wallet',
          Profile: 'profile',
        },
      },
      PlaceSearch: 'search',
      VehicleSelect: 'vehicle-select',
      LiveRide: 'ride/:rideId',
      LiveParcel: 'parcel/:parcelId',
      Settings: 'settings',
      Notifications: 'notifications',
    },
  },
};

function MainStack() {
  return (
    <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="PlaceSearch" component={PlaceSearchScreen} />
      <Stack.Screen name="VehicleSelect" component={VehicleSelectScreen} />
      <Stack.Screen name="LiveRide" component={LiveRideScreen} />
      <Stack.Screen name="RateRide" component={RateRideScreen} />
      <Stack.Screen name="ParcelDetails" component={ParcelDetailsScreen} />
      <Stack.Screen name="LiveParcel" component={LiveParcelScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Claims" component={ClaimsScreen} />
      <Stack.Screen name="Offers" component={OffersScreen} />
      <Stack.Screen name="Safety" component={SafetyScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();


  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={deepLinkingConfig}>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
