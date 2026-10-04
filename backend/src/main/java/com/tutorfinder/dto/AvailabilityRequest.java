package com.tutorfinder.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.DayOfWeek;
import java.time.LocalTime;

@Data
public class AvailabilityRequest {
    @NotNull public DayOfWeek dayOfWeek;
    @NotNull public LocalTime startTime;
    @NotNull public LocalTime endTime;
    /** Slot duration in minutes. Defaults to 60. */
    public Integer slotDurationMinutes = 60;
}
