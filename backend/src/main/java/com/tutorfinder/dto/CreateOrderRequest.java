package com.tutorfinder.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CreateOrderRequest {
    /** Tutor user id (not profile id) */
    @NotNull
    private Long tutorId;

    /** Amount in INR (will be converted to paise for Razorpay) */
    @NotNull @DecimalMin("1.00")
    private BigDecimal amount;

    /** Free text, shown in Razorpay dashboard */
    private String description;
}
