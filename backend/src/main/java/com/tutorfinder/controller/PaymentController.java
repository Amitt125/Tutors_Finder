package com.tutorfinder.controller;

import com.tutorfinder.dto.*;
import com.tutorfinder.entity.User;
import com.tutorfinder.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * POST /api/payments/create-order
     * Called when a student clicks "Pay Now".
     * Returns Razorpay order details that the frontend passes to Razorpay Checkout.
     */
    @PostMapping("/create-order")
    public ResponseEntity<ApiResponse<CreateOrderResponse>> createOrder(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateOrderRequest request) {

        CreateOrderResponse response = paymentService.createOrder(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Order created", response));
    }

    /**
     * POST /api/payments/verify
     * Called after Razorpay Checkout succeeds — verifies HMAC signature and
     * marks payment as CAPTURED.
     */
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<PaymentDto>> verifyPayment(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody VerifyPaymentRequest request) {

        PaymentDto payment = paymentService.verifyAndCapture(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", payment));
    }

    /**
     * POST /api/payments/webhook
     * Razorpay webhook endpoint — must be public (no auth header).
     * Razorpay calls this for: payment.captured, payment.failed, refund.created, etc.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {

        if (signature == null) {
            log.warn("Webhook received without signature header");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        paymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/payments/{id}/refund
     * Initiates a full refund for a captured payment.
     */
    @PostMapping("/{id}/refund")
    public ResponseEntity<ApiResponse<PaymentDto>> refund(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        PaymentDto payment = paymentService.refund(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Refund initiated", payment));
    }

    /**
     * GET /api/payments
     * Returns all payments for the authenticated user (student or tutor).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentDto>>> getMyPayments(
            @AuthenticationPrincipal User user) {

        List<PaymentDto> payments = paymentService.getMyPayments(user.getId(), user.getRole().name());
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    /**
     * GET /api/payments/{id}
     * Returns a single payment record.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentDto>> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(ApiResponse.success(paymentService.getPaymentById(id)));
    }
}
