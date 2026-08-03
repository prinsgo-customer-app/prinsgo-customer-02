import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
      }}
    >
      <StatusBar style="dark" />
      <Text
        style={{
          fontSize: 30,
          fontWeight: 'bold',
          color: '#007BFF',
        }}
      >
        PrinsGo Enterprise
      </Text>
    </View>
  );
}
