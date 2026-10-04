import { Component, inject, resource } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule, DecimalPipe, RouterLink],
  template: `
    <h1 class="page-title">Dashboard</h1>

    @if (statsRes.isLoading()) {
      <div class="spinner-wrap"><mat-spinner diameter="48" /></div>
    } @else if (statsRes.value(); as s) {

      <!-- Stat cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue"><mat-icon>people</mat-icon></div>
          <div>
            <div class="stat-val">{{ s.totalUsers }}</div>
            <div class="stat-lbl">Total Users</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon indigo"><mat-icon>school</mat-icon></div>
          <div>
            <div class="stat-val">{{ s.totalTutors }}</div>
            <div class="stat-lbl">Tutors</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple"><mat-icon>person</mat-icon></div>
          <div>
            <div class="stat-val">{{ s.totalStudents }}</div>
            <div class="stat-lbl">Students</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><mat-icon>payments</mat-icon></div>
          <div>
            <div class="stat-val">₹{{ s.totalRevenue | number:'1.0-0' }}</div>
            <div class="stat-lbl">Total Revenue</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange"><mat-icon>event</mat-icon></div>
          <div>
            <div class="stat-val">{{ s.totalBookings }}</div>
            <div class="stat-lbl">Total Bookings</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon teal"><mat-icon>event_available</mat-icon></div>
          <div>
            <div class="stat-val">{{ s.activeBookings }}</div>
            <div class="stat-lbl">Active Bookings</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon amber"><mat-icon>person_add</mat-icon></div>
          <div>
            <div class="stat-val">{{ s.newSignupsWeek }}</div>
            <div class="stat-lbl">New This Week</div>
          </div>
        </div>
        <div class="stat-card clickable" routerLink="/admin/documents">
          <div class="stat-icon red"><mat-icon>pending_actions</mat-icon></div>
          <div>
            <div class="stat-val">{{ s.pendingDocs }}</div>
            <div class="stat-lbl">Pending Verifications</div>
          </div>
          @if (s.pendingDocs > 0) {
            <span class="urgent-badge">Action needed</span>
          }
        </div>
      </div>

      <!-- Quick links -->
      <div class="quick-row">
        <a class="quick-card" routerLink="/admin/users">
          <mat-icon>people</mat-icon>
          <strong>Manage Users</strong>
          <span>Activate, deactivate accounts</span>
        </a>
        <a class="quick-card highlight" routerLink="/admin/documents">
          <mat-icon>workspace_premium</mat-icon>
          <strong>Verify Documents</strong>
          <span>{{ s.pendingDocs }} awaiting review</span>
        </a>
        <a class="quick-card" routerLink="/admin/bookings">
          <mat-icon>event</mat-icon>
          <strong>All Bookings</strong>
          <span>{{ s.totalBookings }} total</span>
        </a>
        <a class="quick-card" routerLink="/admin/payments">
          <mat-icon>payments</mat-icon>
          <strong>Payments</strong>
          <span>₹{{ s.totalRevenue | number:'1.0-0' }} collected</span>
        </a>
      </div>
    }
  `,
  styles: [`
    .page-title { font-size:26px;font-weight:800;color:#1e293b;margin-bottom:28px; }
    .spinner-wrap { display:flex;justify-content:center;padding:80px; }

    /* stat grid */
    .stats-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-bottom:28px; }
    .stat-card { background:white;border-radius:14px;padding:20px;display:flex;align-items:center;gap:16px;box-shadow:0 1px 3px rgb(0 0 0/.07);position:relative; }
    .stat-card.clickable { cursor:pointer;transition:box-shadow .15s; }
    .stat-card.clickable:hover { box-shadow:0 4px 12px rgb(0 0 0/.12); }
    .stat-icon { width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .stat-icon mat-icon { font-size:24px;width:24px;height:24px;color:white; }
    .blue   { background:#3b82f6; } .indigo { background:#4f46e5; }
    .purple { background:#7c3aed; } .green  { background:#059669; }
    .orange { background:#ea580c; } .teal   { background:#0891b2; }
    .amber  { background:#d97706; } .red    { background:#dc2626; }
    .stat-val { font-size:26px;font-weight:800;color:#1e293b;line-height:1; }
    .stat-lbl { font-size:13px;color:#64748b;margin-top:4px; }
    .urgent-badge { position:absolute;top:10px;right:10px;background:#fef2f2;color:#dc2626;font-size:11px;font-weight:600;padding:2px 8px;border-radius:100px;border:1px solid #fecaca; }

    /* quick links */
    .quick-row { display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px; }
    .quick-card { background:white;border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:6px;text-decoration:none;color:#1e293b;box-shadow:0 1px 3px rgb(0 0 0/.07);transition:box-shadow .15s;border:2px solid transparent; }
    .quick-card:hover { box-shadow:0 4px 12px rgb(0 0 0/.1); }
    .quick-card.highlight { border-color:#4f46e5; }
    .quick-card mat-icon { color:#4f46e5;font-size:28px;width:28px;height:28px;margin-bottom:4px; }
    .quick-card strong { font-size:15px;font-weight:700; }
    .quick-card span { font-size:13px;color:#64748b; }
  `]
})
export class AdminDashboardComponent {
  private adminService = inject(AdminService);
  statsRes = resource({ loader: () => firstValueFrom(this.adminService.getStats()) });
}
