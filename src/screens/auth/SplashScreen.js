import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../utils/theme';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const onboarded = await AsyncStorage.getItem('prinsgo_onboarded');
      navigation.replace(onboarded ? 'Login' : 'Onboarding');
    }, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>
        Prins<Text style={styles.logoAccent}>Go</Text>
      </Text>
      <Text style={styles.tagline}>Ride • Parcel • Safe • Smart</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.textPrimary, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 42, fontWeight: '800', color: COLORS.background },
  logoAccent: { color: COLORS.primary },
  tagline: { color: COLORS.textLight, fontSize: 14, marginTop: 8, letterSpacing: 1 },
});
