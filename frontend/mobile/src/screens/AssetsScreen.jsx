import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';

export default function AssetsScreen({ assets = [], lang = 'id' }) {
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.heading}>
          {lang === 'id' ? 'Inventaris Aset & Garansi' : 'Assets & Warranty'}
        </Text>
        <Text style={styles.subheading}>
          {lang === 'id'
            ? 'Kelola elektronik, kendaraan & histori servis berkala'
            : 'Manage electronics, vehicles & periodic service logs'}
        </Text>
      </View>

      {assets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyTitle}>
            {lang === 'id'
              ? 'Belum ada aset terdaftar'
              : 'No assets registered yet'}
          </Text>
          <Text style={styles.emptySub}>
            {lang === 'id'
              ? 'Daftarkan AC, Kulkas, Mobil & Motor Anda'
              : 'Register your electronics and vehicles'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => {
            const isVehicle =
              item.type === 'VEHICLE' ||
              (item.category || '').toLowerCase().includes('kendaraan') ||
              (item.category || '').toLowerCase().includes('mobil');
            return (
              <View style={styles.assetCard}>
                <View style={styles.assetHeader}>
                  <View style={styles.assetIconBox}>
                    <Text style={{ fontSize: 20 }}>
                      {isVehicle ? '🚗' : '❄️'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.assetName}>{item.name}</Text>
                    <Text style={styles.assetCategory}>
                      {item.brand_model || item.category || 'Elektronik Rumah'}
                    </Text>
                  </View>
                  <View style={styles.warrantyBadge}>
                    <Text style={styles.warrantyText}>
                      {item.warranty_status || (lang === 'id' ? 'Garansi Aktif' : 'Warranty OK')}
                    </Text>
                  </View>
                </View>

                {item.current_odometer && (
                  <View style={styles.assetDetailRow}>
                    <Text style={styles.detailLabel}>Odometer:</Text>
                    <Text style={styles.detailValue}>
                      {Number(item.current_odometer).toLocaleString('id-ID')} KM
                    </Text>
                  </View>
                )}

                {item.serial_number && (
                  <View style={styles.assetDetailRow}>
                    <Text style={styles.detailLabel}>No. Seri / Plat:</Text>
                    <Text style={styles.detailValue}>{item.serial_number}</Text>
                  </View>
                )}
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
  assetCard: {
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
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  assetIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  assetCategory: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  warrantyBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  warrantyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  assetDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
});

