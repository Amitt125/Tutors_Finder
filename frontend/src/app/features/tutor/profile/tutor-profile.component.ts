import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, TitleCasePipe, DatePipe } from '@angular/common';
import { TutorService } from '../../../core/services/tutor.service';
import { BookingService } from '../../../core/services/booking.service';
import { ReviewService } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';
import { TutorProfile, TutorDocument, Subject } from '../../../shared/models/tutor.model';
import { Payment } from '../../../shared/models/payment.model';
import { TimeSlot, AvailabilitySlot, Review } from '../../../shared/models/booking.model';
import { absoluteUrl } from '../../../shared/utils/url.util';

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];

@Component({
  selector: 'app-tutor-profile',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTabsModule, MatProgressSpinnerModule,
            MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule,
            ReactiveFormsModule, FormsModule, DecimalPipe, TitleCasePipe, DatePipe],
  template: `
    @if (loading()) {
      <div class="spinner-overlay"><mat-spinner /></div>
    } @else if (error()) {
      <div class="page-container" style="padding-top:64px;text-align:center;color:#94a3b8">
        <mat-icon style="font-size:64px;width:64px;height:64px">error_outline</mat-icon>
        <h3 style="margin-top:16px">Tutor not found</h3>
      </div>
    } @else if (tutor(); as t) {
      <div class="profile-page page-container">

        <!-- Hero -->
        <div class="profile-hero card">
          <div class="profile-main">
            <div class="avatar-wrap">
              @if (t.profilePicture) {
                <img [src]="safeUrl(t.profilePicture)" [alt]="t.fullName" class="avatar-img" />
              } @else {
                <div class="big-avatar">{{ initials(t.fullName) }}</div>
              }
              @if (t.isAvailable) { <span class="available-dot"></span> }
            </div>
            <div class="profile-details">
              <h1>{{ t.fullName }}</h1>
              @if (t.city) {
                <p class="location"><mat-icon>place</mat-icon>{{ t.city }}@if(t.state){, {{t.state}}}</p>
              }
              <div class="meta-row">
                @if (t.averageRating) {
                  <span class="rating">
                    <span class="stars">{{ stars(t.averageRating) }}</span>
                    {{ t.averageRating | number:'1.1-1' }}
                    <span style="color:#94a3b8">({{ t.totalReviews }} reviews)</span>
                  </span>
                }
                <span class="badge" [class]="'badge-' + modeClass(t.teachingMode)">
                  {{ (t.teachingMode ?? 'BOTH') | titlecase }}
                </span>
              </div>
              <div class="stat-row">
                <div class="stat"><strong>{{ t.experienceYears ?? 0 }}y</strong><span>Experience</span></div>
                <div class="stat"><strong>{{ t.totalSessions ?? 0 }}</strong><span>Sessions</span></div>
                <div class="stat"><strong>₹{{ t.hourlyRate ?? '—' }}</strong><span>/hour</span></div>
              </div>
            </div>
            @if (auth.isStudent()) {
              <div class="actions">
                <button mat-raised-button class="btn-primary" style="width:100%"
                        (click)="scrollToBooking()">
                  <mat-icon>event_available</mat-icon> Book a Session
                </button>
                <button mat-stroked-button (click)="message(t)" style="margin-top:8px;width:100%">
                  <mat-icon>chat</mat-icon> Message
                </button>
              </div>
            }
          </div>
        </div>

        <!-- Body -->
        <div class="profile-body">
          <div class="main-col">
            <mat-tab-group>

              <!-- About -->
              <mat-tab label="About">
                <div class="tab-content">
                  @if (t.bio) { <section><h3>About</h3><p>{{ t.bio }}</p></section> }
                  @if (t.education) { <section><h3>Education</h3><p>{{ t.education }}</p></section> }
                  @if (t.teachingStandards?.length) {
                    <section>
                      <h3>Teaching Level</h3>
                      <div class="chips">
                        @for (s of t.teachingStandards!; track s) {
                          <span class="chip">{{ standardLabel(s) }}</span>
                        }
                      </div>
                      @if (t.teachingStandards!.includes('OTHERS') && t.teachingStandardOther) {
                        <p style="margin-top:8px;color:#475569;font-size:14px">
                          Also teaches: {{ t.teachingStandardOther }}
                        </p>
                      }
                    </section>
                  }
                  @if (t.subjects?.length) {
                    <section>
                      <h3>Subjects</h3>
                      <div class="chips">
                        @for (s of t.subjects!; track s.id) {
                          <span class="chip">{{ s.name }}</span>
                        }
                      </div>
                    </section>
                  }
                  <!-- Weekly availability summary -->
                  @if (availability().length > 0) {
                    <section>
                      <h3>Weekly Availability</h3>
                      <div class="avail-grid">
                        @for (a of availability(); track a.id) {
                          <div class="avail-row">
                            <span class="avail-day">{{ a.dayOfWeek | titlecase }}</span>
                            <span class="avail-time">{{ a.startTime }} – {{ a.endTime }}</span>
                            <span class="avail-slot">{{ a.slotDurationMinutes }}min slots</span>
                          </div>
                        }
                      </div>
                    </section>
                  }
                </div>
              </mat-tab>

              <!-- Book a Session tab (students only) -->
              @if (auth.isStudent()) {
                <mat-tab label="Book a Session">
                  <div class="tab-content" #bookingSection>
                    <div class="booking-form-wrap">

                      <!-- Step 1: Pick date -->
                      <div class="book-step">
                        <h4><span class="step-num">1</span> Choose a Date</h4>

                        <!-- Available date suggestions from tutor schedule -->
                        @if (suggestedDates().length > 0) {
                          <p class="suggest-label">
                            <mat-icon>event_available</mat-icon>
                            Available dates (next 14 days):
                          </p>
                          <div class="date-suggestions">
                            @for (d of suggestedDates(); track d.date) {
                              <button class="date-chip"
                                      [class.selected]="selectedDate() === d.date"
                                      type="button"
                                      (click)="onDateChange(d.date)">
                                <span class="date-chip-day">{{ d.dayName }}</span>
                                <span class="date-chip-date">{{ d.display }}</span>
                              </button>
                            }
                          </div>
                          <p class="or-divider">— or pick any date —</p>
                        }

                        <input type="date" class="date-input"
                               [min]="minDate"
                               [value]="selectedDate()"
                               (change)="onDateChange($any($event.target).value)">
                      </div>

                      <!-- Step 2: Pick slot -->
                      @if (selectedDate() && !slotsLoading()) {
                        <div class="book-step">
                          <h4><span class="step-num">2</span> Choose a Time Slot</h4>
                          @if (slots().length === 0) {
                            <p class="no-slots">No availability for this date. Try another day.</p>
                          } @else {
                            <div class="slots-grid">
                              @for (slot of slots(); track slot.startTime) {
                                <button class="slot-btn"
                                        [class.selected]="selectedSlot()?.startTime === slot.startTime"
                                        [class.taken]="!slot.available"
                                        [disabled]="!slot.available"
                                        (click)="selectSlot(slot)">
                                  {{ slot.startTime }} – {{ slot.endTime }}
                                  @if (!slot.available) { <span class="taken-label">Booked</span> }
                                </button>
                              }
                            </div>
                          }
                        </div>
                      }
                      @if (slotsLoading()) {
                        <div style="text-align:center;padding:24px">
                          <mat-spinner diameter="36" style="margin:0 auto" />
                        </div>
                      }

                      <!-- Step 3: Details & Confirm -->
                      @if (selectedSlot()) {
                        <div class="book-step">
                          <h4><span class="step-num">3</span> Confirm Booking</h4>
                          <form [formGroup]="bookForm" (ngSubmit)="confirmBooking(t)">
                            <div class="book-summary">
                              <div><mat-icon>calendar_today</mat-icon> {{ selectedDate() }}</div>
                              <div><mat-icon>access_time</mat-icon>
                                {{ selectedSlot()!.startTime }} – {{ selectedSlot()!.endTime }}</div>
                              <div><mat-icon>payments</mat-icon> ₹{{ t.hourlyRate }}/hr</div>
                            </div>
                            <mat-form-field appearance="outline" style="width:100%;margin-top:12px">
                              <mat-label>Subject</mat-label>
                              <mat-select formControlName="subjectId">
                                <mat-option [value]="null">General / Other</mat-option>
                                @for (s of subjects(); track s.id) {
                                  <mat-option [value]="s.id">{{ s.name }}</mat-option>
                                }
                              </mat-select>
                            </mat-form-field>
                            <mat-form-field appearance="outline" style="width:100%">
                              <mat-label>Mode</mat-label>
                              <mat-select formControlName="teachingMode">
                                <mat-option value="ONLINE">Online</mat-option>
                                <mat-option value="IN_PERSON">In Person</mat-option>
                              </mat-select>
                            </mat-form-field>
                            <mat-form-field appearance="outline" style="width:100%">
                              <mat-label>Notes (optional)</mat-label>
                              <textarea matInput formControlName="notes" rows="2"></textarea>
                            </mat-form-field>
                            <button mat-raised-button class="btn-primary book-confirm-btn"
                                    type="submit" [disabled]="booking()">
                              @if (booking()) {
                                <mat-spinner diameter="18" style="display:inline-block;margin-right:6px" />
                              }
                              {{ booking() ? 'Booking…' : 'Confirm Booking' }}
                            </button>
                          </form>
                        </div>
                      }

                    </div>
                  </div>
                </mat-tab>
              }

              <!-- Certificates -->
              @if (t.documents?.length) {
                <mat-tab [label]="'Certificates (' + t.documents!.length + ')'">
                  <div class="tab-content">
                    <div class="cert-list">
                      @for (doc of t.documents!; track doc.id) {
                        <div class="cert-card">
                          <div class="cert-icon-wrap"><mat-icon>{{ docIcon(doc.documentType) }}</mat-icon></div>
                          <div class="cert-body">
                            <strong>{{ doc.certificateName ?? doc.documentType }}</strong>
                            <span class="cert-meta">{{ doc.documentType }}</span>
                          </div>
                          <div class="cert-right">
                            @if (doc.verified) {
                              <span class="badge badge-success">✓ Verified</span>
                            } @else {
                              <span class="badge badge-warning">Pending</span>
                            }
                            <a [href]="safeUrl(doc.fileUrl)" target="_blank" mat-icon-button>
                              <mat-icon>open_in_new</mat-icon>
                            </a>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </mat-tab>
              }

              <mat-tab label="Reviews ({{ t.totalReviews ?? 0 }})">
                <div class="tab-content">

                  <!-- Rating summary -->
                  @if ((t.totalReviews ?? 0) > 0) {
                    <div class="rating-summary">
                      <div class="rating-big">
                        <span class="rating-number">{{ t.averageRating | number:'1.1-1' }}</span>
                        <span class="stars-big">{{ stars(t.averageRating ?? 0) }}</span>
                        <span class="rating-count">{{ t.totalReviews }} review{{ (t.totalReviews ?? 0) > 1 ? 's' : '' }}</span>
                      </div>
                    </div>
                  }

                  <!-- Reviews list -->
                  @if (reviewsLoading()) {
                    <div style="text-align:center;padding:24px">
                      <mat-spinner diameter="36" style="margin:0 auto" />
                    </div>
                  } @else if (reviews().length === 0) {
                    <div class="no-reviews">
                      <mat-icon>star_border</mat-icon>
                      <p>No reviews yet. Reviews appear after completed sessions.</p>
                    </div>
                  } @else {
                    <div class="reviews-list">
                      @for (r of reviews(); track r.id) {
                        <div class="review-card">
                          <div class="review-header">
                            <div class="reviewer-avatar">
                              @if (r.studentPicture) {
                                <img [src]="safeUrl(r.studentPicture)" alt="avatar" class="reviewer-img" />
                              } @else {
                                {{ reviewerInitials(r.studentName) }}
                              }
                            </div>
                            <div class="reviewer-info">
                              <strong>{{ r.studentName }}</strong>
                              <span class="review-date">{{ r.createdAt | date:'dd MMM yyyy' }}</span>
                            </div>
                            <div class="review-stars">
                              @for (s of starArray(r.rating); track s) {
                                <span class="star-filled">★</span>
                              }
                              @for (s of emptyStarArray(r.rating); track s) {
                                <span class="star-empty">★</span>
                              }
                            </div>
                          </div>
                          @if (r.comment) {
                            <p class="review-comment">{{ r.comment }}</p>
                          }
                          <!-- Tutor reply -->
                          @if (r.tutorReply) {
                            <div class="tutor-reply">
                              <mat-icon>reply</mat-icon>
                              <div>
                                <strong>Tutor's reply:</strong>
                                <p>{{ r.tutorReply }}</p>
                              </div>
                            </div>
                          }
                          <!-- Tutor can add reply if none yet -->
                          @if (auth.isTutor() && !r.tutorReply) {
                            @if (replyingId() === r.id) {
                              <div class="reply-form">
                                <textarea class="reply-textarea"
                                          [(ngModel)]="replyText"
                                          placeholder="Write a reply…"
                                          rows="2"></textarea>
                                <div style="display:flex;gap:8px;margin-top:8px">
                                  <button mat-raised-button class="btn-post-reply"
                                          (click)="postReply(r)"
                                          [disabled]="!replyText.trim()">
                                    <mat-icon>send</mat-icon> Post Reply
                                  </button>
                                  <button mat-button (click)="replyingId.set(null)">Cancel</button>
                                </div>
                              </div>
                            } @else {
                              <button mat-button class="btn-reply"
                                      (click)="replyingId.set(r.id); replyText = ''">
                                <mat-icon>reply</mat-icon> Reply
                              </button>
                            }
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </mat-tab>

            </mat-tab-group>
          </div>

          <!-- Sidebar -->
          <aside class="side-col">
            <div class="card booking-card">
              <div class="price-big">₹{{ t.hourlyRate }}<span>/hour</span></div>
              @if (auth.isStudent()) {
                <button mat-raised-button class="btn-primary" style="width:100%;margin-bottom:12px"
                        (click)="scrollToBooking()">
                  <mat-icon>event_available</mat-icon> Book a Session
                </button>
                <button mat-stroked-button style="width:100%" (click)="message(t)">
                  <mat-icon>chat</mat-icon> Message Tutor
                </button>
              }
              <div class="info-list">
                <div><mat-icon>schedule</mat-icon> Responds within 1 hour</div>
                <div><mat-icon>verified</mat-icon> Identity verified</div>
                <div>
                  <mat-icon>{{ t.teachingMode === 'ONLINE' ? 'videocam' : 'home' }}</mat-icon>
                  {{ t.teachingMode === 'ONLINE' ? 'Online' :
                     t.teachingMode === 'IN_PERSON' ? 'In-person' : 'Online & In-person' }}
                </div>
                @if (t.serviceRadiusKm) {
                  <div><mat-icon>radio_button_checked</mat-icon>Covers {{ t.serviceRadiusKm }} km</div>
                }
                @if (availability().length > 0) {
                  <div><mat-icon>event_available</mat-icon>{{ availability().length }} day(s) available</div>
                }
              </div>
            </div>
          </aside>
        </div>

        @if (lastPayment()) {
          <div class="success-banner">
            <mat-icon>check_circle</mat-icon>
            Payment ₹{{ lastPayment()!.amount }} confirmed!
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .spinner-overlay { display:flex;justify-content:center;align-items:center;min-height:60vh; }
    .profile-page { padding-top:24px; }
    .profile-hero { margin-bottom:24px; }
    .profile-main { display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap; }
    .avatar-wrap { position:relative;flex-shrink:0; }
    .avatar-img { width:110px;height:110px;border-radius:50%;object-fit:cover;border:3px solid #e2e8f0; }
    .big-avatar { width:110px;height:110px;border-radius:50%;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:36px; }
    .available-dot { position:absolute;bottom:6px;right:6px;width:16px;height:16px;border-radius:50%;background:#22c55e;border:2px solid white; }
    .profile-details { flex:1;min-width:200px; }
    h1 { font-size:28px;font-weight:700;margin-bottom:8px; }
    .location { display:flex;align-items:center;gap:4px;color:#64748b;margin-bottom:12px; }
    .location mat-icon { font-size:18px;width:18px;height:18px; }
    .meta-row { display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px; }
    .rating { display:flex;align-items:center;gap:4px;font-size:14px;color:#64748b; }
    .stars { color:#f59e0b; }
    .stat-row { display:flex;gap:24px; }
    .stat { text-align:center; }
    .stat strong { display:block;font-size:22px;font-weight:700;color:#4f46e5; }
    .stat span { font-size:13px;color:#94a3b8; }
    .actions { min-width:180px; }
    .profile-body { display:grid;grid-template-columns:1fr 300px;gap:24px; }
    .tab-content { padding:24px 0; }
    .tab-content section { margin-bottom:24px; }
    .tab-content h3 { font-size:16px;font-weight:600;margin-bottom:12px; }
    .tab-content p { color:#475569;line-height:1.7; }
    .chips { display:flex;flex-wrap:wrap;gap:8px; }
    .chip { background:#f1f5f9;color:#475569;padding:6px 14px;border-radius:100px;font-size:14px; }
    /* availability */
    .avail-grid { display:flex;flex-direction:column;gap:8px; }
    .avail-row { display:flex;align-items:center;gap:12px;background:#f8fafc;border-radius:8px;padding:10px 14px; }
    .avail-day { font-weight:600;font-size:14px;min-width:90px; }
    .avail-time { color:#475569;font-size:14px;flex:1; }
    .avail-slot { font-size:12px;color:#94a3b8;background:#e2e8f0;padding:2px 8px;border-radius:100px; }
    /* booking form */
    .booking-form-wrap { max-width:560px; }
    .book-step { margin-bottom:28px; }
    .book-step h4 { display:flex;align-items:center;gap:10px;font-size:16px;font-weight:600;margin-bottom:14px; }
    .step-num { width:26px;height:26px;border-radius:50%;background:#4f46e5;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0; }
    .suggest-label { display:flex;align-items:center;gap:6px;font-size:13px;color:#4f46e5;font-weight:600;margin-bottom:10px; }
    .suggest-label mat-icon { font-size:16px;width:16px;height:16px; }
    .date-suggestions { display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px; }
    .date-chip { display:flex;flex-direction:column;align-items:center;padding:8px 14px;border:1.5px solid #e2e8f0;border-radius:10px;background:white;cursor:pointer;transition:all .15s;min-width:70px; }
    .date-chip:hover { border-color:#4f46e5;background:#eef2ff; }
    .date-chip.selected { border-color:#4f46e5;background:#4f46e5;color:white; }
    .date-chip-day { font-size:11px;font-weight:600;text-transform:uppercase;opacity:.7; }
    .date-chip-date { font-size:14px;font-weight:700;margin-top:2px; }
    .or-divider { font-size:12px;color:#94a3b8;margin:8px 0 10px;text-align:center; }
    .date-input { border:1.5px solid #e2e8f0;border-radius:8px;padding:10px 14px;font-size:14px;outline:none;color:#1e293b;width:200px; }
    .date-input:focus { border-color:#4f46e5; }
    .slots-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px; }
    .slot-btn { padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:8px;background:white;cursor:pointer;font-size:13px;font-weight:500;color:#475569;transition:all .15s;position:relative; }
    .slot-btn:hover:not(:disabled) { border-color:#4f46e5;color:#4f46e5;background:#eef2ff; }
    .slot-btn.selected { border-color:#4f46e5;background:#4f46e5;color:white; }
    .slot-btn.taken { background:#f1f5f9;color:#cbd5e1;cursor:not-allowed;border-color:#e2e8f0; }
    .taken-label { display:block;font-size:10px;color:#94a3b8; }
    .no-slots { color:#94a3b8;font-size:14px;padding:12px;background:#f8fafc;border-radius:8px; }
    .book-summary { display:flex;flex-wrap:wrap;gap:16px;background:#f8fafc;border-radius:8px;padding:14px;margin-bottom:16px; }
    .book-summary div { display:flex;align-items:center;gap:6px;font-size:14px;color:#475569; }
    .book-summary mat-icon { font-size:16px;width:16px;height:16px;color:#4f46e5; }
    .book-confirm-btn { width:100%;height:44px !important;border-radius:8px !important;display:inline-flex !important;align-items:center !important;justify-content:center !important; }
    /* certs */
    .cert-list { display:flex;flex-direction:column;gap:10px; }
    .cert-card { display:flex;align-items:center;gap:12px;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px; }
    .cert-icon-wrap { width:40px;height:40px;border-radius:8px;background:#eef2ff;display:flex;align-items:center;justify-content:center;color:#4f46e5;flex-shrink:0; }
    .cert-body { flex:1;min-width:0; }
    .cert-body strong { display:block;font-size:14px;font-weight:600; }
    .cert-meta { font-size:12px;color:#94a3b8; }
    .cert-right { display:flex;align-items:center;gap:8px; }
    /* sidebar */
    .booking-card { position:sticky;top:88px; }
    .price-big { font-size:36px;font-weight:800;color:#4f46e5;margin-bottom:16px; }
    .price-big span { font-size:16px;font-weight:400;color:#94a3b8; }
    .info-list { margin-top:16px;display:flex;flex-direction:column;gap:12px; }
    .info-list div { display:flex;align-items:center;gap:8px;font-size:14px;color:#475569; }
    .info-list mat-icon { font-size:18px;width:18px;height:18px;color:#4f46e5; }
    .success-banner { background:#d1fae5;border:1px solid #6ee7b7;border-radius:12px;padding:16px 20px;display:flex;align-items:center;gap:12px;margin-top:24px;color:#065f46; }
    /* reviews */
    .rating-summary { background:#fffbeb;border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:16px; }
    .rating-big { display:flex;align-items:center;gap:10px; }
    .rating-number { font-size:40px;font-weight:800;color:#f59e0b;line-height:1; }
    .stars-big { font-size:22px;color:#f59e0b;letter-spacing:2px; }
    .rating-count { font-size:13px;color:#64748b; }
    .no-reviews { display:flex;flex-direction:column;align-items:center;gap:8px;padding:32px;color:#94a3b8;text-align:center; }
    .no-reviews mat-icon { font-size:48px;width:48px;height:48px; }
    .reviews-list { display:flex;flex-direction:column;gap:16px; }
    .review-card { background:#fafafa;border:1px solid #e2e8f0;border-radius:12px;padding:16px; }
    .review-header { display:flex;align-items:center;gap:12px;margin-bottom:10px; }
    .reviewer-avatar { width:40px;height:40px;min-width:40px;border-radius:50%;background:#4f46e5;color:white;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;overflow:hidden; }
    .reviewer-img { width:40px;height:40px;border-radius:50%;object-fit:cover; }
    .reviewer-info { flex:1; }
    .reviewer-info strong { display:block;font-size:14px;font-weight:600; }
    .review-date { font-size:12px;color:#94a3b8; }
    .review-stars { display:flex;gap:1px; }
    .star-filled { color:#f59e0b;font-size:18px; }
    .star-empty  { color:#d1d5db;font-size:18px; }
    .review-comment { font-size:14px;color:#475569;line-height:1.6;margin:0 0 10px; }
    .tutor-reply { display:flex;gap:10px;background:#eef2ff;border-radius:8px;padding:12px;margin-top:8px; }
    .tutor-reply mat-icon { font-size:18px;width:18px;height:18px;color:#4f46e5;margin-top:2px;flex-shrink:0; }
    .tutor-reply strong { display:block;font-size:13px;font-weight:600;color:#4f46e5;margin-bottom:4px; }
    .tutor-reply p { font-size:13px;color:#475569;margin:0; }
    .btn-reply { color:#4f46e5 !important;font-size:13px !important;display:inline-flex !important;align-items:center !important;gap:4px !important;margin-top:4px; }
    .reply-form { margin-top:10px; }
    .reply-textarea { width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-size:13px;font-family:inherit;outline:none;resize:vertical;box-sizing:border-box; }
    .reply-textarea:focus { border-color:#4f46e5; }
    .btn-post-reply { background:#4f46e5 !important;color:white !important;border-radius:8px !important;display:inline-flex !important;align-items:center !important;gap:4px !important; }
    @media (max-width:768px) { .profile-body { grid-template-columns:1fr; } }
  `]
})
export class TutorProfileComponent implements OnInit {
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private tutorService   = inject(TutorService);
  private bookingService = inject(BookingService);
  private reviewService  = inject(ReviewService);
  private snack          = inject(MatSnackBar);
  private fb             = inject(FormBuilder);
  auth                   = inject(AuthService);

  tutor        = signal<TutorProfile | null>(null);
  loading      = signal(true);
  error        = signal(false);
  lastPayment  = signal<Payment | null>(null);
  availability = signal<AvailabilitySlot[]>([]);
  subjects     = signal<Subject[]>([]);
  slots        = signal<TimeSlot[]>([]);
  slotsLoading = signal(false);
  selectedDate = signal('');
  selectedSlot = signal<TimeSlot | null>(null);
  booking      = signal(false);
  minDate      = new Date().toISOString().split('T')[0];

  /** Computes the next 14 days that match the tutor's availability schedule */
  suggestedDates = computed(() => {
    const avail = this.availability();
    if (!avail.length) return [];
    const dayNames = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
    const results: { date: string; dayName: string; display: string }[] = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayOfWeek = dayNames[d.getDay()];
      if (avail.some(a => a.dayOfWeek === dayOfWeek)) {
        const dateStr = d.toISOString().split('T')[0];
        results.push({
          date:    dateStr,
          dayName: dayOfWeek.charAt(0) + dayOfWeek.slice(1).toLowerCase(),
          display: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        });
      }
    }
    return results;
  });

  // ── Review signals ─────────────────────────────────────────────────────────
  reviews       = signal<Review[]>([]);
  reviewsLoading = signal(false);
  replyingId    = signal<number | null>(null);
  replyText     = '';

  bookForm = this.fb.group({
    subjectId:    [null as number | null],
    teachingMode: ['ONLINE', Validators.required],
    notes:        ['']
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id      = Number(idParam);
    if (!idParam || isNaN(id) || id <= 0) {
      this.error.set(true); this.loading.set(false); return;
    }
    this.tutorService.getById(id).subscribe({
      next: t => {
        this.tutor.set(t);
        this.loading.set(false);
        // Load availability and subjects and reviews in parallel
        this.bookingService.getAvailabilityByProfile(t.id).subscribe({
          next: a => this.availability.set(a), error: () => {}
        });
        this.tutorService.getSubjects().subscribe({
          next: s => this.subjects.set(s), error: () => {}
        });
        this.reviewsLoading.set(true);
        this.reviewService.getByTutor(t.userId).subscribe({
          next: r => { this.reviews.set(r); this.reviewsLoading.set(false); },
          error: () => this.reviewsLoading.set(false)
        });
      },
      error: () => { this.error.set(true); this.loading.set(false); }
    });
  }

  onDateChange(date: string) {
    this.selectedDate.set(date);
    this.selectedSlot.set(null);
    if (!date) return;
    const t = this.tutor();
    if (!t) return;
    this.slotsLoading.set(true);
    this.bookingService.getAvailableSlots(t.userId, date).subscribe({
      next:  s => { this.slots.set(s); this.slotsLoading.set(false); },
      error: () => { this.slots.set([]); this.slotsLoading.set(false); }
    });
  }

  selectSlot(slot: TimeSlot) {
    if (!slot.available) return;
    this.selectedSlot.set(slot);
  }

  confirmBooking(t: TutorProfile) {
    const slot = this.selectedSlot();
    const date = this.selectedDate();
    if (!slot || !date) return;
    this.booking.set(true);
    this.bookingService.create({
      tutorId:      t.userId,
      subjectId:    this.bookForm.value.subjectId ?? undefined,
      sessionDate:  date,
      startTime:    slot.startTime,
      endTime:      slot.endTime,
      teachingMode: this.bookForm.value.teachingMode!,
      notes:        this.bookForm.value.notes ?? ''
    }).subscribe({
      next: () => {
        this.snack.open('✅ Booking request sent! Waiting for tutor confirmation.', 'Close', { duration: 4000 });
        this.selectedSlot.set(null);
        this.selectedDate.set('');
        this.slots.set([]);
        this.booking.set(false);
      },
      error: err => {
        this.snack.open(err.error?.message ?? 'Booking failed. Please try again.', 'Close',
          { duration: 4000, panelClass: ['error-snack'] });
        this.booking.set(false);
      }
    });
  }

  scrollToBooking() {
    // Switch to Book a Session tab (index depends on student role, always present)
    const tabGroup = document.querySelector('mat-tab-group');
    if (tabGroup) {
      const tabs = tabGroup.querySelectorAll('.mdc-tab');
      tabs.forEach((tab: any) => {
        if (tab.textContent?.includes('Book')) tab.click();
      });
    }
  }

  postReply(r: Review) {
    if (!this.replyText.trim()) return;
    this.reviewService.addReply(r.id, this.replyText.trim()).subscribe({
      next: updated => {
        this.reviews.update(list => list.map(x => x.id === r.id ? updated : x));
        this.replyingId.set(null);
        this.replyText = '';
      },
      error: () => {}
    });
  }

  starArray(n: number)      { return Array(Math.round(n)).fill(0); }
  emptyStarArray(n: number) { return Array(5 - Math.round(n)).fill(0); }
  reviewerInitials(name: string) {
    return (name ?? '').split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) || '?';
  }

  message(t: TutorProfile) { this.router.navigate(['/messages', t.userId]); }
  onPaid(p: Payment)       { this.lastPayment.set(p); }
  initials(n: string)      { return n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2); }
  stars(r: number)         { return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r)); }
  modeClass(m?: string)    { return m === 'ONLINE' ? 'info' : m === 'IN_PERSON' ? 'success' : 'warning'; }
  docIcon(type?: string)   {
    const m: Record<string,string> = { DEGREE:'school', CERTIFICATION:'workspace_premium', ID_PROOF:'badge', OTHER:'description' };
    return m[type ?? ''] ?? 'description';
  }
  safeUrl(url: string | null | undefined): string | null { return absoluteUrl(url); }

  standardLabel(code: string): string {
    const map: Record<string, string> = {
      CLASS_1_5:    'Class 1 – 5 (Primary)',
      CLASS_6_10:   'Class 6 – 10 (Secondary)',
      CLASS_11_12:  'Class 11 – 12 (Higher Secondary)',
      BCOM: 'B.Com', BSC: 'B.Sc', BA: 'B.A',
      MCOM: 'M.Com', MSC: 'M.Sc', MA: 'M.A',
      ENGINEERING:  'Engineering (B.Tech / B.E)',
      MEDICAL:      'Medical (MBBS / BDS)',
      COMPETITIVE:  'Competitive Exams (JEE / NEET / UPSC)',
      OTHERS:       'Others',
    };
    return map[code] ?? code;
  }
}
