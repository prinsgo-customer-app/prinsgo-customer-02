import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { getMyTransactions } from '../api/wallet';
import { getSettings } from '../api/auth';
import { COLORS } from '../utils/theme';
import AnimatedCard from '../components/AnimatedCard';

const REASON_LABELS = {
  ride_payment: 'Ride Payment',
  parcel_payment: 'Parcel Payment',
  refund: 'Refund',
  referral_bonus: 'Referral Bonus',
  topup: 'Wallet Top-up',
  withdrawal: 'Withdrawal',
  admin_adjustment: 'Adjustment',
};

export default function WalletScreen() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Bank/UPI details from Admin Settings
  const [settings, setSettings] = useState(null);
  const [showAddFunds, setShowAddFunds] = useState(false);

  const load = useCallback(async () => {
    try {
      const [txRes, settingsRes] = await Promise.all([
        getMyTransactions(1, 30),
        getSettings(),
      ]);
      setBalance(txRes.data.walletBalance);
      setTransactions(txRes.data.transactions);
      setSettings(settingsRes.data.settings);
    } catch (err) {
      // ignore, show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleAddFundsPress = () => {
    setShowAddFunds(!showAddFunds);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={transactions}
      keyExtractor={(item) => item._id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <>
          <AnimatedCard style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Wallet Balance</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>₹{Math.round(balance)}</Text>
              <TouchableOpacity style={styles.addButton} onPress={handleAddFundsPress}>
                <Text style={styles.addButtonText}>{showAddFunds ? 'Close' : '+ Add Funds'}</Text>
              </TouchableOpacity>
            </View>
          </AnimatedCard>

          {showAddFunds && settings && (
            <AnimatedCard style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>How to Top up Wallet</Text>
              <Text style={styles.instructionsBody}>
                Please make an online transfer of any amount to our bank or UPI. Once processed, our admins will adjust your wallet balance immediately.
              </Text>

              {settings.upiId ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>UPI ID:</Text>
                  <Text style={styles.detailValue}>{settings.upiId}</Text>
                </View>
              ) : null}

              {settings.bankAccountNumber ? (
                <View style={styles.bankSection}>
                  <Text style={styles.bankTitle}>Bank Transfer Details:</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bank Name:</Text>
                    <Text style={styles.detailValue}>{settings.bankName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account Name:</Text>
                    <Text style={styles.detailValue}>{settings.bankAccountName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account No:</Text>
                    <Text style={styles.detailValue}>{settings.bankAccountNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>IFSC Code:</Text>
                    <Text style={styles.detailValue}>{settings.bankIfsc}</Text>
                  </View>
                </View>
              ) : null}
            </AnimatedCard>
          )}

          <Text style={styles.sectionTitle}>Transaction History</Text>
        </>
      }
      contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 60 }}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No transactions yet.</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.txRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.txReason}>{REASON_LABELS[item.reason] || item.reason}</Text>
            <Text style={styles.txDate}>
              {new Date(item.createdAt).toLocaleDateString()} ·{' '}
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={[styles.txAmount, item.type === 'credit' ? styles.credit : styles.debit]}>
            {item.type === 'credit' ? '+' : '-'}₹{Math.round(item.amount)}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  balanceCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  balanceLabel: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  balanceAmount: { color: COLORS.textPrimary, fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  addButton: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 24 },
  addButtonText: { color: '#0A0F24', fontWeight: '800', fontSize: 14 },
  instructionsCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border, marginVertical: 0 },
  instructionsTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  instructionsBody: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  detailLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },
  bankSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  bankTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 12, letterSpacing: -0.2 },
  emptyText: { textAlign: 'center', color: COLORS.textLight, marginTop: 40, fontSize: 15, fontWeight: '500' },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 16,
  },
  txReason: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  txDate: { fontSize: 13, color: COLORS.textLight, marginTop: 4, fontWeight: '500' },
  txAmount: { fontSize: 16, fontWeight: '900' },
  credit: { color: COLORS.green },
  debit: { color: COLORS.red },
});
