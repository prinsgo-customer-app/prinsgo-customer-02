import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen({ navigation }) {
  const { logout } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [rideUpdates, setRideUpdates] = useState(true);
  const [promoNotifs, setPromoNotifs] = useState(false);

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This will permanently delete your account and cannot be undone. Contact support to proceed.',
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Contact Support', onPress: () => Alert.alert('Support', 'Email support@prinsgo.com to request account deletion.') }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Push notifications</Text>
        <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: '#1877F2' }} />
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Ride & parcel updates</Text>
        <Switch value={rideUpdates} onValueChange={setRideUpdates} trackColor={{ true: '#1877F2' }} />
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Offers & promotions</Text>
        <Switch value={promoNotifs} onValueChange={setPromoNotifs} trackColor={{ true: '#1877F2' }} />
      </View>

      <Text style={styles.sectionTitle}>Language</Text>
      <TouchableOpacity style={styles.row} onPress={() => Alert.alert('Language', 'More languages coming soon.')}>
        <Text style={styles.rowLabel}>App language</Text>
        <Text style={styles.rowValue}>English ›</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Account</Text>
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('About')}>
        <Text style={styles.rowLabel}>About PrinsGo</Text>
        <Text style={styles.rowValue}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={confirmDeleteAccount}>
        <Text style={[styles.rowLabel, { color: '#DC2626' }]}>Delete account</Text>
        <Text style={styles.rowValue}>›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '800', color: '#0A0F24', marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', marginTop: 24, marginBottom: 8 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  rowLabel: { fontSize: 15, color: '#0A0F24' },
  rowValue: { fontSize: 14, color: '#999' },
});
