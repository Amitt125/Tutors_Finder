package com.tutorfinder.dto;

import lombok.*;
import java.time.DayOfWeek;
import java.time.LocalTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AvailabilityDto {
    private Long       id;
    private DayOfWeek  dayOfWeek;
    private LocalTime  startTime;
    private LocalTime  endTime;
    private Integer    slotDurationMinutes;
}
