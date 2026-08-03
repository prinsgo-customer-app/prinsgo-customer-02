import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function VehicleCard({
  icon,
  title,
  eta,
  fare,
  selected,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.selectedCard,
      ]}
      onPress={onPress}
    >
      <Text style={styles.icon}>{icon}</Text>

      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.eta}>{eta}</Text>
      </View>

      <Text style={styles.fare}>₹{fare}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  selectedCard: {
    borderColor: "#1976D2",
    backgroundColor: "#EAF4FF",
  },

  icon: {
    fontSize: 32,
    marginRight: 15,
  },

  info: {
    flex: 1,
  },

  title: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#111",
  },

  eta: {
    marginTop: 3,
    color: "#666",
    fontSize: 14,
  },

  fare: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1976D2",
  },
});
