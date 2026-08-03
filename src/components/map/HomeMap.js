import React from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function HomeMap() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 23.5247,
          longitude: 80.8372,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Demo Driver */}
        <Marker
          coordinate={{
            latitude: 23.5265,
            longitude: 80.8390,
          }}
          title="Nearby Driver"
          description="2 min away"
        />

        {/* Pickup */}
        <Marker
          coordinate={{
            latitude: 23.5247,
            longitude: 80.8372,
          }}
          pinColor="green"
          title="Pickup"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 280,
    margin: 15,
    borderRadius: 18,
    overflow: "hidden",
  },

  map: {
    flex: 1,
  },
});
