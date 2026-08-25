import React, { useState } from 'react';
import { View, Text, TouchableOpacity,
  TouchableWithoutFeedback,
  Animated, TextInput, StyleSheet, Alert } from 'react-native';
import { rateRide } from '../../api/rides';
import { COLORS } from '../../utils/theme';
import AnimatedButton from '../../components/AnimatedButton';


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

export default function RateRideScreen({ route, navigation }) {
  const { rideId } = route.params;
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  const submit = async () => {
    try {
      await rateRide(rideId, rating, review);
      navigation.replace('MainTabs');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip completed 🎉</Text>
      <Text style={styles.subtitle}>Rate your driver</Text>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <AnimatedStar key={n} n={n} rating={rating} setRating={setRating} />
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Leave a comment (optional)"
        value={review}
        onChangeText={setReview}
        multiline
        placeholderTextColor={COLORS.textLight}
      />

      <AnimatedButton
        title="Submit"
        onPress={submit}
      />

      <TouchableOpacity onPress={() => navigation.replace('MainTabs')} style={{ marginTop: 14 }}>
        <Text style={{ textAlign: 'center', color: COLORS.textLight, fontWeight: '600' }}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 6, color: COLORS.textPrimary },
  subtitle: { textAlign: 'center', color: COLORS.textSecondary, marginBottom: 24 },
  stars: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  star: { fontSize: 40, color: COLORS.border, marginHorizontal: 4 },
  starActive: { color: COLORS.primary },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
    color: COLORS.textPrimary,
  },
  button: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 15, alignItems: 'center' },
  buttonText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 16 },
});
