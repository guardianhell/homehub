import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { STRINGS } from '../locales/strings';

export default function Header({
  household,
  households = [],
  onSelectHousehold,
  onOpenEditModal,
  onOpenMembersModal,
  membersCount = 0,
  lang = 'id',
  onToggleLang,
  onLogout,
}) {
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const strings = STRINGS[lang] || STRINGS.id;

  const currentTier = household?.tier || household?.subscription_tier || 'FREE';
  const isPro = currentTier === 'PRO';

  return (
    <View style={styles.headerContainer}>
      {/* Top row: Brand & Language Switcher & Logout */}
      <View style={styles.topRow}>
        <View style={styles.brandGroup}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🏠</Text>
          </View>
          <Text style={styles.brandText}>HomeHub</Text>
        </View>

        <View style={styles.actionsGroup}>
          {/* Lang Switcher */}
          <TouchableOpacity
            onPress={onToggleLang}
            style={styles.langPill}
            activeOpacity={0.7}
          >
            <Text style={[styles.langText, lang === 'id' && styles.langActive]}>
              ID
            </Text>
            <Text style={styles.langDivider}>|</Text>
            <Text style={[styles.langText, lang === 'en' && styles.langActive]}>
              EN
            </Text>
          </TouchableOpacity>

          {/* Logout Button */}
          {onLogout && (
            <TouchableOpacity
              onPress={onLogout}
              style={styles.logoutBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutText}>🚪</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Bottom row: Active Household Selector & Edit Pencil */}
      <View style={styles.householdRow}>
        <TouchableOpacity
          onPress={() => setIsSwitchModalOpen(true)}
          style={styles.householdPill}
          activeOpacity={0.8}
        >
          <Text style={styles.householdIcon}>{isPro ? '🏖️' : '🏡'}</Text>
          <Text style={styles.householdName} numberOfLines={1}>
            {household?.name || 'Rumah Utama Keluarga'}
          </Text>
          <View
            style={[
              styles.tierBadge,
              isPro ? styles.tierBadgePro : styles.tierBadgeFree,
            ]}
          >
            <Text
              style={[
                styles.tierText,
                isPro ? styles.tierTextPro : styles.tierTextFree,
              ]}
            >
              {currentTier}
            </Text>
          </View>
          <Text style={styles.chevronIcon}>▾</Text>
        </TouchableOpacity>

        {/* Edit Button */}
        <TouchableOpacity
          onPress={onOpenEditModal}
          style={styles.editBtn}
          activeOpacity={0.8}
          accessibilityLabel="Ubah Nama Rumah"
        >
          <Text style={styles.editBtnText}>✏️</Text>
        </TouchableOpacity>

        {/* Members Button */}
        <TouchableOpacity
          onPress={onOpenMembersModal}
          style={styles.membersBtn}
          activeOpacity={0.8}
          accessibilityLabel="Kelola Anggota Rumah"
        >
          <Text style={styles.membersBtnText}>👥</Text>
          {membersCount > 0 && (
            <View style={styles.membersBadge}>
              <Text style={styles.membersBadgeText}>{membersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Switch Household Modal */}
      <Modal
        visible={isSwitchModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSwitchModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsSwitchModalOpen(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{strings.household.switchTitle}</Text>
            <FlatList
              data={households}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const itemTier = item.tier || item.subscription_tier || 'FREE';
                const isSelected = item.id === household?.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      isSelected && styles.modalItemSelected,
                    ]}
                    onPress={() => {
                      onSelectHousehold(item.id);
                      setIsSwitchModalOpen(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>
                      {itemTier === 'PRO' ? '🏖️' : '🏡'} {item.name} ({itemTier})
                    </Text>
                    {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setIsSwitchModalOpen(false)}
            >
              <Text style={styles.modalCloseText}>{strings.common.close}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 16,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1e1b4b',
    letterSpacing: -0.5,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  langText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  langActive: {
    color: '#4f46e5',
  },
  langDivider: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  logoutBtn: {
    padding: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
  },
  logoutText: {
    fontSize: 14,
  },
  householdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  householdPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  householdIcon: {
    fontSize: 14,
  },
  householdName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: '#312e81',
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierBadgeFree: {
    backgroundColor: '#6366f1',
  },
  tierBadgePro: {
    backgroundColor: '#f59e0b',
  },
  tierText: {
    fontSize: 9,
    fontWeight: '900',
  },
  tierTextFree: {
    color: '#ffffff',
  },
  tierTextPro: {
    color: '#451a03',
  },
  chevronIcon: {
    fontSize: 12,
    color: '#6366f1',
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontSize: 13,
  },
  membersBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  membersBtnText: {
    fontSize: 13,
  },
  membersBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  membersBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 19, 34, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    maxHeight: 350,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 14,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: '#f8fafc',
  },
  modalItemSelected: {
    backgroundColor: '#e0e7ff',
  },
  modalItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  checkIcon: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '900',
  },
  modalCloseBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  modalCloseText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});

