import { useMemo } from 'react';
import { Text, FlatList, StyleSheet, Pressable, View, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, spacing, gradients, type ThemeColors } from '../../context/theme';
import { getCaseStudies } from '../../api/services';

export default function WorkScreen() {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({ queryKey: ['case-studies'], queryFn: getCaseStudies });

  return (
    <FlatList
      style={styles.screen}
      data={data || []}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: 64 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
      ListHeaderComponent={<Text style={styles.h1}>Our Work</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/work/${item.slug}`)}>
          {item.is_featured && (
            <LinearGradient colors={gradients.accentGlow} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badge}>
              <Text style={styles.badgeText}>BUILT & OWNED BY US</Text>
            </LinearGradient>
          )}
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
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
        ) : isError ? (
          <Text style={styles.empty}>Couldn't load case studies — pull down to try again.</Text>
        ) : (
          <Text style={styles.empty}>No case studies published yet.</Text>
        )
      }
    />
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    h1: { color: colors.fg, fontSize: 28, fontWeight: '600', marginBottom: 24 },
    card: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 16, padding: 18, marginBottom: 12 },
    cardTitle: { color: colors.fg, fontSize: 16, fontWeight: '600', marginBottom: 6 },
    cardBody: { color: colors.muted, fontSize: 13.5, lineHeight: 19, marginBottom: 12 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: 10 },
    badgeText: { color: colors.bg, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
    metrics: { flexDirection: 'row', marginTop: 4 },
    metricValue: { color: colors.accent2, fontSize: 18, fontWeight: '700' },
    metricLabel: { color: colors.faint, fontSize: 11 },
    empty: { color: colors.faint, fontSize: 13, fontStyle: 'italic' },
  });
