import { Component, inject, computed, signal, resource, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe, DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { TutorService } from '../../../core/services/tutor.service';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { TutorProfile } from '../../../shared/models/tutor.model';
import { Booking } from '../../../shared/models/booking.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-tutor-dashboard',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink, DecimalPipe, DatePipe,
            MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container">

      <!-- Welcome banner -->
      <div class="welcome-banner card">
        <div class="banner-content">
          @if (auth.profilePicture() || profile()?.profilePicture) {
            <img [src]="auth.profilePicture() ?? profile()!.profilePicture"
                 alt="profile" class="banner-avatar-img" />
          } @else {
            <div class="banner-avatar">{{ initials(auth.displayName()) }}</div>
          }
          <div>
            <h1>Welcome, {{ firstName() }}!</h1>
            @if (profile()?.city) {
              <p>{{ profile()!.city }}@if (profile()?.state) { · {{ profile()!.state }} }</p>
            } @else {
              <p class="setup-hint">
                <mat-icon style="font-size:16px;width:16px;height:16px;vertical-align:middle">info</mat-icon>
                Complete your profile so students can find you
              </p>
            }
          </div>
          @if (profile()) {
            <span class="badge" [class]="profile()!.isAvailable ? 'badge-success' : 'badge-danger'"
                  style="margin-left:auto">
              {{ profile()!.isAvailable ? '● Available' : '○ Not Available' }}
            </span>
          }
        </div>
        @if (profileRes.value() && !profile()?.bio) {
          <div class="incomplete-alert">
            <mat-icon>warning</mat-icon>
            Your profile is incomplete — students can't find you yet.
            <a routerLink="/tutor/profile-setup" style="margin-left:8px;color:#92400e;font-weight:600">
              Complete Profile →
            </a>
          </div>
        }
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card card">
          <mat-icon>star</mat-icon>
          <div>
            <strong>{{ profile()?.averageRating ? (profile()!.averageRating! | number:'1.1-1') : '—' }}</strong>
            <span>Avg Rating</span>
          </div>
        </div>
        <div class="stat-card card">
          <mat-icon>event_available</mat-icon>
          <div><strong>{{ profile()?.totalSessions ?? 0 }}</strong><span>Sessions</span></div>
        </div>
        <div class="stat-card card" [class.pending-highlight]="pendingCount() > 0">
          <mat-icon>pending_actions</mat-icon>
          <div>
            <strong>{{ pendingCount() }}</strong>
            <span>Pending Requests</span>
          </div>
          @if (pendingCount() > 0) {
            <span class="pending-dot"></span>
          }
        </div>
        <div class="stat-card card">
          <mat-icon>payments</mat-icon>
          <div>
            <strong>{{ profile()?.hourlyRate ? '₹' + profile()!.hourlyRate : 'Not set' }}</strong>
            <span>Your Rate /hr</span>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">

        <!-- Pending booking requests -->
        <div class="card">
          <div class="section-header">
            <h2>
              Booking Requests
              @if (pendingCount() > 0) {
                <span class="count-badge">{{ pendingCount() }} pending</span>
              }
            </h2>
          </div>
          @if (bookingsRes.isLoading()) {
            <p style="color:#94a3b8;padding:12px">Loading…</p>
          } @else if (pending().length === 0 && confirmed().length === 0) {
            <div class="empty-state">
              <mat-icon>event</mat-icon>
              <h3>No booking requests yet</h3>
              <p>When students book sessions with you, they'll appear here</p>
            </div>
          } @else {

            <!-- Pending requests — action needed -->
            @if (pending().length > 0) {
              <div class="booking-section-label">Awaiting your response</div>
              @for (b of pending(); track b.id) {
                <div class="booking-row pending-row">
                  <div class="mini-avatar">{{ initials(b.studentName) }}</div>
                  <div class="booking-info">
                    <strong>{{ b.studentName }}</strong>
                    <span>
                      {{ b.sessionDate | date:'mediumDate' }} ·
                      {{ b.startTime }} – {{ b.endTime }} ·
                      {{ b.subjectName ?? 'General' }}
                    </span>
                  </div>
                  <div class="booking-actions">
                    <button mat-raised-button class="btn-confirm"
                            (click)="updateStatus(b, 'CONFIRMED')"
                            [disabled]="updatingId() === b.id">
                      @if (updatingId() === b.id) {
                        <mat-spinner diameter="14" style="display:inline-block;margin-right:4px" />
                      } @else { <mat-icon>check</mat-icon> }
                      Confirm
                    </button>
                    <button mat-stroked-button class="btn-reject"
                            (click)="updateStatus(b, 'CANCELLED')"
                            [disabled]="updatingId() === b.id">
                      <mat-icon>close</mat-icon> Reject
                    </button>
                  </div>
                </div>
              }
            }

            <!-- Confirmed upcoming sessions -->
            @if (confirmed().length > 0) {
              <div class="booking-section-label" style="margin-top:16px">Confirmed sessions</div>
              @for (b of confirmed().slice(0, 4); track b.id) {
                <div class="booking-row">
                  <div class="mini-avatar confirmed-avatar">{{ initials(b.studentName) }}</div>
                  <div class="booking-info">
                    <strong>{{ b.studentName }}</strong>
                    <span>
                      {{ b.sessionDate | date:'mediumDate' }} ·
                      {{ b.startTime }} – {{ b.endTime }} ·
                      {{ b.subjectName ?? 'General' }}
                    </span>
                  </div>
                  <span class="badge badge-success">Confirmed</span>
                </div>
              }
            }
          }
          <a mat-button routerLink="/bookings" style="margin-top:12px;display:block;text-align:center">
            View All Bookings →
          </a>
        </div>

        <!-- Quick actions -->
        <div class="card quick-actions">
          <h2>Quick Actions</h2>
          <a mat-stroked-button routerLink="/tutor/profile-setup">
            <mat-icon>edit</mat-icon> Edit Profile & Availability
          </a>
          <a mat-stroked-button routerLink="/bookings">
            <mat-icon>event</mat-icon> All Bookings
          </a>
          <a mat-stroked-button routerLink="/messages">
            <mat-icon>chat</mat-icon> Messages
          </a>
          </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding-top:24px; }
    .welcome-banner { margin-bottom:24px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white; }
    .banner-content { display:flex;align-items:center;gap:20px; }
    .banner-avatar { width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;flex-shrink:0; }
    .banner-avatar-img { width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.4);flex-shrink:0; }
    h1 { font-size:24px;font-weight:700;margin-bottom:4px; }
    .banner-content p { opacity:.85;margin:0; }
    .setup-hint { display:flex;align-items:center;gap:4px;font-size:14px; }
    .incomplete-alert { margin-top:16px;background:rgba(255,255,255,.15);border-radius:8px;padding:10px 14px;font-size:14px;display:flex;align-items:center;gap:8px; }
    .stats-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px; }
    .stat-card { display:flex;align-items:center;gap:16px;position:relative; }
    .stat-card mat-icon { font-size:36px;width:36px;height:36px;color:#4f46e5; }
    .stat-card strong { display:block;font-size:22px;font-weight:700; }
    .stat-card span { font-size:13px;color:#64748b; }
    .pending-highlight { border-color:#f59e0b !important;background:#fffbeb !important; }
    .pending-highlight mat-icon { color:#f59e0b !important; }
    .pending-dot { position:absolute;top:12px;right:12px;width:10px;height:10px;border-radius:50%;background:#ef4444;animation:pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
    .dashboard-grid { display:grid;grid-template-columns:1fr 260px;gap:24px; }
    .section-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:16px; }
    .section-header h2 { font-size:18px;font-weight:700;display:flex;align-items:center;gap:10px; }
    .count-badge { background:#ef4444;color:white;font-size:11px;font-weight:700;padding:2px 8px;border-radius:100px; }
    .booking-section-label { font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px; }
    .empty-state { text-align:center;padding:32px 16px;color:#94a3b8; }
    .empty-state mat-icon { font-size:48px;width:48px;height:48px;margin-bottom:8px; }
    .booking-row { display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f1f5f9; }
    .booking-row:last-child { border:none; }
    .pending-row { background:#fffbeb;border-radius:10px;padding:12px;border:1px solid #fde68a !important;margin-bottom:8px; }
    .booking-info { flex:1; }
    .booking-info strong { display:block;font-size:14px;font-weight:600; }
    .booking-info span { font-size:13px;color:#94a3b8; }
    .mini-avatar { width:36px;height:36px;min-width:36px;border-radius:50%;background:#4f46e5;color:white;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px; }
    .confirmed-avatar { background:#059669; }
    .booking-actions { display:flex;gap:6px;flex-shrink:0; }
    .btn-confirm { background:#059669 !important;color:white !important;border-radius:8px !important;font-size:12px !important;height:34px !important;padding:0 10px !important;display:inline-flex !important;align-items:center !important;gap:2px !important; }
    .btn-reject { border-color:#ef4444 !important;color:#ef4444 !important;border-radius:8px !important;font-size:12px !important;height:34px !important;padding:0 10px !important;display:inline-flex !important;align-items:center !important;gap:2px !important; }
    .btn-reject mat-icon, .btn-confirm mat-icon { font-size:16px;width:16px;height:16px; }
    .quick-actions { display:flex;flex-direction:column;gap:12px; }
    .quick-actions h2 { margin-bottom:4px;font-size:18px;font-weight:700; }
    .quick-actions a { justify-content:flex-start !important;gap:8px;border-radius:8px !important; }
    @media (max-width:768px) { .stats-grid { grid-template-columns:repeat(2,1fr); } .dashboard-grid { grid-template-columns:1fr; } }
  `]
})
export class TutorDashboardComponent implements OnInit {
  private tutorService   = inject(TutorService);
  private bookingService = inject(BookingService);
  private snack          = inject(MatSnackBar);
  auth = inject(AuthService);

  profileRes = resource<TutorProfile, void>({
    loader: () => firstValueFrom(this.tutorService.getMyProfile())
  });
  bookingsRes = resource<Booking[], void>({
    loader: () => firstValueFrom(this.bookingService.getMyBookings())
  });

  profile    = computed(() => this.profileRes.value() as TutorProfile | undefined);
  bookings   = computed(() => (this.bookingsRes.value() as Booking[] | undefined) ?? []);
  pending    = computed(() => this.bookings().filter(b => b.status === 'PENDING'));
  confirmed  = computed(() => this.bookings().filter(b => b.status === 'CONFIRMED'));
  pendingCount = computed(() => this.pending().length);
  firstName  = computed(() => this.auth.displayName().split(' ')[0] || 'there');
  updatingId = signal<number | null>(null);

  ngOnInit() {}

  updateStatus(b: Booking, status: string) {
    this.updatingId.set(b.id);
    this.bookingService.updateStatus(b.id, status).subscribe({
      next: () => {
        this.snack.open(
          status === 'CONFIRMED' ? '✅ Booking confirmed!' : 'Booking rejected.',
          'Close', { duration: 3000 }
        );
        this.updatingId.set(null);
        this.bookingsRes.reload();
      },
      error: () => {
        this.snack.open('Update failed', 'Close', { duration: 3000 });
        this.updatingId.set(null);
      }
    });
  }

  initials(n: string) { return (n ?? '').split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) || '?'; }
}
