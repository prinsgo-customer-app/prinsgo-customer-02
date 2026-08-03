import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>PrinsGo Enterprise</Text>
      <Text style={styles.subtitle}>
        Customer App Loading...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 18,
    color: '#666',
  },
});
