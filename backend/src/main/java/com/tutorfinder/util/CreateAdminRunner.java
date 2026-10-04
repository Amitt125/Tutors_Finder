package com.tutorfinder.util;

import com.tutorfinder.entity.User;
import com.tutorfinder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Runs ONLY when Spring profile "create-admin" is active.
 *
 * Usage — from the backend/ directory:
 *   mvn spring-boot:run -Dspring-boot.run.profiles=create-admin
 *
 * This will:
 *  1. Generate the correct BCrypt hash for "123456" using Spring's own encoder
 *  2. Insert (or update) the admin user in the database
 *  3. Print the credentials to the console
 */
@Component
@Profile("create-admin")
@RequiredArgsConstructor
public class CreateAdminRunner implements CommandLineRunner {

    private final UserRepository  userRepo;
    private final PasswordEncoder encoder;

    @Override
    public void run(String... args) {
        String email    = "admin@tutorfinder.com";
        String password = "123456";
        String hash     = encoder.encode(password);

        System.out.println("\n==========================================");
        System.out.println("  BCrypt hash for '" + password + "': " + hash);
        System.out.println("==========================================\n");

        if (userRepo.existsByEmail(email)) {
            User u = userRepo.findByEmail(email).get();
            u.setPassword(hash);
            u.setActive(true);
            userRepo.save(u);
            System.out.println("✅ Admin password reset: " + email);
        } else {
            userRepo.save(User.builder()
                .email(email)
                .password(hash)
                .fullName("Admin")
                .role(User.Role.ADMIN)
                .active(true)
                .verified(true)
                .build());
            System.out.println("✅ Admin user created: " + email);
        }
        System.out.println("   Login  →  http://localhost:4200/auth/login");
        System.out.println("   Email  →  " + email);
        System.out.println("   Pass   →  " + password + "\n");
    }
}
