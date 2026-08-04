import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { estimateParcelCharge, bookParcel } from '../../api/parcels';
import { COLORS } from '../../utils/theme';

const PARCEL_TYPES = [
  { key: 'document', label: 'Document', icon: '📄' },
  { key: 'food', label: 'Food', icon: '🍱' },
  { key: 'electronics', label: 'Electronics', icon: '🔌' },
  { key: 'clothing', label: 'Clothing', icon: '👕' },
  { key: 'fragile', label: 'Fragile', icon: '🍷' },
  { key: 'other', label: 'Other', icon: '📦' },
];

const WEIGHT_OPTIONS = [
  { key: 'upto_1kg', label: 'Up to 1 kg' },
  { key: 'upto_5kg', label: 'Up to 5 kg' },
  { key: 'upto_10kg', label: 'Up to 10 kg' },
  { key: 'upto_20kg', label: 'Up to 20 kg' },
];

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Cash' },
  { key: 'upi', label: 'UPI' },
  { key: 'wallet', label: 'Wallet' },
];

export default function ParcelDetailsScreen({ route, navigation }) {
  const { pickup, drop } = route.params || {};

  const pickupLat = pickup?.lat ?? pickup?.latitude;
  const pickupLng = pickup?.lng ?? pickup?.longitude;
  const dropLat = drop?.lat ?? drop?.latitude;
  const dropLng = drop?.lng ?? drop?.longitude;

  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [parcelType, setParcelType] = useState('document');
  const [weightCategory, setWeightCategory] = useState('upto_1kg');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [estimate, setEstimate] = useState(null);
  const [estimating, setEstimating] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!pickupLat || !pickupLng || !dropLat || !dropLng) {
      Alert.alert('Location Error', 'Pickup or drop location missing', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      setEstimating(false);
      return;
    }
    fetchEstimate();
  }, [weightCategory]);

  const fetchEstimate = async () => {
    setEstimating(true);
    try {
      const res = await estimateParcelCharge({
        pickupLat,
        pickupLng,
        dropLat,
        dropLng,
        weightCategory,
      });
      setEstimate(res?.data || null);
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to calculate parcel charge');
    } finally {
      setEstimating(false);
    }
  };

  const handleBook = async () => {
    if (!senderName.trim() || !/^[6-9]\d{9}$/.test(senderPhone)) {
      Alert.alert('Sender details required', 'Enter a valid sender name and 10-digit phone number');
      return;
    }
    if (!receiverName.trim() || !/^[6-9]\d{9}$/.test(receiverPhone)) {
      Alert.alert('Receiver details required', 'Enter a valid receiver name and 10-digit phone number');
      return;
    }

    setBooking(true);
    try {
      const res = await bookParcel({
        pickup: {
          address: pickup?.address || 'Current Location',
          lat: pickupLat,
          lng: pickupLng,
          contactName: senderName.trim(),
          contactPhone: senderPhone,
        },
        drop: {
          address: drop?.address || 'Drop Location',
          lat: dropLat,
          lng: dropLng,
          contactName: receiverName.trim(),
          contactPhone: receiverPhone,
        },
        parcelType,
        weightCategory,
        paymentMethod,
      });

      const parcelId = res?.data?.parcel?._id;
      if (!parcelId) {
        Alert.alert('Booking Failed', res?.data?.message || 'Parcel ID not received from server');
        return;
      }

      navigation.replace('LiveParcel', { parcelId });
    } catch (err) {
      Alert.alert('Booking Error', err.message || 'Something went wrong');
    } finally {
      setBooking(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Send a Parcel</Text>

      <View style={styles.routeCard}>
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {pickup?.address || 'Current Location'}
          </Text>
        </View>
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: COLORS.red }]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {drop?.address || 'Drop Location'}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Sender details</Text>
      <TextInput
        style={styles.input}
        placeholder="Sender's full name"
        placeholderTextColor={COLORS.textLight}
        value={senderName}
        onChangeText={setSenderName}
      />
      <TextInput
        style={styles.input}
        placeholder="Sender's 10-digit mobile number"
        placeholderTextColor={COLORS.textLight}
        keyboardType="number-pad"
        maxLength={10}
        value={senderPhone}
        onChangeText={(t) => setSenderPhone(t.replace(/[^0-9]/g, ''))}
      />

      <Text style={styles.sectionLabel}>Receiver details</Text>
      <TextInput
        style={styles.input}
        placeholder="Receiver's full name"
        placeholderTextColor={COLORS.textLight}
        value={receiverName}
        onChangeText={setReceiverName}
      />
      <TextInput
        style={styles.input}
        placeholder="Receiver's 10-digit mobile number"
        placeholderTextColor={COLORS.textLight}
        keyboardType="number-pad"
        maxLength={10}
        value={receiverPhone}
        onChangeText={(t) => setReceiverPhone(t.replace(/[^0-9]/g, ''))}
      />

      <Text style={styles.sectionLabel}>Parcel type</Text>
      <View style={styles.chipRow}>
        {PARCEL_TYPES.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.chip, parcelType === item.key && styles.chipActive]}
            onPress={() => setParcelType(item.key)}
          >
            <Text style={styles.chipIcon}>{item.icon}</Text>
            <Text style={[styles.chipText, parcelType === item.key && styles.chipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Approximate weight</Text>
      <View style={styles.chipRow}>
        {WEIGHT_OPTIONS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.weightChip, weightCategory === item.key && styles.chipActive]}
            onPress={() => setWeightCategory(item.key)}
          >
            <Text style={[styles.chipText, weightCategory === item.key && styles.chipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Payment method</Text>
      <View style={styles.chipRow}>
        {PAYMENT_METHODS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.weightChip, paymentMethod === item.key && styles.chipActive]}
            onPress={() => setPaymentMethod(item.key)}
          >
            <Text style={[styles.chipText, paymentMethod === item.key && styles.chipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.fareCard}>
        {estimating ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : estimate ? (
          <>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Distance</Text>
              <Text style={styles.fareValue}>{estimate.distanceKm?.toFixed(1)} km</Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Estimated time</Text>
              <Text style={styles.fareValue}>{estimate.durationMin} min</Text>
            </View>
            <View style={[styles.fareRow, { marginTop: 6 }]}>
              <Text style={styles.fareTotalLabel}>Total charge</Text>
              <Text style={styles.fareTotalValue}>
                ₹{Math.round(estimate.charges?.totalCharge || 0)}
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.fareLabel}>Charge estimate unavailable</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, (booking || estimating) && { opacity: 0.6 }]}
        onPress={handleBook}
        disabled={booking || estimating}
      >
        {booking ? (
          <ActivityIndicator color={COLORS.textPrimary} />
        ) : (
          <Text style={styles.buttonText}>Book Parcel</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  routeCard: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, marginBottom: 20, backgroundColor: COLORS.background
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 9, height: 9, borderRadius: 4.5, marginRight: 10 },
  routeText: { flex: 1, fontSize: 14, color: COLORS.textSecondary },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8, marginTop: 6 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 10, color: COLORS.textPrimary
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8, marginBottom: 8,
  },
  chipIcon: { fontSize: 15, marginRight: 6 },
  weightChip: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 14, marginRight: 8, marginBottom: 8,
  },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.cardBg },
  chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  chipTextActive: { color: COLORS.textPrimary },
  fareCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 16, marginTop: 14, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border
  },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  fareLabel: { color: COLORS.textSecondary, fontSize: 13 },
  fareValue: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  fareTotalLabel: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  fareTotalValue: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  button: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center' },
  buttonText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
});
