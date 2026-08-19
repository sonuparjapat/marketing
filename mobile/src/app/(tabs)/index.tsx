import { useMemo } from 'react';
import { Text, View, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, gradients, type ThemeColors } from '../../context/theme';
import { getServices, getCaseStudies, getPublicSettings } from '../../api/services';

const SERVICE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  target: 'locate-outline',
  search: 'search-outline',
  sparkles: 'sparkles-outline',
  layout: 'grid-outline',
  workflow: 'git-network-outline',
  users: 'people-outline',
};

const BADGE_HUES: (keyof typeof gradients)[] = ['gold', 'emerald', 'coral'];

const PROCESS_STEPS = [
  { n: '01', title: 'Audit & Diagnose', body: 'A full funnel teardown in the first 7 days.' },
  { n: '02', title: 'Strategy & Roadmap', body: 'A 90-day plan with real revenue milestones.' },
  { n: '03', title: 'Build & Launch', body: 'Shipped by the same pod that wrote the strategy.' },
  { n: '04', title: 'Scale & Optimize', body: 'Weekly cycles compound what works.' },
];

export default function HomeScreen() {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    data: services,
    isLoading: servicesLoading,
    isError: servicesError,
  } = useQuery({ queryKey: ['services'], queryFn: getServices });
  const {
    data: caseStudies,
    isLoading: caseStudiesLoading,
    isError: caseStudiesError,
  } = useQuery({ queryKey: ['case-studies'], queryFn: getCaseStudies });
  const { data: settings, refetch, isRefetching } = useQuery({ queryKey: ['settings'], queryFn: getPublicSettings });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: 64 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <View style={styles.eyebrowRow}>
        <View style={styles.eyebrowDash} />
        <Text style={styles.eyebrow}>DIGITAL MARKETING AGENCY · INDIA</Text>
      </View>
      <Text style={styles.h1}>
        {settings?.tagline ? (
          settings.tagline
        ) : (
          <>
            We don't just <Text style={{ color: colors.accent, fontStyle: 'italic' }}>market</Text> brands. We've
            built one.
          </>
        )}
      </Text>
      <Text style={styles.sub}>
        A performance-driven agency for D2C & SME brands — every strategy we sell has already been tested on our own
        eCommerce brand.
      </Text>

      <Link href="/contact" asChild>
        <Pressable>
          <LinearGradient colors={gradients.accentGlow} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            <Text style={styles.ctaText}>Get a Free Audit</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.bg} />
          </LinearGradient>
        </Pressable>
      </Link>

      {caseStudies?.[0] && (
        <View style={styles.proofCard}>
          <View style={styles.proofHeadRow}>
            <Text style={styles.proofLabel}>REAL BRAND. REAL RESULTS.</Text>
            <View style={styles.pulseDot} />
          </View>
          <Text style={styles.proofMetric}>{caseStudies[0].results_json?.[0]?.value || '—'}</Text>
          <Text style={styles.proofSub}>
            {caseStudies[0].results_json?.[0]?.metric || 'Result'} — {caseStudies[0].title}
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>What we do</Text>
      {servicesLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginBottom: 24 }} />
      ) : (
        <>
          {services?.slice(0, 4).map((s, i) => {
            const hue = BADGE_HUES[i % 3];
            return (
              <Link key={s.id} href={`/service/${s.slug}`} asChild>
                <Pressable style={styles.card}>
                  <LinearGradient colors={gradients[hue]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconBadge}>
                    <Ionicons name={SERVICE_ICONS[s.icon] || 'locate-outline'} size={20} color={colors.bg} />
                  </LinearGradient>
                  <Text style={styles.cardTitle}>{s.title}</Text>
                  <Text style={styles.cardBody}>{s.short_description}</Text>
                </Pressable>
              </Link>
            );
          })}
          {!services?.length && (
            <Text style={styles.empty}>
              {servicesError ? "Couldn't load services — pull down to try again." : 'Services will appear here once published from the admin panel.'}
            </Text>
          )}
        </>
      )}

      <Text style={styles.sectionTitle}>How we work</Text>
      <View style={{ marginBottom: 8 }}>
        {PROCESS_STEPS.map((step, i) => (
          <View key={step.n} style={styles.processRow}>
            <LinearGradient
              colors={gradients[BADGE_HUES[i % 3]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.processNum}
            >
              <Text style={styles.processNumText}>{step.n}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{step.title}</Text>
              <Text style={styles.cardBody}>{step.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Selected work</Text>
      {caseStudiesLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginBottom: 24 }} />
      ) : (
        <>
          {caseStudies?.slice(0, 2).map((c) => (
            <Link key={c.id} href={`/work/${c.slug}`} asChild>
              <Pressable style={styles.card}>
                {c.is_featured && (
                  <LinearGradient colors={gradients.accentGlow} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badgePill}>
                    <Text style={styles.badgePillText}>BUILT & OWNED BY US</Text>
                  </LinearGradient>
                )}
                <Text style={styles.cardTitle}>{c.title}</Text>
                <Text style={styles.cardBody}>{c.client_industry}</Text>
              </Pressable>
            </Link>
          ))}
          {!caseStudies?.length && (
            <Text style={styles.empty}>
              {caseStudiesError ? "Couldn't load case studies — pull down to try again." : 'Case studies will appear here once published.'}
            </Text>
          )}
        </>
      )}

      <Link href="/admin/login" asChild>
        <Pressable style={{ marginTop: 40, alignItems: 'center' }}>
          <Text style={{ color: colors.faint, fontSize: 11 }}>Admin</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    eyebrowDash: { width: 20, height: 1, backgroundColor: colors.accent },
    eyebrow: { color: colors.accent, fontSize: 12, letterSpacing: 2 },
    h1: { color: colors.fg, fontSize: 32, fontWeight: '600', lineHeight: 40, marginBottom: 16 },
    sub: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 28 },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      borderRadius: 10,
      marginBottom: 20,
      shadowColor: colors.accent,
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    ctaText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
    proofCard: {
      backgroundColor: colors.bg3,
      borderWidth: 1,
      borderColor: colors.lineSoft,
      borderRadius: 16,
      padding: 20,
      marginBottom: 40,
    },
    proofHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    proofLabel: { color: colors.accent, fontSize: 10.5, letterSpacing: 1 },
    pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent2 },
    proofMetric: { color: colors.fg, fontSize: 34, fontStyle: 'italic', fontWeight: '600', marginBottom: 4 },
    proofSub: { color: colors.muted, fontSize: 12.5 },
    sectionTitle: { color: colors.fg, fontSize: 20, fontWeight: '600', marginBottom: 16, marginTop: 8 },
    card: {
      backgroundColor: colors.bg2,
      borderWidth: 1,
      borderColor: colors.lineSoft,
      borderRadius: 16,
      padding: 18,
      marginBottom: 12,
    },
    iconBadge: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    cardTitle: { color: colors.fg, fontSize: 16, fontWeight: '600', marginBottom: 6 },
    cardBody: { color: colors.muted, fontSize: 13.5, lineHeight: 19 },
    badgePill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: 10 },
    badgePillText: { color: colors.bg, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
    processRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start', marginBottom: 20 },
    processNum: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    processNumText: { color: colors.bg, fontSize: 12, fontWeight: '700', fontStyle: 'italic' },
    empty: { color: colors.faint, fontSize: 13, fontStyle: 'italic', marginBottom: 24 },
  });
