package com.tutorfinder.service;

import com.tutorfinder.dto.*;
import java.util.List;

public interface TutorService {
    List<TutorProfileDto> searchNearbyTutors(TutorSearchRequest request);
    TutorProfileDto getTutorById(Long tutorId);
    TutorProfileDto updateProfile(Long userId, UpdateTutorProfileRequest request);
    TutorProfileDto getMyProfile(Long userId);
}
