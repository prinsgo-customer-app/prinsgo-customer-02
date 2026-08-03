import React from "react";
import { View, TextInput, StyleSheet } from "react-native";

export default function LocationSearch() {
  return (
    <View style={styles.container}>

      <TextInput
        style={styles.input}
        placeholder="Pickup Location"
        placeholderTextColor="#888"
      />

      <TextInput
        style={styles.input}
        placeholder="Where do you want to go?"
        placeholderTextColor="#888"
      />

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    marginHorizontal: 16,
    marginTop: 18,
  },

  input: {
    height: 54,
    backgroundColor: "#F5F5F5",
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    marginBottom: 12,
    color: "#111",
  },

});
