import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { createWorkerBooking, getWorkerPackages, uploadWorkerBookingPhoto } from '../../api/workers';

export default function WorkerBookingScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { workerId, workerName, categoryId, category, basePrice, initialPackageId } = route.params;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [address, setAddress] = useState('');
  const [addressObj, setAddressObj] = useState(null);
  const [taskDescription, setTaskDescription] = useState('');

  // Dynamic Pricing & Packages
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [tipAmount, setTipAmount] = useState(0);
  const [photoUri, setPhotoUri] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route.params?.selectedLocation) {
      const loc = route.params.selectedLocation;
      setAddress(loc.address);
      setAddressObj({ lat: loc.lat, lng: loc.lng });
      navigation.setParams({ selectedLocation: undefined });
    }
  }, [route.params?.selectedLocation, navigation]);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const res = await getWorkerPackages(workerId);
        const pkgs = res?.data?.packages || [];
        setPackages(pkgs);
        if (initialPackageId) {
          const found = pkgs.find(p => p._id === initialPackageId);
          if (found) setSelectedPackage(found);
        }
      } catch (e) {
        console.log('Failed to fetch packages');
      }
    };
    loadPackages();
  }, [workerId, initialPackageId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const onDateChange = (event, selected) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) {
      const currentDate = new Date(selectedDate);
      currentDate.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setSelectedDate(currentDate);
    }
  };

  const onTimeChange = (event, selected) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selected) {
      const currentDate = new Date(selectedDate);
      currentDate.setHours(selected.getHours(), selected.getMinutes());
      setSelectedDate(currentDate);
    }
  };

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
        categoryId: categoryId || null,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        serviceAddress: address,
        latitude: addressObj?.lat || null,
        longitude: addressObj?.lng || null,
        taskDescription,
        packageId: selectedPackage ? selectedPackage._id : null,
        packageName: selectedPackage ? selectedPackage.name : null,
        estimatedPrice: selectedPackage ? selectedPackage.price : (basePrice || 0),
        tip: tipAmount,
        paymentMethod,
      };
      const res = await createWorkerBooking(payload);
      const bookingId = res?.data?.booking?._id || res?.data?.job?._id || res?.data?.workerBooking?._id || res?.data?.data?._id || res?.data?._id;
      if (bookingId) {
        // Handle Photo Upload if present
        if (photoUri) {
          try {
            const formData = new FormData();
            formData.append('photo', {
              uri: photoUri,
              name: 'service_photo.jpg',
              type: 'image/jpeg'
            });
            await uploadWorkerBookingPhoto(bookingId, formData);
          } catch (e) {
            console.log('Failed to upload optional photo');
          }
        }
        navigation.replace('LiveWorker', { bookingId });
      } else {
        Alert.alert('Success', 'Your booking request has been sent to the worker!', [
          { text: 'OK', onPress: () => navigation.replace('History', { initialTab: 'workers' }) }
        ]);
      }
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

        {/* Date & Time Selection */}
        <Text style={[styles.label, { color: colors.textPrimary, marginTop: 20 }]}>Select Date</Text>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, justifyContent: 'center' }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: colors.textPrimary }}>{selectedDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        <Text style={[styles.label, { color: colors.textPrimary }]}>Select Time</Text>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, justifyContent: 'center' }]}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={{ color: colors.textPrimary }}>{selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}

        {/* Address Input */}
        <Text style={[styles.label, { color: colors.textPrimary }]}>Service Address</Text>
        <TouchableOpacity
          style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, justifyContent: 'center' }]}
          onPress={() => navigation.navigate('PlaceSearch', {
            mode: 'workers',
            currentLocation: addressObj,
            previousScreen: 'WorkerBooking'
          })}
        >
          <Text style={{ color: address ? colors.textPrimary : colors.textLight }}>
            {address || 'Select from map...'}
          </Text>
        </TouchableOpacity>

        {/* Packages Selection (If Available) */}
        {packages.length > 0 && (
          <>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Select a Package (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {packages.map(pkg => (
                <TouchableOpacity
                  key={pkg._id}
                  style={[
                    styles.packageCardSelection,
                    selectedPackage?._id === pkg._id ? { borderColor: colors.primary, backgroundColor: colors.primary + '10' } : { borderColor: colors.border, backgroundColor: colors.cardBg }
                  ]}
                  onPress={() => setSelectedPackage(selectedPackage?._id === pkg._id ? null : pkg)}
                >
                  <Text style={[styles.packageCardTitle, { color: colors.textPrimary }]}>{pkg.name}</Text>
                  <Text style={[styles.packageCardPrice, { color: colors.primary }]}>₹{pkg.price}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

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

        {/* Optional Photo Upload */}
        <TouchableOpacity style={[styles.photoUploadBtn, { borderColor: colors.border, backgroundColor: colors.cardBg }]} onPress={pickImage}>
          <Text style={{ fontSize: 18, marginRight: 8 }}>📷</Text>
          <Text style={{ color: colors.textSecondary, flex: 1 }}>{photoUri ? 'Photo Attached' : 'Attach a photo of the issue (Optional)'}</Text>
          {photoUri && <Image source={{ uri: photoUri }} style={{ width: 30, height: 30, borderRadius: 6 }} />}
        </TouchableOpacity>

        {/* Price Estimate */}
        <View style={[styles.priceBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Estimated Starting Price</Text>
          <Text style={[styles.priceValue, { color: colors.textPrimary }]}>₹{selectedPackage ? selectedPackage.price : (basePrice || 0)}</Text>
        </View>

        <Text style={{ fontSize: 12, color: colors.textLight, textAlign: 'center', marginTop: 10, marginBottom: 20 }}>
          Final price will be decided after inspection by the professional.
        </Text>

        {/* Tip Professional */}
        <Text style={[styles.label, { color: colors.textPrimary }]}>Tip the Professional (Optional)</Text>
        <View style={styles.paymentSelectorRow}>
          {[0, 20, 50, 100].map((tip) => (
            <TouchableOpacity
              key={tip}
              style={[styles.paymentBtn, tipAmount === tip && { borderColor: colors.primary, backgroundColor: colors.cardBg }]}
              onPress={() => setTipAmount(tip)}
            >
              <Text style={[styles.paymentText, { color: colors.textPrimary }]}>
                {tip === 0 ? 'No Tip' : `₹${tip}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textPrimary, marginBottom: 12 }]}>Payment Method</Text>
        <View style={styles.paymentSelectorRow}>
          <TouchableOpacity
            style={[styles.paymentBtn, paymentMethod === 'cash' && { borderColor: colors.primary, backgroundColor: colors.cardBg }]}
            onPress={() => setPaymentMethod('cash')}
          >
            <Text style={[styles.paymentText, { color: colors.textPrimary }]}>💵 Cash</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paymentBtn, paymentMethod === 'wallet' && { borderColor: colors.primary, backgroundColor: colors.cardBg }]}
            onPress={() => setPaymentMethod('wallet')}
          >
            <Text style={[styles.paymentText, { color: colors.textPrimary }]}>💳 Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paymentBtn, paymentMethod === 'upi' && { borderColor: colors.primary, backgroundColor: colors.cardBg }]}
            onPress={() => setPaymentMethod('upi')}
          >
            <Text style={[styles.paymentText, { color: colors.textPrimary }]}>📱 UPI App</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1, marginTop: 20 }]}
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
  paymentSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
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
  confirmBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { fontSize: 16, fontWeight: '800' },
  packageCardSelection: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginRight: 12,
    minWidth: 120,
  },
  packageCardTitle: { fontSize: 14, fontWeight: '700' },
  packageCardPrice: { fontSize: 14, fontWeight: '900', marginTop: 4 },
  photoUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
  },
});
