import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';

const TABS = [
  { key: 'Home', translationKey: 'home', icon: '🏠' },
  { key: 'History', translationKey: 'bookings', icon: '📋' },
  { key: 'Search', translationKey: '', icon: '🔍', isCenter: true },
  { key: 'Wallet', translationKey: 'wallet', icon: '💳' },
  { key: 'Profile', translationKey: 'profile', icon: '👤' },
];

export default function BottomNav({ active }) {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { t } = useLocalization();

  const handlePress = (key) => {
    if (key === 'Search') {
      navigation.navigate('Home');
      return;
    }
    navigation.navigate(key);
  };

  return (
    <View style={[styles.bottomNav, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      {TABS.map((tab) =>
        tab.isCenter ? (
          <TouchableOpacity key={tab.key} style={styles.bottomNavItem} onPress={() => handlePress(tab.key)}>
            <View style={[styles.bottomNavCenterButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
              <Text style={styles.bottomNavCenterIcon}>{tab.icon}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity key={tab.key} style={styles.bottomNavItem} onPress={() => handlePress(tab.key)}>
            <Text style={[styles.bottomNavIcon, active === tab.key && styles.bottomNavIconActive, { opacity: active === tab.key ? 1 : 0.5 }]}>
              {tab.icon}
            </Text>
            <Text style={[styles.bottomNavLabel, active === tab.key ? { color: colors.textPrimary, fontWeight: '700' } : { color: colors.textLight }]}>
              {t(tab.translationKey)}
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
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10, paddingBottom: 22, paddingHorizontal: 8,
    justifyContent: 'space-around', alignItems: 'center',
  },
  bottomNavItem: { alignItems: 'center', flex: 1 },
  bottomNavIcon: { fontSize: 20 },
  bottomNavIconActive: { fontSize: 20 },
  bottomNavLabel: { fontSize: 11, marginTop: 3, fontWeight: '600' },
  bottomNavCenterButton: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginTop: -26,
    shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  bottomNavCenterIcon: { fontSize: 20 },
});
