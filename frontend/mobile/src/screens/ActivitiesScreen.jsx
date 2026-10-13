import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';

export default function ActivitiesScreen({ activities = [], lang = 'id' }) {
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.heading}>
          {lang === 'id' ? 'Agenda & Aktivitas Keluarga' : 'Family Schedule'}
        </Text>
        <Text style={styles.subheading}>
          {lang === 'id'
            ? 'Jadwal les anak, liburan keluarga, dan undangan acara'
            : 'Tuition, family holidays & event invitations'}
        </Text>
      </View>

      {activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>
            {lang === 'id'
              ? 'Belum ada agenda terdaftar'
              : 'No activities scheduled yet'}
          </Text>
          <Text style={styles.emptySub}>
            {lang === 'id'
              ? 'Tambahkan jadwal les, arisan, atau agenda penting keluarga'
              : 'Add tuition, meetings, or important family schedules'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => {
            const isLesson =
              item.activity_type === 'COURSE_LES' ||
              (item.title || '').toLowerCase().includes('les');
            return (
              <View style={styles.activityCard}>
                <View
                  style={[
                    styles.accentBorder,
                    isLesson ? styles.accentPink : styles.accentBlue,
                  ]}
                />
                <View style={{ flex: 1, padding: 14 }}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <View style={styles.tagPill}>
                      <Text style={styles.tagText}>
                        {item.tag || item.activity_type || 'Agenda'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.activityTime}>
                    🕒 {item.start_time || item.time || '14:00'} • {item.date || 'Sep 2026'}
                  </Text>
                  {item.location && (
                    <Text style={styles.activityLocation}>
                      📍 {item.location}
                    </Text>
                  )}
                  {item.created_by_name && (
                    <View style={styles.authorBadge}>
                      <Text style={styles.authorText}>👤 Oleh: {item.created_by_name}</Text>
                    </View>
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
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  accentBorder: {
    width: 6,
  },
  accentPink: {
    backgroundColor: '#ec4899',
  },
  accentBlue: {
    backgroundColor: '#3b82f6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  tagPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  activityTime: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  activityLocation: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  authorBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  authorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
});

