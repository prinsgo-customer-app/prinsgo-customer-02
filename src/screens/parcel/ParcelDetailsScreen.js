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
import { useTheme } from '../../context/ThemeContext';
import { useAccessibility } from '../../context/AccessibilityContext';

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
  { key: 'cash', label: '💵 Cash / COD' },
  { key: 'upi', label: '📱 UPI' },
  { key: 'wallet', label: '💳 Wallet' },
];

export default function ParcelDetailsScreen({ route, navigation }) {
  const { pickup, drop } = route.params || {};
  const { colors } = useTheme();
  const { fontSizeMultiplier } = useAccessibility();

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

  // Premium new inputs
  const [isFragile, setIsFragile] = useState(false);
  const [insuranceSelected, setInsuranceSelected] = useState(false);
  const [parcelDesc, setParcelDesc] = useState('');

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
        isFragile,
        insuranceSelected,
        description: parcelDesc.trim(),
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

  const handleSchedulePickup = () => {
    Alert.alert('Schedule Pickup', 'Arrange custom pickup window dates & times.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Schedule', onPress: () => Alert.alert('Success 🎉', 'Your parcel pickup has been scheduled successfully.') }
    ]);
  };

  const costTotal = estimate?.charges?.totalCharge || 0;
  const baseCost = Math.round(costTotal * 0.7);
  const distanceCost = Math.round(costTotal * 0.2);
  const insuranceFee = insuranceSelected ? 29 : 0;
  const finalTotal = Math.round(costTotal) + insuranceFee;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '700' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: 20 * fontSizeMultiplier }]}>
          Send a Parcel
        </Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.routeCard, { borderColor: colors.border }]}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.routeText, { color: colors.textSecondary }]} numberOfLines={1}>
              {pickup?.address || 'Current Location'}
            </Text>
          </View>
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: colors.red }]} />
            <Text style={[styles.routeText, { color: colors.textSecondary }]} numberOfLines={1}>
              {drop?.address || 'Drop Location'}
            </Text>
          </View>

          <TouchableOpacity style={[styles.scheduleBtn, { backgroundColor: colors.cardBg }]} onPress={handleSchedulePickup}>
            <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '700' }}>📅 SCHEDULE PICKUP</Text>
          </TouchableOpacity>
        </View>

        {/* Sender details card */}
        <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Sender details</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
            placeholder="Sender's full name"
            placeholderTextColor={colors.textLight}
            value={senderName}
            onChangeText={setSenderName}
          />
          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
            placeholder="Sender's 10-digit mobile number"
            placeholderTextColor={colors.textLight}
            keyboardType="number-pad"
            maxLength={10}
            value={senderPhone}
            onChangeText={(t) => setSenderPhone(t.replace(/[^0-9]/g, ''))}
          />
        </View>

        {/* Receiver details card */}
        <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border, marginTop: 14 }]}>
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Receiver details</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
            placeholder="Receiver's full name"
            placeholderTextColor={colors.textLight}
            value={receiverName}
            onChangeText={setReceiverName}
          />
          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
            placeholder="Receiver's 10-digit mobile number"
            placeholderTextColor={colors.textLight}
            keyboardType="number-pad"
            maxLength={10}
            value={receiverPhone}
            onChangeText={(t) => setReceiverPhone(t.replace(/[^0-9]/g, ''))}
          />
        </View>

        {/* Parcel type selection */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary, marginTop: 14 }]}>Parcel category</Text>
        <View style={styles.chipRow}>
          {PARCEL_TYPES.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.chip,
                { borderColor: colors.border },
                parcelType === item.key && { borderColor: colors.primary, backgroundColor: colors.cardBg },
              ]}
              onPress={() => setParcelType(item.key)}
            >
              <Text style={styles.chipIcon}>{item.icon}</Text>
              <Text style={[styles.chipText, { color: colors.textSecondary }, parcelType === item.key && { color: colors.textPrimary }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Approximate weight options */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary, marginTop: 10 }]}>Approximate weight</Text>
        <View style={styles.chipRow}>
          {WEIGHT_OPTIONS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.weightChip,
                { borderColor: colors.border },
                weightCategory === item.key && { borderColor: colors.primary, backgroundColor: colors.cardBg },
              ]}
              onPress={() => setWeightCategory(item.key)}
            >
              <Text style={[styles.chipText, { color: colors.textSecondary }, weightCategory === item.key && { color: colors.textPrimary }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Premium items options */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary, marginTop: 10 }]}>Parcel options</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, { backgroundColor: colors.cardBg, borderColor: isFragile ? colors.primary : colors.border }]}
            onPress={() => setIsFragile(!isFragile)}
          >
            <Text style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '700' }}>
              {isFragile ? '🍷 Fragile Enabled' : '🍷 Handle with care'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, { backgroundColor: colors.cardBg, borderColor: insuranceSelected ? colors.primary : colors.border }]}
            onPress={() => setInsuranceSelected(!insuranceSelected)}
          >
            <Text style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '700' }}>
              {insuranceSelected ? '🛡️ Transit Insured' : '🛡️ Insurance (+₹29)'}
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.cardBg, marginTop: 10, height: 60 }]}
          placeholder="Detailed description of parcel contents..."
          placeholderTextColor={colors.textLight}
          value={parcelDesc}
          onChangeText={setParcelDesc}
          multiline
        />

        {/* Payment method selection */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary, marginTop: 14 }]}>Payment method</Text>
        <View style={styles.chipRow}>
          {PAYMENT_METHODS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.weightChip,
                { borderColor: colors.border },
                paymentMethod === item.key && { borderColor: colors.primary, backgroundColor: colors.cardBg },
              ]}
              onPress={() => setPaymentMethod(item.key)}
            >
              <Text style={[styles.chipText, { color: colors.textSecondary }, paymentMethod === item.key && { color: colors.textPrimary }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dynamic pricing and itemized breakdown */}
        <View style={[styles.fareCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.breakdownTitle, { color: colors.textPrimary }]}>Charge breakdown</Text>
          {estimating ? (
            <ActivityIndicator color={colors.primary} />
          ) : estimate ? (
            <>
              <View style={styles.fareRow}>
                <Text style={[styles.fareLabel, { color: colors.textSecondary }]}>Cargo Base Fare</Text>
                <Text style={[styles.fareValue, { color: colors.textPrimary }]}>₹{baseCost}</Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={[styles.fareLabel, { color: colors.textSecondary }]}>Distance Matrix ({estimate.distanceKm?.toFixed(1)} km)</Text>
                <Text style={[styles.fareValue, { color: colors.textPrimary }]}>₹{distanceCost}</Text>
              </View>
              {insuranceSelected && (
                <View style={styles.fareRow}>
                  <Text style={[styles.fareLabel, { color: colors.textSecondary }]}>Transit Settle Protection</Text>
                  <Text style={[styles.fareValue, { color: colors.textPrimary }]}>₹29</Text>
                </View>
              )}
              <View style={[styles.fareRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 8 }]}>
                <Text style={[styles.fareTotalLabel, { color: colors.textPrimary }]}>Total Charge</Text>
                <Text style={[styles.fareTotalValue, { color: colors.textPrimary }]}>
                  ₹{finalTotal}
                </Text>
              </View>
            </>
          ) : (
            <Text style={[styles.fareLabel, { color: colors.textSecondary }]}>Charge estimate unavailable</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }, (booking || estimating) && { opacity: 0.6 }]}
          onPress={handleBook}
          disabled={booking || estimating}
        >
          {booking ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Confirm Parcel Booking</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  title: { fontSize: 20, fontWeight: '800' },
  container: { flex: 1, padding: 20 },
  routeCard: {
    borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 14,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  routeText: { flex: 1, fontSize: 13 },
  scheduleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  sectionLabel: { fontSize: 14, fontWeight: '800', marginBottom: 10 },
  input: {
    borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12,
  },
  chipIcon: { fontSize: 15, marginRight: 6 },
  weightChip: {
    borderWidth: 1.5, borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  fareCard: {
    borderRadius: 14, padding: 16, marginTop: 14, marginBottom: 20, borderWidth: 1,
  },
  breakdownTitle: { fontSize: 14, fontWeight: '800', marginBottom: 10 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  fareLabel: { fontSize: 13 },
  fareValue: { fontSize: 13, fontWeight: '600' },
  fareTotalLabel: { fontSize: 15, fontWeight: '800' },
  fareTotalValue: { fontSize: 18, fontWeight: '900' },
  button: { padding: 18, borderRadius: 15, alignItems: 'center' },
  buttonText: { fontSize: 17, fontWeight: '800' },
});
