package com.tutorfinder.service;

import com.tutorfinder.dto.ReviewDto;
import com.tutorfinder.dto.ReviewRequest;
import java.util.List;

public interface ReviewService {
    ReviewDto submitReview(Long studentId, ReviewRequest req);
    List<ReviewDto> getReviewsByTutor(Long tutorUserId);
    ReviewDto addTutorReply(Long reviewId, Long tutorUserId, String reply);
    boolean hasReviewed(Long bookingId);
}
