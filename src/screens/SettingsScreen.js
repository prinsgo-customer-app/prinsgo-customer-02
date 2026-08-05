import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { getSoundEnabled, setSoundEnabled } from '../services/soundService';
import { getHapticsEnabled, setHapticsEnabled } from '../services/hapticService';
import BottomSheets from '../components/BottomSheets';

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
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('settings')}</Text>

        <Text style={[styles.sectionTitle, { color: colors.textLight }]}>Notifications & System</Text>
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.textPrimary, fontSize: 15 * fontSizeMultiplier }]}>{t('pushNotifications')}</Text>
          <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: colors.primary }} />
        </View>
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.textPrimary, fontSize: 15 * fontSizeMultiplier }]}>{t('sounds')}</Text>
          <Switch value={soundOn} onValueChange={handleSoundChange} trackColor={{ true: colors.primary }} />
        </View>
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.textPrimary, fontSize: 15 * fontSizeMultiplier }]}>{t('haptics')}</Text>
          <Switch value={hapticOn} onValueChange={handleHapticChange} trackColor={{ true: colors.primary }} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textLight }]}>{t('appLanguage')}</Text>
        <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => setLangSheetVisible(true)}>
          <Text style={[styles.rowLabel, { color: colors.textPrimary, fontSize: 15 * fontSizeMultiplier }]}>{t('appLanguage')}</Text>
          <Text style={[styles.rowValue, { color: colors.textLight }]}>{locale === 'en' ? 'English' : 'हिंदी'} ›</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.textLight }]}>{t('theme')}</Text>
        <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => setThemeSheetVisible(true)}>
          <Text style={[styles.rowLabel, { color: colors.textPrimary, fontSize: 15 * fontSizeMultiplier }]}>{t('theme')}</Text>
          <Text style={[styles.rowValue, { color: colors.textLight, textTransform: 'capitalize' }]}>{themeMode} ›</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.textLight }]}>Accessibility</Text>
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.textPrimary, fontSize: 15 * fontSizeMultiplier }]}>High Contrast</Text>
          <Switch value={highContrast} onValueChange={toggleHighContrast} trackColor={{ true: colors.primary }} />
        </View>
        <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => {
          const nextScale = fontSizeMultiplier === 1 ? 1.25 : fontSizeMultiplier === 1.25 ? 1.5 : 1;
          changeFontSizeMultiplier(nextScale);
        }}>
          <Text style={[styles.rowLabel, { color: colors.textPrimary, fontSize: 15 * fontSizeMultiplier }]}>Text Scale Modifier</Text>
          <Text style={[styles.rowValue, { color: colors.textLight }]}>{fontSizeMultiplier}x ›</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.textLight }]}>Account</Text>
        <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('About')}>
          <Text style={[styles.rowLabel, { color: colors.textPrimary, fontSize: 15 * fontSizeMultiplier }]}>{t('aboutPrinsgo')}</Text>
          <Text style={[styles.rowValue, { color: colors.textLight }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={confirmDeleteAccount}>
          <Text style={[styles.rowLabel, { color: colors.red, fontSize: 15 * fontSizeMultiplier }]}>{t('deleteAccount')}</Text>
          <Text style={[styles.rowValue, { color: colors.textLight }]}>›</Text>
        </TouchableOpacity>

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
  title: { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginTop: 24, marginBottom: 8 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1,
  },
  rowLabel: { fontSize: 15 },
  rowValue: { fontSize: 14 },
  logoutBtn: {
    marginTop: 40,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: { fontSize: 16, fontWeight: '700' },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginVertical: 12 },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  sheetOption: { fontSize: 16 },
});
