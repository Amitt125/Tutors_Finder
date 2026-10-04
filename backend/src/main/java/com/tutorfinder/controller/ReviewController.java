package com.tutorfinder.controller;

import com.tutorfinder.dto.*;
import com.tutorfinder.entity.User;
import com.tutorfinder.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /** Student submits a review for a completed session */
    @PostMapping
    public ResponseEntity<ApiResponse<ReviewDto>> submit(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ReviewRequest req) {
        return ResponseEntity.ok(ApiResponse.success(
            reviewService.submitReview(user.getId(), req)));
    }

    /** Public — get all reviews for a tutor (by tutor user ID) */
    @GetMapping("/tutor/{tutorUserId}")
    public ResponseEntity<ApiResponse<List<ReviewDto>>> getByTutor(
            @PathVariable Long tutorUserId) {
        return ResponseEntity.ok(ApiResponse.success(
            reviewService.getReviewsByTutor(tutorUserId)));
    }

    /** Check if current user has already reviewed a booking */
    @GetMapping("/check/{bookingId}")
    public ResponseEntity<ApiResponse<Boolean>> hasReviewed(
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(ApiResponse.success(
            reviewService.hasReviewed(bookingId)));
    }

    /** Tutor replies to a review */
    @PatchMapping("/{reviewId}/reply")
    public ResponseEntity<ApiResponse<ReviewDto>> reply(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(
            reviewService.addTutorReply(reviewId, user.getId(), body.get("reply"))));
    }
}
