package com.tutorfinder.service;

import com.tutorfinder.dto.*;
import java.util.List;

public interface PaymentService {

    /**
     * Creates a Razorpay order and persists a CREATED payment record.
     * Call this from the "Pay Now" button in the frontend.
     */
    CreateOrderResponse createOrder(Long studentId, CreateOrderRequest request);

    /**
     * Verifies the HMAC-SHA256 signature returned by Razorpay Checkout,
     * captures the payment on Razorpay, and marks the payment CAPTURED.
     * Returns the updated PaymentDto on success.
     */
    PaymentDto verifyAndCapture(Long studentId, VerifyPaymentRequest request);

    /**
     * Webhook endpoint handler — processes Razorpay event payloads.
     * Validates the X-Razorpay-Signature header before processing.
     */
    void handleWebhook(String payload, String razorpaySignatureHeader);

    /** Issue a full refund for a captured payment. */
    PaymentDto refund(Long paymentId, Long requestedByUserId);

    List<PaymentDto> getMyPayments(Long userId, String role);

    PaymentDto getPaymentById(Long paymentId);
}
