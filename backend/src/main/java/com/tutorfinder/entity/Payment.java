package com.tutorfinder.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Student who made the payment */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    /** Tutor being paid */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id", nullable = false)
    private User tutor;

    /**
     * Razorpay order id returned from createOrder (e.g. order_XXXX).
     * Stored before payment is attempted.
     */
    @Column(name = "razorpay_order_id", unique = true)
    private String razorpayOrderId;

    /**
     * Razorpay payment id returned after successful capture (e.g. pay_XXXX).
     * Populated after webhook / verify call.
     */
    @Column(name = "razorpay_payment_id", unique = true)
    private String razorpayPaymentId;

    /** Razorpay signature for server-side verification */
    @Column(name = "razorpay_signature")
    private String razorpaySignature;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /** ISO-4217 currency code, default INR */
    @Column(length = 3)
    private String currency = "INR";

    @Column(name = "description", length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.CREATED;

    /** Refund id if this payment was refunded */
    @Column(name = "refund_id")
    private String refundId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist  protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate   protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum PaymentStatus {
        CREATED,    // order created, checkout not started
        ATTEMPTED,  // user opened checkout
        CAPTURED,   // payment successful
        FAILED,     // payment failed
        REFUNDED    // payment refunded
    }
}
