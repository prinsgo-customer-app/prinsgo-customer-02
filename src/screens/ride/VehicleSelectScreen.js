import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { estimateFare, bookRide } from '../../api/rides';
import { useTheme } from '../../context/ThemeContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import AnimatedCard from '../../components/AnimatedCard';

const VEHICLE_LABELS = {
  bike: { label: 'PrinsGo Bike', icon: '🏍️', capacity: '1 Pax', desc: 'Fastest solo travel' },
  auto: { label: 'PrinsGo Auto', icon: '🛺', capacity: '3 Pax', desc: 'Affordable open transit' },
  car_mini: { label: 'Mini Hatchback', icon: '🚗', capacity: '4 Pax', desc: 'Compact AC cabins' },
  car_sedan: { label: 'Comfort Sedan', icon: '🚘', capacity: '5 Pax', desc: 'Top-tier spacious rides' },
};

export default function VehicleSelectScreen({ route, navigation }) {
  const { pickup, drop } = route.params || {};
  const { colors } = useTheme();
  const { fontSizeMultiplier } = useAccessibility();

  const [estimates, setEstimates] = useState([]);
  const [selected, setSelected] = useState('bike');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'wallet' | 'upi'
  const [selectedCoupon, setSelectedCoupon] = useState(null); // null | { code: string, discount: number }

  const [stops, setStops] = useState([]); // array of intermediate stops { address: string, lat: number, lng: number }

  useEffect(() => {
    getFare();
  }, []);

  const getFare = async () => {
    const pLat = pickup?.lat || pickup?.latitude;
    const pLng = pickup?.lng || pickup?.longitude;
    const dLat = drop?.lat || drop?.latitude;
    const dLng = drop?.lng || drop?.longitude;

    if (!pLat || !pLng || !dLat || !dLng) {
      Alert.alert('Location Error', 'Pickup or drop location missing', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const res = await estimateFare(pLat, pLng, dLat, dLng);
      setEstimates(res?.data?.estimates || res?.estimates || []);
    } catch (error) {
      console.log('FARE ERROR', error);
      Alert.alert('Error', 'Unable to calculate fare');
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async () => {
    if (!pickup || !drop || !selected) {
      Alert.alert('Booking Error', 'Pickup, drop and vehicle required');
      return;
    }

    setBooking(true);

    try {
      const pLat = pickup?.lat || pickup?.latitude;
      const pLng = pickup?.lng || pickup?.longitude;
      const dLat = drop?.lat || drop?.latitude;
      const dLng = drop?.lng || drop?.longitude;

      // Pack stops if any exist
      const res = await bookRide({
        pickup: {
          address: pickup.address || 'Current Location',
          lat: pLat,
          lng: pLng,
        },
        drop: {
          address: drop.address || 'Drop Location',
          lat: dLat,
          lng: dLng,
        },
        vehicleType: selected,
        paymentMethod,
        stops: stops.length > 0 ? stops : undefined,
      });

      const rideId = res?.data?.ride?._id;

      if (!rideId) {
        Alert.alert('Booking Failed', res?.data?.message || 'Ride ID not received from server');
        return;
      }

      navigation.replace('LiveRide', {
        rideId: rideId,
      });
    } catch (error) {
      console.log('BOOK ERROR', error);
      Alert.alert('Booking Error', error?.message || 'Something went wrong');
    } finally {
      setBooking(false);
    }
  };

  const selectedItem = estimates.find((item) => item.vehicleType === selected);
  const baseFare = selectedItem ? Math.round(selectedItem.totalFare * 0.5) : 0;
  const distanceCharge = selectedItem ? Math.round(selectedItem.totalFare * 0.35) : 0;
  const platformFee = selectedItem ? 15 : 0;
  const taxes = selectedItem ? Math.round(selectedItem.totalFare * 0.1) : 0;
  const rawTotal = selectedItem ? Math.round(selectedItem.totalFare) : 0;
  const discount = selectedCoupon ? selectedCoupon.discount : 0;
  const finalTotal = Math.max(0, rawTotal - discount);

  const handleApplyCoupon = (code, value) => {
    if (selectedCoupon?.code === code) {
      setSelectedCoupon(null);
      Alert.alert('Coupon Removed', 'Promo discount has been removed.');
    } else {
      setSelectedCoupon({ code, discount: value });
      Alert.alert('Coupon Applied 🎉', `Coupon "${code}" applied successfully! Saved ₹${value}.`);
    }
  };

  const handleAddStop = () => {
    Alert.prompt(
      'Add Intermediate Stop',
      'Please enter physical stop address:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Stop',
          onPress: (val) => {
            if (val && val.trim().length > 0) {
              setStops([...stops, { address: val, lat: 22.1, lng: 80.1 }]);
            }
          },
        },
      ]
    );
  };

  const handleScheduleRide = () => {
    Alert.alert(
      'Schedule Ride Later',
      'Select dynamic date & time. Pre-book and locks fare prices.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Schedule Now',
          onPress: () => {
            Alert.alert('Success 🎉', 'Your ride has been successfully scheduled. You can track this in Bookings History.');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Finding best premium fare...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '700' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: 20 * fontSizeMultiplier }]}>
          Choose Your Ride
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} style={{ flex: 1 }}>
        {/* Destination Info Route Card */}
        <View style={[styles.routeCard, { borderColor: colors.border }]}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={{ color: colors.textPrimary, fontSize: 13, flex: 1 }} numberOfLines={1}>
              {pickup?.address || 'Current Location'}
            </Text>
          </View>
          {stops.map((stop, i) => (
            <View key={i} style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: colors.orange }]} />
              <Text style={{ color: colors.textPrimary, fontSize: 13, flex: 1 }} numberOfLines={1}>
                {stop.address}
              </Text>
              <TouchableOpacity onPress={() => setStops(stops.filter((_, idx) => idx !== i))}>
                <Text style={{ color: colors.red, fontSize: 12, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: colors.red }]} />
            <Text style={{ color: colors.textPrimary, fontSize: 13, flex: 1 }} numberOfLines={1}>
              {drop?.address || 'Drop Location'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
            <TouchableOpacity style={[styles.pillsBtn, { backgroundColor: colors.cardBg }]} onPress={handleAddStop}>
              <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '700' }}>+ ADD STOP</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pillsBtn, { backgroundColor: colors.cardBg }]} onPress={handleScheduleRide}>
              <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '700' }}>📅 SCHEDULE LATER</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle Selection List */}
        <FlatList
          data={estimates}
          keyExtractor={(item) => item.vehicleType}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const config = VEHICLE_LABELS[item.vehicleType] || { label: 'Comfort Ride', icon: '🚕', capacity: '4 Pax', desc: 'Premium luxury cabs' };
            const isSelected = selected === item.vehicleType;
            return (
              <AnimatedCard
                style={[
                  styles.card,
                  { borderColor: isSelected ? colors.primary : colors.border },
                  isSelected && { backgroundColor: colors.cardBg },
                ]}
                onPress={() => setSelected(item.vehicleType)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                  <Text style={styles.icon}>{config.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.name, { color: colors.textPrimary }]}>{config.label}</Text>
                      <View style={[styles.capacityBadge, { backgroundColor: colors.background }]}>
                        <Text style={{ fontSize: 9, color: colors.textSecondary, fontWeight: '700' }}>{config.capacity}</Text>
                      </View>
                    </View>
                    <Text style={[styles.duration, { color: colors.textSecondary }]}>{config.desc}</Text>
                    <Text style={[styles.duration, { color: colors.textLight }]}>ETA: {item.durationMin || 0} min away</Text>
                  </View>
                  <Text style={[styles.price, { color: colors.textPrimary }]}>
                    ₹{Math.round(item.totalFare || 0)}
                  </Text>
                </View>
              </AnimatedCard>
            );
          }}
        />

        {/* Promo Code Selection */}
        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Select Coupon Discount</Text>
        <View style={styles.couponRow}>
          <TouchableOpacity
            style={[styles.couponCard, { backgroundColor: colors.cardBg, borderColor: selectedCoupon?.code === 'PRINSGO20' ? colors.primary : colors.border }]}
            onPress={() => handleApplyCoupon('PRINSGO20', 40)}
          >
            <Text style={[styles.couponCode, { color: colors.textPrimary }]}>PRINSGO20</Text>
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>Flat ₹40 Discount</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.couponCard, { backgroundColor: colors.cardBg, borderColor: selectedCoupon?.code === 'FIRST50' ? colors.primary : colors.border }]}
            onPress={() => handleApplyCoupon('FIRST50', 60)}
          >
            <Text style={[styles.couponCode, { color: colors.textPrimary }]}>FIRST50</Text>
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>Flat ₹60 Discount</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Selector */}
        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Payment Method</Text>
        <View style={styles.paymentSelectorRow}>
          <TouchableOpacity
            style={[styles.paymentBtn, paymentMethod === 'cash' && { borderColor: colors.primary, backgroundColor: colors.cardBg }]}
            onPress={() => setPaymentMethod('cash')}
          >
            <Text style={styles.paymentText}>💵 Cash</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paymentBtn, paymentMethod === 'wallet' && { borderColor: colors.primary, backgroundColor: colors.cardBg }]}
            onPress={() => setPaymentMethod('wallet')}
          >
            <Text style={styles.paymentText}>💳 Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paymentBtn, paymentMethod === 'upi' && { borderColor: colors.primary, backgroundColor: colors.cardBg }]}
            onPress={() => setPaymentMethod('upi')}
          >
            <Text style={styles.paymentText}>📱 UPI App</Text>
          </TouchableOpacity>
        </View>

        {/* Itemized Fare Breakdown */}
        {selectedItem && (
          <View style={[styles.fareBreakdownCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.breakdownTitle, { color: colors.textPrimary }]}>Fare Breakdown</Text>
            <View style={styles.breakdownRow}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Base Fare</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>₹{baseFare}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Distance Charge</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>₹{distanceCharge}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Platform Fee</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>₹{platformFee}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Taxes & GST</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>₹{taxes}</Text>
            </View>
            {selectedCoupon && (
              <View style={styles.breakdownRow}>
                <Text style={{ color: colors.green, fontSize: 13, fontWeight: '700' }}>Promo Applied ({selectedCoupon.code})</Text>
                <Text style={{ color: colors.green, fontSize: 13, fontWeight: '700' }}>-₹{discount}</Text>
              </View>
            )}
            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '800' }}>Estimated Total Fare</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '900' }}>₹{finalTotal}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={confirmBooking}
        disabled={booking}
      >
        {booking ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Book Ride Now</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 54,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontWeight: '800',
  },
  routeCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginVertical: 14,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillsBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1.5,
    borderRadius: 15,
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
    marginRight: 15,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
  },
  capacityBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  duration: {
    marginTop: 2,
    fontSize: 11,
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 10,
  },
  couponRow: {
    flexDirection: 'row',
    gap: 10,
  },
  couponCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  couponCode: {
    fontSize: 13,
    fontWeight: '800',
  },
  paymentSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fareBreakdownCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginVertical: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 8,
  },
  button: {
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '800',
  },
});
