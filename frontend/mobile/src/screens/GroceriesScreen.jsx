import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export default function GroceriesScreen({
  groceries = [],
  onToggleItem,
  lang = 'id',
}) {
  const unbought = groceries.filter((g) => !g.bought);
  const bought = groceries.filter((g) => g.bought);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.heading}>
            {lang === 'id' ? 'Daftar Belanja Dapur' : 'Grocery Shopping List'}
          </Text>
          <Text style={styles.subheading}>
            {lang === 'id'
              ? 'Ketuk item saat berbelanja di supermarket'
              : 'Tap items while shopping at the supermarket'}
          </Text>
        </View>
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {bought.length}/{groceries.length}
          </Text>
        </View>
      </View>

      {groceries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>
            {lang === 'id'
              ? 'Daftar belanja masih kosong'
              : 'Shopping list is empty'}
          </Text>
          <Text style={styles.emptySub}>
            {lang === 'id'
              ? 'Tambahkan kebutuhan dapur & bumbu masak Anda'
              : 'Add kitchen groceries and ingredients'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={groceries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.groceryItem,
                item.bought && styles.groceryItemBought,
              ]}
              activeOpacity={0.7}
              onPress={() => onToggleItem && onToggleItem(item.id)}
            >
              <View
                style={[
                  styles.checkbox,
                  item.bought && styles.checkboxChecked,
                ]}
              >
                {item.bought && <Text style={styles.checkmark}>✓</Text>}
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.itemName,
                    item.bought && styles.itemNameBought,
                  ]}
                >
                  {item.name}
                </Text>
                <Text style={styles.itemCategory}>{item.category || 'Dapur'}</Text>
                {(item.created_by_name || (item.bought && item.bought_by_name)) && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    {item.created_by_name && (
                      <View style={styles.authorBadge}>
                        <Text style={styles.authorText}>📝 {item.created_by_name}</Text>
                      </View>
                    )}
                    {item.bought && item.bought_by_name && (
                      <View style={[styles.authorBadge, styles.boughtBadge]}>
                        <Text style={[styles.authorText, styles.boughtText]}>✓ {item.bought_by_name}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.itemPrice}>
                  Rp{' '}
                  {Number(
                    item.actual_price || item.estimated_price || 0
                  ).toLocaleString('id-ID')}
                </Text>
                <Text
                  style={[
                    styles.statusText,
                    item.status === 'OUT_OF_STOCK'
                      ? styles.statusOutOfStock
                      : styles.statusNormal,
                  ]}
                >
                  {item.status === 'OUT_OF_STOCK'
                    ? (lang === 'id' ? 'Habis' : 'Out of stock')
                    : (lang === 'id' ? 'Stok Rendah' : 'Low stock')}
                </Text>
              </View>
            </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  counterBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#4338ca',
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
  groceryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  groceryItemBought: {
    backgroundColor: '#f8fafc',
    opacity: 0.7,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  itemNameBought: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  itemCategory: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  statusOutOfStock: {
    color: '#ef4444',
  },
  statusNormal: {
    color: '#f59e0b',
  },
  authorBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  authorText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  boughtBadge: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  boughtText: {
    color: '#065f46',
  },
});

