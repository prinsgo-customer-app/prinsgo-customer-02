import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { getBanners } from '../api/auth';
import AnimatedCard from '../components/AnimatedCard';

const { width } = Dimensions.get('window');

export default function OffersScreen({ navigation }) {
  const { colors, activeTheme } = useTheme();
  const { fontSizeMultiplier } = useAccessibility();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('offers'); // 'offers' | 'refer'
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [campaigns, setCampaigns] = useState([]);

  const isDark = activeTheme === 'dark';

  useEffect(() => {
    fetchPromoBanners();
  }, []);

  const fetchPromoBanners = async () => {
    setLoadingBanners(true);
    try {
      const res = await getBanners();
      setCampaigns(res.data?.banners || []);
    } catch (e) {
      // ignore
    } finally {
      setLoadingBanners(false);
    }
  };

  const copyToClipboard = async (text, type = 'Coupon Code') => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied! 📋', `${type} "${text}" successfully copied to your clipboard.`);
  };

  const handleShareReferral = async () => {
    const code = user?.referralCode || 'NOT_AVAILABLE';
    try {
      await Share.share({
        message: `Commute and send parcels safely with PrinsGo! Use my Referral Code *${code}* to receive ₹50 wallet cashback on your first booking. Download here: https://prinsgo.com`,
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Premium Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: 22 * fontSizeMultiplier }]}>
          Offers & Referrals
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Unlock exclusive rewards, cashbacks and discount deals
        </Text>
      </View>

      {/* Premium Navigation Tabs */}
      <View style={[styles.tabRow, { backgroundColor: isDark ? '#161B26' : '#FAFAFA' }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'offers' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('offers')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'offers' ? '#0A0F24' : colors.textSecondary }
            ]}
          >
            🎁 Active Offers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'refer' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('refer')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'refer' ? '#0A0F24' : colors.textSecondary }
            ]}
          >
            🤝 Refer & Earn
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'offers' ? (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

          {/* Prominent Hero Coupon Card */}
          <View style={[styles.heroPromoCard, { backgroundColor: isDark ? '#1E293B' : '#FFFBEB', borderColor: colors.primary }]}>
            <View style={styles.heroPromoHeader}>
              <Text style={styles.heroPromoTag}>🔥 SEASON'S CHOICE</Text>
              <Text style={[styles.heroPromoTitle, { color: colors.textPrimary }]}>Up to ₹100 Flat Wallet Cashback!</Text>
              <Text style={[styles.heroPromoBody, { color: colors.textSecondary }]}>
                Book any premium ride or parcel delivery this week. Apply code <Text style={{fontWeight: '800'}}>PRINSGO50</Text> at checkout.
              </Text>
            </View>
            <TouchableOpacity style={styles.heroPromoBtn} onPress={() => copyToClipboard('PRINSGO50')}>
              <Text style={styles.heroPromoBtnText}>COPY: PRINSGO50</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Available Vouchers</Text>

          {loadingBanners ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : campaigns.length === 0 ? (
            /* Premium Fallbacks Banners with Scratch Card look */
            <View style={{ gap: 16 }}>
              <AnimatedCard style={[styles.couponCard, { backgroundColor: isDark ? '#161B26' : '#FAFAFA', borderColor: colors.border }]} onPress={() => copyToClipboard('PRINS50')}>
                <View style={styles.cardHeader}>
                  <View style={styles.badgeRow}>
                    <Text style={[styles.tag, { color: colors.primary, backgroundColor: isDark ? '#0B0F19' : '#ECEEF2' }]}>FIRST TRIP</Text>
                    <Text style={styles.expiryTag}>EXP: 31 DEC</Text>
                  </View>
                  <Text style={[styles.titleCard, { color: colors.textPrimary }]}>Get 50% Off on your first trip</Text>
                  <Text style={[styles.descCard, { color: colors.textSecondary }]}>
                    Valid for all vehicle classes up to ₹100 maximum discount. Applies instantly at checkout.
                  </Text>
                  <View style={[styles.couponBox, { borderColor: colors.primary, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                    <Text style={[styles.couponCode, { color: colors.textPrimary }]}>PRINS50</Text>
                    <Text style={{ color: '#FFC72C', fontWeight: '800', fontSize: 11 }}>TAP TO COPY</Text>
                  </View>
                </View>
              </AnimatedCard>

              <AnimatedCard style={[styles.couponCard, { backgroundColor: isDark ? '#161B26' : '#FAFAFA', borderColor: colors.border }]} onPress={() => copyToClipboard('PRINSPARCEL')}>
                <View style={styles.cardHeader}>
                  <View style={styles.badgeRow}>
                    <Text style={[styles.tag, { color: colors.primary, backgroundColor: isDark ? '#0B0F19' : '#ECEEF2' }]}>PARCEL SPEC</Text>
                    <Text style={styles.expiryTag}>EXP: 31 DEC</Text>
                  </View>
                  <Text style={[styles.titleCard, { color: colors.textPrimary }]}>Flat ₹30 cashback on Parcel Delivery</Text>
                  <Text style={[styles.descCard, { color: colors.textSecondary }]}>
                    Ship files, food, electronics, and clothing securely. Minimum delivery fare requirement ₹80.
                  </Text>
                  <View style={[styles.couponBox, { borderColor: colors.primary, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                    <Text style={[styles.couponCode, { color: colors.textPrimary }]}>PRINSPARCEL</Text>
                    <Text style={{ color: '#FFC72C', fontWeight: '800', fontSize: 11 }}>TAP TO COPY</Text>
                  </View>
                </View>
              </AnimatedCard>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {campaigns.map((banner) => (
                <AnimatedCard key={banner._id} style={[styles.couponCard, { backgroundColor: isDark ? '#161B26' : '#FAFAFA', borderColor: colors.border }]} onPress={() => copyToClipboard(banner.linkValue || 'WELCOME30')}>
                  <View style={styles.cardHeader}>
                    <View style={styles.badgeRow}>
                      <Text style={[styles.tag, { color: colors.primary, backgroundColor: isDark ? '#0B0F19' : '#ECEEF2' }]}>DYNAMIC PROMO</Text>
                      <Text style={styles.expiryTag}>ACTIVE</Text>
                    </View>
                    <Text style={[styles.titleCard, { color: colors.textPrimary }]}>{banner.title}</Text>
                    <Text style={[styles.descCard, { color: colors.textSecondary }]}>
                      Enjoy premium rewards customized just for you. Apply this promo code at checkout.
                    </Text>
                    {banner.linkValue ? (
                      <View style={[styles.couponBox, { borderColor: colors.primary, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                        <Text style={[styles.couponCode, { color: colors.textPrimary }]}>{banner.linkValue}</Text>
                        <Text style={{ color: '#FFC72C', fontWeight: '800', fontSize: 11 }}>TAP TO COPY</Text>
                      </View>
                    ) : null}
                  </View>
                </AnimatedCard>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, alignItems: 'center', paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.referralIcon}>🪙</Text>
          <Text style={[styles.referralTitle, { color: colors.textPrimary }]}>Invite Friends & Earn Credits</Text>
          <Text style={[styles.referralBody, { color: colors.textSecondary }]}>
            Share the PrinsGo experience with your friends. They will get ₹50 free wallet credits upon signup, and you'll receive ₹50 wallet credits as soon as they complete their first ride or parcel delivery!
          </Text>

          {/* Timeline Steps */}
          <Text style={[styles.stepsHeader, { color: colors.textLight }]}>HOW IT WORKS</Text>
          <View style={[styles.stepsContainer, { borderColor: colors.border }]}>
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, { backgroundColor: colors.primary }]}><Text style={styles.stepNum}>1</Text></View>
              <Text style={[styles.stepText, { color: colors.textPrimary }]}>Share your unique referral code with family and friends.</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, { backgroundColor: colors.primary }]}><Text style={styles.stepNum}>2</Text></View>
              <Text style={[styles.stepText, { color: colors.textPrimary }]}>They get ₹50 wallet balance instantly upon sign up.</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, { backgroundColor: colors.primary }]}><Text style={styles.stepNum}>3</Text></View>
              <Text style={[styles.stepText, { color: colors.textPrimary }]}>You receive ₹50 credit after their first completed trip.</Text>
            </View>
          </View>

          <View style={[styles.referralBox, { backgroundColor: isDark ? '#161B26' : '#F9F9FB', borderColor: colors.border }]}>
            <Text style={{ color: colors.textLight, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Your Referral Code
            </Text>
            <Text style={[styles.referralCodeText, { color: colors.textPrimary }]}>
              {user?.referralCode || 'NOT_AVAILABLE'}
            </Text>
            <TouchableOpacity style={[styles.copyPill, { backgroundColor: colors.primary }]} onPress={() => copyToClipboard(user?.referralCode || '', 'Referral Code')}>
              <Text style={{ color: '#0A0F24', fontWeight: '800', fontSize: 12 }}>📋 COPY CODE</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.primary }]} onPress={handleShareReferral}>
            <Text style={[styles.shareButtonText, { color: '#0A0F24' }]}>🔗 Share Invite Code</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: { marginBottom: 6 },
  backText: { fontSize: 13, fontWeight: '700' },
  title: { fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 4 },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 4,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabText: { fontSize: 13, fontWeight: '800' },

  container: { flex: 1 },
  heroPromoCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 20,
    gap: 12,
  },
  heroPromoHeader: { gap: 4 },
  heroPromoTag: { fontSize: 11, fontWeight: '800', color: '#B45309' },
  heroPromoTitle: { fontSize: 18, fontWeight: '900' },
  heroPromoBody: { fontSize: 13, lineHeight: 18 },
  heroPromoBtn: {
    backgroundColor: '#0A0F24',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  heroPromoBtnText: { color: '#FFC72C', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },

  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },

  couponCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: { gap: 6 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  expiryTag: { fontSize: 10, color: '#94A3B8', fontWeight: '700' },
  titleCard: { fontSize: 15, fontWeight: '800' },
  descCard: { fontSize: 12, lineHeight: 17 },
  couponBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  couponCode: { fontSize: 15, fontWeight: '900', letterSpacing: 1 },

  referralIcon: { fontSize: 64, marginTop: 16, marginBottom: 10 },
  referralTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  referralBody: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },

  stepsHeader: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, alignSelf: 'flex-start', marginBottom: 8 },
  stepsContainer: { width: '100%', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 20, gap: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  stepNum: { color: '#0A0F24', fontSize: 12, fontWeight: '800' },
  stepText: { fontSize: 12, fontWeight: '600', flex: 1 },

  referralBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  referralCodeText: { fontSize: 26, fontWeight: '900', letterSpacing: 2, marginVertical: 8 },
  copyPill: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  shareButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareButtonText: { fontSize: 14, fontWeight: '800' },
});
