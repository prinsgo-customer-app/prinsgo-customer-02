import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { getMyTransactions } from '../api/wallet';

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

  const load = useCallback(async () => {
    try {
      const res = await getMyTransactions(1, 30);
      setBalance(res.data.walletBalance);
      setTransactions(res.data.transactions);
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1877F2" />
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
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Wallet Balance</Text>
            <Text style={styles.balanceAmount}>₹{Math.round(balance)}</Text>
          </View>
          <Text style={styles.sectionTitle}>Transaction History</Text>
        </>
      }
      contentContainerStyle={{ padding: 20, paddingTop: 60 }}
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
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  balanceCard: { backgroundColor: '#0A0F24', borderRadius: 16, padding: 22, marginBottom: 24 },
  balanceLabel: { color: '#aaa', fontSize: 13 },
  balanceAmount: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0A0F24', marginBottom: 10 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40 },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 14,
  },
  txReason: { fontSize: 14, fontWeight: '600', color: '#0A0F24' },
  txDate: { fontSize: 12, color: '#999', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  credit: { color: '#16A34A' },
  debit: { color: '#DC2626' },
});
