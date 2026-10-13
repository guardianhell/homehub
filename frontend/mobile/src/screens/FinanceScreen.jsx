import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';

export default function FinanceScreen({
  expenses = [],
  budgetCeiling = 10000000,
  lang = 'id',
}) {
  const totalSpent = expenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );
  const remaining = Math.max(0, budgetCeiling - totalSpent);

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.topBar}>
        <Text style={styles.heading}>
          {lang === 'id' ? 'Finansial & Pengeluaran' : 'Finance & Expenses'}
        </Text>
        <Text style={styles.subheading}>
          {lang === 'id'
            ? 'Plafon bulanan & histori pengeluaran kas keluarga'
            : 'Monthly budget ceiling & family cash outflow'}
        </Text>
      </View>

      {/* Summary Box */}
      <View style={styles.summaryBox}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>
            {lang === 'id' ? 'Plafon Anggaran' : 'Budget Ceiling'}
          </Text>
          <Text style={styles.summaryValue}>
            Rp {Number(budgetCeiling).toLocaleString('id-ID')}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>
            {lang === 'id' ? 'Total Terpakai' : 'Total Spent'}
          </Text>
          <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
            Rp {totalSpent.toLocaleString('id-ID')}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>
            {lang === 'id' ? 'Sisa Dana' : 'Remaining'}
          </Text>
          <Text style={[styles.summaryValue, { color: '#10b981' }]}>
            Rp {remaining.toLocaleString('id-ID')}
          </Text>
        </View>
      </View>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>💸</Text>
          <Text style={styles.emptyTitle}>
            {lang === 'id'
              ? 'Belum ada catatan pengeluaran'
              : 'No expenses recorded yet'}
          </Text>
          <Text style={styles.emptySub}>
            {lang === 'id'
              ? 'Catat pengeluaran belanja, perbaikan atau kebutuhan rumah tangga'
              : 'Record shopping, maintenance, or home expenses'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <View style={styles.expenseCard}>
              <View style={styles.expenseIconBox}>
                <Text style={{ fontSize: 18 }}>🧾</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.expenseTitle}>
                  {item.title || item.description || 'Pengeluaran'}
                </Text>
                <Text style={styles.expenseCategory}>
                  {item.category || 'Operasional'} • {item.date || 'Sep 2026'}
                </Text>
                {item.recorded_by_name && (
                  <View style={styles.authorBadge}>
                    <Text style={styles.authorText}>👤 Oleh: {item.recorded_by_name}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.expenseAmount}>
                -Rp {Number(item.amount || 0).toLocaleString('id-ID')}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  heading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  subheading: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#f1f5f9',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  expenseIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  expenseCategory: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ef4444',
  },
  authorBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  authorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
});

