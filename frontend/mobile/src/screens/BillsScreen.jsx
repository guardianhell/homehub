import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export default function BillsScreen({ bills = [], onToggleBill, lang = 'id' }) {
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.heading}>
          {lang === 'id' ? 'Tagihan Utilitas Rutin' : 'Routine Utility Bills'}
        </Text>
        <Text style={styles.subheading}>
          {lang === 'id'
            ? 'Pantau jatuh tempo PLN, PDAM, Indihome & IPL'
            : 'Track electricity, water, internet & maintenance fees'}
        </Text>
      </View>

      {bills.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>💡</Text>
          <Text style={styles.emptyTitle}>
            {lang === 'id'
              ? 'Belum ada tagihan terdaftar'
              : 'No bills registered yet'}
          </Text>
          <Text style={styles.emptySub}>
            {lang === 'id'
              ? 'Tambahkan tagihan rutin rumah Anda melalui web atau mobile'
              : 'Add your household bills via web or mobile'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={bills}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => {
            const isPaid = item.is_paid || item.status === 'PAID';
            return (
              <View style={styles.billCard}>
                <View style={styles.billHeader}>
                  <View style={styles.billIconBox}>
                    <Text style={{ fontSize: 18 }}>
                      {item.category_icon || item.icon || (
                        (item.utility_type === 'ELECTRICITY' || item.type === 'electricity' || item.category === 'ELECTRICITY') ? '⚡' :
                        (item.utility_type === 'WATER' || item.type === 'water' || item.category === 'WATER') ? '💧' :
                        (item.utility_type === 'INTERNET' || item.type === 'internet' || item.category === 'INTERNET') ? '🌐' :
                        (item.category === 'MAINTENANCE_IPL') ? '🏢' :
                        (item.category === 'GAS') ? '🔥' : '📄'
                      )}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.billName}>{item.name}</Text>
                    <Text style={styles.billDue}>
                      {lang === 'id' ? 'Jatuh Tempo: Tgl ' : 'Due Date: Day '}
                      {item.due_day || item.due_date || '20'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      isPaid ? styles.statusPaid : styles.statusUnpaid,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isPaid ? styles.statusTextPaid : styles.statusTextUnpaid,
                      ]}
                    >
                      {isPaid
                        ? (lang === 'id' ? 'Lunas' : 'Paid')
                        : (lang === 'id' ? 'Belum Bayar' : 'Unpaid')}
                    </Text>
                  </View>
                </View>

                <View style={styles.billFooter}>
                  <Text style={styles.billAmount}>
                    Rp {Number(item.amount || item.estimated_amount || 0).toLocaleString('id-ID')}
                  </Text>
                  {onToggleBill && (
                    <TouchableOpacity
                      onPress={() => onToggleBill(item.id)}
                      style={styles.toggleBtn}
                    >
                      <Text style={styles.toggleBtnText}>
                        {isPaid
                          ? (lang === 'id' ? 'Tandai Belum' : 'Mark Unpaid')
                          : (lang === 'id' ? '✓ Bayar' : '✓ Pay')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
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
  billCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  billIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  billName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  billDue: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPaid: {
    backgroundColor: '#d1fae5',
  },
  statusUnpaid: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextPaid: {
    color: '#047857',
  },
  statusTextUnpaid: {
    color: '#b91c1c',
  },
  billFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  billAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1e1b4b',
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eef2ff',
    borderRadius: 10,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f46e5',
  },
});

