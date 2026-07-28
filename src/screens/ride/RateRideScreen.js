import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { rateRide } from '../../api/rides';

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
      />

      <TouchableOpacity style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace('Home')} style={{ marginTop: 14 }}>
        <Text style={{ textAlign: 'center', color: '#888' }}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  subtitle: { textAlign: 'center', color: '#888', marginBottom: 24 },
  stars: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  star: { fontSize: 40, color: '#ddd', marginHorizontal: 4 },
  starActive: { color: '#FFB800' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  button: { backgroundColor: '#1877F2', borderRadius: 10, paddingVertical: 15, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
