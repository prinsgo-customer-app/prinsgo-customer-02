import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function RideBookingScreen() {
  const [region] = useState({
    latitude: 23.5245,
    longitude: 80.8372,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  });

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>

        <TouchableOpacity style={styles.circle}>
          <Text style={styles.icon}>☰</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.small}>Current Location</Text>
          <Text style={styles.location}>
            Fetching location...
          </Text>
        </View>

        <TouchableOpacity style={styles.circle}>
          <Text style={styles.icon}>🔔</Text>
        </TouchableOpacity>

      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <TextInput
          placeholder="Search destination..."
          placeholderTextColor="#777"
          style={styles.searchInput}
        />
      </View>

      {/* Google Map */}
      <MapView
        style={styles.map}
        initialRegion={region}
      >
        <Marker coordinate={region} />
      </MapView>

      {/* Bottom Card */}
      <View style={styles.bottomCard}>

        <TextInput
          style={styles.input}
          value="Current Location"
        />

        <TextInput
          style={styles.input}
          placeholder="Where do you want to go?"
        />

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>
            Find Ride
          </Text>
        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 10,
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

  small: {
    fontSize: 13,
    color: "#777",
    marginLeft: 15,
  },

  location: {
    marginLeft: 15,
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },

  searchBox: {
    marginHorizontal: 16,
    marginBottom: 10,
  },

  searchInput: {
    backgroundColor: "#F5F5F5",
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 16,
  },

  map: {
    flex: 1,
  },

  bottomCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    elevation: 10,
  },

  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
  },

  button: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#1976D2",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },

});
