import { Injectable, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'tf_token';
  private readonly USER_KEY  = 'tf_user';

  private api    = inject(ApiService);
  private router = inject(Router);

  currentUser     = signal<User | null>(this.storedUser());
  isAuthenticated = signal<boolean>(!!this.getToken());

  userRole        = computed(() => this.currentUser()?.role ?? null);
  isStudent       = computed(() => this.userRole() === 'STUDENT');
  isTutor         = computed(() => this.userRole() === 'TUTOR');
  displayName     = computed(() => this.currentUser()?.fullName ?? '');
  profilePicture  = computed(() => this.currentUser()?.profilePicture ?? null);

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', req).pipe(tap(r => this.persist(r)));
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', req).pipe(tap(r => this.persist(r)));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }

  /** Call after profile picture upload to update navbar avatar instantly */
  updateProfilePicture(url: string): void {
    const user = this.currentUser();
    if (!user) return;
    const updated = { ...user, profilePicture: url };
    localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
    this.currentUser.set(updated);
  }

  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }

  private persist(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    const user: User = {
      id:             res.userId,
      email:          res.email,
      fullName:       res.fullName,
      role:           res.role as any,
      profilePicture: res.profilePicture ?? null,
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  private storedUser(): User | null {
    try {
      const u = localStorage.getItem(this.USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }
}
