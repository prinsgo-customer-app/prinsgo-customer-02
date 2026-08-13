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
  Linking,
  Dimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { updateProfile, addAddress, deleteAddress, getSettings } from '../api/auth';
import BottomNav from '../components/BottomNav';

const { width } = Dimensions.get('window');
const LABEL_ICONS = { home: '🏠', work: '💼', other: '📍' };

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const { colors, activeTheme } = useTheme();
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
  const [adminSettings, setAdminSettings] = useState(null);

  const isDark = activeTheme === 'dark';

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
        setAdminSettings(settings);
      }
    } catch (err) {
      setSupportPhone('9999999999');
      setSupportEmail('support@prinsgo.com');
    }
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name, email: email || undefined });
      await refreshUser();
      setEditing(false);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const submitAddress = async () => {
    if (!newAddress.trim()) {
      Alert.alert('Address required', 'Please enter a valid address');
      return;
    }
    setAddingAddress(true);
    try {
      await addAddress({ label: newLabel, address: newAddress, lat: 18.5204, lng: 73.8567 });
      await refreshUser();
      setNewAddress('');
      setShowAddForm(false);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setAddingAddress(false);
    }
  };

  const removeAddress = (addressId) => {
    Alert.alert('Remove Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAddress(addressId);
            await refreshUser();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of PrinsGo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSupport = () => {
    navigation.navigate('Help');
  };

  const handleCopyReferral = async () => {
    const code = user?.referralCode || 'NOT AVAILABLE';
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied! 📋', `Referral code "${code}" copied to clipboard.`);
  };

  const handleSocialLink = (platform) => {
    const urls = {
      whatsapp: adminSettings?.whatsappUrl || adminSettings?.whatsappNumber || 'https://wa.me/918629995010',
      instagram: adminSettings?.instagramUrl || 'https://instagram.com/prinsgo',
      youtube: adminSettings?.youtubeUrl || 'https://youtube.com/@prinsgo',
      facebook: adminSettings?.facebookUrl || 'https://facebook.com/prinsgo',
      twitter: adminSettings?.twitterUrl || 'https://twitter.com/prinsgo',
      linkedin: adminSettings?.linkedinUrl || 'https://linkedin.com/company/prinsgo',
    };
    Linking.openURL(urls[platform]).catch(() => {
      Alert.alert('Link Error', `Could not open ${platform} channel.`);
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Profile Hero Block */}
        <View style={[styles.heroCard, { backgroundColor: isDark ? '#161B26' : '#FAFAFA', borderColor: colors.border }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>FULL NAME</Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? '#0B0F19' : '#FFFFFF' }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter full name"
                placeholderTextColor={colors.textLight}
              />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>EMAIL ADDRESS</Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? '#0B0F19' : '#FFFFFF' }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
                placeholderTextColor={colors.textLight}
              />
              <View style={styles.rowButtons}>
                <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={() => setEditing(false)}>
                  <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={saveProfile} disabled={saving}>
                  {saving ? <ActivityIndicator color={colors.textPrimary} size="small" /> : <Text style={styles.primaryButtonText}>Save Details</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.userInfo}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name}</Text>
              <View style={styles.verifiedPill}>
                <Text style={styles.phoneText}>+91 {user?.phone}</Text>
                <Text style={styles.verifiedPillText}>Verified Customer</Text>
              </View>
              {user?.email ? <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text> : null}
              <TouchableOpacity style={[styles.editLink, { backgroundColor: isDark ? '#1E293B' : '#ECEEF2' }]} onPress={() => setEditing(true)}>
                <Text style={[styles.editLinkText, { color: colors.textPrimary }]}>Edit Account Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Premium Core Metrics Block */}
        <View style={styles.metricsContainer}>
          <TouchableOpacity style={[styles.metricBox, { backgroundColor: isDark ? '#161B26' : '#F5F6F8' }]} onPress={() => navigation.navigate('Wallet')}>
            <Text style={styles.metricEmoji}>💳</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Wallet Balance</Text>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]}>₹{user?.walletBalance || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.metricBox, { backgroundColor: isDark ? '#161B26' : '#F5F6F8' }]} onPress={() => navigation.navigate('Offers')}>
            <Text style={styles.metricEmoji}>🎁</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Refer & Earn</Text>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]}>₹50 Free</Text>
          </TouchableOpacity>
        </View>

        {/* Premium Referral Code card */}
        <View style={[styles.card, { backgroundColor: isDark ? '#161B26' : '#F8F9FA', borderColor: colors.border }]}>
          <View style={styles.referralHeader}>
            <View>
              <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>YOUR UNIQUE REFERRAL CODE</Text>
              <Text style={[styles.referralCode, { color: colors.textPrimary }]}>{user?.referralCode || 'NOT AVAILABLE'}</Text>
            </View>
            <TouchableOpacity style={[styles.copyCodeButton, { backgroundColor: colors.primary }]} onPress={handleCopyReferral}>
              <Text style={styles.copyCodeButtonText}>COPY</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.cardSub, { color: colors.textLight }]}>Share with your friends and receive ₹50 wallet credit instantly on their first completed transaction.</Text>
        </View>

        {/* Saved Addresses Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Saved Locations</Text>
          <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)} style={[styles.addBtn, { backgroundColor: isDark ? '#1E293B' : '#E5E7EB' }]}>
            <Text style={[styles.addLink, { color: colors.textPrimary }]}>{showAddForm ? 'Cancel' : '＋ Add New'}</Text>
          </TouchableOpacity>
        </View>

        {showAddForm && (
          <View style={[styles.addForm, { backgroundColor: isDark ? '#161B26' : '#F9F9FB', borderColor: colors.border }]}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>SELECT ADDRESS TYPE</Text>
            <View style={styles.labelRow}>
              {['home', 'work', 'other'].map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.labelChip, newLabel === l && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setNewLabel(l)}
                >
                  <Text style={[styles.labelChipText, { color: newLabel === l ? colors.textPrimary : colors.textSecondary }]}>
                    {LABEL_ICONS[l]} {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>STREET ADDRESS DETAILS</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? '#0B0F19' : '#FFFFFF' }]}
              placeholder="E.g., Apartment, Block, Street Name"
              placeholderTextColor={colors.textLight}
              value={newAddress}
              onChangeText={setNewAddress}
              multiline
            />
            <TouchableOpacity style={[styles.saveAddressBtn, { backgroundColor: colors.primary }]} onPress={submitAddress} disabled={addingAddress}>
              {addingAddress ? <ActivityIndicator color={colors.textPrimary} size="small" /> : <Text style={styles.saveAddressBtnText}>Save Address to Profile</Text>}
            </TouchableOpacity>
          </View>
        )}

        {user?.savedAddresses?.length ? (
          <View style={[styles.addressesList, { borderColor: colors.border }]}>
            {user.savedAddresses.map((addr, index) => (
              <View key={addr._id} style={[styles.addressRow, { borderBottomWidth: index === user.savedAddresses.length - 1 ? 0 : 1, borderBottomColor: colors.border }]}>
                <View style={[styles.addressIconContainer, { backgroundColor: isDark ? '#1E293B' : '#ECEEF2' }]}>
                  <Text style={styles.addressIcon}>{LABEL_ICONS[addr.label] || '📍'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addressLabel, { color: colors.textPrimary }]}>{addr.label}</Text>
                  <Text style={[styles.addressText, { color: colors.textSecondary }]}>{addr.address}</Text>
                </View>
                <TouchableOpacity onPress={() => removeAddress(addr._id)} style={styles.deleteBtn}>
                  <Text style={styles.removeText}>✕ Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          !showAddForm && (
            <View style={[styles.emptyState, { backgroundColor: isDark ? '#161B26' : '#FAFAFA', borderColor: colors.border }]}>
              <Text style={styles.emptyIcon}>📍</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No saved locations found. Add your favorite spots for faster booking!</Text>
            </View>
          )
        )}

        {/* Premium Menu Section */}
        <Text style={[styles.menuHeader, { color: colors.textSecondary }]}>PREMIUM SERVICES & SETTINGS</Text>
        <View style={[styles.menuSection, { backgroundColor: isDark ? '#161B26' : '#FAFAFA', borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('History', { initialTab: 'rides' })}>
            <View style={[styles.menuIconBox, { backgroundColor: '#FFEDD5' }]}><Text style={styles.menuEmoji}>🏍️</Text></View>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>My Ride History</Text>
            <Text style={[styles.chevron, { color: colors.textLight }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('History', { initialTab: 'parcels' })}>
            <View style={[styles.menuIconBox, { backgroundColor: '#DBEAFE' }]}><Text style={styles.menuEmoji}>📦</Text></View>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>My Parcel History</Text>
            <Text style={[styles.chevron, { color: colors.textLight }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Wallet')}>
            <View style={[styles.menuIconBox, { backgroundColor: '#D1FAE5' }]}><Text style={styles.menuEmoji}>💳</Text></View>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Wallet Balance & Settle</Text>
            <Text style={[styles.chevron, { color: colors.textLight }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Offers')}>
            <View style={[styles.menuIconBox, { backgroundColor: '#FCE7F3' }]}><Text style={styles.menuEmoji}>🎁</Text></View>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Offers & Referrals</Text>
            <Text style={[styles.chevron, { color: colors.textLight }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Safety')}>
            <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}><Text style={styles.menuEmoji}>🛡️</Text></View>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Safety & Emergency Center</Text>
            <Text style={[styles.chevron, { color: colors.textLight }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Claims')}>
            <View style={[styles.menuIconBox, { backgroundColor: '#E0F2FE' }]}><Text style={styles.menuEmoji}>⚖️</Text></View>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Grievances, Claims & Refunds</Text>
            <Text style={[styles.chevron, { color: colors.textLight }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Settings')}>
            <View style={[styles.menuIconBox, { backgroundColor: '#F1F5F9' }]}><Text style={styles.menuEmoji}>⚙️</Text></View>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>App Preferences & Theme</Text>
            <Text style={[styles.chevron, { color: colors.textLight }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]} onPress={handleSupport}>
            <View style={[styles.menuIconBox, { backgroundColor: '#E0F2FE' }]}><Text style={styles.menuEmoji}>🎧</Text></View>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Help, FAQs & Legal Center</Text>
            <Text style={[styles.chevron, { color: colors.textLight }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Social Media Row */}
        <Text style={[styles.socialHeader, { color: colors.textLight }]}>CONNECT WITH OUR SOCIAL COMMUNITY</Text>
        <View style={styles.socialRow}>
          {[
            { platform: 'whatsapp', icon: '💬', color: '#25D366' },
            { platform: 'instagram', icon: '📸', color: '#E1306C' },
            { platform: 'youtube', icon: '📺', color: '#FF0000' },
            { platform: 'facebook', icon: '👤', color: '#1877F2' },
            { platform: 'twitter', icon: '🐦', color: '#1DA1F2' },
            { platform: 'linkedin', icon: '💼', color: '#0077B5' },
          ].map((item) => (
            <TouchableOpacity
              key={item.platform}
              style={[styles.socialIconWrap, { backgroundColor: isDark ? '#1E293B' : '#E5E7EB' }]}
              onPress={() => handleSocialLink(item.platform)}
            >
              <Text style={{ fontSize: 18 }}>{item.icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Securely Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav active="Profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1, padding: 16, paddingTop: 54 },
  heroCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFC72C',
  },
  avatarInitial: { color: '#0A0F24', fontSize: 32, fontWeight: '800' },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#16A34A',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  verifiedText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  editForm: { width: '100%' },
  fieldLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6, marginTop: 12, letterSpacing: 0.5 },
  userInfo: { alignItems: 'center', width: '100%' },
  name: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    gap: 6,
  },
  phoneText: { fontSize: 13, color: '#111827', fontWeight: '600' },
  verifiedPillText: { fontSize: 11, color: '#065F46', fontWeight: '700', textTransform: 'uppercase' },
  email: { fontSize: 14, marginTop: 6 },
  editLink: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editLinkText: { fontSize: 13, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 10,
  },
  rowButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  primaryButton: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#0A0F24', fontWeight: '800', fontSize: 14 },
  secondaryButton: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { fontWeight: '700', fontSize: 14 },

  metricsContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  metricBox: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricEmoji: { fontSize: 24, marginBottom: 4 },
  metricLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  metricValue: { fontSize: 18, fontWeight: '800' },

  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  referralHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  referralCode: { fontSize: 22, fontWeight: '900', marginTop: 2, letterSpacing: 1.5 },
  copyCodeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  copyCodeButtonText: { color: '#0A0F24', fontWeight: '800', fontSize: 12 },
  cardSub: { fontSize: 12, lineHeight: 17 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  addBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  addLink: { fontSize: 12, fontWeight: '700' },
  addForm: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  formLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  labelRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  labelChip: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  labelChipText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  saveAddressBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveAddressBtnText: { color: '#0A0F24', fontWeight: '800', fontSize: 14 },

  addressesList: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  addressRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  addressIconContainer: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  addressIcon: { fontSize: 16 },
  addressLabel: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  addressText: { fontSize: 13, marginTop: 1 },
  deleteBtn: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  removeText: { color: '#DC2626', fontSize: 11, fontWeight: '700' },

  emptyState: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },

  menuHeader: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: 24, marginBottom: 10 },
  menuSection: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuEmoji: { fontSize: 16 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  chevron: { fontSize: 18, fontWeight: '300' },

  socialHeader: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: 28, marginBottom: 12, textAlign: 'center' },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  socialIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

  logoutButton: { borderWidth: 1.5, borderColor: '#DC2626', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 16, marginHorizontal: 4 },
  logoutText: { color: '#DC2626', fontWeight: '800', fontSize: 14 },
});
