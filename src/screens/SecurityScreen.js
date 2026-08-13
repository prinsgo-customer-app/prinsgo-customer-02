import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import AnimatedCard from '../components/AnimatedCard';

export default function SecurityScreen({ navigation }) {
  const { colors } = useTheme();
  const { fontSizeMultiplier } = useAccessibility();
  const { logout } = useAuth();

  const [pinEnabled, setPinEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [showPinForm, setShowPinForm] = useState(false);

  const handleChangePin = () => {
    if (!oldPin || newPin.length !== 4) {
      Alert.alert('Validation Error', 'Please enter a valid 4-digit PIN.');
      return;
    }
    Alert.alert('PIN Updated 🎉', 'Your security login PIN has been updated successfully.');
    setOldPin('');
    setNewPin('');
    setShowPinForm(false);
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account permanently?',
      'This action is irreversible and will delete your active balance, ride history, and active bookings. Are you sure you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deletion Requested', 'Our support team has been notified. We will process your deletion request within 24 hours.', [
              { text: 'OK', onPress: logout }
            ]);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: 20 * fontSizeMultiplier }]}>
          Account Security
        </Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>🔒 Security & Lock</Text>

        <AnimatedCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>4-Digit Secure PIN</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Require PIN to open app or book trips</Text>
            </View>
            <Switch value={pinEnabled} onValueChange={setPinEnabled} trackColor={{ true: colors.primary }} />
          </View>

          {pinEnabled && (
            <TouchableOpacity onPress={() => setShowPinForm(!showPinForm)} style={styles.pinToggleBtn}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                {showPinForm ? 'Hide PIN Reset' : 'Reset Secure PIN'}
              </Text>
            </TouchableOpacity>
          )}

          {showPinForm && (
            <View style={styles.pinForm}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Old 4-Digit PIN</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                value={oldPin}
                onChangeText={(t) => setOldPin(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                placeholder="••••"
                placeholderTextColor={colors.textLight}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>New 4-Digit PIN</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                value={newPin}
                onChangeText={(t) => setNewPin(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                placeholder="••••"
                placeholderTextColor={colors.textLight}
              />

              <TouchableOpacity style={[styles.pinBtn, { backgroundColor: colors.primary }]} onPress={handleChangePin}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>Update PIN</Text>
              </TouchableOpacity>
            </View>
          )}
        </AnimatedCard>

        <AnimatedCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Biometric Authentication</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Unlock PrinsGo with Fingerprint / Face ID</Text>
            </View>
            <Switch value={biometricsEnabled} onValueChange={setBiometricsEnabled} trackColor={{ true: colors.primary }} />
          </View>
        </AnimatedCard>

        <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: 24 }]}>📱 Trusted Devices & Sessions</Text>
        <AnimatedCard style={styles.card}>
          <View style={styles.deviceRow}>
            <Text style={{ fontSize: 24 }}>🤖</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.deviceName, { color: colors.textPrimary }]}>Google Pixel 7 (This Device)</Text>
              <Text style={{ color: colors.green, fontSize: 12, fontWeight: '600' }}>Active Now · Pune, India</Text>
            </View>
          </View>
        </AnimatedCard>

        <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: 24 }]}>⚠️ Account Protection</Text>
        <AnimatedCard style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={confirmDeleteAccount}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dangerLabel, { color: colors.red }]}>Delete Account</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Permanently erase your account, active balance and data</Text>
            </View>
            <Text style={{ color: colors.red, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        </AnimatedCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: { marginBottom: 6 },
  backText: { fontSize: 14, fontWeight: '600' },
  title: { fontWeight: '800' },

  container: { flex: 1 },
  sectionHeading: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  card: { padding: 18, marginBottom: 14 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLabel: { fontSize: 15, fontWeight: '700' },
  pinToggleBtn: { marginTop: 14 },
  pinForm: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 14, gap: 10 },
  inputLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 14, letterSpacing: 2 },
  pinBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deviceName: { fontSize: 14, fontWeight: '700' },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  dangerLabel: { fontSize: 15, fontWeight: '700' },
});
