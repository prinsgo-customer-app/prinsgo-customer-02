import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,

  Animated,
} from 'react-native';
import { getMyTransactions } from '../api/wallet';
import { getSettings } from '../api/auth';
import { COLORS } from '../utils/theme';

const REASON_LABELS = {
  ride_payment: 'Ride Payment',
  parcel_payment: 'Parcel Payment',
  refund: 'Refund',
  referral_bonus: 'Referral Bonus',
  topup: 'Wallet Top-up',
  withdrawal: 'Withdrawal',
  admin_adjustment: 'Adjustment',
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const TransactionRow = ({ item, index }) => {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, slideAnim]);

  const isCredit = item.type === 'credit';

  return (
    <Animated.View style={[
      styles.txRow,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }
    ]}>
      <View style={styles.txIconContainer}>
        <Text style={styles.txIcon}>{isCredit ? '↓' : '↑'}</Text>
      </View>
      <View style={styles.txDetails}>
        <Text style={styles.txReason}>{REASON_LABELS[item.reason] || item.reason}</Text>
        <Text style={styles.txDate}>
          {new Date(item.createdAt).toLocaleDateString()} ·{' '}
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Text style={[styles.txAmount, isCredit ? styles.credit : styles.debit]}>
        {isCredit ? '+' : '-'}₹{Math.round(item.amount)}
      </Text>
    </Animated.View>
  );
};

export default function WalletScreen() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Bank/UPI details from Admin Settings
  const [settings, setSettings] = useState(null);
  const [showAddFunds, setShowAddFunds] = useState(false);

  const slideAnim = useRef(new Animated.Value(-20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [load, fadeAnim, slideAnim]);

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
    <AnimatedFlatList
      style={styles.container}
      data={transactions}
      keyExtractor={(item) => item._id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>₹{Math.round(balance)}</Text>
              <TouchableOpacity style={styles.addButton} onPress={handleAddFundsPress}>
                <Text style={styles.addButtonText}>{showAddFunds ? 'Close' : '+ Add Funds'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showAddFunds && settings && (
            <View style={styles.instructionsCard}>
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
            </View>
          )}

          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </Animated.View>
      }
      contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 60 }}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No transactions yet.</Text>
      }
      renderItem={({ item, index }) => <TransactionRow item={item} index={index} />}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceLabel: { color: 'rgba(0,0,0,0.6)', fontSize: 15, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 },
  balanceAmount: { color: '#000', fontSize: 44, fontWeight: '900', letterSpacing: -1 },
  addButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  instructionsCard: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
  instructionsTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 10 },
  instructionsBody: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, alignItems: 'center' },
  detailLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  bankSection: { marginTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 },
  bankTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 16, letterSpacing: -0.3, paddingHorizontal: 4 },
  emptyText: { textAlign: 'center', color: COLORS.textLight, marginTop: 40, fontSize: 15, fontWeight: '600' },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  txIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  txIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  txDetails: { flex: 1 },
  txReason: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  txDate: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  txAmount: { fontSize: 17, fontWeight: '900' },
  credit: { color: COLORS.green },
  debit: { color: COLORS.textPrimary }, // keep debit neutral/black instead of red for cleaner look, or red
});
