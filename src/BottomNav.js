import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const TABS = [
  { key: 'Home', label: 'Home', icon: '🏠' },
  { key: 'History', label: 'Bookings', icon: '📋' },
  { key: 'Search', label: '', icon: '🔍', isCenter: true },
  { key: 'Wallet', label: 'Wallet', icon: '💳' },
  { key: 'Profile', label: 'Profile', icon: '👤' },
];

export default function BottomNav({ active }) {
  const navigation = useNavigation();

  const handlePress = (key) => {
    if (key === 'Search') {
      navigation.navigate('Home');
      return;
    }
    navigation.navigate(key);
  };

  return (
    <View style={styles.bottomNav}>
      {TABS.map((tab) =>
        tab.isCenter ? (
          <TouchableOpacity key={tab.key} style={styles.bottomNavItem} onPress={() => handlePress(tab.key)}>
            <View style={styles.bottomNavCenterButton}>
              <Text style={styles.bottomNavCenterIcon}>{tab.icon}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity key={tab.key} style={styles.bottomNavItem} onPress={() => handlePress(tab.key)}>
            <Text style={active === tab.key ? styles.bottomNavIconActive : styles.bottomNavIcon}>
              {tab.icon}
            </Text>
            <Text style={active === tab.key ? styles.bottomNavLabelActive : styles.bottomNavLabel}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#EEE',
    paddingTop: 10, paddingBottom: 22, paddingHorizontal: 8,
    justifyContent: 'space-around', alignItems: 'center',
  },
  bottomNavItem: { alignItems: 'center', flex: 1 },
  bottomNavIcon: { fontSize: 20, opacity: 0.5 },
  bottomNavIconActive: { fontSize: 20 },
  bottomNavLabel: { fontSize: 11, color: '#999', marginTop: 3, fontWeight: '600' },
  bottomNavLabelActive: { fontSize: 11, color: '#1877F2', marginTop: 3, fontWeight: '700' },
  bottomNavCenterButton: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#1877F2',
    justifyContent: 'center', alignItems: 'center', marginTop: -26,
    shadowColor: '#1877F2', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  bottomNavCenterIcon: { fontSize: 20 },
});
