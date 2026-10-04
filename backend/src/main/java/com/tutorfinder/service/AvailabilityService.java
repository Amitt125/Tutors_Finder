package com.tutorfinder.service;

import com.tutorfinder.dto.AvailabilityDto;
import com.tutorfinder.dto.AvailabilityRequest;
import com.tutorfinder.dto.TimeSlotDto;
import java.time.LocalDate;
import java.util.List;

public interface AvailabilityService {
    /** Save full weekly schedule for the logged-in tutor (replaces existing) */
    List<AvailabilityDto> saveAvailability(Long tutorUserId, List<AvailabilityRequest> slots);

    /** Get weekly availability for any tutor profile */
    List<AvailabilityDto> getAvailability(Long tutorProfileId);

    /** Generate available time slots for a tutor on a specific date */
    List<TimeSlotDto> getAvailableSlots(Long tutorUserId, LocalDate date);
}
