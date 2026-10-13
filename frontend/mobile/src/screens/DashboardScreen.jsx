import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { STRINGS } from '../locales/strings';

export default function DashboardScreen({
  household,
  bills = [],
  assets = [],
  groceries = [],
  expenses = [],
  activities = [],
  members = [],
  onOpenMembersModal,
  budgetCeiling = 10000000,
  navigation,
  lang = 'id',
}) {
  const strings = STRINGS[lang] || STRINGS.id;

  const currentTier = household?.tier || household?.subscription_tier || 'FREE';
  const isPro = currentTier === 'PRO';

  // Calculations
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const budgetProgress = budgetCeiling > 0 ? Math.min(100, Math.round((totalExpenses / budgetCeiling) * 100)) : 0;
  const unpaidBills = bills.filter((b) => !b.is_paid && b.status !== 'PAID');
  const unboughtGroceries = groceries.filter((g) => !g.bought);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome & Household Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerHeader}>
          <Text style={styles.bannerGreeting}>
            {lang === 'id' ? 'Selamat Datang di' : 'Welcome to'}
          </Text>
          <View style={styles.tierPill}>
            <Text style={styles.tierPillText}>{isPro ? '⭐ PRO' : 'FREE'}</Text>
          </View>
        </View>
        <Text style={styles.bannerHomeName} numberOfLines={1}>
          {household?.name || 'Rumah Utama Keluarga'}
        </Text>
        <Text style={styles.bannerSubtitle}>
          {household?.address || (lang === 'id' ? 'Alamat belum diatur' : 'No address set')}
        </Text>
      </View>

      {/* 1. Monthly Budget Card */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation?.navigate('finance')}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>💰</Text>
          <Text style={styles.cardTitle}>{strings.dashboard.budgetCardTitle}</Text>
          <Text style={styles.percentageBadge}>{budgetProgress}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${budgetProgress}%` },
              budgetProgress > 85 ? styles.progressDanger : styles.progressNormal,
            ]}
          />
        </View>
        <View style={styles.budgetRow}>
          <View>
            <Text style={styles.budgetLabel}>{strings.dashboard.spent}</Text>
            <Text style={styles.budgetValue}>
              Rp {totalExpenses.toLocaleString('id-ID')}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.budgetLabel}>{strings.dashboard.remaining}</Text>
            <Text style={styles.budgetRemaining}>
              Rp {Math.max(0, budgetCeiling - totalExpenses).toLocaleString('id-ID')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* 2. Utility Bills Card */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation?.navigate('bills')}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>⚡</Text>
          <Text style={styles.cardTitle}>{strings.dashboard.billsCardTitle}</Text>
          <Text style={styles.arrowIcon}>→</Text>
        </View>
        {bills.length === 0 ? (
          <Text style={styles.emptyText}>{strings.dashboard.noBills}</Text>
        ) : (
          <View style={styles.itemRow}>
            <Text style={styles.highlightText}>
              {unpaidBills.length}{' '}
              {lang === 'id' ? 'tagihan jatuh tempo' : 'bills pending'}
            </Text>
            <Text style={styles.metaText}>
              {bills.length} {lang === 'id' ? 'akun terdaftar' : 'registered accounts'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 3. Assets & Service Card */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation?.navigate('assets')}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>❄️</Text>
          <Text style={styles.cardTitle}>{strings.dashboard.assetsCardTitle}</Text>
          <Text style={styles.arrowIcon}>→</Text>
        </View>
        {assets.length === 0 ? (
          <Text style={styles.emptyText}>{strings.dashboard.noAssets}</Text>
        ) : (
          <View style={styles.itemRow}>
            <Text style={styles.highlightText}>
              {assets.length} {lang === 'id' ? 'unit aset & kendaraan' : 'assets & vehicles'}
            </Text>
            <Text style={styles.metaText}>
              {lang === 'id' ? 'Semua jadwal terpantau' : 'All schedules tracked'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 4. Groceries Card */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation?.navigate('groceries')}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🛒</Text>
          <Text style={styles.cardTitle}>{strings.dashboard.groceriesCardTitle}</Text>
          <Text style={styles.arrowIcon}>→</Text>
        </View>
        {groceries.length === 0 ? (
          <Text style={styles.emptyText}>{strings.dashboard.noGroceries}</Text>
        ) : (
          <View style={styles.itemRow}>
            <Text style={styles.highlightText}>
              {unboughtGroceries.length}{' '}
              {lang === 'id' ? 'item belum dibeli' : 'items pending'}
            </Text>
            <Text style={styles.metaText}>
              {groceries.length - unboughtGroceries.length}{' '}
              {lang === 'id' ? 'sudah terbeli' : 'completed'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 5. Activities Card */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation?.navigate('activities')}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>📅</Text>
          <Text style={styles.cardTitle}>{strings.dashboard.activitiesCardTitle}</Text>
          <Text style={styles.arrowIcon}>→</Text>
        </View>
        {activities.length === 0 ? (
          <Text style={styles.emptyText}>{strings.dashboard.noActivities}</Text>
        ) : (
          <View style={styles.itemRow}>
            <Text style={styles.highlightText}>
              {activities.length} {lang === 'id' ? 'agenda bulan ini' : 'activities this month'}
            </Text>
            <Text style={styles.metaText}>
              {lang === 'id' ? 'Les, liburan & acara keluarga' : 'Tuition, trips & family events'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 6. Household Members Card */}
      <TouchableOpacity
        style={[styles.card, styles.membersCard]}
        activeOpacity={0.9}
        onPress={onOpenMembersModal}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>👥</Text>
          <Text style={styles.cardTitle}>
            {strings.members?.cardTitle || 'Anggota Keluarga'}
          </Text>
          <View style={styles.membersCountPill}>
            <Text style={styles.membersCountText}>
              {members.length} {lang === 'id' ? 'Orang' : 'Members'}
            </Text>
          </View>
        </View>

        <View style={styles.membersRow}>
          <View style={styles.avatarsGroup}>
            {members.slice(0, 4).map((m, i) => (
              <View
                key={m.id || i}
                style={[
                  styles.miniAvatar,
                  { marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i },
                ]}
              >
                <Text style={styles.miniAvatarText}>
                  {m.name ? m.name.substring(0, 1).toUpperCase() : 'U'}
                </Text>
              </View>
            ))}
            {members.length > 4 && (
              <View style={[styles.miniAvatar, styles.miniAvatarMore, { marginLeft: -8 }]}>
                <Text style={styles.miniAvatarText}>+{members.length - 4}</Text>
              </View>
            )}
          </View>

          <View style={styles.manageBtn}>
            <Text style={styles.manageBtnText}>
              {strings.members?.manageBtn || 'Kelola'} →
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
    gap: 12,
  },
  banner: {
    backgroundColor: '#0c1322',
    borderRadius: 24,
    padding: 20,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bannerGreeting: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tierPill: {
    backgroundColor: '#312e81',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tierPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#a5b4fc',
  },
  bannerHomeName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  percentageBadge: {
    fontSize: 12,
    fontWeight: '900',
    color: '#4f46e5',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  arrowIcon: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressNormal: {
    backgroundColor: '#4f46e5',
  },
  progressDanger: {
    backgroundColor: '#ef4444',
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  budgetRemaining: {
    fontSize: 14,
    fontWeight: '900',
    color: '#10b981',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  highlightText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
  },
  membersCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  membersCountPill: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  membersCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4338ca',
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  avatarsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  miniAvatarMore: {
    backgroundColor: '#64748b',
  },
  miniAvatarText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  manageBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  manageBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f46e5',
  },
});

