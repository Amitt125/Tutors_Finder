export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'TUTOR' | 'ADMIN';
  profilePicture?: string | null;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  profileComplete: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: 'STUDENT' | 'TUTOR';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  role: string;
  userId: number;
  profilePicture?: string | null;
  profileComplete: boolean;
}
