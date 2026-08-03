import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>

      <Text style={styles.logo}>PrinsGo</Text>

      <Text style={styles.tagline}>
        Ride • Parcel • Safe • Smart
      </Text>

      <Text style={styles.welcome}>
        Welcome to PrinsGo
      </Text>

      <Text style={styles.description}>
        Customer App Successfully Started
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  logo: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#1976D2",
  },

  tagline: {
    marginTop: 8,
    fontSize: 17,
    color: "#666",
  },

  welcome: {
    marginTop: 35,
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
  },

  description: {
    marginTop: 12,
    fontSize: 17,
    color: "#777",
    textAlign: "center",
  },
});
