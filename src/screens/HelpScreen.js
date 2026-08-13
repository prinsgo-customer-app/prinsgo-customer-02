import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { getSettings } from '../api/auth';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';
import AnimatedCard from '../components/AnimatedCard';

const FAQ_ITEMS = [
  {
    q: 'How does the OpenStreetMap/Nominatim GPS fallback work?',
    a: 'PrinsGo features an automated multi-tier location failover. If Google Maps services are rate-limited or unavailable, our system switches seamlessly to OpenStreetMap/Nominatim, allowing you to search places, track rides, and drop off parcels without any disruption.',
  },
  {
    q: 'How can I add funds to my PrinsGo Wallet?',
    a: 'To top up your wallet, navigate to the Wallet Tab, press "+ Add Funds", and make an online UPI or bank transfer using the listed credentials. Our admin desk verifies the transaction and instantly adjusts your balance.',
  },
  {
    q: 'Can I cancel my ride or parcel shipment?',
    a: 'Yes, you can cancel any ride or parcel order before the driver/delivery partner accepts or arrives at your pickup location. Simply tap "Cancel" inside the Live Tracking screen.',
  },
  {
    q: 'How are refund requests verified?',
    a: 'Once you raise a dispute in the Claims Center, our arbitration team evaluates the case. When approved, a unique Refund ID (REF...) is generated and credits are automatically rolled back to your wallet.',
  },
];

const PAGES = {
  about: {
    title: 'About PrinsGo',
    text: 'PrinsGo is a premium, super-app ecosystem built for everyday logistics and convenient transit. Based in India, our goal is to offer zero-crash, high-reliability rides, cargo logistics, and on-demand parcel shipments. By integrating state-of-the-art fallback navigation systems, we guarantee high uptimes and seamless accessibility.',
  },
  privacy: {
    title: 'Privacy Policy',
    text: 'We take privacy seriously. PrinsGo Technologies Pvt. Ltd. collects location details in the foreground to match drivers, calculate accurate routing, and coordinate doorstep delivery. No continuous background tracking is active. All communications, tokens, and personal details are encrypted and securely vaulted.',
  },
  terms: {
    title: 'Terms & Conditions',
    text: 'By booking a ride or booking cargo transit with PrinsGo, you agree to our standard terms of service. Customers must represent accurate pickup and destination coordinates. Items packed in parcel packages must comply with local security acts. Hazardous, toxic, or illegal items are strictly prohibited.',
  },
  safety: {
    title: 'Safety & Security Policy',
    text: 'Your security is our absolute priority. Drivers onboarded to the PrinsGo platform undergo a mandatory double-blind document verification check. Every trip has live Map Coordinate rendering, in-trip SOS buttons, trusted contact SMS broadcasts, and safe start verification OTPs to protect your travel.',
  },
  cancellation: {
    title: 'Cancellation Policy',
    text: 'Cancellation is free if performed within 5 minutes of booking and before the driver arrives at the pickup spot. If cancelled post arrival, a nominal convenience fee may be added to cover the travel expenses of the delivery partner.',
  },
  refund: {
    title: 'Refund Policy',
    text: 'Approved refunds are credited back to the customer wallet immediately. In the event of a payment gateway failure or incorrect fare calculation, claims raised via the Claims Center are verified and resolved within 24 working hours.',
  },
};

export default function HelpScreen({ navigation }) {
  const { colors } = useTheme();
  const { fontSizeMultiplier } = useAccessibility();

  const [activeTab, setActiveTab] = useState('faq'); // 'faq' | 'legal'
  const [selectedPage, setSelectedPage] = useState(null); // null or key from PAGES
  const [loading, setLoading] = useState(false);
  const [gstNumber, setGstNumber] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportEmail, setSupportEmail] = useState('');

  const [faqList, setFaqList] = useState(FAQ_ITEMS);
  const [cmsPages, setCmsPages] = useState(PAGES);

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    setLoading(true);
    try {
      const res = await getSettings();
      const settings = res?.data?.settings;
      if (settings) {
        setGstNumber(settings.gstNumber || 'GSTIN27AACP9928H1Z8');
        setSupportPhone(settings.supportPhone || '8629995010');
        setSupportEmail(settings.supportEmail || 'Prinsgoofficial@gmail.com');

        // Dynamically load Admin CMS/FAQ if configured in backend
        if (settings.faqs && Array.isArray(settings.faqs) && settings.faqs.length > 0) {
          setFaqList(settings.faqs);
        } else if (settings.faqList && Array.isArray(settings.faqList) && settings.faqList.length > 0) {
          setFaqList(settings.faqList);
        }

        if (settings.cmsPages && typeof settings.cmsPages === 'object') {
          setCmsPages({ ...PAGES, ...settings.cmsPages });
        }
      }
    } catch (e) {
      setGstNumber('GSTIN27AACP9928H1Z8');
      setSupportPhone('8629995010');
      setSupportEmail('Prinsgoofficial@gmail.com');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSupport = () => {
    Linking.openURL(`mailto:${supportEmail || 'Prinsgoofficial@gmail.com'}`);
  };

  const handleCallSupport = () => {
    Linking.openURL(`tel:${supportPhone || '8629995010'}`);
  };

  if (selectedPage) {
    const pageData = cmsPages[selectedPage] || PAGES[selectedPage];
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedPage(null)}>
            <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back to Help</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: 18 * fontSizeMultiplier }]}>
            {pageData.title}
          </Text>
        </View>
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
          <Text style={[styles.pageContent, { color: colors.textSecondary }]}>
            {pageData.text || pageData.content}
          </Text>

          <View style={[styles.legalDisclaimer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.disclaimerTitle, { color: colors.textPrimary }]}>Administrative Info</Text>
            <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
              Registered Entity: PrinsGo Technologies Pvt. Ltd.
            </Text>
            {gstNumber ? (
              <Text style={[styles.disclaimerText, { color: colors.textSecondary, marginTop: 4 }]}>
                GST Number: {gstNumber}
              </Text>
            ) : null}
            <Text style={[styles.disclaimerText, { color: colors.textSecondary, marginTop: 4 }]}>
              State Jurisdiction: Maharashtra, India 🇮🇳
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: 20 * fontSizeMultiplier }]}>
          Help Center & FAQs
        </Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'faq' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('faq')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'faq'
                ? { color: colors.textPrimary, fontWeight: '700' }
                : { color: colors.textLight },
            ]}
          >
            ❓ FAQs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'legal' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('legal')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'legal'
                ? { color: colors.textPrimary, fontWeight: '700' }
                : { color: colors.textLight },
            ]}
          >
            📜 Legal & Information
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'faq' ? (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={{ gap: 14 }}>
            {faqList.map((faq, idx) => (
              <View key={idx} style={[styles.faqCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Text style={[styles.faqQuestion, { color: colors.textPrimary }]}>Q: {faq.q || faq.question}</Text>
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.a || faq.answer}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.contactLabel, { color: colors.textPrimary }]}>Still need help?</Text>
          <View style={styles.contactRow}>
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: colors.cardBg }]} onPress={handleCallSupport}>
              <Text style={{ fontSize: 20 }}>📞</Text>
              <Text style={[styles.contactBtnText, { color: colors.textPrimary }]}>Call Support</Text>
              <Text style={{ fontSize: 11, color: colors.textLight }}>{supportPhone}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: colors.cardBg }]} onPress={handleEmailSupport}>
              <Text style={{ fontSize: 20 }}>📧</Text>
              <Text style={[styles.contactBtnText, { color: colors.textPrimary }]}>Email Support</Text>
              <Text style={{ fontSize: 11, color: colors.textLight }}>{supportEmail}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={{ gap: 10 }}>
            {Object.keys(cmsPages).map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.legalRow, { borderBottomColor: colors.border }]}
                onPress={() => setSelectedPage(key)}
              >
                <Text style={[styles.legalRowText, { color: colors.textPrimary }]}>
                  {cmsPages[key].title}
                </Text>
                <Text style={{ color: colors.textLight, fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footerWrap}>
            <Text style={[styles.footerText, { color: colors.textLight }]}>
              © PrinsGo Technologies Pvt. Ltd.
            </Text>
            <Text style={[styles.footerText, { color: colors.textLight, marginTop: 2 }]}>
              All Rights Reserved.
            </Text>
            <Text style={[styles.footerText, { color: colors.textLight, marginTop: 4, fontSize: 13 }]}>
              Made in 🇮🇳
            </Text>
          </View>
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
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: { marginBottom: 6 },
  backText: { fontSize: 14, fontWeight: '600' },
  title: { fontWeight: '800' },

  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 14, marginBottom: 6 },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 14, fontWeight: '600' },

  container: { flex: 1 },
  faqCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  faqQuestion: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  faqAnswer: { fontSize: 13, lineHeight: 18 },

  contactLabel: { fontSize: 16, fontWeight: '800', marginTop: 28, marginBottom: 12, textAlign: 'center' },
  contactRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  contactBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    gap: 4,
  },
  contactBtnText: { fontSize: 14, fontWeight: '700' },

  legalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  legalRowText: { fontSize: 15, fontWeight: '600' },

  pageContent: { fontSize: 14, lineHeight: 22, marginTop: 10 },
  legalDisclaimer: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
  },
  disclaimerTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  disclaimerText: { fontSize: 12 },

  footerWrap: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 11, fontWeight: '600' },
});
