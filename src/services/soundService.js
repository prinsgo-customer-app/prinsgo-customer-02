import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

let isSoundEnabled = true;

// Preload sound files or references
// Note: We use public domain, tiny sound file URLs or placeholders to prevent large bundle sizes,
// but since the requirement is to use lightweight sound assets, we can define short audio effects.
const SOUNDS = {
  ride_alert: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
  parcel_shipped: 'https://actions.google.com/sounds/v1/cartoon/slide_whistle_to_drum_roll.ogg',
  emergency: 'https://actions.google.com/sounds/v1/alarms/mechanical_clock_ring.ogg',
  success: 'https://actions.google.com/sounds/v1/ui/beep_short.ogg',
  click: 'https://actions.google.com/sounds/v1/ui/click_on.ogg',
};

export async function initSoundService() {
  try {
    const value = await AsyncStorage.getItem('prinsgo_sound_enabled');
    if (value !== null) {
      isSoundEnabled = value === 'true';
    }
  } catch (err) {
    console.error('Failed to init sound service settings:', err);
  }
}

export async function setSoundEnabled(enabled) {
  try {
    isSoundEnabled = enabled;
    await AsyncStorage.setItem('prinsgo_sound_enabled', String(enabled));
  } catch (err) {
    console.error('Failed to save sound setting:', err);
  }
}

export function getSoundEnabled() {
  return isSoundEnabled;
}

export async function playSound(soundKey) {
  if (!isSoundEnabled) return;
  try {
    const soundUrl = SOUNDS[soundKey];
    if (!soundUrl) return;

    // Request playing audio using expo-av
    const { sound } = await Audio.Sound.createAsync(
      { uri: soundUrl },
      { shouldPlay: true }
    );

    // Automatically unload sound after playing to prevent memory leaks
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (err) {
    // Fail silently so as to not disrupt the main user flow
    console.warn('Sound playback failed or was muted by silent mode:', err);
  }
}
