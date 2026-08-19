import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, type ThemeColors } from '../../context/theme';
import { adminLogin } from '../../api/admin';
import { registerForAdminPushNotifications } from '../../lib/pushNotifications';

export default function AdminLoginScreen() {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Enter your admin email and password.');
      return;
    }
    setLoading(true);
    try {
      await adminLogin(email.trim(), password);
      registerForAdminPushNotifications().catch(() => {});
      router.replace('/admin');
    } catch {
      Alert.alert('Login failed', 'Check your email and password and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.h1}>
        Anvil <Text style={{ color: colors.accent }}>/ admin</Text>
      </Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@agency.com"
        placeholderTextColor={colors.faint}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordRow}>
        <TextInput
          style={styles.passwordInput}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.faint}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <Pressable
          onPress={() => setShowPassword((v) => !v)}
          style={styles.eyeButton}
          hitSlop={8}
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        >
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color={colors.muted} />
        </Pressable>
      </View>

      <Pressable style={styles.cta} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.ctaText}>Sign in</Text>}
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: spacing.lg },
    h1: { color: colors.fg, fontSize: 24, fontWeight: '600', marginBottom: 32, textAlign: 'center' },
    label: { color: colors.muted, fontSize: 12, letterSpacing: 0.5, marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
    input: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, borderRadius: 6, padding: 14, color: colors.fg, fontSize: 15 },
    passwordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg2,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 6,
    },
    passwordInput: { flex: 1, padding: 14, color: colors.fg, fontSize: 15 },
    eyeButton: { paddingHorizontal: 14, paddingVertical: 14 },
    cta: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 4, alignItems: 'center', marginTop: 28 },
    ctaText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
  });
