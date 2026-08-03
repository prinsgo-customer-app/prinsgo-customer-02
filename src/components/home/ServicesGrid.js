import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const services = [
  { icon: "🚖", title: "Ride" },
  { icon: "📦", title: "Parcel" },
  { icon: "🛡️", title: "Safety" },
  { icon: "💳", title: "Wallet" },
];

export default function ServicesGrid() {
  return (
    <View style={styles.container}>
      {services.map((item, index) => (
        <TouchableOpacity key={index} style={styles.card}>
          <Text style={styles.icon}>{item.icon}</Text>
          <Text style={styles.title}>{item.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: 15,
    marginTop: 20,
  },

  card: {
    width: "48%",
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    paddingVertical: 22,
    marginBottom: 15,
    alignItems: "center",
  },

  icon: {
    fontSize: 36,
  },

  title: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
  },
});
