package com.tutorfinder.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TutorDocumentDto {
    private Long id;
    private String documentType;
    private String certificateName;
    private String fileUrl;
    private Boolean verified;
    private LocalDateTime uploadedAt;
}
