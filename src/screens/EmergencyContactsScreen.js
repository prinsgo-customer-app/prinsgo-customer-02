import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';
import AnimatedCard from '../components/AnimatedCard';

export default function EmergencyContactsScreen({ navigation }) {
  const { colors } = useTheme();
  const { fontSizeMultiplier } = useAccessibility();

  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [editingIndex, setEditingIndex] = useState(-1); // -1 means adding new
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const saved = await AsyncStorage.getItem('prinsgo_emergency_contacts');
      if (saved) {
        setContacts(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !relationship.trim() || !/^[6-9]\d{9}$/.test(phone)) {
      Alert.alert('Invalid Details', 'Please enter a valid name, relationship, and 10-digit mobile number.');
      return;
    }

    let updated = [...contacts];
    const newContact = { name: name.trim(), relationship: relationship.trim(), phone };

    if (editingIndex >= 0) {
      updated[editingIndex] = newContact;
      Alert.alert('Success 🎉', 'Emergency Contact updated successfully!');
    } else {
      updated.push(newContact);
      Alert.alert('Success 🎉', 'Emergency Contact added successfully!');
    }

    setContacts(updated);
    try {
      await AsyncStorage.setItem('prinsgo_emergency_contacts', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }

    // Reset Form
    setName('');
    setRelationship('');
    setPhone('');
    setEditingIndex(-1);
    setShowForm(false);
  };

  const startEdit = (index) => {
    const contact = contacts[index];
    setName(contact.name);
    setRelationship(contact.relationship);
    setPhone(contact.phone);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDelete = (index) => {
    Alert.alert('Delete Contact', 'Are you sure you want to delete this emergency contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = contacts.filter((_, idx) => idx !== index);
          setContacts(updated);
          try {
            await AsyncStorage.setItem('prinsgo_emergency_contacts', JSON.stringify(updated));
            Alert.alert('Removed', 'Emergency Contact deleted successfully.');
          } catch (e) {
            // ignore
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: 20 * fontSizeMultiplier }]}>
          Emergency Contacts
        </Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        {showForm ? (
          <AnimatedCard style={styles.formCard}>
            <Text style={[styles.formTitle, { color: colors.textPrimary }]}>
              {editingIndex >= 0 ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Contact Name *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Jane Doe"
              placeholderTextColor={colors.textLight}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Relationship *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              value={relationship}
              onChangeText={setRelationship}
              placeholder="e.g. Spouse, Mother, Brother"
              placeholderTextColor={colors.textLight}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Mobile Number *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ''))}
              placeholder="10-digit mobile number"
              placeholderTextColor={colors.textLight}
              keyboardType="number-pad"
              maxLength={10}
            />

            <View style={styles.rowButtons}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setName('');
                  setRelationship('');
                  setPhone('');
                  setEditingIndex(-1);
                  setShowForm(false);
                }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Save Contact</Text>
              </TouchableOpacity>
            </View>
          </AnimatedCard>
        ) : (
          <TouchableOpacity
            style={[styles.addBtn, { borderColor: colors.primary }]}
            onPress={() => {
              setEditingIndex(-1);
              setShowForm(true);
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>➕ ADD EMERGENCY CONTACT</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>
          Your Saved Contacts
        </Text>

        <View style={{ gap: 12, marginTop: 12 }}>
          {contacts.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textLight }]}>
              No emergency contacts added yet.
            </Text>
          ) : (
            contacts.map((item, idx) => (
              <AnimatedCard key={idx} style={styles.contactCard}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactName, { color: colors.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.contactRelation, { color: colors.primary, backgroundColor: colors.border }]}>
                    {item.relationship}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 6 }}>+91 {item.phone}</Text>
                </View>
                <View style={styles.actionColumn}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => startEdit(idx)}>
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(idx)}>
                    <Text style={{ color: colors.red, fontWeight: '700', fontSize: 13 }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </AnimatedCard>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: { marginBottom: 6 },
  backText: { fontSize: 14, fontWeight: '600' },
  title: { fontWeight: '800' },

  container: { flex: 1 },
  addBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  formCard: { padding: 18, gap: 12 },
  formTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  rowButtons: { flexDirection: 'row', gap: 10, marginTop: 12 },
  primaryBtn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  secondaryBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },

  sectionTitle: { fontSize: 15, fontWeight: '700' },
  emptyText: { fontSize: 13, textAlign: 'center', marginTop: 12 },
  contactCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  contactName: { fontSize: 16, fontWeight: '800' },
  contactRelation: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  actionColumn: { gap: 8, alignItems: 'flex-end', marginLeft: 12 },
  actionBtn: { paddingVertical: 4, paddingHorizontal: 8 },
});
