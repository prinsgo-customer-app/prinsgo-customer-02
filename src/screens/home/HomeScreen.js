import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";

import HomeHeader from "../../components/home/HomeHeader";
import SearchBar from "../../components/common/SearchBar";
import HomeMap from "../../components/map/HomeMap";
import ServicesGrid from "../../components/home/ServicesGrid";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="#FFFFFF"
        barStyle="dark-content"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <HomeHeader />

        <SearchBar />

        <HomeMap />

        <ServicesGrid />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    paddingBottom: 30,
  },
});
