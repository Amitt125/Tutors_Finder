package com.tutorfinder.dto;

import com.tutorfinder.entity.User;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank @Email
    private String email;
    @NotBlank @Size(min = 6, max = 100)
    private String password;
    @NotBlank
    private String fullName;
    private String phone;
    @NotNull
    private User.Role role;
}
