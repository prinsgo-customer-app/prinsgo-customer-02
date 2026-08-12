import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

let isSoundEnabled = true;

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

    // Set audio mode configuration safely
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldRouteThroughEarpieceAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: soundUrl },
      { shouldPlay: true, volume: 1.0 }
    );

    sound.setOnPlaybackStatusUpdate(async (status) => {
      if (status.didJustFinish) {
        try {
          await sound.unloadAsync();
        } catch (e) {
          // ignore double unload
        }
      }
    });
  } catch (err) {
    // Fail silently so as to not disrupt the main user flow
    console.warn('Sound playback failed or was muted by silent mode:', err);
  }
}
