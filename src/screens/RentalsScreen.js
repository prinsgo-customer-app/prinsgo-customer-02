import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';
import AnimatedCard from '../components/AnimatedCard';

const VEHICLES = [
  {
    id: 'rent_mini',
    name: 'Mini Hatchback',
    capacity: '4 Seater',
    pricePerHour: 149,
    pricePerDay: 1999,
    rating: 4.8,
    desc: 'Perfect for swift, traffic-friendly urban travel.',
    icon: '🚗',
  },
  {
    id: 'rent_sedan',
    name: 'Sedan Comfort',
    capacity: '5 Seater',
    pricePerHour: 199,
    pricePerDay: 2499,
    rating: 4.9,
    desc: 'Extra trunk space and premium seating comfort.',
    icon: '🚘',
  },
  {
    id: 'rent_suv',
    name: 'Premium SUV',
    capacity: '7 Seater',
    pricePerHour: 299,
    pricePerDay: 3999,
    rating: 4.95,
    desc: 'Spacious vehicle suitable for family road trips.',
    icon: '🚙',
  },
];

export default function RentalsScreen({ navigation }) {
  const { colors } = useTheme();
  const { fontSizeMultiplier } = useAccessibility();
  const [durationMode, setDurationMode] = useState('hourly'); // 'hourly' | 'daily'
  const [selectedVehicle, setSelectedVehicle] = useState('rent_mini');
  const [driverMode, setDriverMode] = useState('with_driver'); // 'with_driver' | 'self_drive'

  const handleBooking = () => {
    const selectedObj = VEHICLES.find((v) => v.id === selectedVehicle);
    const cost = durationMode === 'hourly' ? selectedObj.pricePerHour : selectedObj.pricePerDay;

    Alert.alert(
      'Confirm Rental Booking',
      `Vehicle: ${selectedObj.name}\nDuration Option: ${durationMode.toUpperCase()}\nDriver: ${driverMode.replace('_', ' ').toUpperCase()}\nEstimated Base Cost: ₹${cost}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed To Settle',
          onPress: () => {
            Alert.alert('Booking Confirmed 🎉', 'Your rental booking has been processed successfully. Driver info will update shortly.');
            navigation.navigate('Home');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: 20 * fontSizeMultiplier }]}>
          Hourly & Daily Rentals
        </Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Intro */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose Rental Plan</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Retain your premium vehicle for hours or full days with professional chauffeur guidance.
        </Text>

        {/* Plan Mode selector */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              durationMode === 'hourly' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setDurationMode('hourly')}
          >
            <Text
              style={[
                styles.toggleText,
                { color: durationMode === 'hourly' ? colors.textPrimary : colors.textSecondary },
              ]}
            >
              ⏱️ Hourly Package
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              durationMode === 'daily' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setDurationMode('daily')}
          >
            <Text
              style={[
                styles.toggleText,
                { color: durationMode === 'daily' ? colors.textPrimary : colors.textSecondary },
              ]}
            >
              📅 Full Day Rentals
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chauffeur Mode selector */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>Driver Preferences</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              driverMode === 'with_driver' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setDriverMode('with_driver')}
          >
            <Text
              style={[
                styles.toggleText,
                { color: driverMode === 'with_driver' ? colors.textPrimary : colors.textSecondary },
              ]}
            >
              🧑‍✈️ Chauffeur Driven
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              driverMode === 'self_drive' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setDriverMode('self_drive')}
          >
            <Text
              style={[
                styles.toggleText,
                { color: driverMode === 'self_drive' ? colors.textPrimary : colors.textSecondary },
              ]}
            >
              🔑 Self Drive Pack
            </Text>
          </TouchableOpacity>
        </View>

        {/* Vehicles list */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24, marginBottom: 12 }]}>Available Cars</Text>
        <View style={{ gap: 12 }}>
          {VEHICLES.map((vehicle) => (
            <AnimatedCard
              key={vehicle.id}
              style={[
                styles.vehicleCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: selectedVehicle === vehicle.id ? colors.primary : colors.border,
                  borderWidth: 2,
                },
              ]}
              onPress={() => setSelectedVehicle(vehicle.id)}
            >
              <View style={styles.vehicleRow}>
                <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.vehicleName, { color: colors.textPrimary }]}>{vehicle.name}</Text>
                    <View style={[styles.pill, { backgroundColor: colors.background }]}>
                      <Text style={{ fontSize: 10, color: colors.textSecondary }}>{vehicle.capacity}</Text>
                    </View>
                  </View>
                  <Text style={[styles.vehicleDesc, { color: colors.textSecondary }]}>{vehicle.desc}</Text>
                  <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: 4 }}>
                    ⭐ {vehicle.rating} rating
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.priceTag, { color: colors.textPrimary }]}>
                    ₹{durationMode === 'hourly' ? vehicle.pricePerHour : vehicle.pricePerDay}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.textLight }}>
                    /{durationMode === 'hourly' ? 'hour' : 'day'}
                  </Text>
                </View>
              </View>
            </AnimatedCard>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity style={[styles.bookBtn, { backgroundColor: colors.primary }]} onPress={handleBooking}>
          <Text style={[styles.bookBtnText, { color: colors.textPrimary }]}>
            Confirm Rental Booking
          </Text>
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
  backButton: { marginBottom: 6 },
  backText: { fontSize: 14, fontWeight: '600' },
  title: { fontWeight: '800' },
  container: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, lineHeight: 16, marginBottom: 14 },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  vehicleCard: {
    padding: 14,
    borderRadius: 14,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    fontSize: 32,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '800',
  },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  vehicleDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  priceTag: {
    fontSize: 18,
    fontWeight: '900',
  },
  bookBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 32,
  },
  bookBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
