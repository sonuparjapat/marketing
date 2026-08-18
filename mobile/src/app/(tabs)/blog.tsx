import { Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../../constants/theme';
import { getPosts } from '../../api/services';

export default function BlogScreen() {
  const router = useRouter();
  const { data, isLoading } = useQuery({ queryKey: ['posts'], queryFn: getPosts });

  return (
    <FlatList
      style={styles.screen}
      data={data?.items || []}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: 64 }}
      ListHeaderComponent={<Text style={styles.h1}>Blog</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/post/${item.slug}`)}>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardBody} numberOfLines={2}>{item.excerpt}</Text>
        </Pressable>
      )}
      ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No posts published yet.</Text> : null}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  h1: { color: colors.fg, fontSize: 28, fontWeight: '600', marginBottom: 24 },
  card: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 18, marginBottom: 12 },
  category: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  cardTitle: { color: colors.fg, fontSize: 16, fontWeight: '600', marginBottom: 6 },
  cardBody: { color: colors.muted, fontSize: 13.5, lineHeight: 19 },
  empty: { color: colors.faint, fontSize: 13, fontStyle: 'italic' },
});
