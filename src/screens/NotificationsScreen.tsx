import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { getNotifications } from '../api/auth';
import { COLORS } from '../utils/theme';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data?.notifications || []);
    } catch (err: any) {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Inbox Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>Your inbox is quiet. No new notifications!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>📣</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardTime}>
                  {new Date(item.createdAt).toLocaleDateString()} ·{' '}
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
            <Text style={styles.cardMessage}>{item.message}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 50, marginBottom: 12 },
  emptyText: { color: COLORS.textLight, fontSize: 14, textAlign: 'center' },
  card: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 16, marginBottom: 12, backgroundColor: COLORS.background },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 8 },
  bellBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  bellBadgeText: { fontSize: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  cardTime: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  cardMessage: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
});
