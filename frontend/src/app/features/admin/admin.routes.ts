import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      { path: '',            redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',   loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'users',       loadComponent: () => import('./users/admin-users.component').then(m => m.AdminUsersComponent) },
      { path: 'documents',   loadComponent: () => import('./documents/admin-documents.component').then(m => m.AdminDocumentsComponent) },
      { path: 'bookings',    loadComponent: () => import('./bookings/admin-bookings.component').then(m => m.AdminBookingsComponent) },
      { path: 'reviews',     loadComponent: () => import('./reviews/admin-reviews.component').then(m => m.AdminReviewsComponent) },
      { path: 'chats',      loadComponent: () => import('./chats/admin-chats.component').then(m => m.AdminChatsComponent) },
    ]
  }
];
