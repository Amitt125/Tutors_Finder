import { Component, inject, computed, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { Booking } from '../../../shared/models/booking.model';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="page-container">
      <div class="welcome-banner card">
        <div class="banner-content">
          <div class="banner-avatar">{{ initials(auth.displayName()) }}</div>
          <div>
            <h1>Welcome, {{ auth.displayName().split(' ')[0] }}!</h1>
            <p>Ready to learn something new today?</p>
          </div>
          <a mat-raised-button routerLink="/search" class="find-btn">
            <mat-icon>search</mat-icon> Find Tutors
          </a>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card card">
          <mat-icon>event_available</mat-icon>
          <div><strong>{{ completedCount() }}</strong><span>Completed</span></div>
        </div>
        <div class="stat-card card">
          <mat-icon>pending</mat-icon>
          <div><strong>{{ upcomingCount() }}</strong><span>Upcoming</span></div>
        </div>
      </div>

      <div class="card">
        <div class="section-header">
          <h2>Upcoming Sessions</h2>
          <a mat-button routerLink="/bookings">View All</a>
        </div>
        @if (bookingsRes.isLoading()) {
          <p style="color:#94a3b8;padding:12px">Loading sessions…</p>
        }
        @for (b of upcoming().slice(0, 5); track b.id) {
          <div class="booking-row">
            <div class="mini-avatar">{{ initials(b.tutorName) }}</div>
            <div>
              <strong>{{ b.tutorName }}</strong>
              <span>{{ b.subjectName }} · {{ b.sessionDate }} {{ b.startTime }}</span>
            </div>
            <span class="badge" [class]="'badge-' + statusClass(b.status)">{{ b.status }}</span>
          </div>
        } @empty {
          @if (!bookingsRes.isLoading()) {
            <div class="empty-state">
              <mat-icon>calendar_today</mat-icon>
              <h3>No upcoming sessions</h3>
              <a mat-raised-button routerLink="/search" class="btn-primary" style="margin-top:12px">
                Find a Tutor
              </a>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding-top:24px; }
    .welcome-banner { margin-bottom:24px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white; }
    .banner-content { display:flex;align-items:center;gap:20px; }
    .banner-avatar { width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700; }
    h1 { font-size:24px;font-weight:700;margin-bottom:4px; }
    .banner-content p { opacity:.8; }
    .find-btn { margin-left:auto;background:white !important;color:#4f46e5 !important; }
    .stats-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:24px;max-width:400px; }
    .stat-card { display:flex;align-items:center;gap:16px; }
    .stat-card mat-icon { font-size:36px;width:36px;height:36px;color:#4f46e5; }
    .stat-card strong { display:block;font-size:24px;font-weight:700; }
    .stat-card span { font-size:13px;color:#64748b; }
    .booking-row { display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f1f5f9; }
    .booking-row:last-child { border:none; }
    .booking-row div:nth-child(2) { flex:1; }
    .booking-row strong { display:block;font-size:14px;font-weight:600; }
    .booking-row span { font-size:13px;color:#94a3b8; }
    .mini-avatar { width:36px;height:36px;min-width:36px;border-radius:50%;background:#4f46e5;color:white;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px; }
  `]
})
export class StudentDashboardComponent {
  auth           = inject(AuthService);
  bookingService = inject(BookingService);

  bookingsRes = resource<Booking[], void>({
    loader: () => firstValueFrom(this.bookingService.getMyBookings())
  });

  bookings       = computed(() => (this.bookingsRes.value() as Booking[] | undefined) ?? []);
  upcoming       = computed(() => this.bookings().filter(b => ['PENDING','CONFIRMED'].includes(b.status)));
  upcomingCount  = computed(() => this.upcoming().length);
  completedCount = computed(() => this.bookings().filter(b => b.status === 'COMPLETED').length);

  initials(n: string)    { return (n ?? '').split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2); }
  statusClass(s: string) { return ({ CONFIRMED:'success', PENDING:'warning', CANCELLED:'danger', COMPLETED:'info' } as any)[s] ?? 'warning'; }
}
