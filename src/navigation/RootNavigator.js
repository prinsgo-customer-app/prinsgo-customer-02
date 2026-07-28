import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import HomeScreen from '../screens/HomeScreen';
import PlaceSearchScreen from '../screens/PlaceSearchScreen';
import VehicleSelectScreen from '../screens/ride/VehicleSelectScreen';
import LiveRideScreen from '../screens/ride/LiveRideScreen';
import RateRideScreen from '../screens/ride/RateRideScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="PlaceSearch" component={PlaceSearchScreen} />
      <Stack.Screen name="VehicleSelect" component={VehicleSelectScreen} />
      <Stack.Screen name="LiveRide" component={LiveRideScreen} />
      <Stack.Screen name="RateRide" component={RateRideScreen} />
      {/* Phase 2 screens */}
      <Stack.Screen name="ParcelDetails" component={ComingSoonScreen} initialParams={{ title: 'Parcel booking' }} />
      <Stack.Screen name="LiveParcel" component={ComingSoonScreen} initialParams={{ title: 'Parcel tracking' }} />
      <Stack.Screen name="Profile" component={ComingSoonScreen} initialParams={{ title: 'Profile' }} />
      <Stack.Screen name="SavedPlaces" component={ComingSoonScreen} initialParams={{ title: 'Saved places' }} />
      <Stack.Screen name="History" component={ComingSoonScreen} initialParams={{ title: 'Booking history' }} />
      <Stack.Screen name="Wallet" component={ComingSoonScreen} initialParams={{ title: 'Wallet' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1877F2" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
