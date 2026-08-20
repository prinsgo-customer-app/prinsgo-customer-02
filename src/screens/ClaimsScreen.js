import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRideHistory } from '../api/rides';
import { getParcelHistory } from '../api/parcels';
import { getSettings } from '../api/auth';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { formatId } from '../utils/idGenerator';
import AnimatedCard from '../components/AnimatedCard';

const CLAIM_ISSUES = [
  { key: 'driver_issue', label: 'Driver behaviour / Safety issue' },
  { key: 'wrong_fare', label: 'Incorrect fare charged' },
  { key: 'damaged_parcel', label: 'Parcel damaged / item missing' },
  { key: 'delay', label: 'Significant transit delays' },
  { key: 'other', label: 'Other issues' },
];

export default function ClaimsScreen({ navigation }) {
  const { colors } = useTheme();
  const { fontSizeMultiplier } = useAccessibility();

  const [activeTab, setActiveTab] = useState('raise'); // 'raise' | 'history'
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [claimsHistory, setClaimsHistory] = useState([]);
  const [gstInfo, setGstInfo] = useState('');

  useEffect(() => {
    fetchBookings();
    loadClaimsHistory();
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const res = await getSettings();
      if (res.data?.settings?.gstNumber) {
        setGstInfo(res.data.settings.gstNumber);
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const [ridesRes, parcelsRes] = await Promise.all([
        getRideHistory(1, 10).catch(() => ({ data: { rides: [] } })),
        getParcelHistory(1, 10).catch(() => ({ data: { parcels: [] } })),
      ]);

      const rides = (ridesRes?.data?.rides || []).map((r) => ({
        ...r,
        type: 'ride',
        displayId: formatId('RID', r._id),
        dateLabel: new Date(r.createdAt).toLocaleDateString(),
        amountLabel: `₹${Math.round(r.fare?.totalFare || 0)}`,
        summary: `Ride from ${r.pickup?.address?.substring(0, 15)}... to ${r.drop?.address?.substring(0, 15)}...`,
      }));

      const parcels = (parcelsRes?.data?.parcels || []).map((p) => ({
        ...p,
        type: 'parcel',
        displayId: formatId('PRC', p._id),
        dateLabel: new Date(p.createdAt).toLocaleDateString(),
        amountLabel: `₹${Math.round(p.charges?.totalCharge || 0)}`,
        summary: `Parcel to ${p.drop?.contactName || 'Recipient'}`,
      }));

      setBookings([...rides, ...parcels]);
    } catch (err) {
      // ignore
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadClaimsHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem('prinsgo_claims');
      if (saved) {
        setClaimsHistory(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  };

  const saveClaimToHistory = async (newClaim) => {
    try {
      const list = [newClaim, ...claimsHistory];
      setClaimsHistory(list);
      await AsyncStorage.setItem('prinsgo_claims', JSON.stringify(list));
    } catch (e) {
      // ignore
    }
  };

  const handleRaiseClaim = async () => {
    if (!selectedBooking) {
      Alert.alert('Selection Required', 'Please select a ride or parcel booking from the list.');
      return;
    }
    if (!selectedIssue) {
      Alert.alert('Issue Required', 'Please choose an issue category.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Details Required', 'Please write a brief description of the issue.');
      return;
    }

    setSubmitting(true);
    // Simulate server side unique ID generation & registration delay
    setTimeout(async () => {
      const claimId = formatId('CLM');
      const refundId = formatId('REF');

      const claimObject = {
        id: claimId,
        refundId: refundId,
        bookingId: selectedBooking.displayId,
        bookingType: selectedBooking.type,
        issue: CLAIM_ISSUES.find((i) => i.key === selectedIssue)?.label || selectedIssue,
        description: description,
        status: 'under_review',
        refundStatus: 'pending_review',
        createdAt: new Date().toISOString(),
      };

      await saveClaimToHistory(claimObject);
      setSubmitting(false);

      Alert.alert(
        'Claim Submitted Successfully 🎉',
        `Your claim ${claimId} has been filed.\n\nAssociated Refund Ticket: ${refundId}\n\nOur grievance support department will evaluate and resolve this within 24 hours.`,
        [
          {
            text: 'View Claim Status',
            onPress: () => {
              setActiveTab('history');
              setSelectedBooking(null);
              setSelectedIssue('');
              setDescription('');
            },
          },
        ]
      );
    }, 1500);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: 20 * fontSizeMultiplier }]}>
          Claims & Refunds Center
        </Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'raise' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('raise')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'raise'
                ? { color: colors.textPrimary, fontWeight: '700' }
                : { color: colors.textLight },
            ]}
          >
            📋 File a Claim
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'history'
                ? { color: colors.textPrimary, fontWeight: '700' }
                : { color: colors.textLight },
            ]}
          >
            ⏱️ Grievances History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'raise' ? (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            1. Select past ride or delivery
          </Text>

          {loadingBookings ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 14 }} />
          ) : bookings.length === 0 ? (
            <Text style={[styles.emptyLabel, { color: colors.textLight }]}>
              No past bookings available to file a claim.
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10, marginVertical: 12 }}
            >
              {bookings.map((booking) => {
                const isSelected = selectedBooking?.displayId === booking.displayId;
                return (
                  <TouchableOpacity
                    key={booking.displayId}
                    style={[
                      styles.bookingCard,
                      { backgroundColor: colors.cardBg, borderColor: colors.border },
                      isSelected && { borderColor: colors.primary, borderWidth: 2 },
                    ]}
                    onPress={() => setSelectedBooking(booking)}
                  >
                    <Text style={[styles.bookingType, { color: colors.primary }]}>
                      {booking.type === 'ride' ? '🚗 RIDE' : '📦 PARCEL'}
                    </Text>
                    <Text style={[styles.bookingId, { color: colors.textPrimary }]}>
                      {booking.displayId}
                    </Text>
                    <Text style={[styles.bookingDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                      {booking.summary}
                    </Text>
                    <View style={styles.cardFooter}>
                      <Text style={{ color: colors.textLight, fontSize: 11 }}>{booking.dateLabel}</Text>
                      <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>
                        {booking.amountLabel}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={{ paddingHorizontal: 20 }}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: 14 }]}>
              2. Select Issue Category
            </Text>
            <View style={styles.issueRow}>
              {CLAIM_ISSUES.map((issue) => {
                const isSelected = selectedIssue === issue.key;
                return (
                  <TouchableOpacity
                    key={issue.key}
                    style={[
                      styles.issueChip,
                      { borderColor: colors.border },
                      isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedIssue(issue.key)}
                  >
                    <Text
                      style={[
                        styles.issueChipText,
                        { color: isSelected ? colors.textPrimary : colors.textSecondary },
                      ]}
                    >
                      {issue.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: 18 }]}>
              3. Provide Detailed Feedback
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.cardBg },
              ]}
              multiline
              numberOfLines={4}
              placeholder="What went wrong? Please share specific details to help our arbitration team review your case."
              placeholderTextColor={colors.textLight}
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                submitting && { opacity: 0.6 },
              ]}
              onPress={handleRaiseClaim}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <Text style={[styles.submitButtonText, { color: colors.textPrimary }]}>
                  Submit Claim Request
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={claimsHistory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🤝</Text>
              <Text style={[styles.emptyText, { color: colors.textLight }]}>
                No grievances or claims filed yet. Feel free to raise a support ticket.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.claimCard,
                { backgroundColor: colors.cardBg, borderColor: colors.border },
              ]}
            >
              <View style={styles.claimHeader}>
                <View>
                  <Text style={[styles.claimLabelId, { color: colors.textPrimary }]}>
                    Claim ID: {item.id}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>
                    Filed: {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: colors.border }]}>
                  <Text style={[styles.statusText, { color: colors.textPrimary }]}>
                    {item.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700' }}>
                Booking ID: {item.bookingId} ({item.bookingType.toUpperCase()})
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                Issue: {item.issue}
              </Text>
              <Text style={{ color: colors.textLight, fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>
                "{item.description}"
              </Text>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.refundRow}>
                <View>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
                    Refund Ticket
                  </Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '800' }}>
                    {item.refundId}
                  </Text>
                </View>
                <Text style={{ color: colors.orange, fontWeight: '700', fontSize: 12 }}>
                  {item.refundStatus.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {gstInfo ? (
        <Text style={[styles.gstFooter, { color: colors.textLight }]}>
          Corporate GST: {gstInfo}
        </Text>
      ) : null}
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

  container: { flex: 1, marginTop: 14 },
  sectionHeading: { fontSize: 16, fontWeight: '800', marginHorizontal: 20, marginVertical: 10, letterSpacing: -0.2 },
  emptyLabel: { marginHorizontal: 20, marginVertical: 16, fontSize: 14, fontStyle: 'italic' },

  bookingCard: {
    width: 220,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  bookingType: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  bookingId: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  bookingDesc: { fontSize: 13, marginTop: 4, marginBottom: 10, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  issueRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 12 },
  issueChip: {
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  issueChipText: { fontSize: 13, fontWeight: '700' },

  textArea: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 15,
    marginVertical: 12,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  submitButtonText: { fontSize: 16, fontWeight: '800' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 21 },

  claimCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  claimHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  claimLabelId: { fontSize: 16, fontWeight: '900' },
  statusPill: { borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  divider: { height: 1, marginVertical: 14 },
  refundRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gstFooter: { textAlign: 'center', fontSize: 11, marginVertical: 14, fontWeight: '700' },
});
