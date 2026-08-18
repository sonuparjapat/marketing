import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, type ThemeColors } from '../../context/theme';
import { getCaseStudy, CaseStudyDetail } from '../../api/services';

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function CaseStudyDetailScreen() {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [cs, setCs] = useState<CaseStudyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    getCaseStudy(slug)
      .then(setCs)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!cs) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.muted }}>Case study not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.lg, paddingTop: 60 }}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={18} color={colors.muted} />
        <Text style={styles.backText}>Work</Text>
      </Pressable>

      {cs.is_featured && <Text style={styles.badge}>BUILT & OWNED BY US</Text>}
      <Text style={styles.industry}>{cs.client_industry}</Text>
      <Text style={styles.h1}>{cs.title}</Text>

      <View style={styles.metricsGrid}>
        {cs.results_json.map((r) => (
          <View key={r.metric} style={styles.metricCard}>
            <Text style={styles.metricValue}>{r.value}</Text>
            <Text style={styles.metricLabel}>{r.metric}{r.label ? `, ${r.label}` : ''}</Text>
          </View>
        ))}
      </View>

      {cs.challenge && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.sectionLabel}>The challenge</Text>
          <Text style={styles.body}>{stripHtml(cs.challenge)}</Text>
        </View>
      )}

      {cs.solution && (
        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionLabel}>What we did</Text>
          <Text style={styles.body}>{stripHtml(cs.solution)}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    back: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backText: { color: colors.muted, fontSize: 14, marginLeft: 4 },
    badge: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
    industry: { color: colors.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    h1: { color: colors.fg, fontSize: 24, fontWeight: '600', marginBottom: 20 },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
    metricCard: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 14, minWidth: '46%' },
    metricValue: { color: colors.accent, fontSize: 22, fontWeight: '700' },
    metricLabel: { color: colors.faint, fontSize: 11, marginTop: 4 },
    sectionLabel: { color: colors.accent, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
    body: { color: colors.fg, fontSize: 14.5, lineHeight: 21, opacity: 0.9 },
  });
