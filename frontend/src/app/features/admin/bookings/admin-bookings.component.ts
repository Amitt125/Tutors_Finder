import { Component, inject, signal, resource, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule, DatePipe, DecimalPipe, FormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">All Bookings</h1>
      <div class="filters">
        <input class="search-input" [(ngModel)]="search" placeholder="Search student or tutor…">
        <select class="filter-select" [(ngModel)]="statusFilter">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
    </div>

    @if (bookingsRes.isLoading()) {
      <div class="spinner-wrap"><mat-spinner diameter="48" /></div>
    } @else {
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>Tutor</th>
              <th>Subject</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            @for (b of filtered(); track b.id) {
              <tr>
                <td class="muted">#{{ b.id }}</td>
                <td><div class="name-cell"><div class="mini-av">{{ initials(b.studentName) }}</div>{{ b.studentName }}</div></td>
                <td><div class="name-cell"><div class="mini-av tutor">{{ initials(b.tutorName) }}</div>{{ b.tutorName }}</div></td>
                <td class="muted">{{ b.subjectName }}</td>
                <td class="muted">{{ b.sessionDate }}</td>
                <td>@if (b.totalAmount) { ₹{{ b.totalAmount | number:'1.0-0' }} }</td>
                <td><span class="status-chip" [class]="b.status.toLowerCase()">{{ b.status }}</span></td>
                <td class="muted">{{ b.createdAt | date:'dd MMM yy' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="empty-row">No bookings found</td></tr>
            }
          </tbody>
        </table>
      </div>
      <div class="table-footer">{{ filtered().length }} of {{ (bookingsRes.value() ?? []).length }} bookings</div>
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
    .table-card { background:white;border-radius:14px;box-shadow:0 1px 3px rgb(0 0 0/.07);overflow:auto; }
    .data-table { width:100%;border-collapse:collapse;min-width:700px; }
    .data-table th { background:#f8fafc;padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #e2e8f0;white-space:nowrap; }
    .data-table td { padding:11px 16px;border-bottom:1px solid #f1f5f9;font-size:14px; }
    .data-table tr:last-child td { border:none; }
    .data-table tr:hover td { background:#fafbff; }
    .name-cell { display:flex;align-items:center;gap:8px;font-weight:600;white-space:nowrap; }
    .mini-av { width:28px;height:28px;border-radius:50%;background:#4f46e5;color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0; }
    .mini-av.tutor { background:#059669; }
    .muted { color:#64748b; }
    .status-chip { padding:3px 10px;border-radius:100px;font-size:12px;font-weight:600; }
    .confirmed  { background:#dbeafe;color:#1d4ed8; }
    .pending    { background:#fef3c7;color:#92400e; }
    .completed  { background:#d1fae5;color:#065f46; }
    .cancelled  { background:#fee2e2;color:#991b1b; }
    .empty-row  { text-align:center;color:#94a3b8;padding:40px !important; }
    .table-footer { margin-top:12px;font-size:13px;color:#94a3b8;text-align:right; }
  `]
})
export class AdminBookingsComponent {
  private adminService = inject(AdminService);
  search       = '';
  statusFilter = '';

  bookingsRes = resource<any[], void>({ loader: () => firstValueFrom(this.adminService.getBookings()) });

  filtered = computed(() => {
    const q = this.search.toLowerCase();
    return (this.bookingsRes.value() ?? []).filter(b =>
      (!q || b.studentName.toLowerCase().includes(q) || b.tutorName.toLowerCase().includes(q)) &&
      (!this.statusFilter || b.status === this.statusFilter)
    );
  });

  initials(n: string) { return (n ?? '').split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2); }
}
