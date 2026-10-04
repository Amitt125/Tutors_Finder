package com.tutorfinder.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "tutor_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TutorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Builder.Default
    @Column(name = "hourly_rate", nullable = false)
    private BigDecimal hourlyRate = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "experience_years")
    private Integer experienceYears = 0;

    private String education;

    // Teaching standard — e.g. "CLASS_1_5", "BCOM", "OTHERS"
    @Column(name = "teaching_standard")
    private String teachingStandard;

    // Filled when teachingStandard = "OTHERS"
    @Column(name = "teaching_standard_other")
    private String teachingStandardOther;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "teaching_mode")
    private TeachingMode teachingMode = TeachingMode.BOTH;

    @Builder.Default
    @Column(name = "service_radius_km")
    private Integer serviceRadiusKm = 10;

    private Double latitude;
    private Double longitude;
    private String address;
    private String city;
    private String state;
    private String country;

    // Use Boolean wrapper so @Builder.Default = true actually works with Lombok builder
    @Builder.Default
    @Column(name = "is_available")
    private Boolean available = true;

    @Builder.Default
    @Column(name = "average_rating")
    private Double averageRating = 0.0;

    @Builder.Default
    @Column(name = "total_reviews")
    private Integer totalReviews = 0;

    @Builder.Default
    @Column(name = "total_sessions")
    private Integer totalSessions = 0;

    @Builder.Default
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "tutor_subjects",
        joinColumns = @JoinColumn(name = "tutor_id"),
        inverseJoinColumns = @JoinColumn(name = "subject_id"))
    private Set<Subject> subjects = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        if (available == null) available = true;
        if (hourlyRate == null)  hourlyRate  = BigDecimal.ZERO;
    }

    public enum TeachingMode { IN_PERSON, ONLINE, BOTH }
}
