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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { updateProfile, addAddress, deleteAddress, getSettings } from '../api/auth';
import BottomNav from '../components/BottomNav';
import { COLORS } from '../utils/theme';

const LABEL_ICONS = { home: '🏠', work: '💼', other: '📍' };

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('home');
  const [newAddress, setNewAddress] = useState('');
  const [addingAddress, setAddingAddress] = useState(false);

  // Dynamic support settings
  const [supportPhone, setSupportPhone] = useState('');
  const [supportEmail, setSupportEmail] = useState('');

  useEffect(() => {
    fetchSupportSettings();
  }, []);

  const fetchSupportSettings = async () => {
    try {
      const res = await getSettings();
      const settings = res.data?.settings;
      if (settings) {
        setSupportPhone(settings.supportPhone || '');
        setSupportEmail(settings.supportEmail || '');
      }
    } catch (err: any) {
      setSupportPhone('9999999999');
      setSupportEmail('support@prinsgo.com');
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, email: email || undefined });
      await refreshUser();
      setEditing(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message);
    } finally {
      setSaving(false);
    }
  };

  const submitAddress = async () => {
    if (!newAddress.trim()) {
      Alert.alert('Address required', 'Enter an address');
      return;
    }
    setAddingAddress(true);
    try {
      await addAddress({ label: newLabel, address: newAddress, lat: 18.5204, lng: 73.8567 });
      await refreshUser();
      setNewAddress('');
      setShowAddForm(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message);
    } finally {
      setAddingAddress(false);
    }
  };

  const removeAddress = (addressId) => {
    Alert.alert('Remove address?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAddress(addressId);
            await refreshUser();
          } catch (err: any) {
            Alert.alert('Error', err?.message);
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Log out?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSupport = () => {
    Alert.alert(
      'Support & Help',
      `For any issues, please reach out to us:\n\n📧 Email: ${supportEmail || 'support@prinsgo.com'}\n📞 Call: ${supportPhone || '9999999999'}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 110 }}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>

        {editing ? (
          <>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textLight}
            />
            <View style={styles.rowButtons}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setEditing(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={saveProfile} disabled={saving}>
                {saving ? <ActivityIndicator color={COLORS.textPrimary} /> : <Text style={styles.primaryButtonText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.phone}>+91 {user?.phone}</Text>
            {user?.email ? <Text style={styles.phone}>{user.email}</Text> : null}
            <TouchableOpacity style={styles.editLink} onPress={() => setEditing(true)}>
              <Text style={styles.editLinkText}>Edit profile</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Referral Code</Text>
          <Text style={styles.referralCode}>{user?.referralCode || 'NOT AVAILABLE'}</Text>
          <Text style={styles.cardSub}>Share this with friends to earn rewards</Text>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Saved Addresses</Text>
          <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)}>
            <Text style={styles.addLink}>{showAddForm ? 'Cancel' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {showAddForm && (
          <View style={styles.addForm}>
            <View style={styles.labelRow}>
              {['home', 'work', 'other'].map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.labelChip, newLabel === l && styles.labelChipActive]}
                  onPress={() => setNewLabel(l)}
                >
                  <Text style={[styles.labelChipText, newLabel === l && styles.labelChipTextActive]}>
                    {LABEL_ICONS[l]} {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Full address"
              placeholderTextColor={COLORS.textLight}
              value={newAddress}
              onChangeText={setNewAddress}
              multiline
            />
            <TouchableOpacity style={styles.primaryButton} onPress={submitAddress} disabled={addingAddress}>
              {addingAddress ? <ActivityIndicator color={COLORS.textPrimary} /> : <Text style={styles.primaryButtonText}>Save Address</Text>}
            </TouchableOpacity>
          </View>
        )}

        {user?.savedAddresses?.length ? (
          user.savedAddresses.map((addr) => (
            <View key={addr._id} style={styles.addressRow}>
              <Text style={styles.addressIcon}>{LABEL_ICONS[addr.label] || '📍'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressLabel}>{addr.label}</Text>
                <Text style={styles.addressText}>{addr.address}</Text>
              </View>
              <TouchableOpacity onPress={() => removeAddress(addr._id)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          !showAddForm && <Text style={styles.emptyText}>No saved addresses yet.</Text>
        )}

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('History', { initialTab: 'rides' })}>
            <Text style={styles.menuIcon}>🏍️</Text>
            <Text style={styles.menuLabel}>Ride History</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('History', { initialTab: 'parcels' })}>
            <Text style={styles.menuIcon}>📦</Text>
            <Text style={styles.menuLabel}>Parcel History</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('Wallet')}>
            <Text style={styles.menuIcon}>💳</Text>
            <Text style={styles.menuLabel}>Wallet</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={styles.menuLabel}>Settings</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('About')}>
            <Text style={styles.menuIcon}>ℹ️</Text>
            <Text style={styles.menuLabel}>About PrinsGo</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={handleSupport}
          >
            <Text style={styles.menuIcon}>🎧</Text>
            <Text style={styles.menuLabel}>Support</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav active="Profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  avatarInitial: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  phone: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  editLink: { marginTop: 10 },
  editLinkText: { color: COLORS.textPrimary, fontWeight: '600' },
  label: { fontSize: 13, color: COLORS.textPrimary, marginBottom: 6, marginTop: 12, fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15, color: COLORS.textPrimary,
  },
  rowButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  primaryButton: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  primaryButtonText: { color: COLORS.textPrimary, fontWeight: '700' },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  secondaryButtonText: { color: COLORS.textSecondary, fontWeight: '600' },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 16, marginTop: 24 },
  cardLabel: { fontSize: 12, color: COLORS.textSecondary },
  referralCode: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginTop: 4, letterSpacing: 1 },
  cardSub: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  addLink: { color: COLORS.textPrimary, fontWeight: '600' },
  addForm: { backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 14, marginBottom: 14 },
  labelRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  labelChip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12 },
  labelChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  labelChipText: { fontSize: 13, color: COLORS.textSecondary, textTransform: 'capitalize' },
  labelChipTextActive: { color: COLORS.textPrimary, fontWeight: '600' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 10 },
  addressIcon: { fontSize: 18 },
  addressLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, textTransform: 'capitalize' },
  addressText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  removeText: { color: COLORS.red, fontSize: 12, fontWeight: '600' },
  emptyText: { color: COLORS.textLight, fontSize: 13, marginBottom: 10 },
  logoutButton: { borderWidth: 1, borderColor: COLORS.red, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 32, marginBottom: 20 },
  logoutText: { color: COLORS.red, fontWeight: '700' },
  menuSection: { marginTop: 28 },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12,
  },
  menuIcon: { fontSize: 18, width: 24 },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  chevron: { color: COLORS.textLight, fontSize: 18 },
});
