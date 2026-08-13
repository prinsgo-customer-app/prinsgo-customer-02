import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import { Feather } from '@expo/vector-icons';

const TABS = [
  { key: 'Home', translationKey: 'home', icon: 'home' },
  { key: 'History', translationKey: 'bookings', icon: 'list' },
  { key: 'Search', translationKey: '', icon: 'search', isCenter: true },
  { key: 'Wallet', translationKey: 'wallet', icon: 'credit-card' },
  { key: 'Profile', translationKey: 'profile', icon: 'user' },
];

export default function BottomNav({ active }) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useLocalization();

  const handlePress = (key) => {
    if (key === 'Search') {
      navigation.navigate('Home');
      return;
    }
    // Navigate directly to the tab
    navigation.navigate(key);
  };

  return (
    <View style={[styles.bottomNav, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      {TABS.map((tab) =>
        tab.isCenter ? (
          <TouchableOpacity key={tab.key} style={styles.bottomNavItem} onPress={() => handlePress(tab.key)}>
            <View style={[styles.bottomNavCenterButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
              <Feather name={tab.icon} size={22} color="#0A0F24" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity key={tab.key} style={styles.bottomNavItem} onPress={() => handlePress(tab.key)}>
            <Feather
              name={tab.icon}
              size={20}
              color={active === tab.key ? colors.primary : colors.textLight}
              style={[styles.bottomNavIcon, active === tab.key && styles.bottomNavIconActive]}
            />
            <Text style={[styles.bottomNavLabel, active === tab.key ? { color: colors.primary, fontWeight: '700' } : { color: colors.textLight }]}>
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    paddingBottom: 22,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 8,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
  },
  bottomNavItem: { alignItems: 'center', flex: 1 },
  bottomNavIcon: { marginBottom: 3 },
  bottomNavIconActive: {},
  bottomNavLabel: { fontSize: 11, marginTop: 1, fontWeight: '600' },
  bottomNavCenterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -26,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
