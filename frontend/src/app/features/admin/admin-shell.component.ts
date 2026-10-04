import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="admin-layout">

      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="collapsed()">
        <div class="sidebar-brand">
          <mat-icon>admin_panel_settings</mat-icon>
          @if (!collapsed()) { <span>Admin Panel</span> }
        </div>

        <nav class="sidebar-nav">
          @for (item of navItems; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active"
               [matTooltip]="collapsed() ? item.label : ''" matTooltipPosition="right"
               class="nav-item">
              <mat-icon>{{ item.icon }}</mat-icon>
              @if (!collapsed()) { <span>{{ item.label }}</span> }
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/home" class="nav-item"
             [matTooltip]="collapsed() ? 'Back to App' : ''" matTooltipPosition="right">
            <mat-icon>arrow_back</mat-icon>
            @if (!collapsed()) { <span>Back to App</span> }
          </a>
          <button class="nav-item logout-btn" (click)="auth.logout()"
                  [matTooltip]="collapsed() ? 'Logout' : ''" matTooltipPosition="right">
            <mat-icon>logout</mat-icon>
            @if (!collapsed()) { <span>Logout</span> }
          </button>
        </div>
      </aside>

      <!-- Toggle button -->
      <button class="collapse-btn" (click)="collapsed.update(v => !v)"
              [matTooltip]="collapsed() ? 'Expand' : 'Collapse'">
        <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
      </button>

      <!-- Main content -->
      <main class="admin-main">
        <div class="admin-topbar">
          <span class="topbar-title">TutorFinder Admin</span>
          <div class="topbar-user">
            <mat-icon>account_circle</mat-icon>
            <span>{{ auth.displayName() }}</span>
          </div>
        </div>
        <div class="admin-content">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout { display:flex;min-height:100vh;background:#f8fafc; }

    /* sidebar */
    .sidebar { width:240px;background:#1e293b;color:white;display:flex;flex-direction:column;transition:width .25s ease;flex-shrink:0;position:relative; }
    .sidebar.collapsed { width:64px; }
    .sidebar-brand { display:flex;align-items:center;gap:12px;padding:20px 16px;border-bottom:1px solid rgba(255,255,255,.08);font-size:16px;font-weight:700;color:#e2e8f0;overflow:hidden;white-space:nowrap; }
    .sidebar-brand mat-icon { font-size:28px;width:28px;height:28px;color:#818cf8;flex-shrink:0; }
    .sidebar-nav { flex:1;padding:12px 8px;display:flex;flex-direction:column;gap:2px; }
    .sidebar-footer { padding:12px 8px;border-top:1px solid rgba(255,255,255,.08);display:flex;flex-direction:column;gap:2px; }
    .nav-item { display:flex;align-items:center;gap:12px;padding:10px 10px;border-radius:8px;color:#94a3b8;text-decoration:none;font-size:14px;font-weight:500;transition:all .15s;cursor:pointer;background:none;border:none;width:100%;overflow:hidden;white-space:nowrap; }
    .nav-item:hover { background:rgba(255,255,255,.07);color:#e2e8f0; }
    .nav-item.active { background:#4f46e5;color:white; }
    .nav-item.active mat-icon { color:white; }
    .nav-item mat-icon { font-size:20px;width:20px;height:20px;flex-shrink:0; }
    .logout-btn { color:#f87171; }
    .logout-btn:hover { background:rgba(248,113,113,.1) !important; }

    /* collapse button */
    .collapse-btn { position:fixed;left:228px;top:50%;transform:translateY(-50%);z-index:50;width:24px;height:48px;background:#1e293b;border:none;border-radius:0 6px 6px 0;color:#94a3b8;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:left .25s; }
    .collapse-btn:hover { color:white;background:#334155; }

    /* main */
    .admin-main { flex:1;display:flex;flex-direction:column;min-width:0; }
    .admin-topbar { background:white;border-bottom:1px solid #e2e8f0;padding:0 28px;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10; }
    .topbar-title { font-size:18px;font-weight:700;color:#1e293b; }
    .topbar-user { display:flex;align-items:center;gap:8px;color:#64748b;font-size:14px; }
    .topbar-user mat-icon { color:#4f46e5; }
    .admin-content { padding:28px;flex:1; }
  `]
})
export class AdminShellComponent {
  auth      = inject(AuthService);
  collapsed = signal(false);

  navItems = [
    { path: '/admin/dashboard', icon: 'dashboard',        label: 'Dashboard'    },
    { path: '/admin/users',     icon: 'people',            label: 'Users'        },
    { path: '/admin/documents', icon: 'workspace_premium', label: 'Verifications' },
    { path: '/admin/bookings',  icon: 'event',             label: 'Bookings'     },
    { path: '/admin/reviews',   icon: 'rate_review',       label: 'Reviews'      },
    { path: '/admin/chats',     icon: 'forum',             label: 'Chat Monitor' },
  ];
}
