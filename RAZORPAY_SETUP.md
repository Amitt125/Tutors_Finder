# 💳 Razorpay Integration Guide

## 1. Create a Razorpay Account
1. Sign up at https://razorpay.com
2. Go to **Settings → API Keys → Generate Key**
3. Copy the **Key ID** (starts with `rzp_test_...`) and **Key Secret**

## 2. Configure Backend

Edit `backend/src/main/resources/application.properties`:

```properties
razorpay.key.id=rzp_test_XXXXXXXXXXXXXXXX
razorpay.key.secret=YOUR_KEY_SECRET_HERE
razorpay.webhook.secret=YOUR_WEBHOOK_SECRET_HERE
razorpay.currency=INR
```

## 3. Configure Webhook (for production)

In the Razorpay Dashboard → **Webhooks → Add New Webhook**:

- **URL:** `https://your-domain.com/api/payments/webhook`
- **Events to subscribe:**
  - `payment.captured`
  - `payment.failed`
  - `refund.created`
- Copy the **Webhook Secret** into `razorpay.webhook.secret`

> For local development, use [ngrok](https://ngrok.com):
> ```bash
> ngrok http 8080
> # Set webhook URL to: https://xxxx.ngrok.io/api/payments/webhook
> ```

## 4. Payment Flow Diagram

```
Student clicks "Pay ₹X"
        │
        ▼
  POST /api/payments/create-order
        │  Backend creates Razorpay order via SDK
        │  Saves Payment record (status=CREATED)
        ▼
  CreateOrderResponse → frontend
        │
        ▼
  Razorpay Checkout Modal opens
        │  Student enters card/UPI details
        │
    ┌───┴──────────────────┐
    │ SUCCESS              │ DISMISS/FAIL
    ▼                      ▼
  Razorpay returns:      Payment stays CREATED / FAILED
  { order_id, payment_id, signature }
        │
        ▼
  POST /api/payments/verify
        │  Backend verifies HMAC-SHA256 signature
        │  Marks Payment status=CAPTURED
        ▼
  PaymentDto → frontend shows success banner
        │
        ▼  (async, via webhook)
  POST /api/payments/webhook
        │  Razorpay sends payment.captured event
        │  Backend idempotently updates status
        ▼
  ✅ Payment complete
```

## 5. Test Cards (Test Mode)

| Card Number         | Behaviour              |
|---------------------|------------------------|
| 4111 1111 1111 1111 | Success                |
| 5267 3181 8797 5449 | Success (Mastercard)   |
| 4000 0000 0000 0002 | Card declined          |

- CVV: any 3 digits
- Expiry: any future date
- OTP: `1234` (for 3DS test cards)

## 6. Going Live

1. Switch keys from `rzp_test_` → `rzp_live_`
2. Complete Razorpay KYC
3. Update `razorpay.key.id` and `razorpay.key.secret`
4. Update `index.html` — the same Razorpay CDN script works for live
5. Ensure HTTPS on your backend (required for webhooks in production)
