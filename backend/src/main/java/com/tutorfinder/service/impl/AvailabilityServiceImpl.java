package com.tutorfinder.service.impl;

import com.tutorfinder.dto.AvailabilityDto;
import com.tutorfinder.dto.AvailabilityRequest;
import com.tutorfinder.dto.TimeSlotDto;
import com.tutorfinder.entity.*;
import com.tutorfinder.repository.*;
import com.tutorfinder.service.AvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvailabilityServiceImpl implements AvailabilityService {

    private final TutorAvailabilityRepository availRepo;
    private final TutorProfileRepository      tutorRepo;
    private final BookingRepository           bookingRepo;
    private final UserRepository              userRepo;

    @Override
    @Transactional
    public List<AvailabilityDto> saveAvailability(Long tutorUserId, List<AvailabilityRequest> slots) {
        TutorProfile profile = tutorRepo.findByUserId(tutorUserId)
            .orElseThrow(() -> new RuntimeException("Tutor profile not found"));

        // Replace all existing availability for this tutor
        availRepo.deleteByTutorProfileId(profile.getId());

        List<TutorAvailability> saved = slots.stream().map(req -> {
            if (req.getEndTime().isBefore(req.getStartTime()) ||
                req.getEndTime().equals(req.getStartTime()))
                throw new RuntimeException("End time must be after start time for " + req.getDayOfWeek());

            int duration = req.getSlotDurationMinutes() != null ? req.getSlotDurationMinutes() : 60;
            if (duration < 15 || duration > 480)
                throw new RuntimeException("Slot duration must be between 15 and 480 minutes");

            return TutorAvailability.builder()
                .tutorProfile(profile)
                .dayOfWeek(req.getDayOfWeek())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .slotDurationMinutes(duration)
                .build();
        }).collect(Collectors.toList());

        return availRepo.saveAll(saved).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailabilityDto> getAvailability(Long tutorProfileId) {
        return availRepo.findByTutorProfileId(tutorProfileId).stream()
            .map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeSlotDto> getAvailableSlots(Long tutorUserId, LocalDate date) {
        TutorProfile profile = tutorRepo.findByUserId(tutorUserId)
            .orElseThrow(() -> new RuntimeException("Tutor profile not found"));

        // Find availability rules for this day of week
        List<TutorAvailability> rules = availRepo
            .findByTutorProfileIdAndDayOfWeek(profile.getId(), date.getDayOfWeek());

        if (rules.isEmpty()) return List.of();

        // Collect already-booked start times for this date
        Set<LocalTime> bookedStarts = bookingRepo.findByTutorIdAndDate(tutorUserId, date)
            .stream()
            .map(Booking::getStartTime)
            .collect(Collectors.toSet());

        List<TimeSlotDto> slots = new ArrayList<>();

        for (TutorAvailability rule : rules) {
            int durationMins = rule.getSlotDurationMinutes() != null
                ? rule.getSlotDurationMinutes() : 60;

            LocalTime cursor = rule.getStartTime();
            while (!cursor.plusMinutes(durationMins).isAfter(rule.getEndTime())) {
                LocalTime slotEnd = cursor.plusMinutes(durationMins);
                slots.add(TimeSlotDto.builder()
                    .startTime(cursor)
                    .endTime(slotEnd)
                    .available(!bookedStarts.contains(cursor))
                    .build());
                cursor = slotEnd;
            }
        }

        return slots;
    }

    private AvailabilityDto mapToDto(TutorAvailability a) {
        return AvailabilityDto.builder()
            .id(a.getId())
            .dayOfWeek(a.getDayOfWeek())
            .startTime(a.getStartTime())
            .endTime(a.getEndTime())
            .slotDurationMinutes(a.getSlotDurationMinutes())
            .build();
    }
}
