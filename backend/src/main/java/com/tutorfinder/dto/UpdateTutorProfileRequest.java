package com.tutorfinder.dto;

import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class UpdateTutorProfileRequest {
    private String     bio;
    private BigDecimal hourlyRate;
    private Integer    experienceYears;
    private String     education;

    // Multiple teaching standards stored as comma-separated, e.g. "CLASS_1_5,CLASS_6_10"
    @JsonSetter(nulls = Nulls.SKIP)
    private List<String> teachingStandards;

    private String     teachingStandardOther;
    private String     teachingMode;
    private Integer    serviceRadiusKm;
    private Double     latitude;
    private Double     longitude;
    private String     address;
    private String     city;
    private String     state;
    private String     country;

    @JsonSetter(nulls = Nulls.SKIP)
    private List<Long> subjectIds;
}
