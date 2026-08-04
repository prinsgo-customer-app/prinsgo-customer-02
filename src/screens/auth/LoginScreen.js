import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { sendOtp } from '../../api/auth';
import { COLORS } from '../../utils/theme';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      Alert.alert('Invalid number', 'Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(phone);
      navigation.navigate('Otp', { phone });
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>
        Prins<Text style={styles.logoAccent}>Go</Text>
      </Text>
      <Text style={styles.tagline}>Ride • Parcel • Delivered</Text>

      <Text style={styles.label}>Enter your mobile number</Text>
      <View style={styles.inputRow}>
        <Text style={styles.prefix}>+91</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          maxLength={10}
          placeholder="9876543210"
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleContinue}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.textPrimary} />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24, justifyContent: 'center' },
  logo: { fontSize: 34, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  logoAccent: { color: COLORS.primary },
  tagline: { textAlign: 'center', color: COLORS.textSecondary, marginBottom: 40, marginTop: 4 },
  label: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  prefix: { fontSize: 16, color: COLORS.textPrimary, marginRight: 8, fontWeight: '600' },
  input: { flex: 1, fontSize: 16, paddingVertical: 14, color: COLORS.textPrimary },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
});
