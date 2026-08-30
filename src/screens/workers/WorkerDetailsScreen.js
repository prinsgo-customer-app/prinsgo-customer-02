import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getWorkerById } from '../../api/workers';

export default function WorkerDetailsScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { workerId } = route.params;

  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorker = async () => {
      try {
        const res = await getWorkerById(workerId);
        setWorker(res.data?.worker);
      } catch (err) {
        Alert.alert('Error', 'Could not load worker details');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    loadWorker();
  }, [workerId, navigation]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!worker) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textPrimary }}>Worker not found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Worker Profile</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.background }]}>
            <Text style={{ fontSize: 40 }}>🧑‍🔧</Text>
          </View>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{worker.name}</Text>
          <Text style={[styles.category, { color: colors.textSecondary }]}>{worker.category}</Text>

          {worker.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.green + '20' }]}>
              <Text style={{ color: colors.green, fontWeight: 'bold', fontSize: 12 }}>✓ Verified Professional</Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>⭐ {worker.rating || 'New'}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{worker.reviews || 0} Reviews</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{worker.experience || '1+'} Yrs</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Experience</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{worker.completedJobs || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Jobs Done</Text>
            </View>
          </View>
        </View>

        {/* About */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>About</Text>
        <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
          {worker.about || `${worker.name} is a highly rated professional offering excellent ${worker.category.toLowerCase()} services.`}
        </Text>

        {/* Services & Pricing */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>Services & Pricing</Text>
        <View style={[styles.pricingBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>Starting Price (Inspection/Visit)</Text>
          <Text style={[styles.pricingValue, { color: colors.textPrimary }]}>₹{worker.startingPrice || 199}</Text>
        </View>

        {worker.servicesOffered && worker.servicesOffered.length > 0 && (
          <View style={{ marginTop: 10 }}>
            {worker.servicesOffered.map((srv, idx) => (
              <View key={idx} style={styles.serviceRow}>
                <Text style={[styles.serviceName, { color: colors.textPrimary }]}>• {srv.name}</Text>
                <Text style={[styles.servicePrice, { color: colors.textSecondary }]}>₹{srv.price}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[styles.chatBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={{ fontSize: 16 }}>💬</Text>
          <Text style={[styles.chatText, { color: colors.textPrimary }]}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bookBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('WorkerBooking', { workerId: worker._id, workerName: worker.name, category: worker.category, basePrice: worker.startingPrice })}
        >
          <Text style={[styles.bookText, { color: colors.textPrimary }]}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: { marginBottom: 6 },
  backText: { fontSize: 14, fontWeight: '600' },
  title: { fontWeight: '800', fontSize: 20 },
  container: { flex: 1 },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
  },
  imagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: { fontSize: 22, fontWeight: '900' },
  category: { fontSize: 15, marginTop: 4 },
  verifiedBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  aboutText: { fontSize: 14, lineHeight: 22 },
  pricingBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  pricingLabel: { fontSize: 14 },
  pricingValue: { fontSize: 18, fontWeight: '900' },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceName: { fontSize: 14, fontWeight: '500' },
  servicePrice: { fontSize: 14, fontWeight: '700' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 12,
  },
  chatText: { marginLeft: 8, fontWeight: '700', fontSize: 16 },
  bookBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  bookText: { fontWeight: '800', fontSize: 16 },
});
