package com.tutorfinder.controller;

import com.tutorfinder.dto.*;
import com.tutorfinder.entity.*;
import com.tutorfinder.repository.*;
import com.tutorfinder.entity.Review;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository          userRepo;
    private final TutorProfileRepository  tutorProfileRepo;
    private final TutorDocumentRepository docRepo;
    private final BookingRepository       bookingRepo;
    private final PaymentRepository       paymentRepo;
    private final ReviewRepository        reviewRepo;
    private final MessageRepository       messageRepo;

    // ── Dashboard stats ────────────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        long totalUsers    = userRepo.count();
        long totalTutors   = userRepo.countByRole(User.Role.TUTOR);
        long totalStudents = userRepo.countByRole(User.Role.STUDENT);
        long totalBookings = bookingRepo.count();
        long activeBookings = bookingRepo.countByStatus(Booking.BookingStatus.CONFIRMED);
        long pendingBookings = bookingRepo.countByStatus(Booking.BookingStatus.PENDING);

        BigDecimal totalRevenue = paymentRepo.getTotalRevenue();
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        // New signups this week
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        long newSignups = userRepo.countByCreatedAtAfter(weekAgo);

        // Pending doc verifications
        long pendingDocs = docRepo.countByVerified(false);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers",      totalUsers);
        stats.put("totalTutors",     totalTutors);
        stats.put("totalStudents",   totalStudents);
        stats.put("totalBookings",   totalBookings);
        stats.put("activeBookings",  activeBookings);
        stats.put("pendingBookings", pendingBookings);
        stats.put("totalRevenue",    totalRevenue);
        stats.put("newSignupsWeek",  newSignups);
        stats.put("pendingDocs",     pendingDocs);

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // ── User Management ────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllUsers() {
        List<Map<String, Object>> users = userRepo.findAll().stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",             u.getId());
            m.put("email",          u.getEmail());
            m.put("fullName",       u.getFullName());
            m.put("role",           u.getRole().name());
            m.put("isActive",       u.getActive());
            m.put("profilePicture", u.getProfilePicture());
            m.put("createdAt",      u.getCreatedAt());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PatchMapping("/users/{id}/activate")
    public ResponseEntity<ApiResponse<String>> activateUser(@PathVariable Long id) {
        User u = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        u.setActive(true);
        userRepo.save(u);
        return ResponseEntity.ok(ApiResponse.success("User activated"));
    }

    @PatchMapping("/users/{id}/deactivate")
    public ResponseEntity<ApiResponse<String>> deactivateUser(@PathVariable Long id) {
        User u = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        u.setActive(false);
        userRepo.save(u);
        return ResponseEntity.ok(ApiResponse.success("User deactivated"));
    }

    // ── Tutor Document Verification ────────────────────────────────────────────

    @GetMapping("/documents")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPendingDocuments() {
        List<Map<String, Object>> docs = docRepo.findAll().stream().map(d -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",              d.getId());
            m.put("tutorProfileId",  d.getTutorProfile().getId());
            m.put("tutorName",       d.getTutorProfile().getUser().getFullName());
            m.put("tutorEmail",      d.getTutorProfile().getUser().getEmail());
            m.put("documentType",    d.getDocumentType() != null ? d.getDocumentType().name() : null);
            m.put("certificateName", d.getCertificateName());
            m.put("fileUrl",         d.getFileUrl());
            m.put("verified",        d.getVerified());
            m.put("uploadedAt",      d.getUploadedAt());
            return m;
        }).sorted(Comparator.comparing(x -> Boolean.TRUE.equals(x.get("verified"))))
          .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(docs));
    }

    @PatchMapping("/documents/{id}/verify")
    public ResponseEntity<ApiResponse<String>> verifyDocument(@PathVariable Long id) {
        TutorDocument doc = docRepo.findById(id).orElseThrow(() -> new RuntimeException("Document not found"));
        doc.setVerified(true);
        docRepo.save(doc);
        return ResponseEntity.ok(ApiResponse.success("Document verified"));
    }

    @PatchMapping("/documents/{id}/reject")
    public ResponseEntity<ApiResponse<String>> rejectDocument(@PathVariable Long id) {
        TutorDocument doc = docRepo.findById(id).orElseThrow(() -> new RuntimeException("Document not found"));
        doc.setVerified(false);
        docRepo.save(doc);
        return ResponseEntity.ok(ApiResponse.success("Document rejected"));
    }

    // ── Bookings Overview ──────────────────────────────────────────────────────

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllBookings() {
        List<Map<String, Object>> bookings = bookingRepo.findAll().stream()
            .sorted(Comparator.comparing(Booking::getCreatedAt).reversed())
            .map(b -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",          b.getId());
                m.put("studentName", b.getStudent().getFullName());
                m.put("tutorName",   b.getTutor().getFullName());
                m.put("subjectName", b.getSubject() != null ? b.getSubject().getName() : "General");
                m.put("sessionDate", b.getSessionDate());
                m.put("startTime",   b.getStartTime());
                m.put("status",      b.getStatus().name());
                m.put("totalAmount", b.getTotalAmount());
                m.put("createdAt",   b.getCreatedAt());
                return m;
            }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(bookings));
    }

    // ── Payments Overview ──────────────────────────────────────────────────────

    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllPayments() {
        List<Map<String, Object>> payments = paymentRepo.findAll().stream()
            .sorted(Comparator.comparing(Payment::getCreatedAt).reversed())
            .map(p -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",                 p.getId());
                m.put("studentName",        p.getStudent().getFullName());
                m.put("tutorName",          p.getTutor().getFullName());
                m.put("amount",             p.getAmount());
                m.put("currency",           p.getCurrency());
                m.put("status",             p.getStatus().name());
                m.put("razorpayPaymentId",  p.getRazorpayPaymentId());
                m.put("createdAt",          p.getCreatedAt());
                return m;
            }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    // ── Reviews Management ─────────────────────────────────────────────────────

    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllReviews() {
        List<Map<String, Object>> reviews = reviewRepo.findAll().stream()
            .sorted(Comparator.comparing(Review::getCreatedAt).reversed())
            .map(r -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",           r.getId());
                m.put("studentName",  r.getStudent().getFullName());
                m.put("studentId",    r.getStudent().getId());
                m.put("tutorName",    r.getTutor().getFullName());
                m.put("tutorId",      r.getTutor().getId());
                m.put("rating",       r.getRating());
                m.put("comment",      r.getComment());
                m.put("tutorReply",   r.getTutorReply());
                m.put("createdAt",    r.getCreatedAt());
                return m;
            }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<ApiResponse<String>> deleteReview(@PathVariable Long id) {
        Review review = reviewRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Review not found"));

        Long tutorUserId = review.getTutor().getId();
        reviewRepo.deleteById(id);

        // Recalculate tutor's average rating and total reviews after deletion
        tutorProfileRepo.findByUserId(tutorUserId).ifPresent(profile -> {
            Double avg   = reviewRepo.getAverageRatingByTutorId(tutorUserId);
            long   count = reviewRepo.countByTutorId(tutorUserId);
            profile.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
            profile.setTotalReviews((int) count);
            tutorProfileRepo.save(profile);
        });

        return ResponseEntity.ok(ApiResponse.success("Review deleted"));
    }
    // ── Chat Monitoring ─────────────────────────────────────────────────────────

    /** Get list of all unique conversations (latest message per pair) */
    @GetMapping("/chats")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllConversations() {
        List<Object[]> pairs = messageRepo.findConversationPairsRaw();
        List<Map<String, Object>> convos = pairs.stream().map(row -> {
            Long userAId  = ((Number) row[0]).longValue();
            Long userBId  = ((Number) row[1]).longValue();
            Long lastMsgId= ((Number) row[2]).longValue();
            Map<String, Object> c = new LinkedHashMap<>();
            messageRepo.findById(lastMsgId).ifPresent(m -> {
                c.put("userAId",   userAId);
                c.put("userBId",   userBId);
                c.put("userAName", m.getSender().getId().equals(userAId)
                    ? m.getSender().getFullName() : m.getReceiver().getFullName());
                c.put("userBName", m.getSender().getId().equals(userBId)
                    ? m.getSender().getFullName() : m.getReceiver().getFullName());
                c.put("lastMessage", m.getContent());
                c.put("lastTime",    m.getCreatedAt());
            });
            return c;
        }).filter(m -> !m.isEmpty()).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(convos));
    }

    /** Get full conversation between two users */
    @GetMapping("/chats/{userAId}/{userBId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getConversation(
            @PathVariable Long userAId,
            @PathVariable Long userBId) {
        List<Map<String, Object>> messages = messageRepo.findConversationBetween(userAId, userBId)
            .stream()
            .map(m -> {
                Map<String, Object> msg = new LinkedHashMap<>();
                msg.put("id",           m.getId());
                msg.put("senderId",     m.getSender().getId());
                msg.put("senderName",   m.getSender().getFullName());
                msg.put("receiverId",   m.getReceiver().getId());
                msg.put("receiverName", m.getReceiver().getFullName());
                msg.put("content",      m.getContent());
                msg.put("createdAt",    m.getCreatedAt());
                msg.put("isRead",       m.isRead());
                return msg;
            }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

}
