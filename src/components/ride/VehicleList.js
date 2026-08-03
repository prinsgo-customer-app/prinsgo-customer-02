import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import VehicleCard from "./VehicleCard";

const vehicles = [
  {
    id: 1,
    icon: "🏍️",
    title: "Bike",
    eta: "2 min",
    fare: 45,
  },
  {
    id: 2,
    icon: "🛺",
    title: "Auto",
    eta: "3 min",
    fare: 70,
  },
  {
    id: 3,
    icon: "🚗",
    title: "Mini",
    eta: "4 min",
    fare: 120,
  },
  {
    id: 4,
    icon: "🚘",
    title: "Sedan",
    eta: "5 min",
    fare: 180,
  },
  {
    id: 5,
    icon: "🚙",
    title: "SUV",
    eta: "6 min",
    fare: 280,
  },
];

export default function VehicleList() {
  const [selected, setSelected] = useState(1);

  return (
    <View style={styles.container}>
      {vehicles.map((item) => (
        <VehicleCard
          key={item.id}
          icon={item.icon}
          title={item.title}
          eta={item.eta}
          fare={item.fare}
          selected={selected === item.id}
          onPress={() => setSelected(item.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 10,
  },
});
