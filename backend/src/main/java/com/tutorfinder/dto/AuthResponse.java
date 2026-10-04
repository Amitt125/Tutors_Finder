package com.tutorfinder.dto;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String  token;
    private String  email;
    private String  fullName;
    private String  role;
    private Long    userId;
    private String  profilePicture;   // so frontend can show avatar immediately on login
    private boolean profileComplete;
}
