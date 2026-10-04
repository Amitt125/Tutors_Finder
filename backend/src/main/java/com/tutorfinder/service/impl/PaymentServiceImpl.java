package com.tutorfinder.service.impl;

// Explicit Razorpay imports — avoid wildcard to prevent clash with com.tutorfinder.entity.Payment
import com.razorpay.Order;
import com.razorpay.Refund;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.tutorfinder.dto.*;
import com.tutorfinder.entity.*;
import com.tutorfinder.repository.*;
import com.tutorfinder.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepo;
    private final UserRepository userRepo;
    private final RazorpayClient razorpayClient;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    @Value("${razorpay.webhook.secret}")
    private String webhookSecret;

    @Value("${razorpay.currency:INR}")
    private String currency;

    // ── Create Order ───────────────────────────────────────────────────────────

    @Override
    @Transactional
    public CreateOrderResponse createOrder(Long studentId, CreateOrderRequest req) {
        User student = userRepo.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found"));
        User tutor = userRepo.findById(req.getTutorId())
            .orElseThrow(() -> new RuntimeException("Tutor not found"));

        // Razorpay expects amount in smallest currency unit (paise for INR)
        long amountPaise = req.getAmount().multiply(BigDecimal.valueOf(100)).longValue();

        try {
            JSONObject orderOptions = new JSONObject();
            orderOptions.put("amount", amountPaise);
            orderOptions.put("currency", currency);
            orderOptions.put("receipt", "tf_" + System.currentTimeMillis());
            orderOptions.put("payment_capture", 1); // auto-capture

            JSONObject notes = new JSONObject();
            notes.put("student_id", studentId);
            notes.put("tutor_id", req.getTutorId());
            notes.put("description", req.getDescription() != null ? req.getDescription() : "TutorFinder session");
            orderOptions.put("notes", notes);

            Order order = razorpayClient.orders.create(orderOptions);
            String razorpayOrderId = order.get("id");

            // Persist payment record
            Payment payment = Payment.builder()
                .student(student)
                .tutor(tutor)
                .razorpayOrderId(razorpayOrderId)
                .amount(req.getAmount())
                .currency(currency)
                .description(req.getDescription())
                .status(Payment.PaymentStatus.CREATED)
                .build();
            payment = paymentRepo.save(payment);

            return CreateOrderResponse.builder()
                .paymentId(payment.getId())
                .razorpayOrderId(razorpayOrderId)
                .amountPaise(amountPaise)
                .currency(currency)
                .razorpayKeyId(razorpayKeyId)
                .studentName(student.getFullName())
                .studentEmail(student.getEmail())
                .build();

        } catch (RazorpayException e) {
            log.error("Razorpay createOrder failed: {}", e.getMessage());
            throw new RuntimeException("Could not create Razorpay order: " + e.getMessage());
        }
    }

    // ── Verify & Capture ──────────────────────────────────────────────────────

    @Override
    @Transactional
    public PaymentDto verifyAndCapture(Long studentId, VerifyPaymentRequest req) {
        Payment payment = paymentRepo.findByRazorpayOrderId(req.getRazorpayOrderId())
            .orElseThrow(() -> new RuntimeException("Payment record not found for order: " + req.getRazorpayOrderId()));

        if (!payment.getStudent().getId().equals(studentId))
            throw new RuntimeException("Unauthorized: this order does not belong to you");

        // ── HMAC-SHA256 signature verification ─────────────────────────────────
        // Razorpay signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
        String generatedSignature = hmacSha256(
            req.getRazorpayOrderId() + "|" + req.getRazorpayPaymentId(),
            razorpayKeySecret
        );

        if (!generatedSignature.equals(req.getRazorpaySignature())) {
            payment.setStatus(Payment.PaymentStatus.FAILED);
            paymentRepo.save(payment);
            throw new RuntimeException("Payment signature verification failed");
        }

        // Signature valid — mark as CAPTURED
        payment.setRazorpayPaymentId(req.getRazorpayPaymentId());
        payment.setRazorpaySignature(req.getRazorpaySignature());
        payment.setStatus(Payment.PaymentStatus.CAPTURED);
        payment = paymentRepo.save(payment);

        log.info("Payment captured: orderId={}, paymentId={}", req.getRazorpayOrderId(), req.getRazorpayPaymentId());
        return mapToDto(payment);
    }

    // ── Webhook ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void handleWebhook(String payload, String signatureHeader) {
        // Validate webhook signature
        String expectedSig = hmacSha256(payload, webhookSecret);
        if (!expectedSig.equals(signatureHeader)) {
            log.warn("Invalid webhook signature — ignoring");
            return;
        }

        try {
            JSONObject event = new JSONObject(payload);
            String eventType = event.getString("event");
            log.info("Razorpay webhook event: {}", eventType);

            if ("payment.captured".equals(eventType)) {
                JSONObject paymentObj = event.getJSONObject("payload")
                    .getJSONObject("payment").getJSONObject("entity");
                String orderId    = paymentObj.getString("order_id");
                String paymentId  = paymentObj.getString("id");

                paymentRepo.findByRazorpayOrderId(orderId).ifPresent(p -> {
                    if (p.getStatus() != Payment.PaymentStatus.CAPTURED) {
                        p.setRazorpayPaymentId(paymentId);
                        p.setStatus(Payment.PaymentStatus.CAPTURED);
                        paymentRepo.save(p);
                    }
                });

            } else if ("payment.failed".equals(eventType)) {
                JSONObject paymentObj = event.getJSONObject("payload")
                    .getJSONObject("payment").getJSONObject("entity");
                String orderId = paymentObj.getString("order_id");

                paymentRepo.findByRazorpayOrderId(orderId).ifPresent(p -> {
                    p.setStatus(Payment.PaymentStatus.FAILED);
                    paymentRepo.save(p);
                });

            } else if ("refund.created".equals(eventType)) {
                JSONObject refundObj = event.getJSONObject("payload")
                    .getJSONObject("refund").getJSONObject("entity");
                String paymentId = refundObj.getString("payment_id");
                String refundId  = refundObj.getString("id");

                paymentRepo.findByRazorpayPaymentId(paymentId).ifPresent(p -> {
                    p.setRefundId(refundId);
                    p.setStatus(Payment.PaymentStatus.REFUNDED);
                    paymentRepo.save(p);
                });
            }
        } catch (Exception e) {
            log.error("Error processing webhook payload: {}", e.getMessage());
        }
    }

    // ── Refund ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PaymentDto refund(Long paymentId, Long requestedByUserId) {
        Payment payment = paymentRepo.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (payment.getStatus() != Payment.PaymentStatus.CAPTURED)
            throw new RuntimeException("Only captured payments can be refunded");

        boolean isOwner = payment.getStudent().getId().equals(requestedByUserId)
            || payment.getTutor().getId().equals(requestedByUserId);
        if (!isOwner) throw new RuntimeException("Unauthorized to refund this payment");

        try {
            JSONObject refundOptions = new JSONObject();
            // full refund — omit "amount" for partial refund
            com.razorpay.Refund refund = razorpayClient.payments.refund(
                payment.getRazorpayPaymentId(), refundOptions);

            payment.setRefundId(refund.get("id"));
            payment.setStatus(Payment.PaymentStatus.REFUNDED);
            payment = paymentRepo.save(payment);
            log.info("Refund created: {} for payment {}", refund.get("id"), payment.getRazorpayPaymentId());
            return mapToDto(payment);

        } catch (RazorpayException e) {
            log.error("Razorpay refund failed: {}", e.getMessage());
            throw new RuntimeException("Refund failed: " + e.getMessage());
        }
    }

    // ── Query ─────────────────────────────────────────────────────────────────

    @Override
    public List<PaymentDto> getMyPayments(Long userId, String role) {
        List<Payment> payments = "TUTOR".equals(role)
            ? paymentRepo.findByTutorIdOrderByCreatedAtDesc(userId)
            : paymentRepo.findByStudentIdOrderByCreatedAtDesc(userId);
        return payments.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public PaymentDto getPaymentById(Long paymentId) {
        return mapToDto(paymentRepo.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found")));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException("HMAC computation failed", e);
        }
    }

    private PaymentDto mapToDto(Payment p) {
        return PaymentDto.builder()
            .id(p.getId())
            .studentId(p.getStudent().getId()).studentName(p.getStudent().getFullName())
            .tutorId(p.getTutor().getId()).tutorName(p.getTutor().getFullName())
            .razorpayOrderId(p.getRazorpayOrderId()).razorpayPaymentId(p.getRazorpayPaymentId())
            .amount(p.getAmount()).currency(p.getCurrency())
            .description(p.getDescription()).status(p.getStatus().name())
            .refundId(p.getRefundId()).createdAt(p.getCreatedAt())
            .build();
    }
}
