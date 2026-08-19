import { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Pressable, ActivityIndicator, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, type ThemeColors } from '../../context/theme';
import { getPost, PostDetail } from '../../api/services';

const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL || 'http://localhost:3000';

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function PostDetailScreen() {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getPost(slug)
      .then(setPost)
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

  if (!post) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.muted }}>{error ? "Couldn't load this post — check your connection." : 'Post not found.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.lg, paddingTop: 60 }}>
      <View style={styles.topRow}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={18} color={colors.muted} />
          <Text style={styles.backText}>Blog</Text>
        </Pressable>
        <Pressable onPress={() => Share.share({ message: `${post.title} — ${SITE_URL}/blog/${post.slug}` })} hitSlop={8}>
          <Ionicons name="share-outline" size={20} color={colors.muted} />
        </Pressable>
      </View>

      <Text style={styles.category}>{post.category}</Text>
      <Text style={styles.h1}>{post.title}</Text>

      <View style={styles.metaRow}>
        {post.author_photo ? (
          <Image source={{ uri: post.author_photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{post.author.charAt(0)}</Text>
          </View>
        )}
        <View>
          <Text style={styles.meta}>{post.author}</Text>
          <Text style={styles.metaSub}>{new Date(post.created_at).toLocaleDateString()}</Text>
        </View>
      </View>

      {post.cover_image && <Image source={{ uri: post.cover_image }} style={styles.cover} accessibilityLabel={post.cover_image_alt || post.title} />}

      <Text style={styles.body}>{stripHtml(post.content)}</Text>

      {post.related?.length > 0 && (
        <View style={styles.relatedSection}>
          <Text style={styles.relatedTitle}>Related reading</Text>
          {post.related.map((r) => (
            <Pressable key={r.id} onPress={() => router.push(`/post/${r.slug}`)} style={styles.relatedRow}>
              {r.cover_image && <Image source={{ uri: r.cover_image }} style={styles.relatedThumb} />}
              <Text style={styles.relatedRowTitle}>{r.title}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    back: { flexDirection: 'row', alignItems: 'center' },
    backText: { color: colors.muted, fontSize: 14, marginLeft: 4 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    category: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
    h1: { color: colors.fg, fontSize: 24, fontWeight: '600', marginBottom: 14 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10, backgroundColor: colors.bg2 },
    avatarFallback: { alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { color: colors.accent, fontWeight: '700', fontSize: 13 },
    meta: { color: colors.fg, fontSize: 13, fontWeight: '600' },
    metaSub: { color: colors.faint, fontSize: 11, marginTop: 2 },
    cover: { width: '100%', aspectRatio: 16 / 9, borderRadius: 8, marginBottom: 20, backgroundColor: colors.bg2 },
    body: { color: colors.fg, fontSize: 15, lineHeight: 23, opacity: 0.9 },
    relatedSection: { marginTop: 32, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.line },
    relatedTitle: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 },
    relatedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    relatedThumb: { width: 48, height: 48, borderRadius: 6, marginRight: 12, backgroundColor: colors.bg2 },
    relatedRowTitle: { color: colors.fg, fontSize: 14, fontWeight: '600', flex: 1 },
  });
