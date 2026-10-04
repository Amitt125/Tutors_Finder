package com.tutorfinder.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TutorProfileDto {
    private Long   id;
    private Long   userId;
    private String fullName;
    private String email;
    private String profilePicture;
    private String bio;
    private BigDecimal hourlyRate;
    private Integer    experienceYears;
    private String     education;
    private List<String> teachingStandards;      // multiple standards e.g. ["CLASS_1_5","BCOM"]
    private String       teachingStandardOther;  // filled when "OTHERS" is selected
    private String     teachingMode;
    private Integer    serviceRadiusKm;
    private Double     latitude;
    private Double     longitude;
    private String     address;
    private String     city;
    private String     state;

    @JsonProperty("isAvailable")
    private Boolean available;

    private Double  averageRating;
    private Integer totalReviews;
    private Integer totalSessions;

    // Full subject objects — for display (name, category)
    private Set<SubjectDto> subjects;

    // Subject IDs — for pre-filling the edit form's multi-select directly
    private List<Long> subjectIds;

    private Double                distanceKm;
    private List<TutorDocumentDto> documents;
}
