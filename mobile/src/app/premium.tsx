import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RazorpayCheckout from 'react-native-razorpay';
import { useTheme, spacing, type ThemeColors } from '../context/theme';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { getSubscriptionPlans, createCheckoutOrder, verifyPayment, type SubscriptionPlan } from '../api/subscriptions';

function durationLabel(days: number) {
  if (days % 365 === 0) return `${days / 365} year${days / 365 > 1 ? 's' : ''}`;
  if (days % 30 === 0) return `${days / 30} month${days / 30 > 1 ? 's' : ''}`;
  return `${days} days`;
}

export default function PremiumScreen() {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { customer } = useCustomerAuth();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    getSubscriptionPlans()
      .then(setPlans)
      .finally(() => setLoading(false));
  }, []);

  const subscribe = async (plan: SubscriptionPlan) => {
    if (!customer) {
      router.push('/account');
      return;
    }
    if (processingId) return; // guards against double-submit while a checkout is already open
    setProcessingId(plan.id);
    try {
      const order = await createCheckoutOrder(plan.id);
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: 'Anvil Digital',
        description: order.plan_name,
        prefill: { name: customer.name, email: customer.email },
        theme: { color: '#d4af6a' },
      };
      const response = await RazorpayCheckout.open(options);
      await verifyPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });
      Alert.alert("You're subscribed!", `Your ${plan.name} plan is now active.`);
      router.back();
    } catch (err: unknown) {
      // RazorpayCheckout rejects with { code, description } when the customer cancels/closes the
      // sheet — that's not a failure worth alarming over.
      const description = err && typeof err === 'object' && 'description' in err ? String((err as { description?: string }).description) : '';
      if (description && !description.toLowerCase().includes('cancel')) {
        Alert.alert('Payment failed', description || 'Something went wrong. Please try again.');
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.lg, paddingTop: 60 }}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={18} color={colors.muted} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.h1}>Go premium</Text>
      <Text style={styles.sub}>Every plan bundles a fixed set of services, decided upfront.</Text>

      {plans.map((plan) => (
        <View key={plan.id} style={styles.card}>
          <Text style={styles.planName}>{plan.name}</Text>
          {plan.description ? <Text style={styles.planDesc}>{plan.description}</Text> : null}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{(plan.price_paise / 100).toLocaleString('en-IN')}</Text>
            <Text style={styles.priceSub}>/ {durationLabel(plan.duration_days)}</Text>
          </View>
          {plan.services.map((s) => (
            <View key={s.id} style={styles.featureRow}>
              <Ionicons name="checkmark" size={15} color={colors.accent} />
              <Text style={styles.featureText}>{s.label}</Text>
            </View>
          ))}
          <Pressable style={styles.cta} onPress={() => subscribe(plan)} disabled={processingId === plan.id}>
            {processingId === plan.id ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.ctaText}>{customer ? 'Subscribe' : 'Sign in to subscribe'}</Text>
            )}
          </Pressable>
        </View>
      ))}

      {!plans.length && <Text style={styles.sub}>No plans are available right now.</Text>}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    back: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backText: { color: colors.muted, fontSize: 14, marginLeft: 4 },
    h1: { color: colors.fg, fontSize: 28, fontWeight: '600', marginBottom: 8 },
    sub: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 24 },
    card: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 20, marginBottom: 16, backgroundColor: colors.bg2 },
    planName: { color: colors.fg, fontSize: 18, fontWeight: '700' },
    planDesc: { color: colors.muted, fontSize: 13, marginTop: 4, lineHeight: 18 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 14, marginBottom: 16 },
    price: { color: colors.fg, fontSize: 26, fontWeight: '700' },
    priceSub: { color: colors.faint, fontSize: 13, marginLeft: 6 },
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    featureText: { color: colors.muted, fontSize: 13.5, marginLeft: 8 },
    cta: { backgroundColor: colors.accent, paddingVertical: 14, borderRadius: 6, alignItems: 'center', marginTop: 12 },
    ctaText: { color: colors.bg, fontWeight: '700', fontSize: 14.5 },
  });
