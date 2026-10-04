import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Booking, BookingRequest, AvailabilitySlot, TimeSlot } from '../../shared/models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private api = inject(ApiService);

  // ── Bookings ──────────────────────────────────────────────────────────────
  create(req: BookingRequest): Observable<Booking> {
    return this.api.post<Booking>('/bookings', req);
  }

  getMyBookings(): Observable<Booking[]> {
    return this.api.get<Booking[]>('/bookings');
  }

  updateStatus(id: number, status: string): Observable<Booking> {
    return this.api.patch<Booking>(`/bookings/${id}/status`, null, { status });
  }

  // ── Availability ──────────────────────────────────────────────────────────
  /** Tutor saves their weekly availability */
  saveAvailability(slots: AvailabilitySlot[]): Observable<AvailabilitySlot[]> {
    return this.api.put<AvailabilitySlot[]>('/availability/me', slots);
  }

  /** Tutor gets their own availability */
  getMyAvailability(): Observable<AvailabilitySlot[]> {
    return this.api.get<AvailabilitySlot[]>('/availability/me');
  }

  /** Public — get weekly schedule for a tutor profile */
  getAvailabilityByProfile(tutorProfileId: number): Observable<AvailabilitySlot[]> {
    return this.api.get<AvailabilitySlot[]>(`/availability/profile/${tutorProfileId}`);
  }

  /** Public — get available time slots for a tutor on a date */
  getAvailableSlots(tutorUserId: number, date: string): Observable<TimeSlot[]> {
    return this.api.get<TimeSlot[]>(`/availability/slots/${tutorUserId}`, { date });
  }
}
