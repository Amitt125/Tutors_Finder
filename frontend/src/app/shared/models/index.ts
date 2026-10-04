// src/app/shared/models/index.ts

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'TUTOR' | 'ADMIN';
  profilePhoto?: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface Subject {
  id: number;
  name: string;
  category: string;
  icon?: string;
}

export interface TutorProfile {
  tutorProfileId: number;
  userId: number;
  fullName: string;
  profilePhoto?: string;
  bio?: string;
  education?: string;
  experienceYears: number;
  hourlyRate: number;
  currency: string;
  teachingMode: 'IN_PERSON' | 'ONLINE' | 'BOTH';
  avgRating: number;
  totalReviews: number;
  totalSessions: number;
  locationAddress?: string;
  distanceKm?: number;
  isAvailable: boolean;
  subjects: Subject[];
}

export interface Booking {
  id: number;
  studentId: number;
  studentName: string;
  studentPhoto?: string;
  tutorProfileId: number;
  tutorName: string;
  tutorPhoto?: string;
  subjectName?: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  teachingMode: string;
  hourlyRate: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  meetingLink?: string;
  createdAt: string;
}

export interface Review {
  id: number;
  studentName: string;
  studentPhoto?: string;
  rating: number;
  comment?: string;
  tutorReply?: string;
  createdAt: string;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  sentAt: string;
}

export interface TutorSearchParams {
  lat: number;
  lng: number;
  radius?: number;
  subjectId?: number;
  mode?: string;
  maxRate?: number;
  limit?: number;
  keyword?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
