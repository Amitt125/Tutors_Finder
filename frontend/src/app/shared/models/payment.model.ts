export interface CreateOrderRequest {
  tutorId: number;
  amount: number;
  description?: string;
}

export interface CreateOrderResponse {
  paymentId: number;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  razorpayKeyId: string;
  studentName: string;
  studentEmail: string;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface Payment {
  id: number;
  studentId: number;
  studentName: string;
  tutorId: number;
  tutorName: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  description?: string;
  status: 'CREATED' | 'ATTEMPTED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  refundId?: string;
  createdAt: string;
}

/** Shape of Razorpay Checkout success handler response */
export interface RazorpayCheckoutResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** Shape of the global Razorpay constructor injected via CDN script */
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayCheckoutResponse) => void;
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open(): void };
  }
}
