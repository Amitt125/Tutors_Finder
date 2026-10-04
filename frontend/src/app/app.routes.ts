import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  { path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },

  // ── Auth ──────────────────────────────────────────────────────────────────
  { path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },

  // ── Search (public) ───────────────────────────────────────────────────────
  { path: 'search',
    loadComponent: () => import('./features/student/search/search.component').then(m => m.SearchComponent) },

  // ── Student ───────────────────────────────────────────────────────────────
  { path: 'student/dashboard',
    canActivate: [authGuard], data: { roles: ['STUDENT'] },
    loadComponent: () => import('./features/student/dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent) },

  // ── Tutor static routes MUST come before tutor/:id ────────────────────────
  { path: 'tutor/dashboard',
    canActivate: [authGuard], data: { roles: ['TUTOR'] },
    loadComponent: () => import('./features/tutor/dashboard/tutor-dashboard.component').then(m => m.TutorDashboardComponent) },
  { path: 'tutor/profile-setup',
    canActivate: [authGuard], data: { roles: ['TUTOR'] },
    loadComponent: () => import('./features/tutor/profile-setup/tutor-profile-setup.component').then(m => m.TutorProfileSetupComponent) },

  // ── Tutor dynamic route MUST come AFTER static tutor/* routes ─────────────
  { path: 'tutor/:id',
    loadComponent: () => import('./features/tutor/profile/tutor-profile.component').then(m => m.TutorProfileComponent) },

  // ── Admin (lazy-loaded feature module with own sidebar layout) ────────────
  { path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes) },

  // ── Chat ──────────────────────────────────────────────────────────────────
  { path: 'messages',
    canActivate: [authGuard],
    loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent) },
  { path: 'messages/:partnerId',
    canActivate: [authGuard],
    loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent) },

  // ── Bookings ──────────────────────────────────────────────────────────────
  { path: 'bookings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/booking/bookings.component').then(m => m.BookingsComponent) },

  // ── Payments ──────────────────────────────────────────────────────────────
  { path: 'payments',
    canActivate: [authGuard],
    loadComponent: () => import('./features/payment/payment-history.component').then(m => m.PaymentHistoryComponent) },

  { path: '**', redirectTo: '/home' }
];
