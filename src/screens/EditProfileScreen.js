import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api/auth';
import AnimatedCard from '../components/AnimatedCard';

export default function EditProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const { fontSizeMultiplier } = useAccessibility();
  const { user, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [profilePic, setProfilePic] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Parse name to first/last name
    if (user?.name) {
      const parts = user.name.split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
    loadAdditionalDetails();
  }, [user]);

  const loadAdditionalDetails = async () => {
    try {
      const saved = await AsyncStorage.getItem('prinsgo_profile_extra');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dob) setDob(parsed.dob);
        if (parsed.gender) setGender(parsed.gender);
        if (parsed.profilePic) setProfilePic(parsed.profilePic);
        if (parsed.lastName && !lastName) setLastName(parsed.lastName);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Validation Error', 'First Name is required.');
      return;
    }
    setSaving(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      // Update primary details on backend
      await updateProfile({ name: fullName, email: email || undefined });

      // Save additional premium fields locally
      const extra = { dob, gender, profilePic, lastName };
      await AsyncStorage.setItem('prinsgo_profile_extra', JSON.stringify(extra));

      await refreshUser();
      Alert.alert('Success 🎉', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Update Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const changeProfilePic = () => {
    // Premium picker mock with beautiful avatars
    const avatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    ];
    const currentIndex = avatars.indexOf(profilePic);
    const nextIndex = (currentIndex + 1) % avatars.length;
    setProfilePic(avatars[nextIndex]);
    Alert.alert('Avatar Changed 📸', 'Toggled to a premium avatar option.');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: 20 * fontSizeMultiplier }]}>
          Edit Profile
        </Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        {/* Profile Pic Card */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={changeProfilePic} style={styles.avatarTouch}>
            <Image source={{ uri: profilePic }} style={styles.avatar} />
            <View style={[styles.cameraIconBadge, { backgroundColor: colors.primary }]}>
              <Text style={{ fontSize: 14 }}>📸</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>Tap to change avatar</Text>
        </View>

        {/* Details Form */}
        <AnimatedCard style={styles.formCard}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>First Name *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="John"
            placeholderTextColor={colors.textLight}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Last Name</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Doe"
            placeholderTextColor={colors.textLight}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Mobile Number (Read-only)</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.textLight, backgroundColor: colors.border }]}
            value={`+91 ${phone}`}
            editable={false}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email Address</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="john.doe@example.com"
            placeholderTextColor={colors.textLight}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Date of Birth (YYYY-MM-DD)</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
            value={dob}
            onChangeText={setDob}
            placeholder="1995-08-15"
            placeholderTextColor={colors.textLight}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Gender</Text>
          <View style={styles.genderRow}>
            {['Male', 'Female', 'Other'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.genderChip,
                  { borderColor: colors.border },
                  gender === g && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setGender(g)}
              >
                <Text style={{ color: gender === g ? colors.textPrimary : colors.textSecondary, fontWeight: '600' }}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedCard>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.textPrimary }]}>Save Changes</Text>
          )}
        </TouchableOpacity>
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
  avatarContainer: { alignItems: 'center', marginVertical: 24 },
  avatarTouch: { position: 'relative' },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarHint: { fontSize: 12, marginTop: 8, fontWeight: '500' },

  formCard: { padding: 18, gap: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  genderRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  genderChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveButton: {
    marginTop: 24,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: { fontSize: 15, fontWeight: '700' },
});
