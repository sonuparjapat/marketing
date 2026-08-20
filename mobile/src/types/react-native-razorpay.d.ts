// react-native-razorpay ships no TypeScript types (plain JS module) — this is a minimal
// hand-written declaration covering the subset this app actually uses (RazorpayCheckout.open()).
declare module 'react-native-razorpay' {
  export type RazorpayOptions = {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    name?: string;
    description?: string;
    image?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    theme?: { color?: string };
  };

  export type RazorpaySuccessResponse = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  };

  export type RazorpayErrorResponse = {
    code: number;
    description: string;
  };

  const RazorpayCheckout: {
    open: (options: RazorpayOptions) => Promise<RazorpaySuccessResponse>;
  };

  export default RazorpayCheckout;
}
