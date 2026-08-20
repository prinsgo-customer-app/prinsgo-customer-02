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
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { getBanners } from '../api/auth';
import { formatId } from '../utils/idGenerator';
import AnimatedCard from '../components/AnimatedCard';

export default function OffersScreen({ navigation }) {
  const { colors } = useTheme();
  const { fontSizeMultiplier } = useAccessibility();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('offers'); // 'offers' | 'refer'
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [campaigns, setCampaigns] = useState([]);

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
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: 20 * fontSizeMultiplier }]}>
          Offers & Referrals
        </Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'offers' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('offers')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'offers'
                ? { color: colors.textPrimary, fontWeight: '700' }
                : { color: colors.textLight },
            ]}
          >
            🎁 Active Offers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'refer' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('refer')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'refer'
                ? { color: colors.textPrimary, fontWeight: '700' }
                : { color: colors.textLight },
            ]}
          >
            🤝 Refer & Earn
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'offers' ? (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {loadingBanners ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : campaigns.length === 0 ? (
            /* Premium Fallbacks Banners */
            <View style={{ gap: 14 }}>
              <AnimatedCard style={{ padding: 18 }} onPress={() => copyToClipboard('PRINS50')}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.tag, { color: colors.primary }]}>FIRST RIDE OFFER</Text>
                  <Text style={[styles.titleCard, { color: colors.textPrimary }]}>Get 50% Off on your first trip</Text>
                  <Text style={[styles.descCard, { color: colors.textSecondary }]}>
                    Valid for all vehicle classes up to ₹100 discount. Valid till end of month.
                  </Text>
                  <View style={[styles.couponBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <Text style={[styles.couponCode, { color: colors.textPrimary }]}>PRINS50</Text>
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 11 }}>TAP TO COPY</Text>
                  </View>
                </View>
              </AnimatedCard>

              <AnimatedCard style={{ padding: 18 }} onPress={() => copyToClipboard('PRINSPARCEL')}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.tag, { color: colors.primary }]}>DELIVERY DISCOUNTS</Text>
                  <Text style={[styles.titleCard, { color: colors.textPrimary }]}>Flat ₹30 cashback on Parcel Delivery</Text>
                  <Text style={[styles.descCard, { color: colors.textSecondary }]}>
                    Ship files, food, electronics, and clothing securely. Minimum delivery fare ₹80.
                  </Text>
                  <View style={[styles.couponBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <Text style={[styles.couponCode, { color: colors.textPrimary }]}>PRINSPARCEL</Text>
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 11 }}>TAP TO COPY</Text>
                  </View>
                </View>
              </AnimatedCard>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {campaigns.map((banner) => (
                <AnimatedCard key={banner._id} style={{ padding: 18 }} onPress={() => copyToClipboard(banner.linkValue || 'WELCOME30')}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.tag, { color: colors.primary }]}>FESTIVAL OFFER</Text>
                    <Text style={[styles.titleCard, { color: colors.textPrimary }]}>{banner.title}</Text>
                    <Text style={[styles.descCard, { color: colors.textSecondary }]}>
                      Enjoy dynamic rewards customized just for you. Apply this promo code at vehicle checkout.
                    </Text>
                    {banner.linkValue ? (
                      <View style={[styles.couponBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
                        <Text style={[styles.couponCode, { color: colors.textPrimary }]}>{banner.linkValue}</Text>
                        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 11 }}>TAP TO COPY</Text>
                      </View>
                    ) : null}
                  </View>
                </AnimatedCard>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
          <Text style={styles.referralIcon}>🪙</Text>
          <Text style={[styles.referralTitle, { color: colors.textPrimary }]}>Invite Friends & Earn Big</Text>
          <Text style={[styles.referralBody, { color: colors.textSecondary }]}>
            Share the PrinsGo experience with friends and family. They will get ₹50 free wallet credits upon signup, and you'll receive ₹50 wallet balance as soon as they complete their first ride or parcel delivery!
          </Text>

          <View style={[styles.referralBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={{ color: colors.textLight, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' }}>
              Your Unique Referral Code
            </Text>
            <Text style={[styles.referralCodeText, { color: colors.textPrimary }]}>
              {user?.referralCode || 'NOT_AVAILABLE'}
            </Text>
            <TouchableOpacity style={styles.copyPill} onPress={() => copyToClipboard(user?.referralCode || '', 'Referral Code')}>
              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 11 }}>📋 COPY CODE</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.primary }]} onPress={handleShareReferral}>
            <Text style={[styles.shareButtonText, { color: colors.textPrimary }]}>🔗 Share Link with Friends</Text>
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
    paddingTop: 60,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 15, fontWeight: '700' },
  title: { fontWeight: '900', letterSpacing: -0.5, fontSize: 26 },

  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 14, marginBottom: 10 },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 15, fontWeight: '700' },

  container: { flex: 1 },
  cardHeader: { gap: 6 },
  tag: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  titleCard: { fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },
  descCard: { fontSize: 14, lineHeight: 20 },
  couponBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  couponCode: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  referralIcon: { fontSize: 80, marginVertical: 20 },
  referralTitle: { fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 },
  referralBody: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  referralBox: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
  },
  referralCodeText: { fontSize: 28, fontWeight: '900', letterSpacing: 2, marginVertical: 14 },
  copyPill: {
    backgroundColor: '#FFC72C',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  shareButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  shareButtonText: { fontSize: 16, fontWeight: '800' },
});
