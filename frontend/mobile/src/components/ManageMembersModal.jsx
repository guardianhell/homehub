import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { STRINGS } from '../locales/strings';
import api from '../services/api';

const ROLE_COLORS = {
  OWNER: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  ADMIN: { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' },
  MEMBER: { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' },
  HELPER: { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
};

export default function ManageMembersModal({
  isOpen,
  onClose,
  household,
  members = [],
  onAddMember,
  onRemoveMember,
  lang = 'id',
}) {
  const strings = STRINGS[lang] || STRINGS.id;
  const t = strings.members || {};

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER'); // 'ADMIN' | 'MEMBER' | 'HELPER'
  const [isSubmitting, setIsSubmitting] = useState(false);

  const householdId = household?.id || 'tebet_free';
  const tier = household?.tier || household?.subscription_tier || 'FREE';
  const isPro = tier === 'PRO';

  const handleAdd = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
      Alert.alert(
        lang === 'id' ? 'Perhatian' : 'Attention',
        lang === 'id'
          ? 'Nama lengkap dan email wajib diisi.'
          : 'Name and email are required.'
      );
      return;
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      Alert.alert(
        lang === 'id' ? 'Perhatian' : 'Attention',
        lang === 'id'
          ? 'Format email tidak valid.'
          : 'Invalid email format.'
      );
      return;
    }

    // Check duplicate
    if (members.some((m) => (m.email || '').toLowerCase() === trimmedEmail)) {
      Alert.alert(
        lang === 'id' ? 'Duplikat' : 'Duplicate',
        lang === 'id'
          ? 'Pengguna dengan email ini sudah terdaftar di rumah ini.'
          : 'This user is already a member of this household.'
      );
      return;
    }

    // Check quota
    if (!isPro && members.length >= 5) {
      Alert.alert(
        lang === 'id' ? 'Batas Kuota' : 'Quota Limit',
        t.freeQuota ||
          'Paket Free maks 5 anggota. Upgrade ke PRO untuk tanpa batas.'
      );
      return;
    }

    setIsSubmitting(true);
    const newMember = {
      id: `mem_${Date.now()}`,
      user_id: `u_${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      role: role,
      joined_at: new Date().toISOString(),
    };

    try {
      const res = await api.post(`/auth/households/${householdId}/members`, {
        name: trimmedName,
        email: trimmedEmail,
        role: role,
      });
      const data = res.data?.data || res.data;
      if (data && data.id) {
        newMember.id = data.id;
        newMember.user_id = data.user_id || data.userId || newMember.user_id;
      }
    } catch (err) {
      console.warn('API add member offline fallback:', err.message);
    } finally {
      setIsSubmitting(false);
    }

    if (onAddMember) onAddMember(newMember);
    setName('');
    setEmail('');
    setRole('MEMBER');
    setActiveTab('list');

    Alert.alert(
      lang === 'id' ? 'Berhasil' : 'Success',
      t.addSuccess || 'Anggota baru berhasil ditambahkan!'
    );
  };

  const handleRemove = (memberId, memberName) => {
    Alert.alert(
      lang === 'id' ? 'Keluarkan Anggota' : 'Remove Member',
      (t.removeConfirm || 'Keluarkan anggota ini dari pengelolaan rumah?').replace(
        '{{name}}',
        memberName
      ),
      [
        { text: strings.common.cancel, style: 'cancel' },
        {
          text: strings.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(
                `/auth/households/${householdId}/members/${memberId}`
              );
            } catch (err) {
              console.warn('API remove member offline fallback:', err.message);
            }
            if (onRemoveMember) onRemoveMember(memberId);
          },
        },
      ]
    );
  };

  const getInitials = (str) => {
    if (!str) return 'U';
    const p = str.trim().split(' ');
    if (p.length === 1) return p[0].substring(0, 2).toUpperCase();
    return (p[0][0] + p[1][0]).toUpperCase();
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.modalTitle}>
                  {t.title || 'Kelola Anggota'}
                </Text>
                <View
                  style={[
                    styles.tierPill,
                    isPro ? styles.tierPillPro : styles.tierPillFree,
                  ]}
                >
                  <Text
                    style={[
                      styles.tierPillText,
                      isPro ? styles.tierPillTextPro : styles.tierPillTextFree,
                    ]}
                  >
                    {isPro ? 'PRO UNLIMITED' : `${members.length}/5 FREE`}
                  </Text>
                </View>
              </View>
              <Text style={styles.modalSubtitle}>
                {household?.name || 'Rumah Utama Keluarga'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              onPress={() => setActiveTab('list')}
              style={[
                styles.tabBtn,
                activeTab === 'list' && styles.tabBtnActive,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'list' && styles.tabTextActive,
                ]}
              >
                👥 {t.activeMembers || 'Anggota'} ({members.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('add')}
              style={[styles.tabBtn, activeTab === 'add' && styles.tabBtnActive]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'add' && styles.tabTextActive,
                ]}
              >
                ➕ {t.addBtn || '+ Tambah Anggota'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'list' ? (
              <View style={styles.listContainer}>
                {members.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>
                      {lang === 'id'
                        ? 'Belum ada anggota terdaftar.'
                        : 'No members registered yet.'}
                    </Text>
                  </View>
                ) : (
                  members.map((m) => {
                    const colors = ROLE_COLORS[m.role] || ROLE_COLORS.MEMBER;
                    const isOwner = m.role === 'OWNER';

                    return (
                      <View key={m.id} style={styles.memberCard}>
                        {/* Avatar */}
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {getInitials(m.name)}
                          </Text>
                        </View>

                        {/* Details */}
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{m.name}</Text>
                          <Text style={styles.memberEmail} numberOfLines={1}>
                            {m.email}
                          </Text>
                        </View>

                        {/* Role Chip */}
                        <View
                          style={[
                            styles.roleBadge,
                            {
                              backgroundColor: colors.bg,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[styles.roleText, { color: colors.text }]}
                          >
                            {m.role}
                          </Text>
                        </View>

                        {/* Delete Button (Owner cannot be removed) */}
                        {!isOwner && (
                          <TouchableOpacity
                            onPress={() => handleRemove(m.id, m.name)}
                            style={styles.deleteBtn}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.deleteBtnText}>🗑️</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
                )}

                {/* Role Guide Card */}
                <View style={styles.guideCard}>
                  <Text style={styles.guideTitle}>
                    💡 {lang === 'id' ? 'Hak Akses Pengelolaan' : 'Role Access Guide'}
                  </Text>
                  <Text style={styles.guideText}>
                    • <Text style={styles.boldText}>Owner:</Text>{' '}
                    {lang === 'id'
                      ? 'Pemilik penuh konfigurasi rumah & langganan.'
                      : 'Full owner of house config & subscriptions.'}
                  </Text>
                  <Text style={styles.guideText}>
                    • <Text style={styles.boldText}>Admin:</Text>{' '}
                    {lang === 'id'
                      ? 'Kelola tagihan, belanja, aset, uang, dan anggota.'
                      : 'Manages bills, groceries, assets, and members.'}
                  </Text>
                  <Text style={styles.guideText}>
                    • <Text style={styles.boldText}>Member:</Text>{' '}
                    {lang === 'id'
                      ? 'Melihat ringkasan, checklist belanja, dan agenda.'
                      : 'Views data, checks off groceries, logs agenda.'}
                  </Text>
                  <Text style={styles.guideText}>
                    • <Text style={styles.boldText}>Helper:</Text>{' '}
                    {lang === 'id'
                      ? 'Akses daftar belanjaan dapur & pemeliharaan.'
                      : 'Kitchen shopping list and maintenance tasks.'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.formContainer}>
                {/* Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {t.nameLabel || 'Nama Lengkap'}{' '}
                    <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder={t.namePlaceholder || 'misal: Siti Aminah'}
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {t.emailLabel || 'Alamat Email'}{' '}
                    <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder={t.emailPlaceholder || 'misal: siti@keluarga.com'}
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Role Picker Buttons */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {t.roleLabel || 'Peran Akses'}
                  </Text>
                  <View style={styles.rolePickerRow}>
                    <TouchableOpacity
                      onPress={() => setRole('ADMIN')}
                      style={[
                        styles.rolePickBtn,
                        role === 'ADMIN' && styles.rolePickBtnActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.rolePickEmoji}>🛡️</Text>
                      <Text
                        style={[
                          styles.rolePickLabel,
                          role === 'ADMIN' && styles.rolePickLabelActive,
                        ]}
                      >
                        Admin
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setRole('MEMBER')}
                      style={[
                        styles.rolePickBtn,
                        role === 'MEMBER' && styles.rolePickBtnActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.rolePickEmoji}>👤</Text>
                      <Text
                        style={[
                          styles.rolePickLabel,
                          role === 'MEMBER' && styles.rolePickLabelActive,
                        ]}
                      >
                        Anggota
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setRole('HELPER')}
                      style={[
                        styles.rolePickBtn,
                        role === 'HELPER' && styles.rolePickBtnActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.rolePickEmoji}>🧹</Text>
                      <Text
                        style={[
                          styles.rolePickLabel,
                          role === 'HELPER' && styles.rolePickLabelActive,
                        ]}
                      >
                        Asisten
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleAdd}
                  disabled={isSubmitting}
                  style={[
                    styles.submitBtn,
                    isSubmitting && styles.submitBtnDisabled,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitBtnText}>
                    {isSubmitting
                      ? strings.common.loading
                      : t.submitBtn || 'Kirim Undangan / Simpan'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 19, 34, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  tierPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  tierPillFree: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  tierPillPro: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  tierPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tierPillTextFree: {
    color: '#475569',
  },
  tierPillTextPro: {
    color: '#92400e',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabBtnActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  scrollArea: {
    maxHeight: 480,
  },
  scrollContent: {
    padding: 20,
  },
  listContainer: {
    gap: 10,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4338ca',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  memberEmail: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
  },
  deleteBtn: {
    padding: 6,
  },
  deleteBtnText: {
    fontSize: 16,
  },
  guideCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 4,
  },
  guideText: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  boldText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  required: {
    color: '#ef4444',
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#0f172a',
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rolePickBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    gap: 4,
  },
  rolePickBtnActive: {
    backgroundColor: '#e0e7ff',
    borderColor: '#6366f1',
  },
  rolePickEmoji: {
    fontSize: 18,
  },
  rolePickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  rolePickLabelActive: {
    color: '#4338ca',
  },
  submitBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#4f46e5',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
