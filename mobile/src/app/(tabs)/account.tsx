import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, spacing, type ThemeColors } from '../../context/theme';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { getMySubscriptions, type Subscription } from '../../api/subscriptions';
import { resendVerification } from '../../api/customerAuth';

type Mode = 'login' | 'register';

export default function AccountScreen() {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { customer, loading, login, register, logout } = useCustomerAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  const [subscriptions, setSubscriptions] = useState<Subscription[] | null>(null);

  useEffect(() => {
    if (!customer) return;
    getMySubscriptions()
      .then(setSubscriptions)
      .catch(() => {});
  }, [customer]);

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (customer) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.lg, paddingTop: 64 }}>
        <Text style={styles.h1}>Hi, {customer.name.split(' ')[0]}</Text>
        <Text style={styles.sub}>{customer.email}</Text>
        {customer.is_premium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>Premium member</Text>
          </View>
        )}

        <Pressable style={styles.cta} onPress={() => router.push('/premium')}>
          <Text style={styles.ctaText}>View plans</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Your subscriptions</Text>
        {!subscriptions?.length ? (
          <Text style={styles.muted}>No subscriptions yet.</Text>
        ) : (
          subscriptions.map((s) => (
            <View key={s.id} style={styles.subRow}>
              <View>
                <Text style={styles.subName}>{s.plan_name}</Text>
                <Text style={styles.subDates}>
                  {new Date(s.started_at).toLocaleDateString()} → {new Date(s.expires_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.subStatus, s.is_currently_active && { color: colors.accent }]}>
                {s.is_currently_active ? 'Active' : s.status === 'refunded' ? 'Refunded' : 'Expired'}
              </Text>
            </View>
          ))
        )}

        <Pressable style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const onSubmit = async () => {
    setError('');
    setNeedsVerification(false);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setSubmitting(true);
    if (mode === 'register') {
      const result = await register(name, email, password);
      setSubmitting(false);
      if (result.success) {
        setJustRegistered(true);
      } else {
        setError(result.message);
      }
      return;
    }
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.message);
      if (result.message.toLowerCase().includes('verify')) setNeedsVerification(true);
    }
  };

  const onResend = async () => {
    await resendVerification(email);
    Alert.alert('Sent', 'If your account needs verification, a new link has been sent to your email.');
  };

  if (justRegistered) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', padding: spacing.lg }]}>
        <Text style={styles.h1}>Check your inbox</Text>
        <Text style={styles.sub}>We&apos;ve sent a verification link to {email}. Open it, then come back and sign in.</Text>
        <Pressable
          style={styles.cta}
          onPress={() => {
            setJustRegistered(false);
            setMode('login');
            setPassword('');
          }}
        >
          <Text style={styles.ctaText}>Back to sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.lg, paddingTop: 64 }}>
      <Text style={styles.h1}>{mode === 'login' ? 'Welcome back' : 'Create an account'}</Text>
      <Text style={styles.sub}>{mode === 'login' ? 'Sign in to manage your subscription.' : 'Free — takes less than a minute.'}</Text>

      <View style={styles.toggleRow}>
        <Pressable style={[styles.toggleBtn, mode === 'login' && styles.toggleBtnActive]} onPress={() => setMode('login')}>
          <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>Sign in</Text>
        </Pressable>
        <Pressable style={[styles.toggleBtn, mode === 'register' && styles.toggleBtnActive]} onPress={() => setMode('register')}>
          <Text style={[styles.toggleText, mode === 'register' && styles.toggleTextActive]}>Register</Text>
        </Pressable>
      </View>

      {mode === 'register' && (
        <>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.faint} />
        </>
      )}

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor={colors.faint}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder={mode === 'register' ? 'Min 8 characters' : 'Password'}
        placeholderTextColor={colors.faint}
        secureTextEntry
      />

      {error ? (
        <Text style={styles.error}>
          {error}
          {needsVerification && (
            <Text style={styles.resendLink} onPress={onResend}>
              {'  '}Resend verification email
            </Text>
          )}
        </Text>
      ) : null}

      <Pressable style={styles.cta} onPress={onSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.ctaText}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>}
      </Pressable>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    h1: { color: colors.fg, fontSize: 28, fontWeight: '600', marginBottom: 8 },
    sub: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 20 },
    muted: { color: colors.faint, fontSize: 13.5 },
    premiumBadge: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: colors.accentDim,
      backgroundColor: colors.bg2,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 5,
      marginBottom: 20,
    },
    premiumBadgeText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
    toggleRow: { flexDirection: 'row', backgroundColor: colors.bg2, borderRadius: 999, padding: 4, marginBottom: 20 },
    toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
    toggleBtnActive: { backgroundColor: colors.accent },
    toggleText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
    toggleTextActive: { color: colors.bg },
    label: { color: colors.muted, fontSize: 12, letterSpacing: 0.5, marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
    input: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, borderRadius: 6, padding: 14, color: colors.fg, fontSize: 15 },
    error: { color: '#e08a6b', fontSize: 13, marginTop: 14 },
    resendLink: { color: colors.accent, textDecorationLine: 'underline' },
    cta: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 4, alignItems: 'center', marginTop: 24 },
    ctaText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
    sectionTitle: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 32, marginBottom: 14 },
    subRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 8,
      padding: 14,
      marginBottom: 10,
    },
    subName: { color: colors.fg, fontSize: 14, fontWeight: '600' },
    subDates: { color: colors.faint, fontSize: 11, marginTop: 3 },
    subStatus: { color: colors.faint, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    logout: { alignItems: 'center', marginTop: 32 },
    logoutText: { color: colors.faint, fontSize: 13 },
  });
