import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Share,
  Linking,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { getSettings } from '../api/auth';
import BottomNav from '../components/BottomNav';
import AnimatedCard from '../components/AnimatedCard';

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const { fontSizeMultiplier } = useAccessibility();
  const { user, logout, refreshUser } = useAuth();

  // Premium details fetched dynamically or fallbacks
  const [profilePic, setProfilePic] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [adminSettings, setAdminSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.addListener('focus', () => {
      refreshUser();
      loadAdditionalDetails();
    });
    fetchSupportSettings();
  }, [navigation]);

  const loadAdditionalDetails = async () => {
    try {
      const saved = await AsyncStorage.getItem('prinsgo_profile_extra');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profilePic) setProfilePic(parsed.profilePic);
        if (parsed.dob) {
          // Can be used for extended info
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchSupportSettings = async () => {
    try {
      const res = await getSettings();
      if (res.data?.settings) {
        setAdminSettings(res.data.settings);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    if (user?.name) {
      const parts = user.name.split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
  }, [user]);

  const copyReferralCode = async () => {
    const code = user?.referralCode || 'NOT AVAILABLE';
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied! 📋', `Referral Code "${code}" copied to clipboard.`);
  };

  const handleShareReferral = async () => {
    const code = user?.referralCode || 'NOT_AVAILABLE';
    try {
      await Share.share({
        message: `Join PrinsGo with my referral code: *${code}* and get ₹50 free wallet credits! https://prinsgo.com`,
      });
    } catch (e) {
      // ignore
    }
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

        {/* Premium Profile Header */}
        <AnimatedCard style={styles.profileHeaderCard}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.avatarTouch}>
              <Image source={{ uri: profilePic }} style={styles.avatar} />
              <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                <Text style={{ fontSize: 10 }}>✏️</Text>
              </View>
            </TouchableOpacity>

            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.profileName, { color: colors.textPrimary, fontSize: 18 * fontSizeMultiplier }]}>
                  {firstName || 'PrinsGo'} {lastName || 'User'}
                </Text>
                <View style={[styles.badge, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.badgeText}>✓ VERIFIED</Text>
                </View>
              </View>
              <Text style={[styles.profileSub, { color: colors.textSecondary }]}>+91 {user?.phone}</Text>
              {user?.email ? <Text style={[styles.profileEmail, { color: colors.textLight }]}>{user.email}</Text> : null}
            </View>
          </View>

          <TouchableOpacity style={[styles.editProfileBtn, { borderColor: colors.border }]} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>Edit Personal Details</Text>
          </TouchableOpacity>
        </AnimatedCard>

        {/* Saved Addresses Summary Shortcut */}
        <AnimatedCard style={styles.addressSummaryCard} onPress={() => navigation.navigate('SavedAddresses')}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 20 }}>🏠</Text>
              <View>
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Saved Addresses</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {user?.savedAddresses?.length || 0} locations registered
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.textLight, fontSize: 18 }}>›</Text>
          </View>
        </AnimatedCard>

        {/* Emergency Contacts Shortcut */}
        <AnimatedCard style={styles.addressSummaryCard} onPress={() => navigation.navigate('EmergencyContacts')}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 20 }}>📞</Text>
              <View>
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Emergency Contacts</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Add family and trusted contacts</Text>
              </View>
            </View>
            <Text style={{ color: colors.textLight, fontSize: 18 }}>›</Text>
          </View>
        </AnimatedCard>

        {/* Referral Card */}
        <AnimatedCard style={styles.referralCard}>
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>
            🎉 Referral Bonus Program
          </Text>
          <Text style={[styles.referralDesc, { color: colors.textSecondary }]}>
            Give ₹50 to your friends, get ₹50 as soon as they complete their first ride or parcel delivery.
          </Text>
          <View style={[styles.codeRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TouchableOpacity onPress={copyReferralCode} style={{ flex: 1 }}>
              <Text style={[styles.codeText, { color: colors.textPrimary }]}>{user?.referralCode || 'NOT AVAILABLE'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShareReferral} style={[styles.shareBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 12 }}>SHARE</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {/* Settings Navigation Menu */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('History')}>
            <Text style={styles.menuIcon}>🏍️</Text>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Trips & Bookings History</Text>
            <Text style={{ color: colors.textLight }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Wallet')}>
            <Text style={styles.menuIcon}>💳</Text>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Payments & Wallet</Text>
            <Text style={{ color: colors.textLight }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Safety')}>
            <Text style={styles.menuIcon}>🛡️</Text>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Safety Center</Text>
            <Text style={{ color: colors.textLight }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Security')}>
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Account Security & PIN</Text>
            <Text style={{ color: colors.textLight }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>System & UI Settings</Text>
            <Text style={{ color: colors.textLight }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Claims')}>
            <Text style={styles.menuIcon}>⚖️</Text>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Claims & Grievance Center</Text>
            <Text style={{ color: colors.textLight }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Help')}>
            <Text style={styles.menuIcon}>🎧</Text>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Help & FAQs</Text>
            <Text style={{ color: colors.textLight }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Social Media Links */}
        <Text style={[styles.socialHeader, { color: colors.textLight }]}>Connect with us</Text>
        <View style={styles.socialRow}>
          {[
            { platform: 'whatsapp', icon: '💬' },
            { platform: 'instagram', icon: '📸' },
            { platform: 'youtube', icon: '📺' },
            { platform: 'facebook', icon: '👤' },
            { platform: 'twitter', icon: '🐦' },
            { platform: 'linkedin', icon: '💼' },
          ].map((item) => (
            <TouchableOpacity
              key={item.platform}
              style={[styles.socialIconWrap, { backgroundColor: colors.cardBg }]}
              onPress={() => handleSocialLink(item.platform)}
            >
              <Text style={{ fontSize: 18 }}>{item.icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.logoutButton, { borderColor: colors.red }]} onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: colors.red }]}>Log Out of PrinsGo</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav active="Profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1 },

  profileHeaderCard: { padding: 18, marginBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  avatarTouch: { position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  profileName: { fontWeight: '800' },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '800' },
  profileSub: { fontSize: 14, marginTop: 4, fontWeight: '500' },
  profileEmail: { fontSize: 12, marginTop: 2 },
  editProfileBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },

  addressSummaryCard: { padding: 16, marginBottom: 10 },
  sectionHeading: { fontSize: 14, fontWeight: '800' },

  referralCard: { padding: 18, marginVertical: 14 },
  referralDesc: { fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 12 },
  codeRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    padding: 6,
    alignItems: 'center',
  },
  codeText: { fontSize: 16, fontWeight: '900', letterSpacing: 1.5, marginLeft: 8 },
  shareBtn: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },

  menuSection: { marginTop: 14 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  menuIcon: { fontSize: 18, width: 28 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600' },

  socialHeader: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 28, marginBottom: 12, textAlign: 'center', letterSpacing: 0.5 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 14 },
  socialIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

  logoutButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  logoutText: { fontWeight: '700', fontSize: 14 },
});
