import { Text, FlatList, StyleSheet, Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../../constants/theme';
import { getCaseStudies } from '../../api/services';

export default function WorkScreen() {
  const router = useRouter();
  const { data, isLoading } = useQuery({ queryKey: ['case-studies'], queryFn: getCaseStudies });

  return (
    <FlatList
      style={styles.screen}
      data={data || []}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: 64 }}
      ListHeaderComponent={<Text style={styles.h1}>Our Work</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/work/${item.slug}`)}>
          {item.is_featured && <Text style={styles.badge}>BUILT & OWNED BY US</Text>}
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardBody}>{item.client_industry}</Text>
          <View style={styles.metrics}>
            {(item.results_json || []).slice(0, 3).map((r, i) => (
              <View key={i} style={{ marginRight: 20 }}>
                <Text style={styles.metricValue}>{r.value}</Text>
                <Text style={styles.metricLabel}>{r.label}</Text>
              </View>
            ))}
          </View>
        </Pressable>
      )}
      ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No case studies published yet.</Text> : null}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  h1: { color: colors.fg, fontSize: 28, fontWeight: '600', marginBottom: 24 },
  card: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 18, marginBottom: 12 },
  cardTitle: { color: colors.fg, fontSize: 16, fontWeight: '600', marginBottom: 6 },
  cardBody: { color: colors.muted, fontSize: 13.5, lineHeight: 19, marginBottom: 12 },
  badge: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  metrics: { flexDirection: 'row', marginTop: 4 },
  metricValue: { color: colors.accent, fontSize: 18, fontWeight: '700' },
  metricLabel: { color: colors.faint, fontSize: 11 },
  empty: { color: colors.faint, fontSize: 13, fontStyle: 'italic' },
});
