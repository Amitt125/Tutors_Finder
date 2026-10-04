package com.tutorfinder.service;
import com.tutorfinder.dto.*;
import java.util.List;
public interface BookingService {
    BookingDto createBooking(Long studentId, BookingRequest request);
    BookingDto updateStatus(Long bookingId, String status, Long userId);
    List<BookingDto> getMyBookings(Long userId, String role);
}
