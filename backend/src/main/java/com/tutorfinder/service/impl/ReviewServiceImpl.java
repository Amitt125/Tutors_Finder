package com.tutorfinder.service.impl;

import com.tutorfinder.dto.ReviewDto;
import com.tutorfinder.dto.ReviewRequest;
import com.tutorfinder.entity.*;
import com.tutorfinder.repository.*;
import com.tutorfinder.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository       reviewRepo;
    private final BookingRepository      bookingRepo;
    private final TutorProfileRepository tutorProfileRepo;
    private final UserRepository         userRepo;

    @Override
    @Transactional
    public ReviewDto submitReview(Long studentId, ReviewRequest req) {
        // Validate booking belongs to this student and is COMPLETED
        Booking booking = bookingRepo.findById(req.getBookingId())
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getStudent().getId().equals(studentId))
            throw new RuntimeException("You can only review your own sessions");

        if (booking.getStatus() != Booking.BookingStatus.COMPLETED)
            throw new RuntimeException("You can only review completed sessions");

        if (reviewRepo.existsByBookingId(req.getBookingId()))
            throw new RuntimeException("You have already reviewed this session");

        User student = userRepo.findById(studentId).orElseThrow();
        User tutor   = booking.getTutor();

        Review review = Review.builder()
            .booking(booking)
            .student(student)
            .tutor(tutor)
            .rating(req.getRating())
            .comment(req.getComment())
            .build();

        reviewRepo.save(review);

        // Update tutor's averageRating and totalReviews on TutorProfile
        tutorProfileRepo.findByUserId(tutor.getId()).ifPresent(profile -> {
            Double avg = reviewRepo.getAverageRatingByTutorId(tutor.getId());
            long count = reviewRepo.countByTutorId(tutor.getId());
            profile.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
            profile.setTotalReviews((int) count);
            tutorProfileRepo.save(profile);
        });

        return mapToDto(review);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDto> getReviewsByTutor(Long tutorUserId) {
        return reviewRepo.findByTutorIdOrderByCreatedAtDesc(tutorUserId)
            .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReviewDto addTutorReply(Long reviewId, Long tutorUserId, String reply) {
        Review review = reviewRepo.findById(reviewId)
            .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getTutor().getId().equals(tutorUserId))
            throw new RuntimeException("You can only reply to your own reviews");

        review.setTutorReply(reply);
        return mapToDto(reviewRepo.save(review));
    }

    @Override
    public boolean hasReviewed(Long bookingId) {
        return reviewRepo.existsByBookingId(bookingId);
    }

    private ReviewDto mapToDto(Review r) {
        return ReviewDto.builder()
            .id(r.getId())
            .bookingId(r.getBooking().getId())
            .studentId(r.getStudent().getId())
            .studentName(r.getStudent().getFullName())
            .studentPicture(r.getStudent().getProfilePicture())
            .rating(r.getRating())
            .comment(r.getComment())
            .tutorReply(r.getTutorReply())
            .createdAt(r.getCreatedAt())
            .build();
    }
}
