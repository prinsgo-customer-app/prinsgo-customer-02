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
  TextInput,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getMyTransactions } from '../api/wallet';
import { getSettings } from '../api/auth';
import { useTheme } from '../context/ThemeContext';
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
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'payment_methods' | 'refunds'
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Bank/UPI details from Admin Settings
  const [settings, setSettings] = useState(null);
  const [showAddFunds, setShowAddFunds] = useState(false);

  // Simulated User Methods (UPI & Bank Account state)
  const [upiList, setUpiList] = useState([
    { id: '1', upiId: 'user@okhdfc', isDefault: true, isVerified: true },
  ]);
  const [bankList, setBankList] = useState([
    { id: '1', holderName: 'John Doe', bankName: 'HDFC Bank', accNumber: 'XXXXXX4829', isDefault: true },
  ]);

  // Add UPI State
  const [showAddUpi, setShowAddUpi] = useState(false);
  const [newUpiId, setNewUpiId] = useState('');
  const [verifyingUpi, setVerifyingUpi] = useState(false);

  // Add Bank State
  const [showAddBank, setShowAddBank] = useState(false);
  const [bankHolderName, setBankHolderName] = useState('');
  const [bankNumber, setBankNumber] = useState('');
  const [bankConfirmNumber, setBankConfirmNumber] = useState('');
  const [bankNameStr, setBankNameStr] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [bankAccType, setBankAccType] = useState('Savings');

  // Simulated Refunds History
  const [refunds, setRefunds] = useState([
    { id: 'REF90812', bookingId: 'RID84291', amount: 350, date: '2026-08-10', status: 'Refunded', method: 'UPI (user@okhdfc)', timeline: 'Processed within 2 hours' },
    { id: 'REF20194', bookingId: 'PRC30129', amount: 120, date: '2026-08-11', status: 'Processing', method: 'Bank Account', timeline: 'Expected in 1-2 business days' },
  ]);

  const load = useCallback(async () => {
    try {
      const [txRes, settingsRes] = await Promise.all([
        getMyTransactions(1, 30).catch(() => ({ data: { walletBalance: 0, transactions: [] } })),
        getSettings().catch(() => ({ data: { settings: {} } })),
      ]);
      setBalance(txRes.data?.walletBalance || 0);
      setTransactions(txRes.data?.transactions || []);
      setSettings(settingsRes.data?.settings || null);
    } catch (err) {
      // ignore
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

  // UPI Management Handlers
  const handleAddUpi = () => {
    if (!newUpiId.trim() || !newUpiId.includes('@')) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid UPI address format (e.g. user@bank).');
      return;
    }
    setVerifyingUpi(true);
    // Simulate premium verification flow
    setTimeout(() => {
      setVerifyingUpi(false);
      const newUpi = {
        id: Math.random().toString(),
        upiId: newUpiId.trim(),
        isDefault: upiList.length === 0,
        isVerified: true,
      };
      setUpiList([...upiList, newUpi]);
      setNewUpiId('');
      setShowAddUpi(false);
      Alert.alert('UPI Added', 'Your UPI address has been successfully verified and linked.');
    }, 1500);
  };

  const handleRemoveUpi = (id) => {
    Alert.alert('Remove UPI', 'Are you sure you want to remove this verified UPI method?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setUpiList(upiList.filter(item => item.id !== id));
      }}
    ]);
  };

  const handleSetDefaultUpi = (id) => {
    setUpiList(upiList.map(item => ({ ...item, isDefault: item.id === id })));
  };

  // Bank Management Handlers
  const handleAddBank = () => {
    if (!bankHolderName.trim() || !bankNumber.trim() || !bankNameStr.trim() || !bankIfscCode.trim()) {
      Alert.alert('Incomplete Details', 'Please fill all fields to link your bank account.');
      return;
    }
    if (bankNumber.trim() !== bankConfirmNumber.trim()) {
      Alert.alert('Match Failure', 'Account numbers do not match.');
      return;
    }
    // Mask account number
    const maskedNum = 'XXXXXX' + bankNumber.slice(-4);
    const newBank = {
      id: Math.random().toString(),
      holderName: bankHolderName.trim(),
      bankName: bankNameStr.trim(),
      accNumber: maskedNum,
      isDefault: bankList.length === 0,
    };
    setBankList([...bankList, newBank]);
    setShowAddBank(false);
    // Reset bank form
    setBankHolderName('');
    setBankNumber('');
    setBankConfirmNumber('');
    setBankNameStr('');
    setBankIfscCode('');
    Alert.alert('Bank Linked', 'Your bank account details have been securely linked.');
  };

  const handleRemoveBank = (id) => {
    Alert.alert('Remove Bank', 'Are you sure you want to unlink this bank account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setBankList(bankList.filter(item => item.id !== id));
      }}
    ]);
  };

  const handleSetDefaultBank = (id) => {
    setBankList(bankList.map(item => ({ ...item, isDefault: item.id === id })));
  };

  const maskString = (str) => {
    if (!str) return '';
    const parts = str.split('@');
    if (parts.length < 2) return str;
    const pre = parts[0];
    const post = parts[1];
    if (pre.length <= 3) return `***@${post}`;
    return `${pre.slice(0, 2)}***${pre.slice(-1)}@${post}`;
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Balance Banner Header Card */}
      <View style={styles.topHeader}>
        <AnimatedCard style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>PrinsGo Wallet Balance</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>₹{Math.round(balance)}</Text>
            <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => setShowAddFunds(!showAddFunds)}>
              <Feather name={showAddFunds ? "x" : "plus"} size={13} color="#0A0F24" style={{ marginRight: 4 }} />
              <Text style={styles.addButtonText}>{showAddFunds ? 'Close' : 'Top up'}</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {showAddFunds && settings && (
          <AnimatedCard style={styles.instructionsCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Feather name="info" size={16} color={colors.primary} />
              <Text style={[styles.instructionsTitle, { color: colors.textPrimary }]}>How to Top up Wallet</Text>
            </View>
            <Text style={[styles.instructionsBody, { color: colors.textSecondary }]}>
              Please make an online transfer of any amount to our bank or UPI. Once processed, our admins will adjust your wallet balance immediately.
            </Text>

            {settings.upiId ? (
              <View style={[styles.detailRow, { borderBottomColor: colors.border, borderBottomWidth: 1, paddingBottom: 6 }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>UPI ID:</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{settings.upiId}</Text>
              </View>
            ) : null}

            {settings.bankAccountNumber ? (
              <View style={styles.bankSection}>
                <Text style={[styles.bankTitle, { color: colors.textPrimary }]}>Bank Transfer Details:</Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Bank Name:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{settings.bankName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Account Name:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{settings.bankAccountName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Account No:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{settings.bankAccountNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>IFSC Code:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{settings.bankIfsc}</Text>
                </View>
              </View>
            ) : null}
          </AnimatedCard>
        )}
      </View>

      {/* Navigation Tabs */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'transactions' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setActiveTab('transactions')}>
          <Text style={[styles.tabLabel, activeTab === 'transactions' ? { color: colors.textPrimary, fontWeight: '700' } : { color: colors.textLight }]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'payment_methods' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setActiveTab('payment_methods')}>
          <Text style={[styles.tabLabel, activeTab === 'payment_methods' ? { color: colors.textPrimary, fontWeight: '700' } : { color: colors.textLight }]}>UPI & Bank</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'refunds' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setActiveTab('refunds')}>
          <Text style={[styles.tabLabel, activeTab === 'refunds' ? { color: colors.textPrimary, fontWeight: '700' } : { color: colors.textLight }]}>Refunds</Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Content */}
      <View style={{ flex: 1 }}>

        {/* TAB 1: Transactions History */}
        {activeTab === 'transactions' && (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="credit-card" size={32} color={colors.textLight} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No transaction history yet.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.txRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.txReason, { color: colors.textPrimary }]}>{REASON_LABELS[item.reason] || item.reason}</Text>
                  <Text style={[styles.txDate, { color: colors.textLight }]}>
                    {new Date(item.createdAt).toLocaleDateString()} ·{' '}
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={[styles.txAmount, item.type === 'credit' ? { color: colors.green } : { color: colors.red }]}>
                  {item.type === 'credit' ? '+' : '-'}₹{Math.round(item.amount)}
                </Text>
              </View>
            )}
          />
        )}

        {/* TAB 2: UPI & Bank Methods */}
        {activeTab === 'payment_methods' && (
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
            {/* UPI Section */}
            <View style={styles.methodSectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Linked UPI Addresses</Text>
              <TouchableOpacity onPress={() => setShowAddUpi(!showAddUpi)}>
                <Text style={[styles.addBtnText, { color: colors.primary }]}>{showAddUpi ? 'Cancel' : '+ Link UPI'}</Text>
              </TouchableOpacity>
            </View>

            {showAddUpi && (
              <AnimatedCard style={styles.inputCard}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Enter UPI ID</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="e.g. username@okhdfc"
                  placeholderTextColor={colors.textLight}
                  value={newUpiId}
                  onChangeText={setNewUpiId}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleAddUpi} disabled={verifyingUpi}>
                  {verifyingUpi ? <ActivityIndicator color="#0A0F24" /> : <Text style={styles.submitBtnText}>Verify & Securely Link</Text>}
                </TouchableOpacity>
              </AnimatedCard>
            )}

            {upiList.length > 0 ? (
              upiList.map((item) => (
                <View key={item.id} style={[styles.methodRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.methodName, { color: colors.textPrimary }]}>{maskString(item.upiId)}</Text>
                      {item.isVerified && (
                        <View style={[styles.verifiedBadge, { backgroundColor: colors.green + '15' }]}>
                          <Feather name="shield" size={10} color={colors.green} />
                          <Text style={[styles.verifiedText, { color: colors.green }]}>Verified</Text>
                        </View>
                      )}
                    </View>
                    {item.isDefault && <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', marginTop: 2 }}>DEFAULT METHOD</Text>}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    {!item.isDefault && (
                      <TouchableOpacity onPress={() => handleSetDefaultUpi(item.id)}>
                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>Set Default</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => handleRemoveUpi(item.id)}>
                      <Feather name="trash-2" size={16} color={colors.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.emptySectionText, { color: colors.textLight }]}>No linked UPI accounts.</Text>
            )}

            {/* Bank Accounts Section */}
            <View style={[styles.methodSectionHeader, { marginTop: 24 }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Linked Bank Accounts</Text>
              <TouchableOpacity onPress={() => setShowAddBank(!showAddBank)}>
                <Text style={[styles.addBtnText, { color: colors.primary }]}>{showAddBank ? 'Cancel' : '+ Link Bank'}</Text>
              </TouchableOpacity>
            </View>

            {showAddBank && (
              <AnimatedCard style={styles.inputCard}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Bank Name</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="e.g. HDFC Bank"
                  placeholderTextColor={colors.textLight}
                  value={bankNameStr}
                  onChangeText={setBankNameStr}
                />
                <Text style={[styles.formLabel, { color: colors.textPrimary, marginTop: 10 }]}>Account Holder Name</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="Enter full name"
                  placeholderTextColor={colors.textLight}
                  value={bankHolderName}
                  onChangeText={setBankHolderName}
                />
                <Text style={[styles.formLabel, { color: colors.textPrimary, marginTop: 10 }]}>Account Number</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="Account number"
                  placeholderTextColor={colors.textLight}
                  value={bankNumber}
                  onChangeText={setBankNumber}
                  keyboardType="numeric"
                  secureTextEntry
                />
                <Text style={[styles.formLabel, { color: colors.textPrimary, marginTop: 10 }]}>Confirm Account Number</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="Re-enter account number"
                  placeholderTextColor={colors.textLight}
                  value={bankConfirmNumber}
                  onChangeText={setBankConfirmNumber}
                  keyboardType="numeric"
                />
                <Text style={[styles.formLabel, { color: colors.textPrimary, marginTop: 10 }]}>IFSC Code</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="e.g. HDFC0000124"
                  placeholderTextColor={colors.textLight}
                  value={bankIfscCode}
                  onChangeText={setBankIfscCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary, marginTop: 14 }]} onPress={handleAddBank}>
                  <Text style={styles.submitBtnText}>Secure Link Account</Text>
                </TouchableOpacity>
              </AnimatedCard>
            )}

            {bankList.length > 0 ? (
              bankList.map((item) => (
                <View key={item.id} style={[styles.methodRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.methodName, { color: colors.textPrimary }]}>{item.bankName} · {item.accNumber}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>{item.holderName}</Text>
                    {item.isDefault && <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', marginTop: 2 }}>DEFAULT ACCOUNT</Text>}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    {!item.isDefault && (
                      <TouchableOpacity onPress={() => handleSetDefaultBank(item.id)}>
                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>Set Default</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => handleRemoveBank(item.id)}>
                      <Feather name="trash-2" size={16} color={colors.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.emptySectionText, { color: colors.textLight }]}>No linked bank accounts.</Text>
            )}

            <View style={[styles.comingSoonBox, { backgroundColor: colors.cardBg, borderColor: colors.border, borderWidth: 1 }]}>
              <Feather name="lock" size={24} color={colors.textLight} style={{ marginBottom: 8 }} />
              <Text style={[styles.comingSoonTitle, { color: colors.textPrimary }]}>Secure Gateways Locked</Text>
              <Text style={[styles.comingSoonBody, { color: colors.textSecondary }]}>
                Real-time debit, cards & instant UPI gateway deposit transactions are currently unavailable in your region. Please utilize our verified manual bank/UPI instructions above to credit your wallet balance securely.
              </Text>
            </View>
          </ScrollView>
        )}

        {/* TAB 3: Refunds Tracking */}
        {activeTab === 'refunds' && (
          <FlatList
            data={refunds}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="refresh-cw" size={32} color={colors.textLight} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No refund records yet.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <AnimatedCard style={{ padding: 14, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>Refund ID: {item.id}</Text>
                  <View style={[styles.statusChip, { backgroundColor: item.status === 'Refunded' ? colors.green + '15' : colors.primary + '15' }]}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: item.status === 'Refunded' ? colors.green : colors.primary }}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={{ marginVertical: 8, gap: 4 }}>
                  <View style={styles.refundRow}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Booking ID:</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>{item.bookingId}</Text>
                  </View>
                  <View style={styles.refundRow}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Amount Credit:</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>₹{item.amount}</Text>
                  </View>
                  <View style={styles.refundRow}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Refund Destination:</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>{item.method}</Text>
                  </View>
                  <View style={styles.refundRow}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Process Timeline:</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>{item.timeline}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 10, color: colors.textLight, marginTop: 4 }}>Requested Date: {new Date(item.date).toLocaleDateString()}</Text>
              </AnimatedCard>
            )}
          />
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topHeader: { padding: 20, paddingBottom: 0, paddingTop: 60 },
  balanceCard: { backgroundColor: '#161B26', borderRadius: 16, padding: 22, marginBottom: 12, borderWidth: 1, borderColor: '#FFC72C', marginVertical: 0 },
  balanceLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '700', uppercase: true, letterSpacing: 0.5 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  balanceAmount: { color: '#FFFFFF', fontSize: 32, fontWeight: '800' },
  addButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  addButtonText: { color: '#0A0F24', fontWeight: '800', fontSize: 12 },

  instructionsCard: { borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, marginVertical: 0 },
  instructionsTitle: { fontSize: 14, fontWeight: '800' },
  instructionsBody: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { fontSize: 11, fontWeight: '600' },
  detailValue: { fontSize: 11, fontWeight: '700' },
  bankSection: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 },
  bankTitle: { fontSize: 12, fontWeight: '800', marginBottom: 4 },

  tabContainer: { flexDirection: 'row', paddingHorizontal: 20 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabLabel: { fontSize: 13, fontWeight: '600' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 8 },
  emptyText: { fontSize: 13, fontWeight: '600' },

  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  txReason: { fontSize: 13, fontWeight: '700' },
  txDate: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '800' },

  methodSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '800', uppercase: true, letterSpacing: 0.5 },
  addBtnText: { fontSize: 12, fontWeight: '700' },

  inputCard: { padding: 14, marginBottom: 14 },
  formLabel: { fontSize: 11, fontWeight: '700' },
  textInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, marginTop: 4 },
  submitBtn: { borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#0A0F24', fontWeight: '800', fontSize: 13 },

  methodRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8 },
  methodName: { fontSize: 13, fontWeight: '700' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, gap: 2 },
  verifiedText: { fontSize: 8, fontWeight: '800' },
  actionBtnText: { fontSize: 11, fontWeight: '700', marginRight: 6 },

  comingSoonBox: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  comingSoonTitle: { fontSize: 13, fontWeight: '800' },
  comingSoonBody: { fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 4 },

  statusChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  refundRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
});
