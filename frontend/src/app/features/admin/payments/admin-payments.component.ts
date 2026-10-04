import { Component, inject, signal, resource, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule, DatePipe, DecimalPipe, FormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">Payments</h1>
      <div class="filters">
        <input class="search-input" [(ngModel)]="search" placeholder="Search student or tutor…">
        <select class="filter-select" [(ngModel)]="statusFilter">
          <option value="">All Statuses</option>
          <option value="CAPTURED">Captured</option>
          <option value="CREATED">Created</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>
    </div>

    <!-- Summary cards -->
    @if (!paymentsRes.isLoading()) {
      <div class="summary-row">
        <div class="sum-card">
          <div class="sum-icon green"><mat-icon>check_circle</mat-icon></div>
          <div>
            <div class="sum-val">₹{{ capturedTotal() | number:'1.0-0' }}</div>
            <div class="sum-lbl">Total Captured</div>
          </div>
        </div>
        <div class="sum-card">
          <div class="sum-icon blue"><mat-icon>payments</mat-icon></div>
          <div>
            <div class="sum-val">{{ capturedCount() }}</div>
            <div class="sum-lbl">Successful Payments</div>
          </div>
        </div>
        <div class="sum-card">
          <div class="sum-icon red"><mat-icon>cancel</mat-icon></div>
          <div>
            <div class="sum-val">{{ failedCount() }}</div>
            <div class="sum-lbl">Failed Payments</div>
          </div>
        </div>
        <div class="sum-card">
          <div class="sum-icon orange"><mat-icon>pending</mat-icon></div>
          <div>
            <div class="sum-val">{{ pendingCount() }}</div>
            <div class="sum-lbl">Pending</div>
          </div>
        </div>
      </div>
    }

    @if (paymentsRes.isLoading()) {
      <div class="spinner-wrap"><mat-spinner diameter="48" /></div>
    } @else {
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>Tutor</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Razorpay ID</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            @for (p of filtered(); track p.id) {
              <tr>
                <td class="muted">#{{ p.id }}</td>
                <td><div class="name-cell"><div class="mini-av">{{ initials(p.studentName) }}</div>{{ p.studentName }}</div></td>
                <td><div class="name-cell"><div class="mini-av tutor">{{ initials(p.tutorName) }}</div>{{ p.tutorName }}</div></td>
                <td class="amount">₹{{ p.amount | number:'1.0-0' }}</td>
                <td><span class="status-chip" [class]="p.status.toLowerCase()">{{ p.status }}</span></td>
                <td class="muted small">{{ p.razorpayPaymentId ?? '—' }}</td>
                <td class="muted">{{ p.createdAt | date:'dd MMM yy, h:mm a' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="empty-row">No payments found</td></tr>
            }
          </tbody>
        </table>
      </div>
      <div class="table-footer">{{ filtered().length }} of {{ (paymentsRes.value() ?? []).length }} payments</div>
    }
  `,
  styles: [`
    .page-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px; }
    .page-title { font-size:26px;font-weight:800;color:#1e293b; }
    .filters { display:flex;gap:12px; }
    .search-input { padding:8px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;min-width:220px;outline:none; }
    .search-input:focus { border-color:#4f46e5; }
    .filter-select { padding:8px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none; }
    .summary-row { display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin-bottom:24px; }
    .sum-card { background:white;border-radius:12px;padding:16px;display:flex;align-items:center;gap:14px;box-shadow:0 1px 3px rgb(0 0 0/.07); }
    .sum-icon { width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .sum-icon mat-icon { color:white;font-size:22px;width:22px;height:22px; }
    .green  { background:#059669; } .blue   { background:#3b82f6; }
    .red    { background:#dc2626; } .orange { background:#ea580c; }
    .sum-val { font-size:22px;font-weight:800;color:#1e293b;line-height:1; }
    .sum-lbl { font-size:12px;color:#64748b;margin-top:3px; }
    .spinner-wrap { display:flex;justify-content:center;padding:80px; }
    .table-card { background:white;border-radius:14px;box-shadow:0 1px 3px rgb(0 0 0/.07);overflow:auto; }
    .data-table { width:100%;border-collapse:collapse;min-width:650px; }
    .data-table th { background:#f8fafc;padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #e2e8f0;white-space:nowrap; }
    .data-table td { padding:11px 16px;border-bottom:1px solid #f1f5f9;font-size:14px; }
    .data-table tr:last-child td { border:none; }
    .data-table tr:hover td { background:#fafbff; }
    .name-cell { display:flex;align-items:center;gap:8px;font-weight:600;white-space:nowrap; }
    .mini-av { width:28px;height:28px;border-radius:50%;background:#4f46e5;color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0; }
    .mini-av.tutor { background:#059669; }
    .amount { font-weight:700;color:#059669; }
    .muted  { color:#64748b; }
    .small  { font-size:12px; }
    .status-chip { padding:3px 10px;border-radius:100px;font-size:12px;font-weight:600; }
    .captured { background:#d1fae5;color:#065f46; }
    .created  { background:#dbeafe;color:#1d4ed8; }
    .failed   { background:#fee2e2;color:#991b1b; }
    .refunded { background:#fef3c7;color:#92400e; }
    .attempted{ background:#e0e7ff;color:#3730a3; }
    .empty-row { text-align:center;color:#94a3b8;padding:40px !important; }
    .table-footer { margin-top:12px;font-size:13px;color:#94a3b8;text-align:right; }
  `]
})
export class AdminPaymentsComponent {
  private adminService = inject(AdminService);
  search       = '';
  statusFilter = '';

  paymentsRes = resource<any[], void>({ loader: () => firstValueFrom(this.adminService.getPayments()) });
  payments    = computed(() => this.paymentsRes.value() ?? []);

  filtered = computed(() => {
    const q = this.search.toLowerCase();
    return this.payments().filter(p =>
      (!q || p.studentName.toLowerCase().includes(q) || p.tutorName.toLowerCase().includes(q)) &&
      (!this.statusFilter || p.status === this.statusFilter)
    );
  });

  capturedTotal = computed(() => this.payments().filter(p => p.status === 'CAPTURED').reduce((s, p) => s + p.amount, 0));
  capturedCount = computed(() => this.payments().filter(p => p.status === 'CAPTURED').length);
  failedCount   = computed(() => this.payments().filter(p => p.status === 'FAILED').length);
  pendingCount  = computed(() => this.payments().filter(p => p.status === 'CREATED' || p.status === 'ATTEMPTED').length);

  initials(n: string) { return (n ?? '').split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2); }
}
