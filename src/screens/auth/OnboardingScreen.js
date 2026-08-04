import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../utils/theme';

export default function OnboardingScreen({ navigation }) {
  const finish = async () => {
    await AsyncStorage.setItem('prinsgo_onboarded', 'true');
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        <Text style={styles.illustrationEmoji}>🚗</Text>
      </View>
      <Text style={styles.title}>Your Ride,{'\n'}Your Way!</Text>
      <Text style={styles.subtitle}>Safe, reliable & affordable rides and parcel delivery, whenever you need.</Text>

      <View style={styles.dotsRow}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={finish}>
        <Text style={styles.primaryButtonText}>Next</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={finish}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 28, justifyContent: 'center', alignItems: 'center' },
  illustration: {
    width: 200, height: 200, borderRadius: 100, backgroundColor: COLORS.cardBg,
    justifyContent: 'center', alignItems: 'center', marginBottom: 40,
  },
  illustrationEmoji: { fontSize: 90 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', lineHeight: 32 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 14, lineHeight: 21, paddingHorizontal: 10 },
  dotsRow: { flexDirection: 'row', gap: 6, marginTop: 32, marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.primary, width: 22 },
  primaryButton: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 15,
    width: '100%', alignItems: 'center', marginBottom: 16,
  },
  primaryButtonText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 16 },
  skipText: { color: COLORS.textLight, fontWeight: '600' },
});
