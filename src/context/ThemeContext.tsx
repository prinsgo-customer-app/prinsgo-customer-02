import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../utils/theme';

const ThemeContext = createContext<any>(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light' | 'dark' | 'system'
  const [activeTheme, setActiveTheme] = useState(systemScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    // Load persisted theme preference
    async function loadThemePreference() {
      try {
        const savedMode = await AsyncStorage.getItem('prinsgo_theme_mode');
        if (savedMode) {
          setThemeMode(savedMode);
        }
      } catch (err: unknown) {
        console.error('Error loading theme preference:', err);
      }
    }
    loadThemePreference();
  }, []);

  useEffect(() => {
    // Dynamically calculate the active palette based on selected mode and system preference
    if (themeMode === 'system') {
      setActiveTheme(systemScheme === 'dark' ? 'dark' : 'light');
    } else {
      setActiveTheme(themeMode);
    }
  }, [themeMode, systemScheme]);

  const selectThemeMode = async (mode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem('prinsgo_theme_mode', mode);
    } catch (err: unknown) {
      console.error('Error saving theme preference:', err);
    }
  };

  const colors = COLORS[activeTheme];

  return (
    <ThemeContext.Provider value={{ themeMode, activeTheme, colors, selectThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
