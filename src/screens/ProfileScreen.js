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
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { updateProfile, addAddress, deleteAddress, getSettings } from '../api/auth';
import BottomNav from '../components/BottomNav';
import AnimatedCard from '../components/AnimatedCard';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';

const LABEL_ICONS = { home: 'home', work: 'briefcase', other: 'map-pin' };

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const { colors } = useTheme();
  const { t } = useLocalization();

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
      Alert.alert('Address required', 'Enter an address');
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
    Alert.alert('Remove address?', '', [
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
    Alert.alert('Log out?', 'Are you sure you want to log out of PrinsGo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
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
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 110 }}>

        {/* 1. Profile Header */}
        <View style={styles.profileHeaderCard}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarInitial, { color: '#0A0F24' }]}>
              {user?.name?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>

          <View style={styles.headerInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name}</Text>
              <View style={[styles.verifiedBadge, { backgroundColor: colors.green + '15' }]}>
                <Feather name="check-circle" size={12} color={colors.green} />
                <Text style={[styles.verifiedText, { color: colors.green }]}>Verified</Text>
              </View>
            </View>
            <Text style={[styles.phone, { color: colors.textSecondary }]}>+91 {user?.phone}</Text>
            {user?.email ? <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text> : null}

            <TouchableOpacity style={[styles.editLink, { backgroundColor: colors.cardBg }]} onPress={() => setEditing(!editing)}>
              <Feather name={editing ? "x" : "edit-2"} size={12} color={colors.textPrimary} />
              <Text style={[styles.editLinkText, { color: colors.textPrimary }]}>{editing ? "Cancel" : "Edit Profile"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {editing && (
          <AnimatedCard style={styles.editCard}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Name</Text>
            <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]} value={name} onChangeText={setName} />
            <Text style={[styles.label, { color: colors.textPrimary }]}>Email</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
              placeholderTextColor={colors.textLight}
            />
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={saveProfile} disabled={saving}>
              {saving ? <ActivityIndicator color="#0A0F24" /> : <Text style={styles.primaryButtonText}>Save Details</Text>}
            </TouchableOpacity>
          </AnimatedCard>
        )}

        {/* 2. Saved Addresses */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Saved Addresses</Text>
          <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)}>
            <Text style={[styles.addLink, { color: colors.primary }]}>{showAddForm ? 'Cancel' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {showAddForm && (
          <View style={[styles.addForm, { backgroundColor: colors.cardBg }]}>
            <View style={styles.labelRow}>
              {['home', 'work', 'other'].map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.labelChip, { borderColor: colors.border }, newLabel === l && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setNewLabel(l)}
                >
                  <Text style={[styles.labelChipText, { color: colors.textSecondary }, newLabel === l && { color: '#0A0F24', fontWeight: '700' }]}>
                    <Feather name={LABEL_ICONS[l]} size={12} /> {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, marginBottom: 12 }]}
              placeholder="Full address details"
              placeholderTextColor={colors.textLight}
              value={newAddress}
              onChangeText={setNewAddress}
              multiline
            />
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={submitAddress} disabled={addingAddress}>
              {addingAddress ? <ActivityIndicator color="#0A0F24" /> : <Text style={styles.primaryButtonText}>Save Address</Text>}
            </TouchableOpacity>
          </View>
        )}

        <AnimatedCard style={styles.addressListCard}>
          {user?.savedAddresses?.length ? (
            user.savedAddresses.map((addr, idx) => (
              <View key={addr._id} style={[styles.addressRow, idx < user.savedAddresses.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                <View style={[styles.addressIconWrap, { backgroundColor: colors.background }]}>
                  <Feather name={LABEL_ICONS[addr.label] || 'map-pin'} size={14} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addressLabel, { color: colors.textPrimary }]}>{addr.label}</Text>
                  <Text style={[styles.addressText, { color: colors.textSecondary }]}>{addr.address}</Text>
                </View>
                <TouchableOpacity onPress={() => removeAddress(addr._id)}>
                  <Feather name="trash-2" size={16} color={colors.red} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            !showAddForm && (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: colors.textLight, fontSize: 13 }}>No saved addresses yet.</Text>
              </View>
            )
          )}
        </AnimatedCard>

        {/* 3. Referral & Rewards */}
        <AnimatedCard style={styles.rewardCard}>
          <View style={styles.rewardHeader}>
            <Feather name="gift" size={24} color={colors.primary} />
            <View>
              <Text style={[styles.rewardTitle, { color: colors.textPrimary }]}>Referral & Rewards</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Invite friends to earn ride credits</Text>
            </View>
          </View>
          <View style={[styles.referralBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.referralCode, { color: colors.textPrimary }]}>{user?.referralCode || 'NOT AVAILABLE'}</Text>
            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.primary }]} onPress={() => Alert.alert('Share', `Use code ${user?.referralCode} to sign up on PrinsGo!`)}>
              <Feather name="share-2" size={14} color="#0A0F24" />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {/* Grouped Actions List */}
        <Text style={[styles.groupTitle, { color: colors.textLight }]}>Trips & Finances</Text>
        <AnimatedCard style={styles.groupCard}>
          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]} onPress={() => navigation.navigate('History', { initialTab: 'rides' })}>
            <Feather name="navigation" size={16} color={colors.primary} />
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Trips & Ride History</Text>
            <Feather name="chevron-right" size={14} color={colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]} onPress={() => navigation.navigate('History', { initialTab: 'parcels' })}>
            <Feather name="box" size={16} color={colors.primary} />
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Parcel & Logistics History</Text>
            <Feather name="chevron-right" size={14} color={colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]} onPress={() => navigation.navigate('Wallet')}>
            <Feather name="credit-card" size={16} color={colors.primary} />
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Payments, Wallet & Top-up</Text>
            <Feather name="chevron-right" size={14} color={colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('Claims')}>
            <Feather name="file-text" size={16} color={colors.primary} />
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Refund & Grievance Claims</Text>
            <Feather name="chevron-right" size={14} color={colors.textLight} />
          </TouchableOpacity>
        </AnimatedCard>

        <Text style={[styles.groupTitle, { color: colors.textLight }]}>Safety & Settings</Text>
        <AnimatedCard style={styles.groupCard}>
          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]} onPress={() => navigation.navigate('Safety')}>
            <Feather name="shield" size={16} color={colors.primary} />
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Safety Center & Emergency SOS</Text>
            <Feather name="chevron-right" size={14} color={colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]} onPress={() => navigation.navigate('Settings')}>
            <Feather name="settings" size={16} color={colors.primary} />
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Account Security & Preferences</Text>
            <Feather name="chevron-right" size={14} color={colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('Help')}>
            <Feather name="help-circle" size={16} color={colors.primary} />
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Help, Support & FAQs</Text>
            <Feather name="chevron-right" size={14} color={colors.textLight} />
          </TouchableOpacity>
        </AnimatedCard>

        {/* Social Media Row */}
        <Text style={[styles.socialHeader, { color: colors.textLight }]}>Connect with PrinsGo</Text>
        <View style={styles.socialRow}>
          {[
            { platform: 'whatsapp', icon: 'message-circle' },
            { platform: 'instagram', icon: 'instagram' },
            { platform: 'youtube', icon: 'youtube' },
            { platform: 'facebook', icon: 'facebook' },
            { platform: 'twitter', icon: 'twitter' },
            { platform: 'linkedin', icon: 'linkedin' },
          ].map((item) => (
            <TouchableOpacity
              key={item.platform}
              style={[styles.socialIconWrap, { backgroundColor: colors.cardBg, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => handleSocialLink(item.platform)}
            >
              <Feather name={item.icon} size={18} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.logoutButton, { borderColor: colors.red }]} onPress={handleLogout}>
          <Feather name="log-out" size={16} color={colors.red} style={{ marginRight: 6 }} />
          <Text style={[styles.logoutText, { color: colors.red }]}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav active="Profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1 },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 20,
    gap: 16,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  avatarInitial: { fontSize: 24, fontWeight: '800' },
  headerInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: '800' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  verifiedText: { fontSize: 9, fontWeight: '800', uppercase: true },
  phone: { fontSize: 13, marginTop: 2 },
  email: { fontSize: 12, marginTop: 1 },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  editLinkText: { fontSize: 11, fontWeight: '700' },

  editCard: { padding: 14, marginBottom: 14 },
  label: { fontSize: 12, marginBottom: 4, marginTop: 8, fontWeight: '700' },
  input: {
    borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14,
  },
  primaryButton: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  primaryButtonText: { color: '#0A0F24', fontWeight: '800', fontSize: 14 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  addLink: { fontWeight: '700', fontSize: 13 },
  addForm: { borderRadius: 14, padding: 14, marginBottom: 14 },
  labelRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  labelChip: { borderWidth: 1, borderRadius: 18, paddingVertical: 6, paddingHorizontal: 12 },
  labelChipText: { fontSize: 12, textTransform: 'capitalize' },

  addressListCard: { padding: 0, overflow: 'hidden' },
  addressRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  addressIconWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  addressLabel: { fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  addressText: { fontSize: 11, marginTop: 2, lineHeight: 15 },

  rewardCard: { padding: 14, marginTop: 16, marginBottom: 16 },
  rewardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rewardTitle: { fontSize: 14, fontWeight: '800' },
  referralBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  referralCode: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, gap: 4 },
  shareBtnText: { color: '#0A0F24', fontWeight: '800', fontSize: 11 },

  groupTitle: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: 20, marginBottom: 8, letterSpacing: 0.5 },
  groupCard: { paddingHorizontal: 14, paddingVertical: 4, marginVertical: 0 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  menuLabel: { flex: 1, fontSize: 13, fontWeight: '600' },

  socialHeader: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginTop: 24, marginBottom: 12, textAlign: 'center', letterSpacing: 0.5 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 16 },
  socialIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 2 },

  logoutButton: { flexDirection: 'row', borderWidth: 1, borderRadius: 10, paddingVertical: 12, justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  logoutText: { fontWeight: '800', fontSize: 14 },
});
