package com.tutorfinder.controller;

import com.tutorfinder.dto.*;
import com.tutorfinder.entity.*;
import com.tutorfinder.repository.*;
import com.tutorfinder.service.FileUploadService;
import com.tutorfinder.service.TutorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/tutors")
@RequiredArgsConstructor
public class TutorController {

    private final TutorService            tutorService;
    private final FileUploadService       fileUploadService;
    private final UserRepository          userRepo;
    private final TutorProfileRepository  tutorProfileRepo;
    private final TutorDocumentRepository docRepo;

    // ── Public search / profile ────────────────────────────────────────────────

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<TutorProfileDto>>> search(TutorSearchRequest req) {
        return ResponseEntity.ok(ApiResponse.success(tutorService.searchNearbyTutors(req)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TutorProfileDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(tutorService.getTutorById(id)));
    }

    // ── Tutor — own profile ────────────────────────────────────────────────────

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<TutorProfileDto>> getMyProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(tutorService.getMyProfile(user.getId())));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<TutorProfileDto>> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestBody UpdateTutorProfileRequest req) {
        return ResponseEntity.ok(ApiResponse.success(tutorService.updateProfile(user.getId(), req)));
    }

    /**
     * POST /api/tutors/me/profile-picture
     * Multipart: field name = "file"
     * Updates users.profile_picture and returns the new URL.
     */
    @PostMapping(value = "/me/profile-picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> uploadProfilePicture(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file) throws IOException {

        String url = fileUploadService.saveProfilePicture(file);

        // Update users.profile_picture
        User u = userRepo.findById(user.getId()).orElseThrow();
        u.setProfilePicture(url);
        userRepo.save(u);

        return ResponseEntity.ok(ApiResponse.success(url));
    }

    /**
     * POST /api/tutors/me/certificates
     * Multipart fields: "file", "certificateName" (optional), "documentType" (optional)
     * Saves to tutor_documents table. Completely optional.
     */
    @PostMapping(value = "/me/certificates", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TutorDocumentDto>> uploadCertificate(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "certificateName", required = false, defaultValue = "") String certificateName,
            @RequestParam(value = "documentType", required = false, defaultValue = "CERTIFICATION") String documentType)
            throws IOException {

        String url = fileUploadService.saveCertificate(file);

        TutorProfile profile = tutorProfileRepo.findByUserId(user.getId())
            .orElseThrow(() -> new RuntimeException("Tutor profile not found"));

        TutorDocument doc = TutorDocument.builder()
            .tutorProfile(profile)
            .fileUrl(url)
            .certificateName(certificateName.isBlank() ? null : certificateName)
            .documentType(TutorDocument.DocumentType.valueOf(documentType))
            .verified(false)
            .build();

        TutorDocument saved = docRepo.save(doc);

        TutorDocumentDto dto = TutorDocumentDto.builder()
            .id(saved.getId())
            .documentType(saved.getDocumentType().name())
            .certificateName(saved.getCertificateName())
            .fileUrl(saved.getFileUrl())
            .verified(saved.getVerified())
            .uploadedAt(saved.getUploadedAt())
            .build();

        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    /**
     * DELETE /api/tutors/me/certificates/{docId}
     * Tutor can delete their own certificate.
     */
    @DeleteMapping("/me/certificates/{docId}")
    public ResponseEntity<ApiResponse<String>> deleteCertificate(
            @AuthenticationPrincipal User user,
            @PathVariable Long docId) {

        TutorDocument doc = docRepo.findById(docId)
            .orElseThrow(() -> new RuntimeException("Document not found"));

        // Security: only the owner can delete
        if (!doc.getTutorProfile().getUser().getId().equals(user.getId()))
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Not your document"));

        docRepo.delete(doc);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }
}
