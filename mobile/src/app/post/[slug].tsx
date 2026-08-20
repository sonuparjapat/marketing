import { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Pressable, ActivityIndicator, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, type ThemeColors } from '../../context/theme';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { getPost, getPostFullContent, PostDetail } from '../../api/services';
import { HtmlContent } from '../../components/HtmlContent';

function PremiumGate({ slug, excerpt, serviceLabel }: { slug: string; excerpt: string; serviceLabel: string | null }) {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { customer, loading } = useCustomerAuth();
  const [content, setContent] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!customer) {
      setChecked(true);
      return;
    }
    getPostFullContent(slug)
      .then(setContent)
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [loading, customer, slug]);

  if (!checked) {
    return <ActivityIndicator color={colors.accent} style={{ marginVertical: 40 }} />;
  }

  if (content) {
    return <HtmlContent html={content} />;
  }

  return (
    <View style={styles.paywall}>
      <View style={styles.paywallIcon}>
        <Ionicons name="lock-closed" size={22} color={colors.accent} />
      </View>
      <Text style={styles.paywallTitle}>This is a premium post</Text>
      <Text style={styles.paywallText}>
        {excerpt}
        {serviceLabel ? ` Unlock it with a plan that includes ${serviceLabel}.` : ''}
      </Text>
      <Pressable style={styles.paywallCta} onPress={() => router.push('/premium')}>
        <Text style={styles.paywallCtaText}>View plans</Text>
      </Pressable>
    </View>
  );
}

const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL || 'http://localhost:3000';

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

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={styles.category}>{post.category}</Text>
        {post.is_premium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="lock-closed" size={9} color={colors.accent} />
            <Text style={styles.premiumBadgeText}>Premium</Text>
          </View>
        )}
      </View>
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

      {post.locked ? (
        <PremiumGate slug={post.slug} excerpt={post.excerpt} serviceLabel={post.required_service_label} />
      ) : (
        <HtmlContent html={post.content || ''} />
      )}

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
    premiumBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: colors.accentDim,
      backgroundColor: colors.bg2,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginBottom: 10,
    },
    premiumBadgeText: { color: colors.accent, fontSize: 9.5, fontWeight: '700' },
    paywall: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 24, alignItems: 'center', backgroundColor: colors.bg2 },
    paywallIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.accentDim,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    paywallTitle: { color: colors.fg, fontSize: 17, fontWeight: '700', marginBottom: 8 },
    paywallText: { color: colors.muted, fontSize: 13.5, textAlign: 'center', lineHeight: 19, marginBottom: 18 },
    paywallCta: { backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 6 },
    paywallCtaText: { color: colors.bg, fontWeight: '700', fontSize: 14 },
    h1: { color: colors.fg, fontSize: 24, fontWeight: '600', marginBottom: 14 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10, backgroundColor: colors.bg2 },
    avatarFallback: { alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { color: colors.accent, fontWeight: '700', fontSize: 13 },
    meta: { color: colors.fg, fontSize: 13, fontWeight: '600' },
    metaSub: { color: colors.faint, fontSize: 11, marginTop: 2 },
    cover: { width: '100%', aspectRatio: 16 / 9, borderRadius: 8, marginBottom: 20, backgroundColor: colors.bg2 },
    relatedSection: { marginTop: 32, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.line },
    relatedTitle: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 },
    relatedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    relatedThumb: { width: 48, height: 48, borderRadius: 6, marginRight: 12, backgroundColor: colors.bg2 },
    relatedRowTitle: { color: colors.fg, fontSize: 14, fontWeight: '600', flex: 1 },
  });
