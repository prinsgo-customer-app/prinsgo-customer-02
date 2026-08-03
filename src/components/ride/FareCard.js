import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function FareCard() {
  return (
    <View style={styles.card}>

      <View style={styles.row}>
        <Text style={styles.label}>Distance</Text>
        <Text style={styles.value}>4.8 km</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Estimated Time</Text>
        <Text style={styles.value}>12 min</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.total}>Total Fare</Text>
        <Text style={styles.price}>₹120</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  label: {
    color: "#666",
    fontSize: 15,
  },

  value: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#111",
  },

  total: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },

  price: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1976D2",
  },

});
