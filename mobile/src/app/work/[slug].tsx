import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, type ThemeColors } from '../../context/theme';
import { getCaseStudy, CaseStudyDetail } from '../../api/services';
import { HtmlContent } from '../../components/HtmlContent';

const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function CaseStudyDetailScreen() {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [cs, setCs] = useState<CaseStudyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getCaseStudy(slug)
      .then(setCs)
      .catch(() => setError(true))
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
        <Text style={{ color: colors.muted }}>{error ? "Couldn't load this case study — check your connection." : 'Case study not found.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.lg, paddingTop: 60 }}>
      <View style={styles.topRow}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={18} color={colors.muted} />
          <Text style={styles.backText}>Work</Text>
        </Pressable>
        <Pressable onPress={() => Share.share({ message: `${cs.title} — ${SITE_URL}/work/${cs.slug}` })} hitSlop={8}>
          <Ionicons name="share-outline" size={20} color={colors.muted} />
        </Pressable>
      </View>

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
          <HtmlContent html={cs.challenge} />
        </View>
      )}

      {cs.solution && (
        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionLabel}>What we did</Text>
          <HtmlContent html={cs.solution} />
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    back: { flexDirection: 'row', alignItems: 'center' },
    backText: { color: colors.muted, fontSize: 14, marginLeft: 4 },
    badge: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
    industry: { color: colors.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    h1: { color: colors.fg, fontSize: 24, fontWeight: '600', marginBottom: 20 },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
    metricCard: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 14, minWidth: '46%' },
    metricValue: { color: colors.accent, fontSize: 22, fontWeight: '700' },
    metricLabel: { color: colors.faint, fontSize: 11, marginTop: 4 },
    sectionLabel: { color: colors.accent, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  });
