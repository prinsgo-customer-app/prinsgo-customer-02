import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { addAddress, deleteAddress } from '../api/auth';
import AnimatedCard from '../components/AnimatedCard';

const LABEL_ICONS = { home: '🏠', work: '💼', other: '📍' };

export default function SavedAddressesScreen({ navigation }) {
  const { colors } = useTheme();
  const { fontSizeMultiplier } = useAccessibility();
  const { user, refreshUser } = useAuth();

  const [label, setLabel] = useState('home');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null); // for editing flow

  const handleSave = async () => {
    if (!address.trim()) {
      Alert.alert('Validation Error', 'Address field is required.');
      return;
    }

    // Check for duplicate address string
    const isDuplicateAddress = user?.savedAddresses?.some(
      (item) => item.address.toLowerCase().trim() === address.toLowerCase().trim() && item._id !== editingAddressId
    );
    if (isDuplicateAddress) {
      Alert.alert('Duplicate Address', 'This address is already in your saved addresses list.');
      return;
    }

    // Prevent duplicate Home or Work labels (Max 1 of each)
    if (label === 'home' || label === 'work') {
      const isDuplicateLabel = user?.savedAddresses?.some(
        (item) => item.label === label && item._id !== editingAddressId
      );
      if (isDuplicateLabel) {
        Alert.alert(
          'Duplicate Category',
          `You already have a saved ${label === 'home' ? 'Home' : 'Work'} address. Please edit or delete the existing one instead.`
        );
        return;
      }
    }

    setSaving(true);
    try {
      if (editingAddressId) {
        // Edit flow: delete old then add new
        await deleteAddress(editingAddressId);
      }
      await addAddress({ label, address: address.trim(), lat: 18.5204, lng: 73.8567 });
      await refreshUser();

      Alert.alert('Success 🎉', editingAddressId ? 'Address updated successfully!' : 'Address added successfully!');
      setAddress('');
      setLabel('home');
      setEditingAddressId(null);
      setShowAddForm(false);
    } catch (err) {
      Alert.alert('Save Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setLabel(item.label);
    setAddress(item.address);
    setEditingAddressId(item._id);
    setShowAddForm(true);
  };

  const handleDelete = (addressId) => {
    Alert.alert('Remove Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAddress(addressId);
            await refreshUser();
            Alert.alert('Success', 'Address removed successfully.');
          } catch (err) {
            Alert.alert('Error', err.message);
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
          Saved Addresses
        </Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        {showAddForm ? (
          <AnimatedCard style={styles.formCard}>
            <Text style={[styles.formTitle, { color: colors.textPrimary }]}>
              {editingAddressId ? 'Edit Address Details' : 'Add New Address'}
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Address Label</Text>
            <View style={styles.labelRow}>
              {['home', 'work', 'other'].map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[
                    styles.labelChip,
                    { borderColor: colors.border },
                    label === l && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setLabel(l)}
                >
                  <Text style={{ color: label === l ? colors.textPrimary : colors.textSecondary, fontWeight: '600', textTransform: 'capitalize' }}>
                    {LABEL_ICONS[l]} {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Full Address *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. 123 Prime Street, Pune"
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={3}
            />

            <View style={styles.rowButtons}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setAddress('');
                  setLabel('home');
                  setEditingAddressId(null);
                  setShowAddForm(false);
                }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Save Address</Text>
                )}
              </TouchableOpacity>
            </View>
          </AnimatedCard>
        ) : (
          <TouchableOpacity
            style={[styles.addBtn, { borderColor: colors.primary }]}
            onPress={() => {
              setEditingAddressId(null);
              setShowAddForm(true);
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>➕ ADD SAVED ADDRESS</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>
          Your Addresses
        </Text>

        <View style={{ gap: 12, marginTop: 12 }}>
          {(!user?.savedAddresses || user.savedAddresses.length === 0) ? (
            <Text style={[styles.emptyText, { color: colors.textLight }]}>
              No saved addresses yet.
            </Text>
          ) : (
            user.savedAddresses.map((item) => (
              <AnimatedCard key={item._id} style={styles.addressCard}>
                <Text style={styles.addressIcon}>{LABEL_ICONS[item.label] || '📍'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addressLabelText, { color: colors.textPrimary }]}>
                    {item.label}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{item.address}</Text>
                </View>
                <View style={styles.actionColumn}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => startEdit(item)}>
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item._id)}>
                    <Text style={{ color: colors.red, fontWeight: '700', fontSize: 13 }}>Remove</Text>
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
  labelRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  labelChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  rowButtons: { flexDirection: 'row', gap: 10, marginTop: 12 },
  primaryBtn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  secondaryBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },

  sectionTitle: { fontSize: 15, fontWeight: '700' },
  emptyText: { fontSize: 13, textAlign: 'center', marginTop: 12 },
  addressCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  addressIcon: { fontSize: 24 },
  addressLabelText: { fontSize: 15, fontWeight: '800', textTransform: 'capitalize' },
  actionColumn: { gap: 8, alignItems: 'flex-end', marginLeft: 12 },
  actionBtn: { paddingVertical: 4, paddingHorizontal: 8 },
});
