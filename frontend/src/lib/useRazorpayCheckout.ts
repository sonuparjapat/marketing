'use client';

import { useCallback, useState } from 'react';
import customerApiClient from './customerApiClient';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type CheckoutState = 'idle' | 'opening' | 'verifying';

// Wraps the order-create → open Checkout.js → verify flow ayurvedaeccom uses on web, adapted for
// subscription plans. `processing` guards against a double-submit (double-click "Subscribe" before
// the first order finishes creating); `modal.ondismiss` resets to idle rather than leaving the UI
// stuck if the customer just closes the Razorpay popup; a failed /verify call surfaces an error but
// leaves the plan purchasable again immediately — each attempt creates a fresh order, so nothing
// needs to be "retried" against a specific stuck order.
export function useRazorpayCheckout({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [state, setState] = useState<CheckoutState>('idle');
  const [error, setError] = useState('');

  const subscribe = useCallback(
    async (planId: number, customerName: string, customerEmail: string) => {
      if (state !== 'idle') return; // guards against double-submit
      setError('');
      setState('opening');

      if (!window.Razorpay) {
        setState('idle');
        setError('Payments are still loading — try again in a moment.');
        return;
      }

      try {
        const orderRes = await customerApiClient.post('/subscriptions/checkout', { plan_id: planId });
        const { order_id, amount, currency, key_id, plan_name } = orderRes.data.data;

        const razorpay = new window.Razorpay({
          key: key_id,
          amount,
          currency,
          order_id,
          name: 'Anvil Digital',
          description: plan_name,
          prefill: { name: customerName, email: customerEmail },
          theme: { color: '#d4af6a' },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            setState('verifying');
            try {
              await customerApiClient.post('/subscriptions/verify', response);
              setState('idle');
              onSuccess?.();
            } catch {
              setState('idle');
              setError('Payment verification failed. If money was deducted, it will be reconciled automatically — contact support if access does not appear shortly.');
            }
          },
          modal: {
            ondismiss: () => setState('idle'),
          },
        });
        // Deliberately stays in 'opening' (processing) until the Razorpay modal resolves via
        // either the handler (payment attempted) or ondismiss (closed) — otherwise a double-click
        // while the modal is up could kick off a second order/second overlay.
        razorpay.open();
      } catch (err: unknown) {
        setState('idle');
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
        setError(message || 'Could not start checkout. Please try again.');
      }
    },
    [state, onSuccess]
  );

  return { subscribe, state, error, processing: state !== 'idle' };
}
