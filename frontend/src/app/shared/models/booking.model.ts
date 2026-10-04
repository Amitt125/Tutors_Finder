export interface Booking {
  id: number;
  studentId: number;
  studentName: string;
  studentPicture?: string;
  tutorId: number;
  tutorName: string;
  tutorPicture?: string;
  subjectName?: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  teachingMode: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  hourlyRate?: number;
  totalAmount?: number;
  notes?: string;
  createdAt: string;
}

export interface BookingRequest {
  tutorId: number;
  subjectId?: number;
  sessionDate: string;
  startTime: string;
  endTime: string;
  teachingMode: string;
  notes?: string;
}

export interface AvailabilitySlot {
  id?: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Review {
  id: number;
  bookingId: number;
  studentId: number;
  studentName: string;
  studentPicture?: string;
  rating: number;
  comment?: string;
  tutorReply?: string;
  createdAt: string;
}

export interface ReviewRequest {
  bookingId: number;
  rating: number;
  comment?: string;
}
