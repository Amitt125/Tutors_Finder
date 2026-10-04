package com.tutorfinder.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "tutor_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TutorDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_profile_id", nullable = false)
    private TutorProfile tutorProfile;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type")
    private DocumentType documentType;

    @Column(name = "certificate_name")
    private String certificateName;   // friendly name e.g. "B.Tech Computer Science"

    @Column(name = "file_url")
    private String fileUrl;

    @Builder.Default
    private Boolean verified = false;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;

    public enum DocumentType {
        ID_PROOF, DEGREE, CERTIFICATION, OTHER
    }
}
