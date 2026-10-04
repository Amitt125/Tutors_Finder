package com.tutorfinder.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;

@Service
public class FileUploadService {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    /**
     * Base URL of the backend — used to build absolute URLs for stored files.
     * e.g. http://localhost:8080
     * Angular serves on 4200, backend on 8080, so we must return an absolute URL.
     */
    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    private static final Set<String> ALLOWED_IMAGE_TYPES =
        Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private static final Set<String> ALLOWED_DOC_TYPES =
        Set.of("application/pdf", "image/jpeg", "image/png",
               "application/msword",
               "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    public String saveProfilePicture(MultipartFile file) throws IOException {
        validateType(file, ALLOWED_IMAGE_TYPES,
            "Only JPG, PNG, WEBP images are allowed for profile picture");
        return save(file, "profile-pics");
    }

    public String saveCertificate(MultipartFile file) throws IOException {
        validateType(file, ALLOWED_DOC_TYPES,
            "Only PDF, JPG, PNG, DOC files are allowed for certificates");
        return save(file, "certificates");
    }

    private String save(MultipartFile file, String subFolder) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");

        Path dir = Paths.get(uploadDir, subFolder);
        Files.createDirectories(dir);

        String ext      = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + ext;
        Path   target   = dir.resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        // Return ABSOLUTE URL so Angular can load it cross-origin (4200 → 8080)
        return baseUrl + "/uploads/" + subFolder + "/" + filename;
    }

    private void validateType(MultipartFile file, Set<String> allowed, String msg) {
        String ct = file.getContentType();
        if (ct == null || !allowed.contains(ct))
            throw new IllegalArgumentException(msg);
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf(".")).toLowerCase();
    }
}
