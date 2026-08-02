import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <Text style={styles.logo}>
        Prins<Text style={styles.logoAccent}>Go</Text>
      </Text>
      <Text style={styles.tagline}>Ride • Parcel • Delivered</Text>
      <Text style={styles.version}>Version 1.0.0</Text>

      <Text style={styles.paragraph}>
        PrinsGo connects you with nearby drivers for quick, safe, and reliable rides and
        parcel deliveries. Built for everyday commutes and doorstep delivery, wherever you are.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact & Support</Text>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:support@prinsgo.com')}>
          <Text style={styles.link}>support@prinsgo.com</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://prinsgo.com/terms')}>
        <Text style={styles.linkRowText}>Terms of Service</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://prinsgo.com/privacy')}>
        <Text style={styles.linkRowText}>Privacy Policy</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>© 2026 PrinsGo. All rights reserved.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  logo: { fontSize: 30, fontWeight: '800', color: '#0A0F24', textAlign: 'center' },
  logoAccent: { color: '#1877F2' },
  tagline: { textAlign: 'center', color: '#888', marginTop: 4 },
  version: { textAlign: 'center', color: '#bbb', fontSize: 12, marginTop: 6, marginBottom: 24 },
  paragraph: { fontSize: 14, color: '#555', lineHeight: 21, marginBottom: 24 },
  card: { backgroundColor: '#f2f4f7', borderRadius: 12, padding: 16, marginBottom: 20 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#888', marginBottom: 6 },
  link: { color: '#1877F2', fontWeight: '600', fontSize: 15 },
  linkRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  linkRowText: { fontSize: 15, color: '#0A0F24' },
  chevron: { color: '#bbb', fontSize: 18 },
  footer: { textAlign: 'center', color: '#bbb', fontSize: 12, marginTop: 30 },
});
