package com.tutorfinder.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingDto {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentPicture;
    private Long tutorId;
    private String tutorName;
    private String tutorPicture;
    private String subjectName;
    private LocalDate sessionDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String teachingMode;
    private String status;
    private BigDecimal hourlyRate;
    private BigDecimal totalAmount;
    private String notes;
    private LocalDateTime createdAt;
}
