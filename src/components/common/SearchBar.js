import React from "react";
import { View, TextInput, StyleSheet } from "react-native";

export default function SearchBar() {
  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search ride, parcel, places..."
        placeholderTextColor="#888"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 15,
    marginTop: 18,
  },

  input: {
    height: 50,
    backgroundColor: "#F5F5F5",
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    color: "#111",
  },
});
