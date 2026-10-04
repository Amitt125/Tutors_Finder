package com.tutorfinder.controller;

import com.tutorfinder.dto.*;
import com.tutorfinder.entity.User;
import com.tutorfinder.repository.TutorProfileRepository;
import com.tutorfinder.service.AvailabilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService    availabilityService;
    private final TutorProfileRepository tutorRepo;

    /**
     * Tutor saves their weekly availability (replaces existing).
     * PUT /api/availability/me
     */
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<List<AvailabilityDto>>> save(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody List<AvailabilityRequest> slots) {
        return ResponseEntity.ok(ApiResponse.success(
            availabilityService.saveAvailability(user.getId(), slots)));
    }

    /**
     * Logged-in tutor gets their own availability.
     * GET /api/availability/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<AvailabilityDto>>> getMine(
            @AuthenticationPrincipal User user) {
        Long profileId = tutorRepo.findByUserId(user.getId())
            .orElseThrow(() -> new RuntimeException("Tutor profile not found"))
            .getId();
        return ResponseEntity.ok(ApiResponse.success(
            availabilityService.getAvailability(profileId)));
    }

    /**
     * Public — get weekly availability for a tutor profile.
     * GET /api/availability/profile/{tutorProfileId}
     */
    @GetMapping("/profile/{tutorProfileId}")
    public ResponseEntity<ApiResponse<List<AvailabilityDto>>> getByProfile(
            @PathVariable Long tutorProfileId) {
        return ResponseEntity.ok(ApiResponse.success(
            availabilityService.getAvailability(tutorProfileId)));
    }

    /**
     * Public — get available time slots for a tutor on a specific date.
     * GET /api/availability/slots/{tutorUserId}?date=2025-03-20
     */
    @GetMapping("/slots/{tutorUserId}")
    public ResponseEntity<ApiResponse<List<TimeSlotDto>>> getSlots(
            @PathVariable Long tutorUserId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(
            availabilityService.getAvailableSlots(tutorUserId, date)));
    }
}
