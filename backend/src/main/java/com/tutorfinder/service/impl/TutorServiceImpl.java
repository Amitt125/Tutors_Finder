package com.tutorfinder.service.impl;

import com.tutorfinder.dto.*;
import com.tutorfinder.entity.*;
import com.tutorfinder.repository.*;
import com.tutorfinder.service.TutorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.Arrays;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TutorServiceImpl implements TutorService {

    private final TutorProfileRepository  tutorRepo;
    private final SubjectRepository       subjectRepo;
    private final TutorDocumentRepository docRepo;

    @Override
    @Transactional(readOnly = true)
    public List<TutorProfileDto> searchNearbyTutors(TutorSearchRequest req) {
        List<TutorProfile> tutors = tutorRepo.findNearbyTutors(
            req.getLatitude(), req.getLongitude(), req.getRadiusKm(),
            req.getSubjectId(), req.getMinRate(), req.getMaxRate(), req.getTeachingMode(),
            req.getTeachingStandard(), req.getMinRating(), req.getMinExperience());
        return tutors.stream()
            .map(t -> mapToDto(t, req.getLatitude(), req.getLongitude()))
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TutorProfileDto getTutorById(Long id) {
        TutorProfile t = tutorRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Tutor not found: " + id));
        if (t.getUser().getRole() != User.Role.TUTOR)
            throw new RuntimeException("Tutor not found: " + id);
        return mapToDto(t, null, null);
    }

    @Override
    @Transactional
    public TutorProfileDto updateProfile(Long userId, UpdateTutorProfileRequest req) {
        TutorProfile t = tutorRepo.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Profile not found for user: " + userId));

        // Only update fields that are explicitly provided (non-null)
        if (req.getBio()             != null) t.setBio(req.getBio());
        if (req.getHourlyRate()      != null) t.setHourlyRate(req.getHourlyRate());
        if (req.getExperienceYears() != null) t.setExperienceYears(req.getExperienceYears());
        if (req.getEducation()            != null) t.setEducation(req.getEducation());
        if (req.getTeachingStandards() != null)
            t.setTeachingStandard(req.getTeachingStandards().isEmpty() ? null
                : String.join(",", req.getTeachingStandards()));
        if (req.getTeachingStandardOther() != null) t.setTeachingStandardOther(req.getTeachingStandardOther());
        if (req.getTeachingMode()    != null)
            t.setTeachingMode(TutorProfile.TeachingMode.valueOf(req.getTeachingMode()));
        if (req.getServiceRadiusKm() != null) t.setServiceRadiusKm(req.getServiceRadiusKm());
        if (req.getLatitude()        != null) t.setLatitude(req.getLatitude());
        if (req.getLongitude()       != null) t.setLongitude(req.getLongitude());
        if (req.getAddress()         != null) t.setAddress(req.getAddress());
        if (req.getCity()            != null) t.setCity(req.getCity());
        if (req.getState()           != null) t.setState(req.getState());

        // subjectIds: List<Long> — Jackson correctly deserializes JSON numbers as Long
        if (req.getSubjectIds() != null && !req.getSubjectIds().isEmpty()) {
            t.setSubjects(new HashSet<>(subjectRepo.findAllById(req.getSubjectIds())));
        } else if (req.getSubjectIds() != null && req.getSubjectIds().isEmpty()) {
            // Explicit empty list means clear all subjects
            t.setSubjects(new HashSet<>());
        }

        return mapToDto(tutorRepo.save(t), null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public TutorProfileDto getMyProfile(Long userId) {
        TutorProfile t = tutorRepo.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Profile not found for user: " + userId));
        return mapToDto(t, null, null);
    }

    // ── Mapping ──────────────────────────────────────────────────────────────

    private TutorProfileDto mapToDto(TutorProfile t, Double lat, Double lng) {
        Double dist = (lat != null && t.getLatitude() != null)
            ? calcDist(lat, lng, t.getLatitude(), t.getLongitude()) : null;

        // Full subject objects — for display on public profile
        Set<SubjectDto> subjectDtos = t.getSubjects().stream()
            .map(s -> SubjectDto.builder()
                .id(s.getId()).name(s.getName()).category(s.getCategory()).build())
            .collect(Collectors.toSet());

        // Subject IDs — for pre-filling the edit form directly (no frontend mapping needed)
        List<Long> subjectIds = t.getSubjects().stream()
            .map(s -> s.getId())
            .collect(Collectors.toList());

        // Documents
        List<TutorDocumentDto> docs = docRepo.findByTutorProfileId(t.getId()).stream()
            .map(d -> TutorDocumentDto.builder()
                .id(d.getId())
                .documentType(d.getDocumentType() != null ? d.getDocumentType().name() : null)
                .certificateName(d.getCertificateName())
                .fileUrl(d.getFileUrl())
                .verified(d.getVerified())
                .uploadedAt(d.getUploadedAt())
                .build())
            .collect(Collectors.toList());

        return TutorProfileDto.builder()
            .id(t.getId())
            .userId(t.getUser().getId())
            .fullName(t.getUser().getFullName())
            .email(t.getUser().getEmail())
            .profilePicture(t.getUser().getProfilePicture())
            .bio(t.getBio())
            .hourlyRate(t.getHourlyRate())
            .experienceYears(t.getExperienceYears())
            .education(t.getEducation())
            .teachingStandards(t.getTeachingStandard() != null && !t.getTeachingStandard().isBlank()
                ? Arrays.asList(t.getTeachingStandard().split(","))
                : new ArrayList<>())
            .teachingStandardOther(t.getTeachingStandardOther())
            .teachingMode(t.getTeachingMode() != null ? t.getTeachingMode().name() : null)
            .serviceRadiusKm(t.getServiceRadiusKm())
            .latitude(t.getLatitude())
            .longitude(t.getLongitude())
            .address(t.getAddress())
            .city(t.getCity())
            .state(t.getState())
            .available(t.getAvailable())
            .averageRating(t.getAverageRating())
            .totalReviews(t.getTotalReviews())
            .totalSessions(t.getTotalSessions())
            .subjects(subjectDtos)
            .subjectIds(subjectIds)        // ← now returned directly for the form
            .distanceKm(dist)
            .documents(docs)
            .build();
    }

    private double calcDist(double lat1, double lng1, double lat2, double lng2) {
        double R    = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a    = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                    + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                    * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
