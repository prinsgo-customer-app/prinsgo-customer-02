import * as Location from 'expo-location';
import { Alert } from 'react-native';

export async function requestLocationPermission() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Access Required',
        'PrinsGo requires background/foreground location permission to estimate fares, match nearby drivers, and trace real-time route progress.'
      );
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('Error requesting location permission:', err);
    return false;
  }
}

export async function checkLocationPermission() {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (err: any) {
    return false;
  }
}

export async function requestCameraPermission() {
  // Can expand with expo-camera or react-native-vision-camera when implemented
  return true;
}

export async function requestNotificationPermission() {
  // Can expand with expo-notifications when implemented
  return true;
}
