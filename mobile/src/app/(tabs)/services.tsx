import { useMemo } from 'react';
import { Text, FlatList, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTheme, spacing, type ThemeColors } from '../../context/theme';
import { getServices } from '../../api/services';

export default function ServicesScreen() {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({ queryKey: ['services'], queryFn: getServices });

  return (
    <FlatList
      style={styles.screen}
      data={data || []}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: 64 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
      ListHeaderComponent={<Text style={styles.h1}>Services</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/service/${item.slug}`)}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardBody}>{item.short_description}</Text>
        </Pressable>
      )}
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
        ) : isError ? (
          <Text style={styles.empty}>Couldn't load services — pull down to try again.</Text>
        ) : (
          <Text style={styles.empty}>No services published yet.</Text>
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
    cardBody: { color: colors.muted, fontSize: 13.5, lineHeight: 19 },
    empty: { color: colors.faint, fontSize: 13, fontStyle: 'italic' },
  });
