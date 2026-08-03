import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function RideHeader() {
  return (
    <View style={styles.container}>

      <TouchableOpacity style={styles.circle}>
        <Text style={styles.icon}>☰</Text>
      </TouchableOpacity>

      <View style={styles.center}>
        <Text style={styles.title}>Current Location</Text>
        <Text style={styles.location}>Fetching location...</Text>
      </View>

      <TouchableOpacity style={styles.circle}>
        <Text style={styles.icon}>🔔</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  circle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F2F2F2",
    justifyContent: "center",
    alignItems: "center",
  },

  icon: {
    fontSize: 22,
  },

  center: {
    flex: 1,
    marginHorizontal: 15,
  },

  title: {
    fontSize: 13,
    color: "#777",
  },

  location: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },
});
