package com.tutorfinder.service.impl;

import com.tutorfinder.dto.*;
import com.tutorfinder.entity.*;
import com.tutorfinder.repository.*;
import com.tutorfinder.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository       bookingRepo;
    private final UserRepository          userRepo;
    private final TutorProfileRepository  tutorRepo;
    private final SubjectRepository       subjectRepo;
    private final SimpMessagingTemplate   messagingTemplate;

    @Override @Transactional
    public BookingDto createBooking(Long studentId, BookingRequest req) {
        User student        = userRepo.findById(studentId).orElseThrow();
        User tutor          = userRepo.findById(req.getTutorId()).orElseThrow();
        TutorProfile profile = tutorRepo.findByUserId(req.getTutorId()).orElseThrow();

        // ── Double-booking guard ──────────────────────────────────────────────
        long conflicts = bookingRepo.countConflict(
            req.getTutorId(), req.getSessionDate(), req.getStartTime());
        if (conflicts > 0)
            throw new RuntimeException(
                "This slot is already booked. Please choose a different time.");

        // ── Subject (optional) ────────────────────────────────────────────────
        Subject subject = null;
        if (req.getSubjectId() != null)
            subject = subjectRepo.findById(req.getSubjectId()).orElse(null);

        // ── Calculate amount ──────────────────────────────────────────────────
        long mins  = Duration.between(req.getStartTime(), req.getEndTime()).toMinutes();
        long hours = Math.max(mins / 60, 1);
        BigDecimal total = profile.getHourlyRate().multiply(BigDecimal.valueOf(hours));

        Booking booking = Booking.builder()
            .student(student).tutor(tutor).subject(subject)
            .sessionDate(req.getSessionDate())
            .startTime(req.getStartTime()).endTime(req.getEndTime())
            .teachingMode(TutorProfile.TeachingMode.valueOf(req.getTeachingMode()))
            .status(Booking.BookingStatus.PENDING)
            .hourlyRate(profile.getHourlyRate())
            .totalAmount(total)
            .notes(req.getNotes())
            .build();

        BookingDto dto = mapToDto(bookingRepo.save(booking));

        // Notify tutor via WebSocket — use email (Principal name), not numeric ID
        String tutorEmail = tutor.getEmail();
        long pendingCount = bookingRepo.countByTutor_IdAndStatus(
            req.getTutorId(), Booking.BookingStatus.PENDING);
        messagingTemplate.convertAndSendToUser(
            tutorEmail,
            "/queue/booking-notification",
            Map.of(
                "type",         "NEW_BOOKING",
                "message",      student.getFullName() + " requested a session on " + req.getSessionDate(),
                "bookingId",    dto.getId(),
                "pendingCount", pendingCount
            )
        );

        return dto;
    }

    @Override @Transactional
    public BookingDto updateStatus(Long bookingId, String status, Long userId) {
        Booking booking = bookingRepo.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Only tutor can CONFIRM/CANCEL; student can only CANCEL their own
        boolean isTutor   = booking.getTutor().getId().equals(userId);
        boolean isStudent = booking.getStudent().getId().equals(userId);
        if (!isTutor && !isStudent)
            throw new RuntimeException("Not authorised to update this booking");

        Booking.BookingStatus newStatus = Booking.BookingStatus.valueOf(status);
        booking.setStatus(newStatus);

        if (newStatus == Booking.BookingStatus.COMPLETED) {
            tutorRepo.findByUserId(booking.getTutor().getId()).ifPresent(p -> {
                p.setTotalSessions(p.getTotalSessions() + 1);
                tutorRepo.save(p);
            });
        }

        BookingDto dto = mapToDto(bookingRepo.save(booking));

        // Notify student when tutor confirms or cancels
        if (isTutor && (newStatus == Booking.BookingStatus.CONFIRMED
                     || newStatus == Booking.BookingStatus.CANCELLED)) {
            // Notify student — use email (Principal name), not numeric ID
            String studentEmail = booking.getStudent().getEmail();
            messagingTemplate.convertAndSendToUser(
                studentEmail,
                "/queue/booking-notification",
                Map.of(
                    "type",      "BOOKING_UPDATE",
                    "message",   "Your booking on " + booking.getSessionDate()
                                 + " was " + status.toLowerCase() + " by the tutor",
                    "bookingId", dto.getId(),
                    "status",    status
                )
            );
        }

        return dto;
    }

    @Override
    public List<BookingDto> getMyBookings(Long userId, String role) {
        List<Booking> bookings = "TUTOR".equals(role)
            ? bookingRepo.findByTutor_IdOrderByCreatedAtDesc(userId)
            : bookingRepo.findByStudent_IdOrderByCreatedAtDesc(userId);
        return bookings.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private BookingDto mapToDto(Booking b) {
        return BookingDto.builder()
            .id(b.getId())
            .studentId(b.getStudent().getId())
            .studentName(b.getStudent().getFullName())
            .studentPicture(b.getStudent().getProfilePicture())
            .tutorId(b.getTutor().getId())
            .tutorName(b.getTutor().getFullName())
            .tutorPicture(b.getTutor().getProfilePicture())
            .subjectName(b.getSubject() != null ? b.getSubject().getName() : null)
            .sessionDate(b.getSessionDate())
            .startTime(b.getStartTime()).endTime(b.getEndTime())
            .teachingMode(b.getTeachingMode() != null ? b.getTeachingMode().name() : null)
            .status(b.getStatus().name())
            .hourlyRate(b.getHourlyRate())
            .totalAmount(b.getTotalAmount())
            .notes(b.getNotes())
            .createdAt(b.getCreatedAt())
            .build();
    }
}
