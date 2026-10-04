package com.tutorfinder.dto;

import lombok.Data;

@Data
public class TutorSearchRequest {
    private double  latitude;
    private double  longitude;
    private double  radiusKm        = 10.0;
    private Long    subjectId;
    private Double  minRate;
    private Double  maxRate;
    private String  teachingMode;
    private String  teachingStandard;
    private Double  minRating;        // e.g. 3.0 → only tutors rated 3★ and above
    private Integer minExperience;    // e.g. 2 → only tutors with 2+ years experience
    private Integer page = 0;
    private Integer size = 20;
}
