import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { STRINGS } from '../locales/strings';

const ICONS = ['🏡', '🏖️', '🏢', '🏪', '🏰', '⛰️'];

export default function EditHouseholdModal({
  isOpen,
  onClose,
  household,
  onSave,
  lang = 'id',
}) {
  const strings = STRINGS[lang] || STRINGS.id;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏡');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && household) {
      let rawName = (household.name || '').trim();
      let matchedIcon = '🏡';
      for (const ic of ICONS) {
        if (rawName.startsWith(ic)) {
          matchedIcon = ic;
          rawName = rawName.slice(ic.length).trim();
          break;
        }
      }
      setIcon(matchedIcon);
      setName(rawName);
      setAddress(household.address || '');
      setErrorMsg('');
    }
  }, [isOpen, household]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setErrorMsg(
        lang === 'id'
          ? 'Nama rumah minimal 2 karakter.'
          : 'Household name must be at least 2 characters.'
      );
      return;
    }

    onSave({
      id: household.id,
      name: `${icon} ${trimmed}`,
      address: address.trim() || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.pencilEmoji}>✏️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{strings.household.editTitle}</Text>
              <Text style={styles.subtitle}>{strings.household.editSubtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.formBody}>
            {/* Icon Picker */}
            <Text style={styles.inputLabel}>
              {lang === 'id' ? 'Pilih Ikon Rumah' : 'Select Home Icon'}
            </Text>
            <View style={styles.iconRow}>
              {ICONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  onPress={() => setIcon(ic)}
                  style={[
                    styles.iconOption,
                    icon === ic && styles.iconOptionSelected,
                  ]}
                >
                  <Text style={styles.iconText}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Name Input */}
            <Text style={styles.inputLabel}>
              {strings.household.nameLabel} <Text style={{ color: '#ef4444' }}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="misal: Rumah Utama Keluarga"
              placeholderTextColor="#94a3b8"
            />

            {/* Address Input */}
            <Text style={styles.inputLabel}>
              {strings.household.addressLabel}
            </Text>
            <TextInput
              style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
              value={address}
              onChangeText={setAddress}
              placeholder="misal: Jl. Tebet Barat Dalam No. 12, Jakarta"
              placeholderTextColor="#94a3b8"
              multiline
            />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>{strings.common.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>{strings.household.saveBtn}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 19, 34, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 22,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pencilEmoji: {
    fontSize: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  formBody: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  iconOption: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionSelected: {
    backgroundColor: '#e0e7ff',
    borderColor: '#6366f1',
    borderWidth: 2,
  },
  iconText: {
    fontSize: 20,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});

