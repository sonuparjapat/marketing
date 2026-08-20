import { useMemo, useState } from 'react';
import { Text, FlatList, StyleSheet, Pressable, ActivityIndicator, RefreshControl, View, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, type ThemeColors } from '../../context/theme';
import { getPosts, getBlogCategories } from '../../api/services';

export default function BlogScreen() {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [category, setCategory] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['posts', category],
    queryFn: () => getPosts(category || undefined),
  });
  const { data: categories } = useQuery({ queryKey: ['blog-categories'], queryFn: getBlogCategories });

  return (
    <FlatList
      style={styles.screen}
      data={data?.items || []}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: 64 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
      ListHeaderComponent={
        <View>
          <Text style={styles.h1}>Blog</Text>
          {categories && categories.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={{ gap: 8 }}>
              <Pressable onPress={() => setCategory(null)} style={[styles.chip, !category && styles.chipActive]}>
                <Text style={[styles.chipText, !category && styles.chipTextActive]}>All</Text>
              </Pressable>
              {categories.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setCategory(c.name)}
                  style={[styles.chip, category === c.name && styles.chipActive]}
                >
                  <Text style={[styles.chipText, category === c.name && styles.chipTextActive]}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/post/${item.slug}`)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.category}>{item.category}</Text>
            {item.is_premium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="lock-closed" size={8} color={colors.accent} />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardBody} numberOfLines={2}>{item.excerpt}</Text>
        </Pressable>
      )}
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
        ) : isError ? (
          <Text style={styles.empty}>Couldn't load posts — pull down to try again.</Text>
        ) : (
          <Text style={styles.empty}>No posts match this category yet.</Text>
        )
      }
    />
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    h1: { color: colors.fg, fontSize: 28, fontWeight: '600', marginBottom: 16 },
    chipRow: { marginBottom: 20 },
    chip: { borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginRight: 8 },
    chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    chipText: { color: colors.muted, fontSize: 12.5, fontWeight: '600' },
    chipTextActive: { color: colors.bg },
    card: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 16, padding: 18, marginBottom: 12 },
    category: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
    premiumBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      borderWidth: 1,
      borderColor: colors.accentDim,
      borderRadius: 999,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginBottom: 8,
    },
    premiumBadgeText: { color: colors.accent, fontSize: 9, fontWeight: '700' },
    cardTitle: { color: colors.fg, fontSize: 16, fontWeight: '600', marginBottom: 6 },
    cardBody: { color: colors.muted, fontSize: 13.5, lineHeight: 19 },
    empty: { color: colors.faint, fontSize: 13, fontStyle: 'italic' },
  });
