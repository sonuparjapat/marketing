import { useEffect, useMemo, useState } from 'react';
import { Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useTheme, spacing, type ThemeColors } from '../../context/theme';
import { submitLead, getServices, getPublicSettings } from '../../api/services';
import { SimpleSelect } from '../../components/SimpleSelect';

export default function ContactScreen() {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [service, setService] = useState('');
  const [budget, setBudget] = useState('');
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [budgetOptions, setBudgetOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getServices()
      .then((list) => setServiceOptions(list.map((s) => s.title)))
      .catch(() => {});
    getPublicSettings()
      .then((settings) => {
        if (settings.budget_ranges) {
          try {
            setBudgetOptions(JSON.parse(settings.budget_ranges));
          } catch {
            // ignore malformed setting
          }
        }
      })
      .catch(() => {});
  }, []);

  const onSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Missing details', 'Please enter your name and email.');
      return;
    }
    setSubmitting(true);
    try {
      await submitLead({ name, email, phone, message, service_interested: service, budget_range: budget });
      Alert.alert('Thanks!', "We've received your message and will get back to you within 24 hours.");
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setService('');
      setBudget('');
    } catch {
      Alert.alert('Something went wrong', 'Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.lg, paddingTop: 64 }}>
      <Text style={styles.h1}>Let's talk growth</Text>
      <Text style={styles.sub}>30 minutes, no deck — just a straight look at what's leaking in your funnel.</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.faint} />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@company.com"
        placeholderTextColor={colors.faint}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Phone (optional)</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+91" placeholderTextColor={colors.faint} keyboardType="phone-pad" />

      {serviceOptions.length > 0 && (
        <SimpleSelect label="Service interested in" value={service} options={serviceOptions} onChange={setService} />
      )}

      {budgetOptions.length > 0 && (
        <SimpleSelect label="Monthly budget" value={budget} options={budgetOptions} onChange={setBudget} />
      )}

      <Text style={styles.label}>Message</Text>
      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
        value={message}
        onChangeText={setMessage}
        placeholder="Tell us about your brand and goals"
        placeholderTextColor={colors.faint}
        multiline
      />

      <Pressable style={styles.cta} onPress={onSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.ctaText}>Send Message</Text>}
      </Pressable>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    h1: { color: colors.fg, fontSize: 28, fontWeight: '600', marginBottom: 8 },
    sub: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 28 },
    label: { color: colors.muted, fontSize: 12, letterSpacing: 0.5, marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
    input: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, borderRadius: 6, padding: 14, color: colors.fg, fontSize: 15 },
    cta: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 4, alignItems: 'center', marginTop: 32 },
    ctaText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
  });
