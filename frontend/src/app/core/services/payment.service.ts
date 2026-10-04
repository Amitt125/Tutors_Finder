import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  CreateOrderRequest,
  CreateOrderResponse,
  Payment,
  RazorpayOptions,
  VerifyPaymentRequest
} from '../../shared/models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {

  constructor(private api: ApiService) {}

  // ── Backend API calls ──────────────────────────────────────────────────────

  /** Step 1 — ask backend to create a Razorpay order */
  createOrder(req: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.api.post<CreateOrderResponse>('/payments/create-order', req);
  }

  /** Step 3 — send signature to backend for verification */
  verifyPayment(req: VerifyPaymentRequest): Observable<Payment> {
    return this.api.post<Payment>('/payments/verify', req);
  }

  getMyPayments(): Observable<Payment[]> {
    return this.api.get<Payment[]>('/payments');
  }

  refund(paymentId: number): Observable<Payment> {
    return this.api.post<Payment>(`/payments/${paymentId}/refund`, {});
  }

  // ── Razorpay Checkout SDK ──────────────────────────────────────────────────

  /**
   * Step 2 — opens the Razorpay Checkout modal.
   * The SDK script must be loaded in index.html.
   *
   * @param order  Response from createOrder()
   * @param onSuccess  Called with the raw Razorpay response (orderId, paymentId, signature)
   * @param onDismiss  Called if the user closes the modal without paying
   */
  openCheckout(
    order: CreateOrderResponse,
    tutorName: string,
    onSuccess: (res: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => void,
    onDismiss: () => void
  ): void {
    const options: RazorpayOptions = {
      key: order.razorpayKeyId,
      amount: order.amountPaise,
      currency: order.currency,
      name: 'TutorFinder',
      description: `Session with ${tutorName}`,
      order_id: order.razorpayOrderId,
      prefill: {
        name: order.studentName,
        email: order.studentEmail,
      },
      theme: { color: '#4f46e5' },
      handler: (response) => {
        onSuccess({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: { ondismiss: onDismiss },
    };

    if (typeof window.Razorpay === 'undefined') {
      console.error('Razorpay SDK not loaded. Check index.html <script> tag.');
      return;
    }
    const rzp = new window.Razorpay(options);
    rzp.open();
  }
}
