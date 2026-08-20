import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';
import AnimatedCard from '../components/AnimatedCard';

export default function SafetyScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { fontSizeMultiplier } = useAccessibility();
  const tripDetails = route?.params?.tripDetails || null; // optional live ride details

  const [trustedContacts, setTrustedContacts] = useState([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadTrustedContacts();
  }, []);

  const loadTrustedContacts = async () => {
    try {
      const saved = await AsyncStorage.getItem('prinsgo_trusted_contacts');
      if (saved) {
        setTrustedContacts(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  };

  const handleAddContact = async () => {
    if (!newContactName.trim() || !/^[6-9]\d{9}$/.test(newContactPhone)) {
      Alert.alert('Invalid Details', 'Please provide a valid name and 10-digit mobile number.');
      return;
    }
    const updated = [...trustedContacts, { name: newContactName.trim(), phone: newContactPhone }];
    setTrustedContacts(updated);
    try {
      await AsyncStorage.setItem('prinsgo_trusted_contacts', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
    setNewContactName('');
    setNewContactPhone('');
    setIsAdding(false);
    Alert.alert('Success 🎉', 'Trusted Contact added. You can now share trip details instantly with them.');
  };

  const handleRemoveContact = (index) => {
    Alert.alert('Remove Contact', 'Are you sure you want to remove this trusted contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const updated = trustedContacts.filter((_, idx) => idx !== index);
          setTrustedContacts(updated);
          try {
            await AsyncStorage.setItem('prinsgo_trusted_contacts', JSON.stringify(updated));
          } catch (e) {
            // ignore
          }
        },
      },
    ]);
  };

  const triggerSOS = () => {
    Alert.alert(
      '🚨 EMERGENCY SOS ACTIVATED 🚨',
      'This will place an immediate call to public emergency response forces (112) and alert all trusted contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'CALL 112 NOW',
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:112');
            if (trustedContacts.length > 0) {
              trustedContacts.forEach((contact) => {
                const message = tripDetails
                  ? `EMERGENCY: I need help during my PrinsGo ride (${tripDetails.displayId || 'Live Ride'}). Track my status immediately.`
                  : `EMERGENCY: I have triggered SOS emergency on the PrinsGo app. Please contact me immediately.`;
                Linking.openURL(`sms:${contact.phone}?body=${encodeURIComponent(message)}`).catch(() => {});
              });
            }
          },
        },
      ]
    );
  };

  const shareLiveTrip = () => {
    if (!tripDetails) {
      Alert.alert('No Active Trip', 'You do not have an ongoing ride or parcel delivery to share.');
      return;
    }
    if (trustedContacts.length === 0) {
      Alert.alert(
        'Add Contacts First',
        'Please add at least one trusted contact below to share your trip coordinates instantly.'
      );
      return;
    }
    trustedContacts.forEach((contact) => {
      const shareMsg = `Tracking my PrinsGo ride: ${tripDetails.displayId || 'Ride'}. Status: ${tripDetails.status || 'Ongoing'}. Track coordinates securely.`;
      Linking.openURL(`sms:${contact.phone}?body=${encodeURIComponent(shareMsg)}`).catch(() => {});
    });
    Alert.alert('Trip Shared ✅', 'Live trip status sent successfully to all trusted contacts.');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: 20 * fontSizeMultiplier }]}>
          Safety Center
        </Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        {/* Urgent Action */}
        <TouchableOpacity style={[styles.sosButton, { shadowColor: colors.red }]} onPress={triggerSOS}>
          <Text style={styles.sosText}>🚨 TRIGGER SOS</Text>
          <Text style={styles.sosSubtext}>Instant help, 112 alert & contacts broadcast</Text>
        </TouchableOpacity>

        {tripDetails && (
          <AnimatedCard style={{ padding: 18, marginVertical: 14 }} onPress={shareLiveTrip}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Text style={{ fontSize: 32 }}>🔗</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Share Live Trip</Text>
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                  Broadcast real-time status & coordinates of ride {tripDetails.displayId || 'Live Ride'}
                </Text>
              </View>
            </View>
          </AnimatedCard>
        )}

        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>🛡️ Trusted Contacts</Text>
        <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
          Add close friends or family members to instantly broadcast your trip status or call during emergencies.
        </Text>

        {isAdding ? (
          <View style={[styles.addForm, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Contact Name"
              placeholderTextColor={colors.textLight}
              value={newContactName}
              onChangeText={setNewContactName}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="10-digit Phone Number"
              placeholderTextColor={colors.textLight}
              keyboardType="number-pad"
              maxLength={10}
              value={newContactPhone}
              onChangeText={(t) => setNewContactPhone(t.replace(/[^0-9]/g, ''))}
            />
            <View style={styles.formButtons}>
              <TouchableOpacity style={styles.cancelChip} onPress={() => setIsAdding(false)}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addChip, { backgroundColor: colors.primary }]} onPress={handleAddContact}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Save Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={[styles.addContactButton, { borderColor: colors.primary }]} onPress={() => setIsAdding(true)}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>➕ ADD TRUSTED CONTACT</Text>
          </TouchableOpacity>
        )}

        <View style={{ gap: 10, marginTop: 14 }}>
          {trustedContacts.map((contact, idx) => (
            <View key={idx} style={[styles.contactRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.contactName, { color: colors.textPrimary }]}>{contact.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>+91 {contact.phone}</Text>
              </View>
              <TouchableOpacity onPress={() => handleRemoveContact(idx)}>
                <Text style={{ color: colors.red, fontWeight: '700', fontSize: 13 }}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: 24 }]}>📖 Emergency Guidance</Text>
        <Text style={[styles.guidancePara, { color: colors.textSecondary }]}>
          1. **Confirm Driver/Vehicle Match:** Always verify that the license plate and vehicle matches what is registered on your screen before onboarding.
        </Text>
        <Text style={[styles.guidancePara, { color: colors.textSecondary }]}>
          2. **OTP Verification:** Never share your ride start OTP before confirming the vehicle identity and sitting comfortably inside.
        </Text>
        <Text style={[styles.guidancePara, { color: colors.textSecondary }]}>
          3. **Stay in Public Spaces:** Avoid secluded drop-off routes. If anything feels unsafe, immediately request the driver to park in a crowded commercial hub.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 15, fontWeight: '700' },
  title: { fontWeight: '900', letterSpacing: -0.5, fontSize: 26 },

  container: { flex: 1 },
  sosButton: {
    backgroundColor: '#EF4444',
    borderRadius: 20,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  sosText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: 1.5 },
  sosSubtext: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 6, fontWeight: '600' },

  cardTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },
  cardDesc: { fontSize: 13, marginTop: 4, lineHeight: 18 },

  sectionHeading: { fontSize: 18, fontWeight: '900', marginTop: 20, marginBottom: 10, letterSpacing: -0.2 },
  sectionDesc: { fontSize: 14, lineHeight: 20, marginBottom: 18 },

  addContactButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  addForm: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
  },
  formButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 14, marginTop: 4 },
  cancelChip: { paddingVertical: 10, paddingHorizontal: 20 },
  addChip: { borderRadius: 24, paddingVertical: 10, paddingHorizontal: 20 },

  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  contactName: { fontSize: 16, fontWeight: '800' },
  guidancePara: { fontSize: 14, lineHeight: 21, marginTop: 12 },
});
