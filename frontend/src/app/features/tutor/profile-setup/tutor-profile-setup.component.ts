import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { BookingService } from '../../../core/services/booking.service';
import { AvailabilitySlot } from '../../../shared/models/booking.model';
import { TutorService } from '../../../core/services/tutor.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subject, TutorDocument } from '../../../shared/models/tutor.model';
import { absoluteUrl } from '../../../shared/utils/url.util';

@Component({
  selector: 'app-tutor-profile-setup',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule,
            MatButtonModule, MatSelectModule, MatIconModule,
            MatSnackBarModule, MatProgressSpinnerModule, TitleCasePipe],
  template: `
    <div class="setup-page page-container">
      <div class="card setup-card">
        <div class="setup-header">
          <h1>Complete Your Profile</h1>
          <p>Help students find you by filling out your tutor profile</p>
        </div>

        @if (pageLoading()) {
          <div style="text-align:center;padding:48px">
            <mat-spinner diameter="48" style="margin:0 auto" />
            <p style="margin-top:16px;color:#64748b">Loading your profile…</p>
          </div>
        } @else {

          <!-- ══════════════════════════════════════════
               SECTION 0 — Profile Picture
          ══════════════════════════════════════════ -->
          <div class="form-section">
            <h3><span class="step">0</span> Profile Picture</h3>
            <div class="pic-upload-area">
              <div class="pic-preview">
                @if (picPreview()) {
                  <img [src]="picPreview()" alt="Profile picture" class="pic-img" />
                } @else {
                  <div class="pic-placeholder">
                    <mat-icon>person</mat-icon>
                  </div>
                }
              </div>
              <div class="pic-actions">
                <label class="upload-btn mat-mdc-button mdc-button mdc-button--outlined">
                  <mat-icon>upload</mat-icon>
                  {{ picPreview() ? 'Change Photo' : 'Upload Photo' }}
                  <input type="file" accept="image/jpeg,image/png,image/webp"
                         (change)="onPicSelected($event)" hidden>
                </label>
                @if (picFile()) {
                  <button mat-raised-button class="btn-save-pic"
                          (click)="savePic()" [disabled]="picUploading()">
                    @if (picUploading()) { <mat-spinner diameter="18" style="display:inline-block;margin-right:6px" /> }
                    {{ picUploading() ? 'Uploading…' : 'Save Picture' }}
                  </button>
                }
                <p class="pic-hint">JPG, PNG or WEBP · Max 5 MB</p>
              </div>
            </div>
          </div>

          <!-- ══════════════════════════════════════════
               SECTION 1 — About You
          ══════════════════════════════════════════ -->
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="form-section">
              <h3><span class="step">1</span> About You</h3>
              <mat-form-field appearance="outline">
                <mat-label>Bio / Introduction</mat-label>
                <textarea matInput formControlName="bio" rows="4"
                          placeholder="Tell students about your teaching style…"></textarea>
              </mat-form-field>
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Education</mat-label>
                  <input matInput formControlName="education" placeholder="e.g. B.Tech CS, IIT Delhi">
                  <mat-icon matSuffix>school</mat-icon>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Experience (years)</mat-label>
                  <input matInput type="number" formControlName="experienceYears" min="0">
                </mat-form-field>
              </div>

              <!-- Teaching Standard -->
              <mat-form-field appearance="outline">
                <mat-label>Teaching Standard / Level</mat-label>
                <mat-select formControlName="teachingStandards" multiple>
                  <mat-option value="">Select a level…</mat-option>
                  <mat-option value="CLASS_1_5">Class 1 – 5 (Primary)</mat-option>
                  <mat-option value="CLASS_6_10">Class 6 – 10 (Secondary)</mat-option>
                  <mat-option value="CLASS_11_12">Class 11 – 12 (Higher Secondary)</mat-option>
                  <mat-option value="BCOM">B.Com</mat-option>
                  <mat-option value="BSC">B.Sc</mat-option>
                  <mat-option value="BA">B.A</mat-option>
                  <mat-option value="MCOM">M.Com</mat-option>
                  <mat-option value="MSC">M.Sc</mat-option>
                  <mat-option value="MA">M.A</mat-option>
                  <mat-option value="ENGINEERING">Engineering (B.Tech / B.E)</mat-option>
                  <mat-option value="MEDICAL">Medical (MBBS / BDS)</mat-option>
                  <mat-option value="COMPETITIVE">Competitive Exams (JEE / NEET / UPSC)</mat-option>
                  <mat-option value="OTHERS">Others</mat-option>
                </mat-select>
                <mat-icon matSuffix>menu_book</mat-icon>
              </mat-form-field>

              <!-- Show "Other" text field only when Others is selected -->
              @if (form.get('teachingStandards')?.value?.includes('OTHERS')) {
                <mat-form-field appearance="outline">
                  <mat-label>Please specify what you teach</mat-label>
                  <input matInput formControlName="teachingStandardOther"
                         placeholder="e.g. Diploma, CA, Spoken English…">
                  <mat-icon matSuffix>edit</mat-icon>
                </mat-form-field>
              }
            </div>

            <!-- ══════════════════════════════════════════
                 SECTION 2 — Teaching Details
            ══════════════════════════════════════════ -->
            <div class="form-section">
              <h3><span class="step">2</span> Teaching Details</h3>
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Hourly Rate (₹)</mat-label>
                  <input matInput type="number" formControlName="hourlyRate" min="1">
                  <span matPrefix>₹&nbsp;</span>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Teaching Mode</mat-label>
                  <mat-select formControlName="teachingMode">
                    <mat-option value="IN_PERSON">In Person Only</mat-option>
                    <mat-option value="ONLINE">Online Only</mat-option>
                    <mat-option value="BOTH">Both</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <mat-form-field appearance="outline">
                <mat-label>Subjects You Teach</mat-label>
                <mat-select formControlName="subjectIds" multiple>
                  @for (s of subjects(); track s.id) {
                    <mat-option [value]="s.id">{{ s.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <!-- ══════════════════════════════════════════
                 SECTION 3 — Location
            ══════════════════════════════════════════ -->
            <div class="form-section">
              <h3><span class="step">3</span> Location</h3>
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Address</mat-label>
                  <input matInput formControlName="address">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>City</mat-label>
                  <input matInput formControlName="city">
                </mat-form-field>
              </div>
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>State</mat-label>
                  <input matInput formControlName="state">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Service Radius (km)</mat-label>
                  <input matInput type="number" formControlName="serviceRadiusKm" min="1">
                </mat-form-field>
              </div>
              <button mat-stroked-button type="button" (click)="detectLocation()"
                      [disabled]="locating()">
                @if (locating()) {
                  <mat-spinner diameter="16" style="display:inline-block;margin-right:6px"></mat-spinner>
                  Detecting…
                } @else {
                  <ng-container>
                    <mat-icon>my_location</mat-icon> Auto-detect location
                  </ng-container>
                }
              </button>
              @if (form.get('latitude')?.value) {
                <p class="location-ok">
                  <mat-icon>check_circle</mat-icon>
                  Location detected — address, city and state filled automatically
                </p>
              } @else {
                <p class="location-warning">
                  <mat-icon>warning</mat-icon>
                  GPS location required to appear in student searches.
                  Typing city/state alone is not enough.
                </p>
              }
            </div>

            <div class="form-actions">
              <button mat-raised-button class="btn-primary save-btn"
                      type="submit" [disabled]="saving()">
                @if (saving()) {
                  <mat-spinner diameter="20" style="display:inline-block;margin-right:8px" />
                }
                {{ saving() ? 'Saving…' : 'Save Profile' }}
              </button>
            </div>
          </form>


          <!-- ══════════════════════════════════════════
               SECTION 5 — Weekly Availability
          ══════════════════════════════════════════ -->
          <div class="form-section avail-section">
            <h3>
              <span class="step">5</span> Weekly Availability
              <span class="optional-badge">Students book from these slots</span>
            </h3>
            <p class="avail-hint">
              Define the days and hours you are available to teach.
              Students will see time slots generated from this schedule.
            </p>

            <!-- Add a day -->
            <div class="avail-add-card">
              <mat-form-field appearance="outline">
                <mat-label>Day</mat-label>
                <mat-select [(value)]="newDay">
                  @for (d of allDays; track d) {
                    <mat-option [value]="d">{{ d | titlecase }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Start Time</mat-label>
                <input matInput type="time" [(ngModel)]="newStart" [ngModelOptions]="{standalone:true}">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>End Time</mat-label>
                <input matInput type="time" [(ngModel)]="newEnd" [ngModelOptions]="{standalone:true}">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Slot (mins)</mat-label>
                <mat-select [(value)]="newSlotMins">
                  <mat-option [value]="30">30 min</mat-option>
                  <mat-option [value]="45">45 min</mat-option>
                  <mat-option [value]="60">60 min</mat-option>
                  <mat-option [value]="90">90 min</mat-option>
                  <mat-option [value]="120">2 hrs</mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-stroked-button type="button" (click)="addAvailRow()">
                <mat-icon>add</mat-icon> Add
              </button>
            </div>

            <!-- Current schedule -->
            @if (availRows().length > 0) {
              <div class="avail-list">
                @for (row of availRows(); track $index) {
                  <div class="avail-row">
                    <span class="avail-day">{{ row.dayOfWeek | titlecase }}</span>
                    <span class="avail-time">{{ row.startTime }} – {{ row.endTime }}</span>
                    <span class="avail-slot">{{ row.slotDurationMinutes }}min slots</span>
                    <button mat-icon-button (click)="removeAvailRow($index)"
                            style="color:#ef4444" title="Remove">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                }
              </div>
              <button mat-raised-button class="btn-save-avail"
                      type="button" (click)="saveAvailability()" [disabled]="savingAvail()">
                @if (savingAvail()) {
                  <mat-spinner diameter="18" style="display:inline-block;margin-right:6px" />
                }
                {{ savingAvail() ? 'Saving…' : 'Save Availability' }}
              </button>
            } @else {
              <p style="color:#94a3b8;font-size:14px">No availability set yet. Add days above.</p>
            }
          </div>


          <!-- ══════════════════════════════════════════
               SECTION 4 — Qualification Certificates (optional)
          ══════════════════════════════════════════ -->
          <div class="form-section cert-section">
            <h3>
              <span class="step">4</span> Qualification Certificates
              <span class="optional-badge">Optional</span>
            </h3>
            <p class="cert-hint">
              Upload your degree certificates, teaching certifications, or any relevant credentials.
              Students will see these on your profile to build trust.
            </p>

            <!-- Upload new certificate -->
            <div class="cert-upload-card">
              <mat-form-field appearance="outline" style="width:100%">
                <mat-label>Certificate / Degree Name</mat-label>
                <input matInput [value]="certName" (input)="certName = $any($event.target).value" placeholder="e.g. B.Tech Computer Science, CTET Certificate">
                <mat-icon matSuffix>workspace_premium</mat-icon>
              </mat-form-field>
              <mat-form-field appearance="outline" style="width:100%">
                <mat-label>Document Type</mat-label>
              <mat-select [value]="certType" (selectionChange)="certType = $event.value">
                  <mat-option value="DEGREE">Degree</mat-option>
                  <mat-option value="CERTIFICATION">Certification</mat-option>
                  <mat-option value="ID_PROOF">ID Proof</mat-option>
                  <mat-option value="OTHER">Other</mat-option>
                </mat-select>
              </mat-form-field>

              <label class="upload-btn mat-mdc-button mdc-button mdc-button--outlined" style="margin-bottom:8px">
                <mat-icon>attach_file</mat-icon>
                {{ certFile() ? certFile()!.name : 'Choose File (PDF, JPG, PNG)' }}
                <input type="file" accept=".pdf,image/jpeg,image/png,.doc,.docx"
                       (change)="onCertSelected($event)" hidden>
              </label>

              <button mat-raised-button class="btn-cert-upload"
                      (click)="uploadCert()" [disabled]="!certFile() || certUploading()">
                @if (certUploading()) {
                  <mat-spinner diameter="18" style="display:inline-block;margin-right:6px" />
                }
                {{ certUploading() ? 'Uploading…' : 'Upload Certificate' }}
              </button>
            </div>

            <!-- Existing certificates -->
            @if (documents().length > 0) {
              <div class="cert-list">
                <h4 style="font-size:15px;font-weight:600;margin-bottom:12px;color:#475569">
                  Uploaded Certificates ({{ documents().length }})
                </h4>
                @for (doc of documents(); track doc.id) {
                  <div class="cert-row">
                    <div class="cert-icon">
                      <mat-icon>{{ docIcon(doc.documentType) }}</mat-icon>
                    </div>
                    <div class="cert-info">
                      <strong>{{ doc.certificateName ?? doc.documentType }}</strong>
                      <span class="cert-type">{{ doc.documentType }}</span>
                    </div>
                    <div class="cert-badges">
                      @if (doc.verified) {
                        <span class="badge badge-success">✓ Verified</span>
                      } @else {
                        <span class="badge badge-warning">Pending</span>
                      }
                    </div>
                    <div class="cert-actions">
                      <a [href]="safeUrl(doc.fileUrl)" target="_blank" mat-icon-button title="View">
                        <mat-icon>visibility</mat-icon>
                      </a>
                      <button mat-icon-button (click)="deleteCert(doc)" title="Delete"
                              style="color:#ef4444">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

        }
      </div>
    </div>
  `,
  styles: [`
    .setup-page { padding-top:24px;max-width:860px;margin:0 auto; }
    .setup-card { padding:40px; }
    .setup-header { text-align:center;margin-bottom:40px; }
    .setup-header h1 { font-size:28px;font-weight:700;margin-bottom:8px; }
    .setup-header p { color:#64748b; }

    /* sections */
    .form-section { margin-bottom:36px;padding-bottom:32px;border-bottom:1px solid #f1f5f9; }
    .form-section:last-child { border:none; }
    .form-section h3 { display:flex;align-items:center;gap:12px;font-size:18px;font-weight:600;margin-bottom:20px; }
    .step { width:28px;height:28px;border-radius:50%;background:#4f46e5;color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0; }
    .form-row { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
    mat-form-field { width:100%; }
    .optional-badge { background:#e0e7ff;color:#4f46e5;padding:2px 10px;border-radius:100px;font-size:11px;font-weight:600;margin-left:4px; }

    /* profile picture */
    .pic-upload-area { display:flex;align-items:center;gap:28px; }
    .pic-preview { flex-shrink:0; }
    .pic-img { width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid #e2e8f0; }
    .pic-placeholder { width:100px;height:100px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;border:2px dashed #cbd5e1; }
    .pic-placeholder mat-icon { font-size:40px;width:40px;height:40px;color:#94a3b8; }
    .pic-actions { display:flex;flex-direction:column;gap:10px; }
    .upload-btn { cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;color:#475569;background:white; }
    .upload-btn:hover { border-color:#4f46e5;color:#4f46e5; }
    .btn-save-pic { background:#059669 !important;color:white !important;border-radius:8px !important;display:inline-flex !important;align-items:center !important; }
    .pic-hint { font-size:12px;color:#94a3b8;margin:0; }

    /* certificates */
    .cert-section { background:#fafafa;border-radius:12px;padding:24px;border:none !important; }
    .cert-hint { color:#64748b;font-size:14px;margin-bottom:20px;line-height:1.6; }
    .cert-upload-card { background:white;border:1px solid #e2e8f0;border-radius:10px;padding:20px;display:flex;flex-direction:column;gap:12px;margin-bottom:24px; }
    .btn-cert-upload { background:#4f46e5 !important;color:white !important;border-radius:8px !important;display:inline-flex !important;align-items:center !important; }
    .cert-list { display:flex;flex-direction:column;gap:10px; }
    .cert-row { display:flex;align-items:center;gap:12px;background:white;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px; }
    .cert-icon { width:40px;height:40px;border-radius:8px;background:#eef2ff;display:flex;align-items:center;justify-content:center;color:#4f46e5;flex-shrink:0; }
    .cert-info { flex:1;min-width:0; }
    .cert-info strong { display:block;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .cert-type { font-size:12px;color:#94a3b8; }
    .cert-badges { flex-shrink:0; }
    .cert-actions { display:flex;gap:4px;flex-shrink:0; }

    /* misc */
    .location-ok { display:flex;align-items:center;gap:6px;color:#059669;font-size:13px;margin-top:8px; }
    .location-ok mat-icon { font-size:16px;width:16px;height:16px; }
    .location-warning { display:flex;align-items:center;gap:6px;color:#92400e;font-size:13px;margin-top:8px;background:#fff7ed;border-radius:6px;padding:8px 10px; }
    .location-warning mat-icon { font-size:16px;width:16px;height:16px;flex-shrink:0; }
    .form-actions { text-align:center;margin-top:8px; }
    .save-btn { height:48px !important;padding:0 48px !important;font-size:16px !important;border-radius:10px !important;display:inline-flex !important;align-items:center !important; }

    /* availability editor */
    .avail-section { background:#f0fdf4;border-radius:12px;padding:24px;border:none !important; }
    .avail-hint { color:#64748b;font-size:14px;margin-bottom:20px;line-height:1.6; }
    .avail-add-card { display:flex;flex-wrap:wrap;align-items:center;gap:12px;background:white;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:16px; }
    .avail-add-card mat-form-field { min-width:120px;flex:1; }
    .avail-list { display:flex;flex-direction:column;gap:8px;margin-bottom:16px; }
    .avail-row { display:flex;align-items:center;gap:12px;background:white;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px; }
    .avail-day { font-weight:600;font-size:14px;min-width:90px; }
    .avail-time { color:#475569;font-size:14px;flex:1; }
    .avail-slot { font-size:12px;color:#94a3b8;background:#e2e8f0;padding:2px 8px;border-radius:100px; }
    .btn-save-avail { background:#059669 !important;color:white !important;border-radius:8px !important;display:inline-flex !important;align-items:center !important; }
    @media (max-width:600px) {
      .form-row { grid-template-columns:1fr; }
      .setup-card { padding:20px; }
      .pic-upload-area { flex-direction:column;align-items:flex-start; }
    }
  `]
})
export class TutorProfileSetupComponent implements OnInit {
  private fb             = inject(FormBuilder);
  private bookingService = inject(BookingService);
  private tutorService   = inject(TutorService);
  private authService    = inject(AuthService);
  private router         = inject(Router);
  private snack          = inject(MatSnackBar);
  private http           = inject(HttpClient);

  locating = signal(false);  // true while reverse-geocoding is in progress

  // ── signals ────────────────────────────────────────────────────────────────
  subjects     = signal<Subject[]>([]);
  documents    = signal<TutorDocument[]>([]);
  pageLoading  = signal(true);
  saving       = signal(false);

  // profile pic
  picPreview   = signal<string | null>(null);
  picFile      = signal<File | null>(null);
  picUploading = signal(false);

  // certificates
  certFile      = signal<File | null>(null);
  certUploading = signal(false);
  certName      = '';
  certType      = 'CERTIFICATION';

  // ── Availability ───────────────────────────────────────────────────────────
  allDays    = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
  availRows  = signal<AvailabilitySlot[]>([]);
  savingAvail = signal(false);
  newDay     = 'MONDAY';
  newStart   = '09:00';
  newEnd     = '17:00';
  newSlotMins = 60;

  form = this.fb.group({
    bio:                  ['', Validators.required],
    education:            [''],
    teachingStandards:    [[] as string[]],
    teachingStandardOther:[''],
    experienceYears:      [0],
    hourlyRate:      [null as number | null, [Validators.required, Validators.min(1)]],
    teachingMode:    ['BOTH', Validators.required],
    subjectIds:      [[] as number[], Validators.required],
    address:         [''],
    city:            [''],
    state:           [''],
    serviceRadiusKm: [10],
    latitude:        [null as number | null],
    longitude:       [null as number | null],
  });

  ngOnInit() {
    this.tutorService.getSubjects().subscribe({
      next: s => this.subjects.set(s),
      error: () => {}
    });

    this.tutorService.getMyProfile().subscribe({
      next: p => {
        this.form.patchValue({
          bio:                   p.bio             ?? '',
          education:             p.education       ?? '',
          teachingStandards:     p.teachingStandards     ?? [],
          teachingStandardOther: p.teachingStandardOther ?? '',
          experienceYears:       p.experienceYears ?? 0,
          hourlyRate:      p.hourlyRate ?? null,
          teachingMode:    p.teachingMode ?? 'BOTH',
          subjectIds:      p.subjects?.map(s => s.id) ?? [],
          address:         p.address ?? '',
          city:            p.city ?? '',
          state:           p.state ?? '',
          serviceRadiusKm: p.serviceRadiusKm ?? 10,
          latitude:        p.latitude ?? null,
          longitude:       p.longitude ?? null,
        });
        // show existing profile picture
        if (p.profilePicture) this.picPreview.set(absoluteUrl(p.profilePicture));
        // load existing certificates
        this.documents.set(p.documents ?? []);
        // Load existing availability
        this.bookingService.getMyAvailability().subscribe({
          next: a => this.availRows.set(a),
          error: () => {}
        });
        this.pageLoading.set(false);
      },
      error: () => this.pageLoading.set(false)
    });
  }

  // ── Profile picture ────────────────────────────────────────────────────────

  onPicSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.picFile.set(file);
    // show local preview immediately
    const reader = new FileReader();
    reader.onload = e => this.picPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  savePic() {
    const f = this.picFile();
    if (!f) return;
    this.picUploading.set(true);
    this.tutorService.uploadProfilePicture(f).subscribe({
      next: url => {
        this.picPreview.set(url);
        this.picFile.set(null);
        this.picUploading.set(false);
        this.authService.updateProfilePicture(url);  // update navbar avatar instantly
        this.snack.open('✅ Profile picture updated!', 'Close', { duration: 3000 });
      },
      error: err => {
        this.snack.open(err.error?.message ?? 'Upload failed', 'Close', { duration: 3000 });
        this.picUploading.set(false);
      }
    });
  }

  // ── Certificates ───────────────────────────────────────────────────────────

  onCertSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.certFile.set(file);
  }

  uploadCert() {
    const f = this.certFile();
    if (!f) return;
    this.certUploading.set(true);
    this.tutorService.uploadCertificate(f, this.certName, this.certType).subscribe({
      next: doc => {
        this.documents.update(d => [...d, doc]);
        this.certFile.set(null);
        this.certName = '';
        this.certUploading.set(false);
        this.snack.open('✅ Certificate uploaded!', 'Close', { duration: 3000 });
      },
      error: err => {
        this.snack.open(err.error?.message ?? 'Upload failed', 'Close', { duration: 3000 });
        this.certUploading.set(false);
      }
    });
  }

  deleteCert(doc: TutorDocument) {
    this.tutorService.deleteCertificate(doc.id).subscribe({
      next: () => {
        this.documents.update(d => d.filter(x => x.id !== doc.id));
        this.snack.open('Certificate removed', 'Close', { duration: 2000 });
      },
      error: () => this.snack.open('Delete failed', 'Close', { duration: 3000 })
    });
  }

  // ── Location ───────────────────────────────────────────────────────────────

  detectLocation() {
    if (!navigator.geolocation) {
      this.snack.open('Geolocation is not supported by your browser.', 'Close', { duration: 3000 });
      return;
    }
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Save coordinates immediately
        this.form.patchValue({ latitude: lat, longitude: lng });

        // Reverse-geocode using OpenStreetMap Nominatim (free, no API key)
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
        this.http.get<any>(url, {
          headers: { 'Accept-Language': 'en' }
        }).subscribe({
          next: data => {
            const addr = data.address ?? {};

            // Address: road/suburb
            const address = [addr.road, addr.suburb, addr.neighbourhood]
              .filter(Boolean).join(', ');

            // City: try multiple Nominatim fields
            const city = addr.city || addr.town || addr.village
                       || addr.district || addr.county || '';

            // State
            const state = addr.state || addr.state_district || '';

            this.form.patchValue({ address, city, state });
            this.locating.set(false);
            this.snack.open('📍 Location detected and fields filled!', 'Close', { duration: 3000 });
          },
          error: () => {
            // Coordinates saved even if geocoding fails
            this.locating.set(false);
            this.snack.open('📍 Coordinates saved. Could not fetch address details.', 'Close', { duration: 3000 });
          }
        });
      },
      () => {
        this.locating.set(false);
        this.snack.open('Could not get location. Please allow location access.', 'Close', { duration: 3000 });
      },
      { timeout: 10000 }
    );
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }
    this.saving.set(true);
    this.tutorService.updateProfile(this.form.value as any).subscribe({
      next: () => {
        this.snack.open('✅ Profile saved!', 'Close', { duration: 3000 });
        this.router.navigate(['/tutor/dashboard']);
      },
      error: err => {
        this.snack.open(err.error?.message ?? 'Save failed. Please try again.', 'Close', { duration: 4000 });
        this.saving.set(false);
      }
    });
  }

  // ── Availability ───────────────────────────────────────────────────────────

  addAvailRow() {
    if (!this.newStart || !this.newEnd) return;
    if (this.newEnd <= this.newStart) {
      this.snack.open('End time must be after start time', 'Close', { duration: 3000 });
      return;
    }
    this.availRows.update(rows => [...rows, {
      dayOfWeek: this.newDay,
      startTime: this.newStart,
      endTime: this.newEnd,
      slotDurationMinutes: this.newSlotMins
    }]);
  }

  removeAvailRow(index: number) {
    this.availRows.update(rows => rows.filter((_, i) => i !== index));
  }

  saveAvailability() {
    if (this.availRows().length === 0) return;
    this.savingAvail.set(true);
    this.bookingService.saveAvailability(this.availRows()).subscribe({
      next: saved => {
        this.availRows.set(saved);
        this.savingAvail.set(false);
        this.snack.open('✅ Availability saved!', 'Close', { duration: 3000 });
      },
      error: err => {
        this.snack.open(err.error?.message ?? 'Save failed', 'Close', { duration: 3000 });
        this.savingAvail.set(false);
      }
    });
  }

  docIcon(type?: string): string {
    const icons: Record<string, string> = {
      DEGREE: 'school', CERTIFICATION: 'workspace_premium',
      ID_PROOF: 'badge', OTHER: 'description'
    };
    return icons[type ?? ''] ?? 'description';
  }

  safeUrl(url: string | null | undefined): string | null { return absoluteUrl(url); }
}
