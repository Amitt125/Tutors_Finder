import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, ReactiveFormsModule, RouterLink],
  template: `
    <!-- ═══════════════════════════════════════════════════
         TUTOR HOME — shown when logged in as a tutor
    ════════════════════════════════════════════════════ -->
    @if (auth.isTutor()) {
      <div class="tutor-hero">
        <div class="hero-content">
          <span class="hero-badge">👨‍🏫 Tutor Dashboard</span>
          <h1>Welcome back, <span class="highlight">{{ firstName() }}</span>!</h1>
          <p>Manage your sessions, connect with students, and grow your tutoring business.</p>
          <div class="tutor-actions">
            <a mat-raised-button routerLink="/tutor/dashboard" class="btn-primary">
              <mat-icon>dashboard</mat-icon> Go to Dashboard
            </a>
            <a mat-stroked-button routerLink="/tutor/profile-setup" class="btn-outline">
              <mat-icon>edit</mat-icon> Edit Profile
            </a>
          </div>
        </div>
      </div>

      <div class="tutor-cards page-container">
        <div class="quick-card card" routerLink="/tutor/dashboard">
          <div class="qc-icon">📊</div>
          <h3>Dashboard</h3>
          <p>View bookings, stats, and recent activity</p>
        </div>
        <div class="quick-card card" routerLink="/tutor/profile-setup">
          <div class="qc-icon">✏️</div>
          <h3>Edit Profile</h3>
          <p>Update bio, subjects, rate and location</p>
        </div>
        <div class="quick-card card" routerLink="/messages">
          <div class="qc-icon">💬</div>
          <h3>Messages</h3>
          <p>Chat with your students in real time</p>
        </div>
        <div class="quick-card card" routerLink="/payments">
          <div class="qc-icon">💰</div>
          <h3>Earnings</h3>
          <p>Track payments and view your earnings</p>
        </div>
      </div>
    }

    <!-- ═══════════════════════════════════════════════════
         DEFAULT HOME — guests and students
    ════════════════════════════════════════════════════ -->
    @if (!auth.isTutor()) {
      <div class="hero">
        <div class="hero-content">
          <span class="hero-badge">🎓 India's #1 Tutor Platform</span>
          <h1>Find Expert Tutors <br><span class="highlight">Near You</span></h1>
          <p>Connect with verified tutors in your area. Learn any subject, anytime, anywhere.</p>
          <div class="search-bar">
            <mat-icon>location_on</mat-icon>
            <input placeholder="Enter your location or use current location..." [formControl]="searchInput">
            <button mat-raised-button (click)="search()">Find Tutors</button>
          </div>
          <div class="stats">
            <div class="stat"><strong>10,000+</strong><span>Tutors</span></div>
            <div class="stat"><strong>50,000+</strong><span>Students</span></div>
            <div class="stat"><strong>100+</strong><span>Subjects</span></div>
            <div class="stat"><strong>4.8★</strong><span>Avg Rating</span></div>
          </div>
        </div>
      </div>

      <div class="features page-container">
        <h2 class="section-title">Why TutorFinder?</h2>
        <div class="feature-grid">
          @for (f of features; track f.title) {
            <div class="feature-card">
              <div class="feature-icon">{{ f.icon }}</div>
              <h3>{{ f.title }}</h3>
              <p>{{ f.desc }}</p>
            </div>
          }
        </div>
      </div>

      <div class="cta-section">
        <div class="page-container">
          <h2>Are you a tutor?</h2>
          <p>Join thousands of tutors earning on their own schedule</p>
          <a mat-raised-button routerLink="/auth/register" class="btn-primary">Start Teaching Today</a>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ── Shared ──────────────────────────────────────────── */
    .highlight { color:#fbbf24; }
    .btn-primary { background:#4f46e5 !important;color:white !important;padding:12px 32px !important;font-size:16px !important;border-radius:10px !important; }

    /* ── Tutor Hero ───────────────────────────────────────── */
    .tutor-hero { background:linear-gradient(135deg,#059669 0%,#0d9488 100%);color:white;padding:80px 20px;text-align:center; }
    .hero-badge { background:rgba(255,255,255,0.2);padding:6px 16px;border-radius:100px;font-size:14px; }
    .tutor-hero h1 { font-size:48px;font-weight:800;margin:20px 0 16px;line-height:1.1; }
    .tutor-hero p { font-size:18px;opacity:0.9;margin-bottom:32px; }
    .tutor-actions { display:flex;gap:16px;justify-content:center;flex-wrap:wrap; }
    .tutor-actions a { display:flex;align-items:center;gap:8px;border-radius:10px !important;font-size:16px !important;padding:12px 28px !important; }
    .btn-outline { border:2px solid white !important;color:white !important;background:transparent !important; }
    .tutor-cards { display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px;padding:48px 16px; }
    .quick-card { cursor:pointer;padding:32px 24px;text-align:center;transition:transform .2s,box-shadow .2s;border-radius:16px; }
    .quick-card:hover { transform:translateY(-4px);box-shadow:0 12px 24px rgb(0 0 0/.1); }
    .qc-icon { font-size:48px;margin-bottom:16px; }
    .quick-card h3 { font-size:18px;font-weight:600;margin-bottom:8px;color:#1e293b; }
    .quick-card p { color:#64748b;font-size:14px;line-height:1.5; }

    /* ── Student/Guest Hero ──────────────────────────────── */
    .hero { background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:white;padding:80px 20px;text-align:center; }
    .hero h1 { font-size:56px;font-weight:800;margin:20px 0 16px;line-height:1.1; }
    .hero p { font-size:20px;opacity:0.9;margin-bottom:32px; }
    .search-bar { display:flex;align-items:center;background:white;border-radius:12px;padding:8px 8px 8px 16px;max-width:600px;margin:0 auto 40px;gap:8px; }
    .search-bar mat-icon { color:#94a3b8; }
    .search-bar input { flex:1;border:none;outline:none;font-size:16px;color:#1e293b; }
    .search-bar button { background:#4f46e5 !important;color:white !important;border-radius:8px !important; }
    .stats { display:flex;justify-content:center;gap:48px;flex-wrap:wrap; }
    .stat { display:flex;flex-direction:column;align-items:center; }
    .stat strong { font-size:28px;font-weight:700; }
    .stat span { font-size:14px;opacity:0.8; }
    .features { padding:80px 16px;text-align:center; }
    .section-title { font-size:36px;font-weight:700;margin-bottom:48px;color:#1e293b; }
    .feature-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px; }
    .feature-card { background:white;border-radius:16px;padding:32px 24px;box-shadow:0 4px 6px -1px rgb(0 0 0/0.07); }
    .feature-icon { font-size:48px;margin-bottom:16px; }
    .feature-card h3 { font-size:18px;font-weight:600;margin-bottom:8px;color:#1e293b; }
    .feature-card p { color:#64748b;font-size:14px;line-height:1.6; }
    .cta-section { background:#1e293b;color:white;padding:80px 20px;text-align:center; }
    .cta-section h2 { font-size:36px;font-weight:700;margin-bottom:12px; }
    .cta-section p { font-size:18px;opacity:0.7;margin-bottom:32px; }
  `]
})
export class HomeComponent {
  private router = inject(Router);
  auth = inject(AuthService);

  searchInput = new FormControl('');
  firstName = computed(() => this.auth.displayName().split(' ')[0] || 'there');

  features = [
    { icon: '📍', title: 'Find Nearby Tutors', desc: 'Search tutors within your preferred distance using our GPS-powered map.' },
    { icon: '✅', title: 'Verified Profiles',  desc: 'All tutors go through document verification for your peace of mind.' },
    { icon: '📅', title: 'Easy Booking',       desc: 'Book sessions instantly based on real-time tutor availability.' },
    { icon: '💬', title: 'In-App Chat',         desc: 'Communicate with tutors directly through our secure messaging system.' },
    { icon: '⭐', title: 'Ratings & Reviews',   desc: 'Read genuine reviews from students before booking a tutor.' },
    { icon: '💰', title: 'Transparent Pricing', desc: 'No hidden fees. See tutor rates upfront and pay securely.' },
  ];
  search() { this.router.navigate(['/search']); }
}
