import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { getSoundEnabled, setSoundEnabled } from '../services/soundService';
import { getHapticsEnabled, setHapticsEnabled } from '../services/hapticService';
import BottomSheets from '../components/BottomSheets';
import AnimatedCard from '../components/AnimatedCard';

export default function SettingsScreen({ navigation }) {
  const { logout } = useAuth();
  const { colors, themeMode, selectThemeMode } = useTheme();
  const { t, locale, changeLocale } = useLocalization();
  const { highContrast, toggleHighContrast, fontSizeMultiplier, changeFontSizeMultiplier } = useAccessibility();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundOn, setSoundOn] = useState(getSoundEnabled());
  const [hapticOn, setHapticOn] = useState(getHapticsEnabled());
  const [langSheetVisible, setLangSheetVisible] = useState(false);
  const [themeSheetVisible, setThemeSheetVisible] = useState(false);

  const confirmDeleteAccount = () => {
    Alert.alert(
      t('deleteAccount') + '?',
      'This will permanently delete your account and cannot be undone. Contact support to proceed.',
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Contact Support', onPress: () => Alert.alert('Support', 'Email support@prinsgo.com to request account deletion.') }]
    );
  };

  const handleSoundChange = (val) => {
    setSoundOn(val);
    setSoundEnabled(val);
  };

  const handleHapticChange = (val) => {
    setHapticOn(val);
    setHapticsEnabled(val);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 100 }}>

        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('settings')}</Text>
        </View>

        {/* 1. Account Settings Group */}
        <Text style={[styles.sectionTitle, { color: colors.textLight }]}>Profile & Accounts</Text>
        <AnimatedCard style={styles.groupCard}>
          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Personal Details</Text>
            <Text style={{ color: colors.textLight }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Wallet')}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Payments & Wallet</Text>
            <Text style={{ color: colors.textLight }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('SavedAddresses')}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Saved Addresses</Text>
            <Text style={{ color: colors.textLight }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('EmergencyContacts')}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Emergency Contacts</Text>
            <Text style={{ color: colors.textLight }}>›</Text>
          </TouchableOpacity>
        </AnimatedCard>

        {/* 2. Safety & Security Group */}
        <Text style={[styles.sectionTitle, { color: colors.textLight }]}>Safety & Protection</Text>
        <AnimatedCard style={styles.groupCard}>
          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Safety')}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Safety Center</Text>
            <Text style={{ color: colors.textLight }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Security')}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Security & Lock PIN</Text>
            <Text style={{ color: colors.textLight }}>›</Text>
          </TouchableOpacity>
        </AnimatedCard>

        {/* 3. System & UI Customization */}
        <Text style={[styles.sectionTitle, { color: colors.textLight }]}>Preferences & System</Text>
        <AnimatedCard style={styles.groupCard}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t('pushNotifications')}</Text>
            <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: colors.primary }} />
          </View>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t('sounds')}</Text>
            <Switch value={soundOn} onValueChange={handleSoundChange} trackColor={{ true: colors.primary }} />
          </View>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t('haptics')}</Text>
            <Switch value={hapticOn} onValueChange={handleHapticChange} trackColor={{ true: colors.primary }} />
          </View>

          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => setLangSheetVisible(true)}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t('appLanguage')}</Text>
            <Text style={[styles.rowValue, { color: colors.textLight }]}>{locale === 'en' ? 'English' : 'हिंदी'} ›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => setThemeSheetVisible(true)}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t('theme')}</Text>
            <Text style={[styles.rowValue, { color: colors.textLight, textTransform: 'capitalize' }]}>{themeMode} ›</Text>
          </TouchableOpacity>
        </AnimatedCard>

        {/* 4. Accessibility */}
        <Text style={[styles.sectionTitle, { color: colors.textLight }]}>Accessibility</Text>
        <AnimatedCard style={styles.groupCard}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>High Contrast</Text>
            <Switch value={highContrast} onValueChange={toggleHighContrast} trackColor={{ true: colors.primary }} />
          </View>
          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => {
            const nextScale = fontSizeMultiplier === 1 ? 1.25 : fontSizeMultiplier === 1.25 ? 1.5 : 1;
            changeFontSizeMultiplier(nextScale);
          }}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Text Scale Modifier</Text>
            <Text style={[styles.rowValue, { color: colors.textLight }]}>{fontSizeMultiplier}x ›</Text>
          </TouchableOpacity>
        </AnimatedCard>

        {/* 5. Support & Legal */}
        <Text style={[styles.sectionTitle, { color: colors.textLight }]}>Help & Legal</Text>
        <AnimatedCard style={styles.groupCard}>
          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Help')}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Help & Support FAQ</Text>
            <Text style={{ color: colors.textLight }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Help')}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Terms & Conditions</Text>
            <Text style={{ color: colors.textLight }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Help')}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Privacy Policy</Text>
            <Text style={{ color: colors.textLight }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('About')}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t('aboutPrinsgo')}</Text>
            <Text style={{ color: colors.textLight }}>›</Text>
          </TouchableOpacity>
        </AnimatedCard>

        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]} onPress={logout}>
          <Text style={[styles.logoutText, { color: colors.red }]}>{t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Language Bottom Sheet */}
      <BottomSheets visible={langSheetVisible} onClose={() => setLangSheetVisible(false)} height={220}>
        <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{t('appLanguage')}</Text>
        <TouchableOpacity style={[styles.sheetRow, { borderBottomColor: colors.border }]} onPress={() => { changeLocale('en'); setLangSheetVisible(false); }}>
          <Text style={[styles.sheetOption, { color: colors.textPrimary, fontWeight: locale === 'en' ? '700' : '400' }]}>English</Text>
          {locale === 'en' && <Text style={{ color: colors.primary, fontSize: 18 }}>✓</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sheetRow, { borderBottomColor: colors.border }]} onPress={() => { changeLocale('hi'); setLangSheetVisible(false); }}>
          <Text style={[styles.sheetOption, { color: colors.textPrimary, fontWeight: locale === 'hi' ? '700' : '400' }]}>हिंदी (Hindi)</Text>
          {locale === 'hi' && <Text style={{ color: colors.primary, fontSize: 18 }}>✓</Text>}
        </TouchableOpacity>
      </BottomSheets>

      {/* Theme Bottom Sheet */}
      <BottomSheets visible={themeSheetVisible} onClose={() => setThemeSheetVisible(false)} height={260}>
        <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{t('theme')}</Text>
        {['light', 'dark', 'system'].map((mode) => (
          <TouchableOpacity key={mode} style={[styles.sheetRow, { borderBottomColor: colors.border }]} onPress={() => { selectThemeMode(mode); setThemeSheetVisible(false); }}>
            <Text style={[styles.sheetOption, { color: colors.textPrimary, textTransform: 'capitalize', fontWeight: themeMode === mode ? '700' : '400' }]}>{t(mode)}</Text>
            {themeMode === mode && <Text style={{ color: colors.primary, fontSize: 18 }}>✓</Text>}
          </TouchableOpacity>
        ))}
      </BottomSheets>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 20 },
  backButton: { marginBottom: 6 },
  backText: { fontSize: 14, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800' },
  sectionTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginTop: 24, marginBottom: 8, letterSpacing: 0.5 },
  groupCard: { paddingHorizontal: 16, paddingVertical: 4 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1,
  },
  rowLabel: { fontSize: 14, fontWeight: '600' },
  rowValue: { fontSize: 13, fontWeight: '500' },
  logoutBtn: {
    marginTop: 40,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '700' },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginVertical: 12 },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  sheetOption: { fontSize: 16 },
});
