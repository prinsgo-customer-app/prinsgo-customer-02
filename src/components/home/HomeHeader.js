import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function HomeHeader() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.icon}>
        <Text style={styles.iconText}>☰</Text>
      </TouchableOpacity>

      <View style={styles.center}>
        <Text style={styles.locationTitle}>Current Location</Text>
        <Text style={styles.location}>Fetching location...</Text>
      </View>

      <TouchableOpacity style={styles.icon}>
        <Text style={styles.iconText}>🔔</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    marginHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  iconText: {
    fontSize: 22,
  },

  center: {
    flex: 1,
    marginHorizontal: 15,
  },

  locationTitle: {
    fontSize: 12,
    color: "#777",
  },

  location: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
  },
});
