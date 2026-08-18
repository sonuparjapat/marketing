import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../constants/theme';
import { getPost, PostDetail } from '../../api/services';

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '');
}

export default function PostDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    getPost(slug)
      .then(setPost)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.muted }}>Post not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.lg, paddingTop: 60 }}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={18} color={colors.muted} />
        <Text style={styles.backText}>Blog</Text>
      </Pressable>

      <Text style={styles.category}>{post.category}</Text>
      <Text style={styles.h1}>{post.title}</Text>
      <Text style={styles.meta}>
        {post.author} · {new Date(post.created_at).toLocaleDateString()}
      </Text>
      <Text style={styles.body}>{stripHtml(post.content)}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backText: { color: colors.muted, fontSize: 14, marginLeft: 4 },
  category: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  h1: { color: colors.fg, fontSize: 24, fontWeight: '600', marginBottom: 10 },
  meta: { color: colors.faint, fontSize: 12, marginBottom: 24 },
  body: { color: colors.fg, fontSize: 15, lineHeight: 23, opacity: 0.9 },
});
