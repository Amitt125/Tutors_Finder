export interface TutorDocument {
  id: number;
  documentType: 'ID_PROOF' | 'DEGREE' | 'CERTIFICATION' | 'OTHER';
  certificateName?: string;
  fileUrl: string;
  verified: boolean;
  uploadedAt: string;
}

export interface Subject {
  id: number;
  name: string;
  category?: string;
}

export interface TutorProfile {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  hourlyRate?: number;
  experienceYears?: number;
  education?: string;
  teachingStandards?: string[];     // multiple e.g. ["CLASS_1_5","BCOM"]
  teachingStandardOther?: string;
  teachingMode?: 'IN_PERSON' | 'ONLINE' | 'BOTH';
  serviceRadiusKm?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  isAvailable?: boolean;
  averageRating?: number;
  totalReviews?: number;
  totalSessions?: number;
  subjects?: Subject[];
  distanceKm?: number;
  documents?: TutorDocument[];
}

export interface TutorSearchRequest {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  subjectId?: number;
  minRate?: number;
  maxRate?: number;
  teachingMode?: string;
  teachingStandard?: string;
  minRating?: number;
  minExperience?: number;
}
