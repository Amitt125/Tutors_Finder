package com.tutorfinder.service.impl;

import com.tutorfinder.dto.*;
import com.tutorfinder.entity.*;
import com.tutorfinder.repository.*;
import com.tutorfinder.security.jwt.JwtUtils;
import com.tutorfinder.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository           userRepo;
    private final StudentProfileRepository studentRepo;
    private final TutorProfileRepository   tutorRepo;
    private final PasswordEncoder          encoder;
    private final JwtUtils                 jwtUtils;
    private final AuthenticationManager    authManager;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepo.existsByEmail(req.getEmail()))
            throw new RuntimeException("Email already registered");

        User user = User.builder()
            .email(req.getEmail())
            .password(encoder.encode(req.getPassword()))
            .fullName(req.getFullName())
            .phone(req.getPhone())
            .role(req.getRole())
            .active(true)      // explicit — never rely on default alone
            .verified(false)
            .build();

        user = userRepo.save(user);

        if (req.getRole() == User.Role.STUDENT) {
            studentRepo.save(StudentProfile.builder().user(user).build());
        } else if (req.getRole() == User.Role.TUTOR) {
            tutorRepo.save(TutorProfile.builder().user(user).available(true).build());
        }

        String token = jwtUtils.generateToken(user);
        return buildResponse(user, token, false);
    }

    @Override
    public AuthResponse login(LoginRequest req) {
        authManager.authenticate(
            new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        User user = userRepo.findByEmail(req.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));
        String token = jwtUtils.generateToken(user);
        return buildResponse(user, token, true);
    }

    private AuthResponse buildResponse(User user, String token, boolean profileComplete) {
        return AuthResponse.builder()
            .token(token)
            .email(user.getEmail())
            .fullName(user.getFullName())
            .role(user.getRole().name())
            .userId(user.getId())
            .profilePicture(user.getProfilePicture())
            .profileComplete(profileComplete)
            .build();
    }
}
