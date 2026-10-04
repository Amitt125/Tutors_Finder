package com.tutorfinder.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ReviewRequest {
    @NotNull private Long bookingId;
    @NotNull @Min(1) @Max(5) private Integer rating;
    private String comment;
}
