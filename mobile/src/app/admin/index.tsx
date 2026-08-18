import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme, spacing, type ThemeColors } from '../../context/theme';
import { getAdminStats, getStoredAdmin, adminLogout, AdminUser } from '../../api/admin';

type Lead = { id: number; name: string; email: string; status: string; created_at: string };

export default function AdminQuickViewScreen() {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [leadsToday, setLeadsToday] = useState(0);
  const [pendingCallbacks, setPendingCallbacks] = useState(0);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const stored = await getStoredAdmin();
    if (!stored) {
      router.replace('/admin/login');
      return;
    }
    setAdmin(stored);
    try {
      const stats = await getAdminStats();
      setLeadsToday(stats.leadsToday);
      setPendingCallbacks(stats.pendingCallbacks);
      setRecentLeads(stats.recentLeads);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: 60 }}
      data={recentLeads}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <Text style={styles.h1}>
              Anvil <Text style={{ color: colors.accent }}>/ admin</Text>
            </Text>
            <Pressable
              onPress={async () => {
                await adminLogout();
                router.replace('/admin/login');
              }}
            >
              <Text style={styles.logout}>Log out</Text>
            </Pressable>
          </View>
          <Text style={styles.signedIn}>Signed in as {admin?.name || admin?.email}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{leadsToday}</Text>
              <Text style={styles.statLabel}>Today&apos;s leads</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{pendingCallbacks}</Text>
              <Text style={styles.statLabel}>Pending callbacks</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Recent leads</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.leadRow}>
          <Text style={styles.leadName}>{item.name}</Text>
          <Text style={styles.leadEmail}>{item.email}</Text>
          <Text style={styles.leadStatus}>{item.status}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No leads yet.</Text>}
    />
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    h1: { color: colors.fg, fontSize: 22, fontWeight: '600' },
    logout: { color: colors.muted, fontSize: 13 },
    signedIn: { color: colors.faint, fontSize: 12, marginBottom: 24 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
    statCard: { flex: 1, backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 16 },
    statValue: { color: colors.accent, fontSize: 26, fontWeight: '700' },
    statLabel: { color: colors.muted, fontSize: 11, marginTop: 4 },
    sectionTitle: { color: colors.fg, fontSize: 16, fontWeight: '600', marginBottom: 12 },
    leadRow: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 12 },
    leadName: { color: colors.fg, fontSize: 14.5, fontWeight: '600' },
    leadEmail: { color: colors.muted, fontSize: 12.5, marginTop: 2 },
    leadStatus: { color: colors.accent, fontSize: 11, marginTop: 4, textTransform: 'uppercase' },
    empty: { color: colors.faint, fontSize: 13, fontStyle: 'italic' },
  });
