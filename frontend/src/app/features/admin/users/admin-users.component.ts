import { Component, inject, signal, resource, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { DatePipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { absoluteUrl } from '../../../shared/utils/url.util';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, FormsModule, DatePipe],
  template: `
    <div class="page-header">
      <h1 class="page-title">User Management</h1>
      <div class="filters">
        <input class="search-input"
               [value]="search()"
               (input)="search.set($any($event.target).value)"
               placeholder="Search name or email…">
        <select class="filter-select"
                [value]="roleFilter()"
                (change)="roleFilter.set($any($event.target).value)">
          <option value="">All Roles</option>
          <option value="STUDENT">Students</option>
          <option value="TUTOR">Tutors</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>
    </div>

    @if (usersRes.isLoading()) {
      <div class="spinner-wrap"><mat-spinner diameter="48" /></div>
    } @else {
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (u of filtered(); track u.id) {
              <tr>
                <td>
                  <div class="user-cell">
                    @if (u.profilePicture) {
                      <img [src]="safe(u.profilePicture)" class="user-avatar-img" alt="avatar">
                    } @else {
                      <div class="user-avatar">{{ initials(u.fullName) }}</div>
                    }
                    <span>{{ u.fullName }}</span>
                  </div>
                </td>
                <td class="muted">{{ u.email }}</td>
                <td>
                  <span class="role-chip" [class]="'role-' + u.role.toLowerCase()">{{ u.role }}</span>
                </td>
                <td class="muted">{{ u.createdAt | date:'dd MMM yyyy' }}</td>
                <td>
                  <span class="status-chip" [class]="u.isActive ? 'active' : 'inactive'">
                    {{ u.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  @if (u.isActive) {
                    <button class="action-btn danger" (click)="deactivate(u)"
                            [disabled]="busy()">
                      <mat-icon>block</mat-icon> Deactivate
                    </button>
                  } @else {
                    <button class="action-btn success" (click)="activate(u)"
                            [disabled]="busy()">
                      <mat-icon>check_circle</mat-icon> Activate
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="empty-row">No users found</td></tr>
            }
          </tbody>
        </table>
      </div>

      <div class="table-footer">
        Showing {{ filtered().length }} of {{ users().length }} users
      </div>
    }
  `,
  styles: [`
    .page-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px; }
    .page-title { font-size:26px;font-weight:800;color:#1e293b; }
    .filters { display:flex;gap:12px; }
    .search-input { padding:8px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;min-width:220px;outline:none; }
    .search-input:focus { border-color:#4f46e5; }
    .filter-select { padding:8px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none; }
    .spinner-wrap { display:flex;justify-content:center;padding:80px; }
    .table-card { background:white;border-radius:14px;box-shadow:0 1px 3px rgb(0 0 0/.07);overflow:hidden; }
    .data-table { width:100%;border-collapse:collapse; }
    .data-table th { background:#f8fafc;padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #e2e8f0; }
    .data-table td { padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px; }
    .data-table tr:last-child td { border:none; }
    .data-table tr:hover td { background:#fafbff; }
    .user-cell { display:flex;align-items:center;gap:10px;font-weight:600; }
    .user-avatar { width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0; }
    .user-avatar-img { width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0; }
    .muted { color:#64748b; }
    .role-chip { padding:3px 10px;border-radius:100px;font-size:12px;font-weight:600; }
    .role-student { background:#dbeafe;color:#1d4ed8; }
    .role-tutor   { background:#d1fae5;color:#065f46; }
    .role-admin   { background:#fce7f3;color:#9d174d; }
    .status-chip  { padding:3px 10px;border-radius:100px;font-size:12px;font-weight:600; }
    .status-chip.active   { background:#d1fae5;color:#065f46; }
    .status-chip.inactive { background:#fee2e2;color:#991b1b; }
    .action-btn { display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:opacity .15s; }
    .action-btn:disabled { opacity:.5;cursor:not-allowed; }
    .action-btn mat-icon { font-size:16px;width:16px;height:16px; }
    .action-btn.danger  { background:#fee2e2;color:#dc2626; }
    .action-btn.success { background:#d1fae5;color:#059669; }
    .empty-row { text-align:center;color:#94a3b8;padding:40px !important; }
    .table-footer { margin-top:12px;font-size:13px;color:#94a3b8;text-align:right; }
  `]
})
export class AdminUsersComponent {
  private adminService = inject(AdminService);
  private snack        = inject(MatSnackBar);

  search     = signal('');
  roleFilter = signal('');
  busy       = signal(false);

  usersRes = resource<any[], void>({ loader: () => firstValueFrom(this.adminService.getUsers()) });
  users    = computed(() => this.usersRes.value() ?? []);

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    const r = this.roleFilter();
    return this.users().filter(u =>
      (!q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (!r  || u.role === r)
    );
  });

  activate(u: any) {
    this.busy.set(true);
    this.adminService.activateUser(u.id).subscribe({
      next: () => { u.isActive = true; this.busy.set(false); this.snack.open('✅ User activated', 'Close', { duration: 2500 }); },
      error: () => { this.busy.set(false); this.snack.open('Failed', 'Close', { duration: 2500 }); }
    });
  }

  deactivate(u: any) {
    this.busy.set(true);
    this.adminService.deactivateUser(u.id).subscribe({
      next: () => { u.isActive = false; this.busy.set(false); this.snack.open('User deactivated', 'Close', { duration: 2500 }); },
      error: () => { this.busy.set(false); this.snack.open('Failed', 'Close', { duration: 2500 }); }
    });
  }

  initials(n: string) { return (n ?? '').split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2); }
  safe = (url: string) => absoluteUrl(url);
}
