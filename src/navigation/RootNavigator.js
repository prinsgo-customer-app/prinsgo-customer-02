import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

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

const Stack = createNativeStackNavigator();

// Shown when there is no logged-in user yet. Splash itself decides
// (via the 'prinsgo_onboarded' flag) whether to continue to Onboarding
// or straight to Login - that logic is unchanged.
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

// Shown once AuthContext has a logged-in user. Every screen the app
// navigates to from Home/Profile/PlaceSearch/etc. is registered here.
function MainStack() {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="PlaceSearch" component={PlaceSearchScreen} />
      <Stack.Screen name="VehicleSelect" component={VehicleSelectScreen} />
      <Stack.Screen name="LiveRide" component={LiveRideScreen} />
      <Stack.Screen name="RateRide" component={RateRideScreen} />
      <Stack.Screen name="ParcelDetails" component={ParcelDetailsScreen} />
      <Stack.Screen name="LiveParcel" component={LiveParcelScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <NavigationContainer>{user ? <MainStack /> : <AuthStack />}</NavigationContainer>;
}
