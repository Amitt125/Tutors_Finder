package com.tutorfinder.controller;

import com.tutorfinder.dto.*;
import com.tutorfinder.entity.User;
import com.tutorfinder.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<ApiResponse<BookingDto>> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody BookingRequest req) {
        return ResponseEntity.ok(ApiResponse.success(bookingService.createBooking(user.getId(), req)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingDto>>> getMyBookings(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(bookingService.getMyBookings(user.getId(), user.getRole().name())));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<BookingDto>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(bookingService.updateStatus(id, status, user.getId())));
    }
}
