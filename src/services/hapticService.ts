import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

let isHapticsEnabled = true;

export async function initHapticService() {
  try {
    const value = await AsyncStorage.getItem('prinsgo_haptics_enabled');
    if (value !== null) {
      isHapticsEnabled = value === 'true';
    }
  } catch (err: unknown) {
    console.error('Failed to init haptic service settings:', err);
  }
}

export async function setHapticsEnabled(enabled) {
  try {
    isHapticsEnabled = enabled;
    await AsyncStorage.setItem('prinsgo_haptics_enabled', String(enabled));
  } catch (err: unknown) {
    console.error('Failed to save haptic setting:', err);
  }
}

export function getHapticsEnabled() {
  return isHapticsEnabled;
}

export async function triggerHaptic(type = 'light') {
  if (!isHapticsEnabled) return;

  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'strong':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      default:
        await Haptics.selectionAsync();
        break;
    }
  } catch (err: unknown) {
    // Fail silently in environments that don't support haptic feedback
  }
}
