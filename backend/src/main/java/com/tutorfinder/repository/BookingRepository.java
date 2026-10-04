package com.tutorfinder.repository;

import com.tutorfinder.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByStudent_IdOrderByCreatedAtDesc(Long studentId);
    List<Booking> findByTutor_IdOrderByCreatedAtDesc(Long tutorId);
    long countByStatus(Booking.BookingStatus status);

    /** All active bookings for a tutor on a given date (for slot generation) */
    @Query("SELECT b FROM Booking b WHERE b.tutor.id = :tutorId AND b.sessionDate = :date AND b.status != 'CANCELLED'")
    List<Booking> findByTutorIdAndDate(@Param("tutorId") Long tutorId, @Param("date") LocalDate date);

    /** Double-booking check — is this exact slot already taken? */
    @Query("""
        SELECT COUNT(b) FROM Booking b
        WHERE b.tutor.id = :tutorId
          AND b.sessionDate = :date
          AND b.startTime = :startTime
          AND b.status != 'CANCELLED'
        """)
    long countConflict(
        @Param("tutorId")    Long tutorId,
        @Param("date")       LocalDate date,
        @Param("startTime")  LocalTime startTime
    );

    @Query("SELECT b FROM Booking b WHERE b.student.id = :studentId AND b.tutor.id = :tutorId AND b.status = 'COMPLETED'")
    List<Booking> findCompletedSessionsBetween(@Param("studentId") Long studentId, @Param("tutorId") Long tutorId);

    /** Pending bookings for a tutor — used for notification badge */
    long countByTutor_IdAndStatus(Long tutorId, Booking.BookingStatus status);
}
