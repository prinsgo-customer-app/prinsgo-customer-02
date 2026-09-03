import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { rateWorkerBooking } from '../../api/workers';

export default function WorkerReviewScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { bookingId } = route.params;

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Required', 'Please select a star rating.');
      return;
    }

    setLoading(true);
    try {
      await rateWorkerBooking(bookingId, rating, review);
      Alert.alert('Success', 'Thank you for your feedback!');
      navigation.replace('History', { initialTab: 'workers' });
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Could not submit review');
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
        <Text style={[styles.title, { color: colors.textPrimary }]}>Rate Professional</Text>
      </View>

      <View style={styles.container}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>How was the service?</Text>

        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text style={[styles.starText, { color: star <= rating ? colors.primary : colors.border }]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Write your review here (optional)..."
          placeholderTextColor={colors.textLight}
          value={review}
          onChangeText={setReview}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <Text style={[styles.submitText, { color: colors.textPrimary }]}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </View>
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
  container: { padding: 20, flex: 1 },
  label: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 30 },
  starText: { fontSize: 50 },
  input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16, minHeight: 120, marginBottom: 30 },
  submitBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '800' },
});
