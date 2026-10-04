import { Component, OnInit, inject, signal, resource } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DecimalPipe, TitleCasePipe, SlicePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { TutorService } from '../../../core/services/tutor.service';
import { AuthService } from '../../../core/services/auth.service';
import { TutorProfile, Subject } from '../../../shared/models/tutor.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule,
            MatSelectModule, MatButtonModule, MatIconModule,
            MatProgressSpinnerModule, DecimalPipe, TitleCasePipe, SlicePipe],
  template: `
    <div class="search-page">
      <div class="search-header">
        <div class="page-container">
          <h1>Find Tutors Near You</h1>
          <p>{{ tutors().length }} tutor{{ tutors().length !== 1 ? 's' : '' }} found</p>
        </div>
      </div>

      <div class="page-container search-layout">
        <!-- Filters -->
        <aside class="filters-panel card">
          <h3>Filters</h3>
          <form [formGroup]="filterForm" (ngSubmit)="search()">
            <div class="filter-group">
              <label>Subject</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="subjectId" placeholder="All Subjects">
                  <mat-option [value]="null">All Subjects</mat-option>
                  @for (s of subjectsRes.value() ?? []; track s.id) {
                    <mat-option [value]="s.id">{{ s.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <div class="filter-group">
              <label>Teaching Mode</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="teachingMode" placeholder="Any">
                  <mat-option value="">Any</mat-option>
                  <mat-option value="IN_PERSON">In Person</mat-option>
                  <mat-option value="ONLINE">Online</mat-option>
                  <mat-option value="BOTH">Both</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
            <div class="filter-group">
              <label>Teaching Level</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="teachingStandard" placeholder="Any Level">
                  <mat-option value="">Any Level</mat-option>
                  <mat-option value="CLASS_1_5">Class 1 – 5</mat-option>
                  <mat-option value="CLASS_6_10">Class 6 – 10</mat-option>
                  <mat-option value="CLASS_11_12">Class 11 – 12</mat-option>
                  <mat-option value="BCOM">B.Com</mat-option>
                  <mat-option value="BSC">B.Sc</mat-option>
                  <mat-option value="BA">B.A</mat-option>
                  <mat-option value="MCOM">M.Com</mat-option>
                  <mat-option value="MSC">M.Sc</mat-option>
                  <mat-option value="MA">M.A</mat-option>
                  <mat-option value="ENGINEERING">Engineering</mat-option>
                  <mat-option value="MEDICAL">Medical</mat-option>
                  <mat-option value="COMPETITIVE">Competitive Exams</mat-option>
                  <mat-option value="OTHERS">Others</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
            <div class="filter-group">
              <label>Radius: {{ filterForm.get('radiusKm')?.value }} km</label>
              <input type="range" min="1" max="50" formControlName="radiusKm" class="radius-slider">
            </div>
            <div class="filter-group">
              <label>Max Rate (₹/hr)</label>
              <mat-form-field appearance="outline">
                <input matInput type="number" formControlName="maxRate" placeholder="No limit">
                <span matPrefix>₹&nbsp;</span>
              </mat-form-field>
            </div>
            <div class="filter-group">
              <label>Minimum Rating</label>
              <div class="star-filter-row">
                @for (star of [1,2,3,4,5]; track star) {
                  <button type="button" class="star-filter-btn"
                          [class.active]="filterForm.get('minRating')?.value === star"
                          (click)="setRating(star)">
                    ★ {{ star }}+
                  </button>
                }
                @if (filterForm.get('minRating')?.value) {
                  <button type="button" class="clear-btn" (click)="setRating(null)">✕ Clear</button>
                }
              </div>
            </div>
            <div class="filter-group">
              <label>Min Experience</label>
              <mat-form-field appearance="outline">
                <mat-select formControlName="minExperience" placeholder="Any">
                  <mat-option [value]="null">Any</mat-option>
                  <mat-option [value]="1">1+ year</mat-option>
                  <mat-option [value]="2">2+ years</mat-option>
                  <mat-option [value]="3">3+ years</mat-option>
                  <mat-option [value]="5">5+ years</mat-option>
                  <mat-option [value]="10">10+ years</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
            <button mat-raised-button type="submit" class="btn-primary" style="width:100%">
              Apply Filters
            </button>
          </form>
          <button mat-stroked-button (click)="useMyLocation()" style="width:100%;margin-top:12px">
            <mat-icon>my_location</mat-icon> Use My Location
          </button>
        </aside>

        <!-- Results -->
        <div class="results">
          @if (loading()) {
            <div class="spinner-overlay"><mat-spinner diameter="48" /></div>
          } @else if (locationDenied()) {
            <!-- Location permission denied -->
            <div class="location-denied-box">
              <mat-icon>location_off</mat-icon>
              <h3>Location access needed</h3>
              <p>
                TutorFinder uses your location to show tutors near you.
                Please allow location access in your browser and try again.
              </p>
              <button mat-raised-button class="btn-primary" (click)="useMyLocation()">
                <mat-icon>my_location</mat-icon> Allow Location & Search
              </button>
            </div>
          } @else if (tutors().length === 0) {
            <div class="empty-state">
              <mat-icon>search_off</mat-icon>
              <h3>No tutors found nearby</h3>
              <p>Try expanding your radius or changing filters</p>
            </div>
          } @else {
            <div class="tutor-grid">
              @for (tutor of tutors(); track tutor.id) {
                <div class="tutor-card card">
                  <div class="tutor-header" (click)="open(tutor)" style="cursor:pointer">

                    <!-- Profile picture or initials avatar -->
                    <div class="avatar-wrap">
                      @if (tutor.profilePicture) {
                        <img [src]="tutor.profilePicture" [alt]="tutor.fullName" class="avatar-img" />
                      } @else {
                        <div class="avatar">{{ initials(tutor.fullName) }}</div>
                      }
                    </div>

                    <div class="tutor-info">
                      <h3>{{ tutor.fullName }}</h3>
                      <span class="city">{{ tutor.city ?? 'Location not set' }}</span>
                      @if (tutor.averageRating) {
                        <div class="rating">
                          <span class="stars">{{ stars(tutor.averageRating) }}</span>
                          {{ tutor.averageRating | number:'1.1-1' }}
                        </div>
                      }
                    </div>

                    @if (tutor.hourlyRate) {
                      <div class="rate">
                        <strong>₹{{ tutor.hourlyRate }}</strong>
                        <span>/hr</span>
                      </div>
                    }
                  </div>

                  @if (tutor.bio) {
                    <p class="bio" (click)="open(tutor)" style="cursor:pointer">
                      {{ tutor.bio | slice:0:120 }}…
                    </p>
                  }

                  @if (tutor.subjects?.length) {
                    <div class="subjects">
                      @for (s of tutor.subjects!.slice(0,4); track s.id) {
                        <span class="chip">{{ s.name }}</span>
                      }
                    </div>
                  }

                  <div class="tutor-footer">
                    @if (tutor.distanceKm) {
                      <span class="distance">
                        <mat-icon>place</mat-icon>{{ tutor.distanceKm | number:'1.1-1' }} km
                      </span>
                    }
                    <!-- certificates badge -->
                    @if (tutor.documents?.length) {
                      <span class="cert-badge" title="Has uploaded certificates">
                        <mat-icon>workspace_premium</mat-icon>
                        {{ tutor.documents!.length }} cert{{ tutor.documents!.length > 1 ? 's' : '' }}
                      </span>
                    }
                    @if (tutor.teachingStandards?.length) {
                      @for (std of tutor.teachingStandards!.slice(0,2); track std) {
                        <span class="std-badge">{{ stdShortLabel(std) }}</span>
                      }
                      @if (tutor.teachingStandards!.length > 2) {
                        <span class="std-badge">+{{ tutor.teachingStandards!.length - 2 }}</span>
                      }
                    }
                    <span class="badge" [class]="'badge-' + modeClass(tutor.teachingMode)">
                      {{ (tutor.teachingMode ?? 'BOTH') | titlecase }}
                    </span>
                  </div>

                  <div class="card-actions">
                    <button mat-raised-button class="btn-view" (click)="open(tutor)">
                      <mat-icon>person</mat-icon> View Profile
                    </button>
                    @if (auth.isAuthenticated()) {
                      <button mat-stroked-button class="btn-msg" (click)="message(tutor)">
                        <mat-icon>chat</mat-icon> Message
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-header { background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:32px 0; }
    .search-header h1 { font-size:28px;font-weight:700;margin-bottom:4px; }
    .search-header p { opacity:.8; }
    .search-layout { display:grid;grid-template-columns:280px 1fr;gap:24px;padding-top:24px; }
    .filters-panel h3 { font-size:16px;font-weight:600;margin-bottom:20px; }
    .filter-group { margin-bottom:16px; }
    .filter-group label { display:block;font-size:13px;font-weight:500;color:#64748b;margin-bottom:6px; }
    .star-filter-row { display:flex;flex-wrap:wrap;gap:6px; }
    .star-filter-btn { padding:5px 10px;border:1.5px solid #e2e8f0;border-radius:100px;background:white;cursor:pointer;font-size:12px;font-weight:500;color:#64748b;transition:all .15s; }
    .star-filter-btn:hover { border-color:#f59e0b;color:#92400e; }
    .star-filter-btn.active { background:#fef3c7;border-color:#f59e0b;color:#92400e;font-weight:700; }
    .clear-btn { padding:5px 10px;border:none;background:none;cursor:pointer;font-size:12px;color:#94a3b8; }
    .clear-btn:hover { color:#ef4444; }
    .radius-slider { width:100%;accent-color:#4f46e5; }
    .tutor-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px; }
    .tutor-card { padding:20px;display:flex;flex-direction:column;gap:0; }

    /* header row */
    .tutor-header { display:flex;gap:12px;align-items:flex-start;margin-bottom:12px; }
    .avatar-wrap { flex-shrink:0; }
    .avatar-img { width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid #e2e8f0; }
    .avatar { width:52px;height:52px;border-radius:50%;background:#4f46e5;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px; }
    .tutor-info { flex:1; }
    .tutor-info h3 { font-size:16px;font-weight:600;margin-bottom:2px; }
    .city { font-size:13px;color:#64748b; }
    .rating { display:flex;align-items:center;gap:4px;font-size:13px;margin-top:4px;color:#64748b; }
    .stars { color:#f59e0b; }
    .rate { text-align:right; }
    .rate strong { font-size:20px;font-weight:700;color:#4f46e5;display:block; }
    .rate span { font-size:12px;color:#94a3b8; }

    .bio { font-size:14px;color:#64748b;line-height:1.5;margin-bottom:12px; }
    .subjects { display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px; }
    .chip { background:#f1f5f9;color:#475569;padding:3px 10px;border-radius:100px;font-size:12px; }

    .tutor-footer { display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #f1f5f9;margin-bottom:12px;flex-wrap:wrap;gap:6px; }
    .distance { display:flex;align-items:center;gap:4px;font-size:13px;color:#64748b; }
    .distance mat-icon { font-size:16px;width:16px;height:16px; }
    .cert-badge { display:flex;align-items:center;gap:3px;font-size:12px;color:#4f46e5;background:#eef2ff;padding:2px 8px;border-radius:100px; }
    .cert-badge mat-icon { font-size:14px;width:14px;height:14px; }
    .std-badge { font-size:11px;color:#065f46;background:#d1fae5;padding:2px 8px;border-radius:100px;font-weight:500; }

    .card-actions { display:flex;gap:8px;margin-top:4px; }
    .btn-view { flex:1;background:#4f46e5 !important;color:white !important;border-radius:8px !important;font-size:13px !important; }
    .btn-msg  { flex:1;border-color:#4f46e5 !important;color:#4f46e5 !important;border-radius:8px !important;font-size:13px !important; }
    .empty-state { text-align:center;padding:64px 16px;color:#94a3b8; }
    .empty-state mat-icon { font-size:64px;width:64px;height:64px;margin-bottom:16px; }
    .location-denied-box { text-align:center;padding:64px 24px;background:#fff7ed;border:1px solid #fed7aa;border-radius:16px;color:#92400e; }
    .location-denied-box mat-icon { font-size:56px;width:56px;height:56px;margin-bottom:16px;color:#f97316; }
    .location-denied-box h3 { font-size:20px;font-weight:700;margin-bottom:8px; }
    .location-denied-box p { font-size:14px;margin-bottom:20px;color:#78350f;max-width:360px;margin-left:auto;margin-right:auto; }
    .spinner-overlay { display:flex;justify-content:center;padding:80px; }
    @media (max-width:768px) { .search-layout { grid-template-columns:1fr; } }
  `]
})
export class SearchComponent implements OnInit {
  private fb           = inject(FormBuilder);
  private tutorService = inject(TutorService);
  private router       = inject(Router);
  auth                 = inject(AuthService);

  filterForm = this.fb.group({
    subjectId:        [null as number | null],
    teachingMode:     [''],
    teachingStandard: [''],
    radiusKm:         [10],
    maxRate:          [null as number | null],
    minRating:        [null as number | null],
    minExperience:    [null as number | null],
  });

  tutors        = signal<TutorProfile[]>([]);
  loading       = signal(false);
  locationDenied = signal(false);
  userLat: number | null = null;
  userLng: number | null = null;

  subjectsRes = resource<Subject[], void>({
    loader: () => firstValueFrom(this.tutorService.getSubjects())
  });

  ngOnInit() { this.useMyLocation(); }

  useMyLocation() {
    if (!navigator.geolocation) {
      this.locationDenied.set(true);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.userLat = pos.coords.latitude;
        this.userLng = pos.coords.longitude;
        this.locationDenied.set(false);
        this.search();
      },
      () => {
        // Location denied or unavailable — don't use fake coordinates
        this.locationDenied.set(true);
        this.tutors.set([]);
        this.loading.set(false);
      }
    );
  }

  search() {
    if (this.userLat === null || this.userLng === null) {
      this.locationDenied.set(true);
      return;
    }
    // Scroll to top of results when filters applied
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.loading.set(true);
    const f = this.filterForm.value;
    this.tutorService.searchNearby({
      latitude:         this.userLat!,
      longitude:        this.userLng!,
      radiusKm:         f.radiusKm ?? 10,
      subjectId:        f.subjectId    ?? undefined,
      maxRate:          f.maxRate      ?? undefined,
      teachingMode:     f.teachingMode     || undefined,
      teachingStandard: f.teachingStandard || undefined,
      minRating:        f.minRating    ?? undefined,
      minExperience:    f.minExperience ?? undefined,
    }).subscribe({
      next:  t => { this.tutors.set(t); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  open(t: TutorProfile)    { this.router.navigate(['/tutor', t.id]); }
  message(t: TutorProfile) { this.router.navigate(['/messages', t.userId]); }
  initials(n: string)      { return n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2); }
  stars(r: number)         { return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r)); }
  modeClass(m?: string)    { return m === 'ONLINE' ? 'info' : m === 'IN_PERSON' ? 'success' : 'warning'; }

  setRating(star: number | null) {
    this.filterForm.patchValue({ minRating: star });
  }

  stdShortLabel(code: string): string {
    const map: Record<string, string> = {
      CLASS_1_5:   'Cl.1–5',   CLASS_6_10:  'Cl.6–10',  CLASS_11_12: 'Cl.11–12',
      BCOM:        'B.Com',    BSC:         'B.Sc',      BA:          'B.A',
      MCOM:        'M.Com',    MSC:         'M.Sc',      MA:          'M.A',
      ENGINEERING: 'Engg.',    MEDICAL:     'Medical',
      COMPETITIVE: 'Comp.Exam', OTHERS:     'Others'
    };
    return map[code] ?? code;
  }
}