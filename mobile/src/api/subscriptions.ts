import api from './client';
import customerApi from './customerClient';

export type SubscriptionPlan = {
  id: number;
  name: string;
  description: string | null;
  duration_days: number;
  price_paise: number;
  services: { id: number; key: string; label: string }[];
};

export type Subscription = {
  id: number;
  plan_id: number;
  plan_name: string;
  started_at: string;
  expires_at: string;
  status: 'active' | 'cancelled' | 'refunded';
  is_currently_active: boolean;
};

// Public — no customer auth needed, uses the plain (unauthenticated) client.
export const getSubscriptionPlans = () =>
  api.get<{ success: true; data: SubscriptionPlan[] }>('/subscription-plans').then((r) => r.data.data);

export const getMySubscriptions = () =>
  customerApi.get<{ success: true; data: Subscription[] }>('/subscriptions/me').then((r) => r.data.data);

export const createCheckoutOrder = (planId: number) =>
  customerApi
    .post<{
      success: true;
      data: { order_id: string; amount: number; currency: string; key_id: string; plan_name: string };
    }>('/subscriptions/checkout', { plan_id: planId })
    .then((r) => r.data.data);

export const verifyPayment = (payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
  customerApi.post('/subscriptions/verify', payload).then((r) => r.data.data);
