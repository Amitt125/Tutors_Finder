import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DatePipe } from '@angular/common';
import { BookingService } from '../../core/services/booking.service';
import { MessageService } from '../../core/services/message.service';
import { ReviewService } from '../../core/services/review.service';
import { AuthService } from '../../core/services/auth.service';
import { Booking } from '../../shared/models/booking.model';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTabsModule,
            MatProgressSpinnerModule, MatSnackBarModule,
            MatInputModule, MatFormFieldModule, FormsModule,
            DatePipe, RouterLink],
  template: `
    <div class="page-container">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>My Bookings</h1>
          <p class="sub">{{ isStudent ? 'Track your session requests and their status' : 'Manage student booking requests' }}</p>
        </div>
        @if (isStudent) {
          <a mat-raised-button class="btn-primary" routerLink="/search">
            <mat-icon>search</mat-icon> Find a Tutor
          </a>
        }
      </div>

      @if (loading()) {
        <div class="spinner-wrap"><mat-spinner diameter="48" /></div>
      } @else {

        <!-- Stats row (student only) -->
        @if (isStudent) {
          <div class="stats-row">
            <div class="stat-pill pending">
              <mat-icon>hourglass_top</mat-icon>
              <strong>{{ pending().length }}</strong> Pending
            </div>
            <div class="stat-pill confirmed">
              <mat-icon>event_available</mat-icon>
              <strong>{{ confirmed().length }}</strong> Confirmed
            </div>
            <div class="stat-pill completed">
              <mat-icon>check_circle</mat-icon>
              <strong>{{ completed().length }}</strong> Completed
            </div>
            <div class="stat-pill cancelled">
              <mat-icon>cancel</mat-icon>
              <strong>{{ cancelled().length }}</strong> Cancelled
            </div>
          </div>
        }

        <mat-tab-group animationDuration="200ms"
                       [selectedIndex]="selectedTab()"
                       (selectedIndexChange)="selectedTab.set($event)">

          <!-- ══════════════════ PENDING TAB ══════════════════ -->
          <mat-tab>
            <ng-template mat-tab-label>
              Pending
              @if (pending().length > 0) {
                <span class="tab-badge">{{ pending().length }}</span>
              }
            </ng-template>
            <div class="bookings-list">
              @if (pendingOrJustConfirmed().length === 0) {
                <div class="empty-state">
                  <mat-icon>hourglass_empty</mat-icon>
                  <h3>No pending bookings</h3>
                  @if (isStudent) { <p>Book a session from a tutor's profile</p> }
                </div>
              }
              @for (b of pendingOrJustConfirmed(); track b.id) {
                <div class="booking-card card"
                     [class.confirmed-card]="justConfirmedId() === b.id">
                  <div class="status-strip"
                       [class.pending-strip]="b.status === 'PENDING'"
                       [class.confirmed-strip]="b.status === 'CONFIRMED'"></div>
                  <div class="booking-body">
                    <div class="booking-who">
                      <div class="mini-avatar"
                           [class.confirmed-avatar]="justConfirmedId() === b.id">
                        {{ initials(isStudent ? b.tutorName : b.studentName) }}
                      </div>
                      <div>
                        <strong>{{ isStudent ? b.tutorName : b.studentName }}</strong>
                        @if (b.subjectName) { <span class="subject">{{ b.subjectName }}</span> }
                      </div>
                      @if (justConfirmedId() === b.id) {
                        <span class="badge badge-success status-badge">✓ Confirmed</span>
                      } @else {
                        <span class="badge badge-warning status-badge">⏳ Pending</span>
                      }
                    </div>
                    <div class="booking-details">
                      <span><mat-icon>calendar_today</mat-icon>{{ b.sessionDate | date:'EEE, dd MMM yyyy' }}</span>
                      <span><mat-icon>access_time</mat-icon>{{ b.startTime }} – {{ b.endTime }}</span>
                      <span><mat-icon>{{ b.teachingMode === 'ONLINE' ? 'videocam' : 'home' }}</mat-icon>{{ b.teachingMode }}</span>
                      @if (b.totalAmount) { <span><mat-icon>payments</mat-icon>₹{{ b.totalAmount }}</span> }
                    </div>
                    @if (b.notes) { <p class="notes">📝 {{ b.notes }}</p> }

                    @if (isStudent) {
                      <div class="booking-hint">
                        <mat-icon>info</mat-icon> Waiting for the tutor to confirm your request
                      </div>
                    }

                    <!-- Tutor: Confirm/Reject OR Share Meeting Link after confirming -->
                    @if (!isStudent) {
                      @if (justConfirmedId() === b.id) {
                        <!-- Just confirmed — show Share Meeting Link immediately -->
                        <div class="session-box" style="margin-top:12px">
                          <p class="session-box-title">
                            <mat-icon>videocam</mat-icon>
                            Booking confirmed! Share a meeting link with the student now.
                          </p>
                          <div class="link-input-row">
                            <input class="link-input" [(ngModel)]="meetingLink"
                                   placeholder="Paste Google Meet / Zoom / Teams link…">
                            <button mat-raised-button class="btn-send-link"
                                    (click)="sendMeetingLink(b)"
                                    [disabled]="!meetingLink.trim()">
                              <mat-icon>send</mat-icon> Send to Student
                            </button>
                          </div>
                          <p class="link-hint">The link will be sent to the student via chat.</p>
                          <button mat-button style="color:#64748b;font-size:12px;margin-top:4px"
                                  (click)="justConfirmedId.set(null); selectedTab.set(1)">
                            Skip — I'll share later →
                          </button>
                        </div>
                      } @else {
                        <div class="booking-actions">
                          <button mat-raised-button class="btn-confirm"
                                  (click)="updateStatus(b, 'CONFIRMED')"
                                  [disabled]="updatingId() === b.id">
                            @if (updatingId() === b.id) {
                              <mat-spinner diameter="16" style="display:inline-block;margin-right:4px"/>
                            } @else { <mat-icon>check</mat-icon> }
                            Confirm
                          </button>
                          <button mat-stroked-button class="btn-reject"
                                  (click)="updateStatus(b, 'CANCELLED')"
                                  [disabled]="updatingId() === b.id">
                            <mat-icon>close</mat-icon> Reject
                          </button>
                        </div>
                      }
                    }

                    <!-- Student cancel -->
                    @if (isStudent) {
                      <div class="booking-actions">
                        <button mat-stroked-button class="btn-cancel"
                                (click)="updateStatus(b, 'CANCELLED')"
                                [disabled]="updatingId() === b.id">
                          <mat-icon>cancel</mat-icon> Cancel Request
                        </button>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </mat-tab>

          <!-- ══════════════════ CONFIRMED TAB ══════════════════ -->
          <mat-tab>
            <ng-template mat-tab-label>
              Confirmed
              @if (confirmed().length > 0) {
                <span class="tab-badge confirmed-badge">{{ confirmed().length }}</span>
              }
            </ng-template>
            <div class="bookings-list">
              @if (confirmed().length === 0) {
                <div class="empty-state">
                  <mat-icon>event_available</mat-icon>
                  <h3>No confirmed sessions yet</h3>
                </div>
              }
              @for (b of confirmed(); track b.id) {
                <div class="booking-card card">
                  <div class="status-strip confirmed-strip"></div>
                  <div class="booking-body">
                    <div class="booking-who">
                      <div class="mini-avatar confirmed-avatar">
                        {{ initials(isStudent ? b.tutorName : b.studentName) }}
                      </div>
                      <div>
                        <strong>{{ isStudent ? b.tutorName : b.studentName }}</strong>
                        @if (b.subjectName) { <span class="subject">{{ b.subjectName }}</span> }
                      </div>
                      <span class="badge badge-success status-badge">✓ Confirmed</span>
                    </div>
                    <div class="booking-details">
                      <span><mat-icon>calendar_today</mat-icon>{{ b.sessionDate | date:'EEE, dd MMM yyyy' }}</span>
                      <span><mat-icon>access_time</mat-icon>{{ b.startTime }} – {{ b.endTime }}</span>
                      <span><mat-icon>{{ b.teachingMode === 'ONLINE' ? 'videocam' : 'home' }}</mat-icon>{{ b.teachingMode }}</span>
                      @if (b.totalAmount) { <span><mat-icon>payments</mat-icon>₹{{ b.totalAmount }}</span> }
                    </div>
                    @if (b.notes) { <p class="notes">📝 {{ b.notes }}</p> }

                    <!-- Mark completed -->
                    <div class="booking-actions" style="margin-top:12px">
                      <button mat-raised-button class="btn-complete"
                              (click)="updateStatus(b, 'COMPLETED')"
                              [disabled]="updatingId() === b.id">
                        @if (updatingId() === b.id) {
                          <mat-spinner diameter="16" style="display:inline-block;margin-right:4px"/>
                        } @else { <mat-icon>done_all</mat-icon> }
                        Mark Session Completed
                      </button>
                    </div>

                    <!-- Tutor: Share Meeting Link -->
                    @if (!isStudent) {
                      <div class="session-box" style="margin-top:12px">
                        <p class="session-box-title">
                          <mat-icon>videocam</mat-icon> Share a meeting link with the student
                        </p>
                        @if (sharingId() === b.id) {
                          <div class="link-input-row">
                            <input class="link-input" [(ngModel)]="meetingLink"
                                   placeholder="Paste Google Meet / Zoom / Teams link…">
                            <button mat-raised-button class="btn-send-link"
                                    (click)="sendMeetingLink(b)"
                                    [disabled]="!meetingLink.trim()">
                              <mat-icon>send</mat-icon> Send
                            </button>
                            <button mat-icon-button (click)="sharingId.set(null)">
                              <mat-icon>close</mat-icon>
                            </button>
                          </div>
                          <p class="link-hint">The link will be sent to the student via chat.</p>
                        } @else {
                          <button mat-stroked-button class="btn-share-link"
                                  (click)="startShare(b.id)">
                            <mat-icon>link</mat-icon> Share Meeting Link
                          </button>
                        }
                      </div>
                    }

                    <!-- Student: open chat -->
                    @if (isStudent) {
                      <div class="session-box student-session-box" style="margin-top:12px">
                        <p class="session-box-title">
                          <mat-icon>videocam</mat-icon> Check your chat for the meeting link from the tutor
                        </p>
                        <button mat-raised-button class="btn-go-chat" (click)="goToChat(b)">
                          <mat-icon>chat</mat-icon> Open Chat with Tutor
                        </button>
                      </div>
                    }

                  </div>
                </div>
              }
            </div>
          </mat-tab>

          <!-- ══════════════════ COMPLETED TAB ══════════════════ -->
          <mat-tab [label]="'Completed (' + completed().length + ')'">
            <div class="bookings-list">
              @if (completed().length === 0) {
                <div class="empty-state">
                  <mat-icon>check_circle</mat-icon>
                  <h3>No completed sessions</h3>
                </div>
              }
              @for (b of completed(); track b.id) {
                <div class="booking-card card">
                  <div class="status-strip completed-strip"></div>
                  <div class="booking-body">
                    <div class="booking-who">
                      <div class="mini-avatar completed-avatar">
                        {{ initials(isStudent ? b.tutorName : b.studentName) }}
                      </div>
                      <div>
                        <strong>{{ isStudent ? b.tutorName : b.studentName }}</strong>
                        @if (b.subjectName) { <span class="subject">{{ b.subjectName }}</span> }
                      </div>
                      <span class="badge badge-info status-badge">✔ Completed</span>
                    </div>
                    <div class="booking-details">
                      <span><mat-icon>calendar_today</mat-icon>{{ b.sessionDate | date:'EEE, dd MMM yyyy' }}</span>
                      <span><mat-icon>access_time</mat-icon>{{ b.startTime }} – {{ b.endTime }}</span>
                      @if (b.totalAmount) { <span><mat-icon>payments</mat-icon>₹{{ b.totalAmount }}</span> }
                    </div>

                    <!-- ── Review section (students only) ── -->
                    @if (isStudent) {
                      @if (reviewedBookingIds().has(b.id)) {
                        <div class="review-done">
                          <mat-icon>star</mat-icon> You have reviewed this session.
                          <a mat-button [routerLink]="['/tutor', b.tutorId]"
                             style="color:#4f46e5;font-size:13px">View on tutor profile →</a>
                        </div>
                      } @else if (reviewingId() === b.id) {
                        <!-- Star rating form -->
                        <div class="review-form">
                          <p class="review-form-title">
                            <mat-icon>star_rate</mat-icon>
                            Rate your session with {{ b.tutorName }}
                          </p>
                          <div class="star-picker">
                            @for (star of [1,2,3,4,5]; track star) {
                              <button class="star-btn"
                                      [class.filled]="star <= (hoverRating() || selectedRating())"
                                      (mouseenter)="hoverRating.set(star)"
                                      (mouseleave)="hoverRating.set(0)"
                                      (click)="selectedRating.set(star)"
                                      type="button">★</button>
                            }
                            <span class="rating-label">
                              {{ ratingLabel(hoverRating() || selectedRating()) }}
                            </span>
                          </div>
                          <textarea class="review-textarea"
                                    [(ngModel)]="reviewComment"
                                    placeholder="Share your experience (optional)…"
                                    rows="3"></textarea>
                          <div class="review-actions">
                            <button mat-raised-button class="btn-submit-review"
                                    (click)="submitReview(b)"
                                    [disabled]="selectedRating() === 0 || submittingReview()">
                              @if (submittingReview()) {
                                <mat-spinner diameter="16" style="display:inline-block;margin-right:4px"/>
                              } @else { <mat-icon>send</mat-icon> }
                              Submit Review
                            </button>
                            <button mat-button (click)="reviewingId.set(null)">Cancel</button>
                          </div>
                        </div>
                      } @else {
                        <button mat-stroked-button class="btn-write-review"
                                (click)="startReview(b.id)">
                          <mat-icon>star_border</mat-icon> Write a Review
                        </button>
                      }
                    }

                    <!-- Tutor hint -->
                    @if (!isStudent) {
                      <div class="tutor-review-hint">
                        <mat-icon>info</mat-icon>
                        Student reviews appear on your public profile.
                      </div>
                    }

                  </div>
                </div>
              }
            </div>
          </mat-tab>

          <!-- ══════════════════ CANCELLED TAB ══════════════════ -->
          <mat-tab [label]="'Cancelled (' + cancelled().length + ')'">
            <div class="bookings-list">
              @if (cancelled().length === 0) {
                <div class="empty-state">
                  <mat-icon>cancel</mat-icon>
                  <h3>No cancelled bookings</h3>
                </div>
              }
              @for (b of cancelled(); track b.id) {
                <div class="booking-card card">
                  <div class="status-strip cancelled-strip"></div>
                  <div class="booking-body">
                    <div class="booking-who">
                      <div class="mini-avatar cancelled-avatar">
                        {{ initials(isStudent ? b.tutorName : b.studentName) }}
                      </div>
                      <div>
                        <strong>{{ isStudent ? b.tutorName : b.studentName }}</strong>
                        @if (b.subjectName) { <span class="subject">{{ b.subjectName }}</span> }
                      </div>
                      <span class="badge badge-danger status-badge">✕ Cancelled</span>
                    </div>
                    <div class="booking-details">
                      <span><mat-icon>calendar_today</mat-icon>{{ b.sessionDate | date:'EEE, dd MMM yyyy' }}</span>
                      <span><mat-icon>access_time</mat-icon>{{ b.startTime }} – {{ b.endTime }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </mat-tab>

        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .page-container { padding-top:24px; }
    .page-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:24px; }
    .page-header h1 { font-size:26px;font-weight:700;margin-bottom:4px; }
    .sub { color:#64748b;font-size:14px; }
    .spinner-wrap { display:flex;justify-content:center;padding:80px; }
    .stats-row { display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px; }
    .stat-pill { display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:100px;font-size:14px;font-weight:500; }
    .stat-pill mat-icon { font-size:18px;width:18px;height:18px; }
    .stat-pill strong { font-size:18px;font-weight:700; }
    .stat-pill.pending   { background:#fffbeb;color:#92400e; }
    .stat-pill.confirmed { background:#ecfdf5;color:#065f46; }
    .stat-pill.completed { background:#eff6ff;color:#1e40af; }
    .stat-pill.cancelled { background:#fef2f2;color:#991b1b; }
    .tab-badge { margin-left:6px;background:#ef4444;color:white;font-size:10px;font-weight:700;padding:1px 6px;border-radius:100px;vertical-align:middle; }
    .confirmed-badge { background:#059669 !important; }
    .bookings-list { padding:16px 0;display:flex;flex-direction:column;gap:14px; }
    .booking-card { padding:0;display:flex;overflow:hidden;border-radius:12px !important; }
    .confirmed-card { border:2px solid #bbf7d0 !important; }
    .status-strip { width:5px;flex-shrink:0; }
    .pending-strip   { background:#f59e0b; }
    .confirmed-strip { background:#059669; }
    .completed-strip { background:#3b82f6; }
    .cancelled-strip { background:#ef4444; }
    .booking-body { flex:1;padding:18px 20px; }
    .booking-who { display:flex;align-items:center;gap:12px;margin-bottom:14px; }
    .booking-who > div:nth-child(2) { flex:1; }
    .booking-who strong { display:block;font-size:15px;font-weight:600; }
    .subject { font-size:13px;color:#64748b; }
    .status-badge { margin-left:auto;flex-shrink:0; }
    .mini-avatar { width:40px;height:40px;min-width:40px;border-radius:50%;background:#4f46e5;color:white;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px; }
    .confirmed-avatar { background:#059669; }
    .completed-avatar { background:#3b82f6; }
    .cancelled-avatar { background:#94a3b8; }
    .booking-details { display:flex;flex-wrap:wrap;gap:14px;font-size:13px;color:#64748b;margin-bottom:12px; }
    .booking-details span { display:flex;align-items:center;gap:4px; }
    .booking-details mat-icon { font-size:15px;width:15px;height:15px;color:#4f46e5; }
    .notes { font-size:13px;color:#475569;background:#f8fafc;border-radius:6px;padding:8px 12px;margin-bottom:12px; }
    .booking-hint { display:flex;align-items:center;gap:6px;font-size:13px;color:#92400e;background:#fffbeb;border-radius:8px;padding:8px 12px;margin-bottom:12px; }
    .booking-hint mat-icon { font-size:16px;width:16px;height:16px; }
    .booking-actions { display:flex;gap:8px;flex-wrap:wrap; }
    .btn-confirm  { background:#059669 !important;color:white !important;border-radius:8px !important;display:inline-flex !important;align-items:center !important;gap:4px !important; }
    .btn-reject   { border-color:#ef4444 !important;color:#ef4444 !important;border-radius:8px !important;display:inline-flex !important;align-items:center !important;gap:4px !important; }
    .btn-cancel   { border-color:#ef4444 !important;color:#ef4444 !important;border-radius:8px !important;display:inline-flex !important;align-items:center !important;gap:4px !important; }
    .btn-complete { background:#3b82f6 !important;color:white !important;border-radius:8px !important;display:inline-flex !important;align-items:center !important;gap:4px !important; }
    .session-box { display:flex;flex-wrap:wrap;align-items:center;gap:10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px; }
    .session-box-title { display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#065f46;width:100%;margin:0 0 6px; }
    .session-box-title mat-icon { font-size:16px;width:16px;height:16px; }
    .student-session-box { background:#eff6ff;border-color:#bfdbfe; }
    .student-session-box .session-box-title { color:#1e40af; }
    .link-input-row { display:flex;align-items:center;gap:8px;width:100%; }
    .link-input { flex:1;border:1.5px solid #e2e8f0;border-radius:8px;padding:9px 14px;font-size:13px;outline:none;color:#1e293b; }
    .link-input:focus { border-color:#059669; }
    .link-hint { font-size:12px;color:#64748b;width:100%;margin:2px 0 0; }
    .btn-share-link { border-color:#059669 !important;color:#059669 !important;border-radius:8px !important;display:inline-flex !important;align-items:center !important;gap:4px !important; }
    .btn-send-link  { background:#059669 !important;color:white !important;border-radius:8px !important;display:inline-flex !important;align-items:center !important;gap:4px !important;white-space:nowrap; }
    .btn-go-chat    { background:#3b82f6 !important;color:white !important;border-radius:8px !important;display:inline-flex !important;align-items:center !important;gap:4px !important; }
    /* review */
    .btn-write-review { border-color:#f59e0b !important;color:#92400e !important;border-radius:8px !important;display:inline-flex !important;align-items:center !important;gap:4px !important;margin-top:8px; }
    .btn-submit-review { background:#4f46e5 !important;color:white !important;border-radius:8px !important;display:inline-flex !important;align-items:center !important;gap:4px !important; }
    .review-done { display:flex;align-items:center;gap:6px;font-size:13px;color:#059669;background:#ecfdf5;border-radius:8px;padding:10px 14px;margin-top:10px; }
    .review-done mat-icon { font-size:16px;width:16px;height:16px; }
    .review-form { background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px;margin-top:12px; }
    .review-form-title { display:flex;align-items:center;gap:6px;font-size:14px;font-weight:600;color:#92400e;margin:0 0 12px; }
    .review-form-title mat-icon { font-size:18px;width:18px;height:18px;color:#f59e0b; }
    .star-picker { display:flex;align-items:center;gap:4px;margin-bottom:12px; }
    .star-btn { background:none;border:none;font-size:32px;cursor:pointer;color:#d1d5db;padding:0 2px;line-height:1;transition:color .1s,transform .1s; }
    .star-btn:hover, .star-btn.filled { color:#f59e0b; }
    .star-btn.filled { transform:scale(1.1); }
    .rating-label { font-size:13px;color:#92400e;font-weight:500;margin-left:8px; }
    .review-textarea { width:100%;border:1.5px solid #fde68a;border-radius:8px;padding:10px 12px;font-size:14px;font-family:inherit;outline:none;resize:vertical;background:white;box-sizing:border-box;margin-bottom:12px; }
    .review-textarea:focus { border-color:#f59e0b; }
    .review-actions { display:flex;align-items:center;gap:8px; }
    .tutor-review-hint { display:flex;align-items:center;gap:6px;font-size:13px;color:#64748b;margin-top:10px; }
    .tutor-review-hint mat-icon { font-size:16px;width:16px;height:16px; }
    /* empty */
    .empty-state { text-align:center;padding:48px 16px;color:#94a3b8; }
    .empty-state mat-icon { font-size:56px;width:56px;height:56px;margin-bottom:12px; }
    .empty-state h3 { font-size:16px;font-weight:600;margin-bottom:6px;color:#64748b; }
    .empty-state p { font-size:14px; }
  `]
})
export class BookingsComponent implements OnInit {
  private bookingService = inject(BookingService);
  private messageService = inject(MessageService);
  private reviewService  = inject(ReviewService);
  private authService    = inject(AuthService);
  private snack          = inject(MatSnackBar);
  private router         = inject(Router);

  bookings        = signal<Booking[]>([]);
  loading         = signal(true);
  updatingId      = signal<number | null>(null);
  sharingId       = signal<number | null>(null);
  justConfirmedId = signal<number | null>(null);
  meetingLink     = '';
  selectedTab     = signal(0);

  // ── Review signals ─────────────────────────────────────────────────────────
  reviewingId        = signal<number | null>(null);
  selectedRating     = signal(0);
  hoverRating        = signal(0);
  reviewComment      = '';
  submittingReview   = signal(false);
  reviewedBookingIds = signal<Set<number>>(new Set());

  get isStudent() { return this.authService.currentUser()?.role === 'STUDENT'; }

  pending   = computed(() => this.bookings().filter(b => b.status === 'PENDING'));
  pendingOrJustConfirmed = computed(() =>
    this.bookings().filter(b =>
      b.status === 'PENDING' ||
      (b.status === 'CONFIRMED' && b.id === this.justConfirmedId())
    )
  );
  confirmed = computed(() => this.bookings().filter(b => b.status === 'CONFIRMED'));
  completed = computed(() => this.bookings().filter(b => b.status === 'COMPLETED'));
  cancelled = computed(() => this.bookings().filter(b => b.status === 'CANCELLED'));

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.bookingService.getMyBookings().subscribe({
      next: b => {
        this.bookings.set(b);
        this.loading.set(false);
        // For students: check which completed bookings already have a review
        if (this.isStudent) {
          const completedIds = b.filter(x => x.status === 'COMPLETED').map(x => x.id);
          if (completedIds.length === 0) return;
          const reviewed = new Set<number>();
          let checked = 0;
          completedIds.forEach(id => {
            this.reviewService.hasReviewed(id).subscribe({
              next: has => {
                if (has) reviewed.add(id);
                if (++checked === completedIds.length)
                  this.reviewedBookingIds.set(new Set(reviewed));
              },
              error: () => { ++checked; }
            });
          });
        }
      },
      error: () => this.loading.set(false)
    });
  }

  updateStatus(b: Booking, status: string) {
    this.updatingId.set(b.id);
    this.bookingService.updateStatus(b.id, status).subscribe({
      next: () => {
        const msg = status === 'CONFIRMED' ? '✅ Booking confirmed! Share a meeting link below.'
                  : status === 'COMPLETED' ? '✅ Marked as completed!'
                  : 'Booking cancelled.';
        this.snack.open(msg, 'Close', { duration: 3000 });
        this.updatingId.set(null);
        if (status === 'CONFIRMED') {
          this.justConfirmedId.set(b.id);
          this.sharingId.set(b.id);
        } else {
          this.justConfirmedId.set(null);
          if (status === 'COMPLETED') this.selectedTab.set(2);
          if (status === 'CANCELLED') this.selectedTab.set(3);
        }
        this.load();
      },
      error: () => {
        this.snack.open('Update failed. Please try again.', 'Close', { duration: 3000 });
        this.updatingId.set(null);
      }
    });
  }

  // ── Meeting link ───────────────────────────────────────────────────────────
  startShare(bookingId: number) {
    this.sharingId.set(bookingId);
    this.meetingLink = '';
  }

  sendMeetingLink(b: Booking) {
    const link = this.meetingLink.trim();
    if (!link) return;
    const message = `🎥 Your session on ${b.sessionDate} at ${b.startTime} is confirmed!\nJoin here: ${link}`;
    this.messageService.send({ receiverId: b.studentId, content: message }).subscribe({
      next: () => {
        this.snack.open('✅ Meeting link sent to student via chat!', 'Close', { duration: 3000 });
        this.sharingId.set(null);
        this.justConfirmedId.set(null);
        this.meetingLink = '';
        this.selectedTab.set(1);
        this.load();
      },
      error: () => this.snack.open('Failed to send link. Try again.', 'Close', { duration: 3000 })
    });
  }

  goToChat(b: Booking) {
    const partnerId = this.isStudent ? b.tutorId : b.studentId;
    this.router.navigate(['/messages', partnerId]);
  }

  // ── Reviews ────────────────────────────────────────────────────────────────
  startReview(bookingId: number) {
    this.reviewingId.set(bookingId);
    this.selectedRating.set(0);
    this.hoverRating.set(0);
    this.reviewComment = '';
  }

  submitReview(b: Booking) {
    if (this.selectedRating() === 0) return;
    this.submittingReview.set(true);
    this.reviewService.submit({
      bookingId: b.id,
      rating:    this.selectedRating(),
      comment:   this.reviewComment.trim() || undefined
    }).subscribe({
      next: () => {
        this.snack.open('⭐ Review submitted! Thank you.', 'Close', { duration: 3000 });
        this.reviewingId.set(null);
        this.submittingReview.set(false);
        // Mark this booking as reviewed locally
        this.reviewedBookingIds.update(s => new Set([...s, b.id]));
      },
      error: err => {
        this.snack.open(err.error?.message ?? 'Failed to submit review.', 'Close', { duration: 3000 });
        this.submittingReview.set(false);
      }
    });
  }

  ratingLabel(r: number): string {
    return ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][r] ?? '';
  }

  initials(n: string) {
    return (n ?? '').split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) || '?';
  }
}
