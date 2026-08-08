import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LocalizationProvider } from './src/context/LocalizationContext';
import { AccessibilityProvider } from './src/context/AccessibilityContext';
import RootNavigator from './src/navigation/RootNavigator';
import { initSoundService } from './src/services/soundService';
import { initHapticService } from './src/services/hapticService';

function AppContent() {
  const { colors, activeTheme } = useTheme();

  useEffect(() => {
    // Initialize global settings
    initSoundService();
    initHapticService();
  }, []);

  return (
    <>
      <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <AccessibilityProvider>
      <LocalizationProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </AccessibilityProvider>
  );
}
