import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { createWorkerBooking } from '../../api/workers';

export default function WorkerBookingScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { workerId, workerName, category, basePrice } = route.params;

  const [date, setDate] = useState('Today'); // Ideally this uses a Date Picker in a full app
  const [time, setTime] = useState('10:00 AM');
  const [address, setAddress] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBooking = async () => {
    if (!address.trim()) {
      Alert.alert('Required', 'Please enter your service address.');
      return;
    }

    if (!taskDescription.trim()) {
      Alert.alert('Required', 'Please enter a task description.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        workerId,
        date,
        time,
        address,
        taskDescription,
      };
      await createWorkerBooking(payload);
      Alert.alert('Success', 'Your booking request has been sent to the worker!', [
        { text: 'OK', onPress: () => navigation.navigate('History', { initialTab: 'workers' }) }
      ]);
    } catch (err) {
      Alert.alert('Booking Failed', err?.message || 'Could not create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Book Service</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Worker Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.workerName, { color: colors.textPrimary }]}>{workerName}</Text>
          <Text style={[styles.workerCategory, { color: colors.textSecondary }]}>{category}</Text>
        </View>

        {/* Date & Time Selection (Mocked as text inputs / pickers for now) */}
        <Text style={[styles.label, { color: colors.textPrimary, marginTop: 20 }]}>Select Date</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.textPrimary }]}
          value={date}
          onChangeText={setDate}
          placeholder="e.g., Today, Tomorrow, 12 Oct"
          placeholderTextColor={colors.textLight}
        />

        <Text style={[styles.label, { color: colors.textPrimary }]}>Select Time</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.textPrimary }]}
          value={time}
          onChangeText={setTime}
          placeholder="e.g., 10:00 AM"
          placeholderTextColor={colors.textLight}
        />

        {/* Address Input */}
        <Text style={[styles.label, { color: colors.textPrimary }]}>Service Address</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.textPrimary }]}
          value={address}
          onChangeText={setAddress}
          placeholder="Enter full address"
          placeholderTextColor={colors.textLight}
        />

        {/* Task Description */}
        <Text style={[styles.label, { color: colors.textPrimary }]}>Task Description</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.textPrimary }]}
          value={taskDescription}
          onChangeText={setTaskDescription}
          placeholder="Describe the problem or task..."
          placeholderTextColor={colors.textLight}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Price Estimate */}
        <View style={[styles.priceBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Estimated Starting Price</Text>
          <Text style={[styles.priceValue, { color: colors.textPrimary }]}>₹{basePrice || 199}</Text>
        </View>

        <Text style={{ fontSize: 12, color: colors.textLight, textAlign: 'center', marginTop: 10, marginBottom: 20 }}>
          Final price will be decided after inspection by the professional.
        </Text>

        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <Text style={[styles.confirmText, { color: colors.textPrimary }]}>Confirm Booking</Text>
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
  backButton: { marginBottom: 6 },
  backText: { fontSize: 14, fontWeight: '600' },
  title: { fontWeight: '800', fontSize: 20 },
  container: { flex: 1 },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  workerName: { fontSize: 18, fontWeight: '800' },
  workerCategory: { fontSize: 14, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
  },
  priceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  priceLabel: { fontSize: 14, fontWeight: '600' },
  priceValue: { fontSize: 20, fontWeight: '900' },
  confirmBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { fontSize: 16, fontWeight: '800' },
});
