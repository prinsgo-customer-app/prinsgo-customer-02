import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ComingSoonScreen({ route }) {
  const title = route?.params?.title || 'This screen';
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{title} — coming in the next phase 🚧</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  text: { fontSize: 16, color: '#888', textAlign: 'center' },
});
