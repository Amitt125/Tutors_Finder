import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../../core/services/auth.service';
import { MessageService } from '../../../core/services/message.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    MatToolbarModule, MatButtonModule, MatIconModule,
    MatMenuModule, MatDividerModule, MatBadgeModule,
    RouterLink, RouterLinkActive,
  ],
  template: `
    <mat-toolbar class="navbar">
      <a routerLink="/home" class="brand">
        <mat-icon>school</mat-icon>
        <span>TutorFinder</span>
      </a>

      <span class="spacer"></span>

      <nav class="nav-links">
        @if (!auth.isTutor()) {
          <a mat-button routerLink="/search" routerLinkActive="active-link">Find Tutors</a>
        }
        @if (auth.isAuthenticated()) {
          <a mat-button [routerLink]="dashboardLink()" routerLinkActive="active-link">Dashboard</a>

          <!-- Messages button — badge stays until a specific chat is opened -->
          <a mat-button routerLink="/messages" routerLinkActive="active-link">
            <span class="msg-btn-wrap">
              <mat-icon>chat</mat-icon>
              @if (unreadCount() > 0) {
                <span class="msg-badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
              }
            </span>
            Messages
          </a>

          <a mat-button routerLink="/bookings" routerLinkActive="active-link">
            <mat-icon>event</mat-icon> Bookings
          </a>
          @if (auth.isTutor()) {
            <a mat-button routerLink="/tutor/profile-setup" routerLinkActive="active-link">
              <mat-icon>edit</mat-icon> Edit Profile
            </a>
          }
          @if (auth.userRole() === 'ADMIN') {
            <a mat-button routerLink="/admin" routerLinkActive="active-link">
              <mat-icon>admin_panel_settings</mat-icon> Admin Panel
            </a>
          }
        }
      </nav>

      <div class="auth-area">
        @if (!auth.isAuthenticated()) {
          <a mat-button routerLink="/auth/login">Login</a>
          <a mat-raised-button class="register-btn" routerLink="/auth/register">Get Started</a>
        } @else {
          <button mat-icon-button [matMenuTriggerFor]="userMenu" class="avatar-btn">
            @if (auth.profilePicture()) {
              <img [src]="auth.profilePicture()!" alt="avatar" class="avatar-img" />
            } @else {
              <div class="avatar-circle">{{ initials() }}</div>
            }
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="menu-header" mat-menu-item disabled>
              <strong>{{ auth.displayName() }}</strong>
              <span class="role-chip">{{ auth.userRole() }}</span>
            </div>
            <mat-divider />
            <button mat-menu-item [routerLink]="dashboardLink()">
              <mat-icon>dashboard</mat-icon> Dashboard
            </button>
            <!-- No clearBadge here — badge only reduces when a chat is opened -->
            <button mat-menu-item routerLink="/messages">
              <mat-icon>chat</mat-icon> Messages
              @if (unreadCount() > 0) {
                <span class="menu-badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
              }
            </button>
            <button mat-menu-item routerLink="/bookings">
              <mat-icon>event</mat-icon> Bookings
            </button>
            @if (auth.isTutor()) {
              <button mat-menu-item routerLink="/tutor/profile-setup">
                <mat-icon>edit</mat-icon> Edit Profile
              </button>
            }
            @if (auth.isStudent()) {
              <button mat-menu-item routerLink="/search">
                <mat-icon>search</mat-icon> Find Tutors
              </button>
            }
            @if (auth.userRole() === 'ADMIN') {
              <button mat-menu-item routerLink="/admin">
                <mat-icon>admin_panel_settings</mat-icon> Admin Panel
              </button>
            }
            <mat-divider />
            <button mat-menu-item (click)="auth.logout()" class="logout-item">
              <mat-icon>logout</mat-icon> Logout
            </button>
          </mat-menu>
        }
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .navbar { background:white;border-bottom:1px solid #e2e8f0;box-shadow:0 1px 3px rgb(0 0 0/.06);position:sticky;top:0;z-index:100;padding:0 24px; }
    .brand { display:flex;align-items:center;gap:8px;text-decoration:none;color:#4f46e5;font-weight:800;font-size:20px; }
    .brand mat-icon { font-size:28px;width:28px;height:28px; }
    .spacer { flex:1; }
    .nav-links { display:flex;align-items:center; }
    .nav-links a { color:#475569;font-weight:500;border-radius:8px;font-size:14px; }
    .nav-links a.active-link { color:#4f46e5;background:#eef2ff; }
    .auth-area { display:flex;align-items:center;gap:8px; }
    .register-btn { background:#4f46e5 !important;color:white !important;border-radius:8px !important; }
    .avatar-btn { padding:0 !important;width:40px !important;height:40px !important;overflow:hidden;border-radius:50% !important; }
    .avatar-img { width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #e2e8f0; }
    .avatar-circle { width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px; }
    .menu-header { pointer-events:none; }
    .menu-header strong { display:block;font-size:14px;color:#1e293b; }
    .role-chip { background:#eef2ff;color:#4f46e5;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600; }
    .logout-item { color:#ef4444; }
    .msg-btn-wrap { position:relative;display:inline-flex;align-items:center;margin-right:4px; }
    .msg-badge {
      position:absolute;top:-8px;right:-10px;
      background:#ef4444;color:white;
      font-size:10px;font-weight:700;line-height:1;
      min-width:18px;height:18px;border-radius:9px;
      display:flex;align-items:center;justify-content:center;
      padding:0 4px;border:2px solid white;
      animation: badge-pop .2s ease;
    }
    @keyframes badge-pop { 0% { transform:scale(0); } 70% { transform:scale(1.2); } 100% { transform:scale(1); } }
    .menu-badge {
      margin-left:auto;background:#ef4444;color:white;
      font-size:11px;font-weight:700;
      min-width:20px;height:20px;border-radius:10px;
      display:inline-flex;align-items:center;justify-content:center;
      padding:0 5px;
    }
  `]
})
export class NavbarComponent {
  auth           = inject(AuthService);
  private msgSvc = inject(MessageService);
  router         = inject(Router);

  unreadCount   = this.msgSvc.unreadCount;
  initials      = computed(() => this.auth.displayName().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2));
  dashboardLink = computed(() =>
    this.auth.userRole() === 'ADMIN'  ? '/admin' :
    this.auth.isTutor()               ? '/tutor/dashboard' : '/student/dashboard'
  );
}
