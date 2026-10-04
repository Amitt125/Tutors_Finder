package com.tutorfinder.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDto {
    private Long id;
    private Long bookingId;
    private Long studentId;
    private String studentName;
    private String studentPicture;
    private Integer rating;
    private String comment;
    private String tutorReply;
    private LocalDateTime createdAt;
}
