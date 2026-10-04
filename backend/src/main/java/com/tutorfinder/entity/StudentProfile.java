package com.tutorfinder.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "grade_level")
    private String gradeLevel;

    private String school;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "learning_goals", columnDefinition = "TEXT")
    private String learningGoals;

    private Double latitude;
    private Double longitude;

    @Column(name = "location_address")
    private String locationAddress;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
