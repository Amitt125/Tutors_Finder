package com.tutorfinder.dto;

import lombok.*;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CreateOrderResponse {
    /** Our internal payment record id */
    private Long paymentId;
    /** Razorpay order id — passed to Razorpay Checkout */
    private String razorpayOrderId;
    /** Amount in paise (INR × 100) */
    private long amountPaise;
    /** ISO currency, e.g. INR */
    private String currency;
    /** Razorpay key_id — passed to Razorpay Checkout */
    private String razorpayKeyId;
    /** Pre-fill fields for checkout */
    private String studentName;
    private String studentEmail;
}
