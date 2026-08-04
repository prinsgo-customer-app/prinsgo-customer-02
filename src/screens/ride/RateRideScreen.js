import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { rateRide } from '../../api/rides';
import { COLORS } from '../../utils/theme';

export default function RateRideScreen({ route, navigation }) {
  const { rideId } = route.params;
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  const submit = async () => {
    try {
      await rateRide(rideId, rating, review);
      navigation.replace('Home');
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
          <TouchableOpacity key={n} onPress={() => setRating(n)}>
            <Text style={[styles.star, n <= rating && styles.starActive]}>★</Text>
          </TouchableOpacity>
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

      <TouchableOpacity style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace('Home')} style={{ marginTop: 14 }}>
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
