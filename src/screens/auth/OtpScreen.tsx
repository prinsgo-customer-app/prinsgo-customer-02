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
import { verifyOtp, sendOtp } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../utils/theme';

export default function OtpScreen({ route }) {
  const { phone } = route.params;
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [needsName, setNeedsName] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (code.length !== 4 && code.length !== 6) {
      Alert.alert('Invalid OTP', 'Enter the OTP you received');
      return;
    }
    if (needsName && !name.trim()) {
      Alert.alert('Name required', 'Please enter your name to create an account');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtp(phone, code, name || undefined);
      const { token, user } = res.data;
      await login(token, user);
    } catch (err: unknown) {
      if ((err as any)?.response?.data?.isNewUser) {
        setNeedsName(true);
      } else {
        Alert.alert('Error', (err as any)?.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await sendOtp(phone);
      Alert.alert('OTP sent', 'A new OTP has been sent to your phone');
    } catch (err: unknown) {
      Alert.alert('Error', (err as any)?.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify your number</Text>
      <Text style={styles.subtitle}>We've sent a code to +91 {phone}</Text>

      <TextInput
        style={styles.otpInput}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="Enter OTP"
        value={code}
        onChangeText={setCode}
        placeholderTextColor={COLORS.textLight}
      />

      {needsName && (
        <TextInput
          style={styles.otpInput}
          placeholder="Your full name"
          value={name}
          onChangeText={setName}
          placeholderTextColor={COLORS.textLight}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={COLORS.textPrimary} />
        ) : (
          <Text style={styles.buttonText}>{needsName ? 'Create account' : 'Verify'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={resend} style={{ marginTop: 16 }}>
        <Text style={{ color: COLORS.blue, textAlign: 'center', fontWeight: '600' }}>Resend OTP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  subtitle: { color: COLORS.textSecondary, marginBottom: 30 },
  otpInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    letterSpacing: 2,
    color: COLORS.textPrimary,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
});
