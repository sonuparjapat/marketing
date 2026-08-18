import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../constants/theme';
import { getService, ServiceDetail } from '../../api/services';

export default function ServiceDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    getService(slug)
      .then(setService)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.muted }}>Service not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.lg, paddingTop: 60 }}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={18} color={colors.muted} />
        <Text style={styles.backText}>Services</Text>
      </Pressable>

      <Text style={styles.h1}>{service.title}</Text>
      <Text style={styles.sub}>{service.short_description}</Text>

      {service.full_description && <Text style={styles.body}>{service.full_description}</Text>}

      {service.features_json?.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionLabel}>What&apos;s included</Text>
          {service.features_json.map((f) => (
            <View key={f} style={styles.featureRow}>
              <View style={styles.dot} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backText: { color: colors.muted, fontSize: 14, marginLeft: 4 },
  h1: { color: colors.fg, fontSize: 26, fontWeight: '600', marginBottom: 10 },
  sub: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 20 },
  body: { color: colors.fg, fontSize: 14.5, lineHeight: 21, opacity: 0.9 },
  sectionLabel: { color: colors.accent, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.line },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent, marginTop: 7, marginRight: 10 },
  featureText: { color: colors.fg, fontSize: 14.5, flex: 1 },
});
