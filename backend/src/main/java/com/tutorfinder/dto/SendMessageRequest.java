package com.tutorfinder.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SendMessageRequest {
    @NotNull private Long receiverId;
    @NotBlank private String content;
}
