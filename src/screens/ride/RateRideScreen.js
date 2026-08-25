import React, { useState } from 'react';
import { View, Text, TouchableOpacity,
  TouchableWithoutFeedback,
  Animated, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { rateRide } from '../../api/rides';
import { COLORS } from '../../utils/theme';

import AnimatedCard from '../../components/AnimatedCard';

const RATING_LABELS = {
  1: 'Bad',
  2: 'Poor',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
};

const AnimatedStar = ({ n, rating, setRating }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.7, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1.2, useNativeDriver: true }).start(() => {
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    });
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => setRating(n)}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Text style={[styles.star, n <= rating && styles.starActive]}>★</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const RatingPill = ({ label, value, currentRating, onPress }) => {
  const isActive = currentRating === value;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(value)}
      style={[styles.pill, isActive && styles.pillActive]}
    >
      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function RateRideScreen({ route, navigation }) {
  const { rideId } = route.params;
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await rateRide(rideId, rating, review);
      navigation.replace('MainTabs');
    } catch (err) {
      Alert.alert('Error', err.message);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedCard delay={100} style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🎉</Text>
        </View>
        <Text style={styles.title}>Trip Completed</Text>
        <Text style={styles.subtitle}>How was your experience?</Text>

        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <AnimatedStar key={n} n={n} rating={rating} setRating={setRating} />
          ))}
        </View>

        <Text style={styles.ratingLabelText}>{RATING_LABELS[rating]}</Text>

        <View style={styles.pillsContainer}>
          <RatingPill label="Bad" value={1} currentRating={rating} onPress={setRating} />
          <RatingPill label="Poor" value={2} currentRating={rating} onPress={setRating} />
          <RatingPill label="Good" value={3} currentRating={rating} onPress={setRating} />
          <RatingPill label="Very Good" value={4} currentRating={rating} onPress={setRating} />
          <RatingPill label="Excellent" value={5} currentRating={rating} onPress={setRating} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Leave a comment (optional)"
          value={review}
          onChangeText={setReview}
          multiline
          placeholderTextColor={COLORS.textLight}
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={submit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace('MainTabs')} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </AnimatedCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 20 },
  card: { padding: 30, alignItems: 'center' },
  iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  iconText: { fontSize: 32 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 30, fontWeight: '500' },
  stars: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  star: { fontSize: 48, color: COLORS.border, marginHorizontal: 4 },
  starActive: { color: COLORS.primary },
  ratingLabelText: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginBottom: 24 },
  pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 24 },
  pill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  pillTextActive: { color: '#000', fontWeight: '800' },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  submitButton: { width: '100%', backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#000', fontWeight: '800', fontSize: 16 },
  skipButton: { marginTop: 20, padding: 10 },
  skipText: { color: COLORS.textLight, fontWeight: '600', fontSize: 15 },
});
