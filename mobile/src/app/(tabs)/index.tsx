import { Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { colors, spacing } from '../../constants/theme';
import { getServices, getCaseStudies } from '../../api/services';

export default function HomeScreen() {
  const { data: services } = useQuery({ queryKey: ['services'], queryFn: getServices });
  const { data: caseStudies } = useQuery({ queryKey: ['case-studies'], queryFn: getCaseStudies });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.lg, paddingTop: 64 }}>
      <Text style={styles.eyebrow}>DIGITAL MARKETING AGENCY · INDIA</Text>
      <Text style={styles.h1}>
        We don't just <Text style={{ color: colors.accent, fontStyle: 'italic' }}>market</Text> brands. We've built
        one.
      </Text>
      <Text style={styles.sub}>
        A performance-driven agency for D2C & SME brands — every strategy we sell has already been tested on our own
        eCommerce brand.
      </Text>

      <Link href="/contact" asChild>
        <Pressable style={styles.cta}>
          <Text style={styles.ctaText}>Get a Free Audit</Text>
        </Pressable>
      </Link>

      <Text style={styles.sectionTitle}>What we do</Text>
      {services?.slice(0, 4).map((s) => (
        <Link key={s.id} href={`/service/${s.slug}`} asChild>
          <Pressable style={styles.card}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardBody}>{s.short_description}</Text>
          </Pressable>
        </Link>
      ))}
      {!services?.length && <Text style={styles.empty}>Services will appear here once published from the admin panel.</Text>}

      <Text style={styles.sectionTitle}>Selected work</Text>
      {caseStudies?.slice(0, 2).map((c) => (
        <Link key={c.id} href={`/work/${c.slug}`} asChild>
          <Pressable style={styles.card}>
            {c.is_featured && <Text style={styles.badge}>BUILT & OWNED BY US</Text>}
            <Text style={styles.cardTitle}>{c.title}</Text>
            <Text style={styles.cardBody}>{c.client_industry}</Text>
          </Pressable>
        </Link>
      ))}
      {!caseStudies?.length && <Text style={styles.empty}>Case studies will appear here once published.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  eyebrow: { color: colors.accent, fontSize: 12, letterSpacing: 2, marginBottom: 12 },
  h1: { color: colors.fg, fontSize: 32, fontWeight: '600', lineHeight: 40, marginBottom: 16 },
  sub: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 28 },
  cta: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 4, alignItems: 'center', marginBottom: 48 },
  ctaText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
  sectionTitle: { color: colors.fg, fontSize: 20, fontWeight: '600', marginBottom: 16, marginTop: 8 },
  card: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 18, marginBottom: 12 },
  cardTitle: { color: colors.fg, fontSize: 16, fontWeight: '600', marginBottom: 6 },
  cardBody: { color: colors.muted, fontSize: 13.5, lineHeight: 19 },
  badge: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  empty: { color: colors.faint, fontSize: 13, fontStyle: 'italic', marginBottom: 24 },
});
