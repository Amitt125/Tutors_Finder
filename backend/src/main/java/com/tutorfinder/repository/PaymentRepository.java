package com.tutorfinder.repository;

import com.tutorfinder.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);
    List<Payment> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<Payment> findByTutorIdOrderByCreatedAtDesc(Long tutorId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.tutor.id = :tutorId AND p.status = 'CAPTURED'")
    BigDecimal getTotalEarningsByTutorId(@Param("tutorId") Long tutorId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'CAPTURED'")
    BigDecimal getTotalRevenue();
}
