import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSLATIONS = {
  en: {
    home: 'Home',
    bookings: 'Bookings',
    wallet: 'Wallet',
    profile: 'Profile',
    settings: 'Settings',
    searchPlaceholder: 'Where to / sending?',
    recentBookings: 'Recent Bookings',
    seeAll: 'See all',
    ride: 'Ride',
    parcel: 'Parcel',
    aboutPrinsgo: 'About PrinsGo',
    deleteAccount: 'Delete account',
    pushNotifications: 'Push notifications',
    rideParcelUpdates: 'Ride & parcel updates',
    offersPromotions: 'Offers & promotions',
    appLanguage: 'App language',
    languageName: 'English',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    logout: 'Log out',
    haptics: 'Haptics & Vibrations',
    sounds: 'App Sounds',
  },
  hi: {
    home: 'होम',
    bookings: 'बुकिंग',
    wallet: 'वॉलेट',
    profile: 'प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    searchPlaceholder: 'कहाँ जाना है / भेजना है?',
    recentBookings: 'हाल की बुकिंग',
    seeAll: 'सभी देखें',
    ride: 'सवारी',
    parcel: 'पार्सल',
    aboutPrinsgo: 'प्रिंसगो के बारे में',
    deleteAccount: 'खाता हटाएं',
    pushNotifications: 'पुश नोटिफिकेशन',
    rideParcelUpdates: 'सवारी और पार्सल अपडेट',
    offersPromotions: 'ऑफ़र और प्रमोशन',
    appLanguage: 'ऐप की भाषा',
    languageName: 'हिंदी',
    theme: 'थीम',
    light: 'लाइट',
    dark: 'डार्क',
    system: 'सिस्टम',
    logout: 'लॉग आउट',
    haptics: 'हैप्टिक्स और कंपन',
    sounds: 'ऐप ध्वनियां',
  },
};

const LocalizationContext = createContext();

export function LocalizationProvider({ children }) {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    async function loadSavedLocale() {
      try {
        const savedLocale = await AsyncStorage.getItem('prinsgo_locale');
        if (savedLocale && TRANSLATIONS[savedLocale]) {
          setLocale(savedLocale);
        }
      } catch (err) {
        console.error('Error loading saved locale:', err);
      }
    }
    loadSavedLocale();
  }, []);

  const changeLocale = async (newLocale) => {
    if (!TRANSLATIONS[newLocale]) return;
    try {
      setLocale(newLocale);
      await AsyncStorage.setItem('prinsgo_locale', newLocale);
    } catch (err) {
      console.error('Error saving locale:', err);
    }
  };

  const t = (key) => {
    const translation = TRANSLATIONS[locale];
    return translation[key] || TRANSLATIONS['en'][key] || key;
  };

  return (
    <LocalizationContext.Provider value={{ locale, t, changeLocale, translations: TRANSLATIONS }}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
}
