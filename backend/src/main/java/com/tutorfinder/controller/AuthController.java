package com.tutorfinder.controller;

import com.tutorfinder.dto.*;
import com.tutorfinder.entity.User;
import com.tutorfinder.repository.UserRepository;
import com.tutorfinder.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService     authService;
    private final UserRepository  userRepo;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(ApiResponse.success(authService.register(req)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(req)));
    }

    /**
     * One-time endpoint to create/reset the admin account.
     * Call once via browser or Postman:
     *   POST http://localhost:8080/api/auth/create-admin
     *
     * Remove or comment out this endpoint after first use.
     */
    @PostMapping("/create-admin")
    public ResponseEntity<ApiResponse<String>> createAdmin() {
        String email    = "admin@tutorfinder.com";
        String password = "123456";
        String hash     = passwordEncoder.encode(password);

        if (userRepo.existsByEmail(email)) {
            // Reset password of existing admin
            User u = userRepo.findByEmail(email).get();
            u.setPassword(hash);
            u.setActive(true);
            u.setVerified(true);
            userRepo.save(u);
            return ResponseEntity.ok(ApiResponse.success(
                "Admin password reset. Email: " + email + " | Password: " + password));
        } else {
            // Create fresh admin
            userRepo.save(User.builder()
                .email(email)
                .password(hash)
                .fullName("Admin")
                .role(User.Role.ADMIN)
                .active(true)
                .verified(true)
                .build());
            return ResponseEntity.ok(ApiResponse.success(
                "Admin created. Email: " + email + " | Password: " + password));
        }
    }
}
