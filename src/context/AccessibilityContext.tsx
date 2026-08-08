import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AccessibilityContext = createContext<any>(null);

export function AccessibilityProvider({ children }) {
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1); // 1 = regular, 1.25 = large, 1.5 = extra large
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Detect system screen reader status
    const updateScreenReaderStatus = (enabled) => {
      setScreenReaderEnabled(enabled);
    };

    AccessibilityInfo.isScreenReaderEnabled().then(updateScreenReaderStatus);
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      updateScreenReaderStatus
    );

    // Load custom configuration from AsyncStorage
    async function loadConfig() {
      try {
        const storedContrast = await AsyncStorage.getItem('prinsgo_accessibility_contrast');
        const storedScale = await AsyncStorage.getItem('prinsgo_accessibility_scale');
        const storedMotion = await AsyncStorage.getItem('prinsgo_accessibility_motion');

        if (storedContrast) setHighContrast(storedContrast === 'true');
        if (storedScale) setFontSizeMultiplier(parseFloat(storedScale));
        if (storedMotion) setReduceMotion(storedMotion === 'true');
      } catch (err: unknown) {
        console.error('Failed to load accessibility config:', err);
      }
    }
    loadConfig();

    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, []);

  const toggleHighContrast = async () => {
    try {
      const newVal = !highContrast;
      setHighContrast(newVal);
      await AsyncStorage.setItem('prinsgo_accessibility_contrast', String(newVal));
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const changeFontSizeMultiplier = async (val) => {
    try {
      setFontSizeMultiplier(val);
      await AsyncStorage.setItem('prinsgo_accessibility_scale', String(val));
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const toggleReduceMotion = async () => {
    try {
      const newVal = !reduceMotion;
      setReduceMotion(newVal);
      await AsyncStorage.setItem('prinsgo_accessibility_motion', String(newVal));
    } catch (err: unknown) {
      console.error(err);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        screenReaderEnabled,
        highContrast,
        fontSizeMultiplier,
        reduceMotion,
        toggleHighContrast,
        changeFontSizeMultiplier,
        toggleReduceMotion,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
