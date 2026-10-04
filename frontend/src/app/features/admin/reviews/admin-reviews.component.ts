import { Component, inject, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { DatePipe, SlicePipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule,
            MatSnackBarModule, FormsModule, DatePipe, SlicePipe],
  template: `
    <div class="page-header">
      <h1 class="page-title">Review Management</h1>
      <div class="filters">
        <input class="search-input" [(ngModel)]="search"
               placeholder="Search tutor or student…"
               (ngModelChange)="applyFilter()">
        <select class="filter-select" [(ngModel)]="ratingFilter"
                (ngModelChange)="applyFilter()">
          <option value="">All Ratings</option>
          <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
          <option value="4">⭐⭐⭐⭐ 4 Stars</option>
          <option value="3">⭐⭐⭐ 3 Stars</option>
          <option value="2">⭐⭐ 2 Stars</option>
          <option value="1">⭐ 1 Star</option>
        </select>
      </div>
    </div>

    <!-- Summary stats -->
    <div class="stats-row">
      <div class="stat-pill">
        <mat-icon>rate_review</mat-icon>
        <span><strong>{{ reviews().length }}</strong> Total Reviews</span>
      </div>
      <div class="stat-pill">
        <mat-icon>star</mat-icon>
        <span><strong>{{ avgRating() }}</strong> Average Rating</span>
      </div>
      <div class="stat-pill warn">
        <mat-icon>warning</mat-icon>
        <span><strong>{{ lowRatingCount() }}</strong> Low Ratings (≤2★)</span>
      </div>
    </div>

    @if (loading()) {
      <div class="spinner-wrap"><mat-spinner diameter="48" /></div>
    } @else {
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Tutor</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Tutor Reply</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (r of filtered(); track r.id) {
              <tr [class.low-rating-row]="r.rating <= 2">
                <td>
                  <div class="user-cell">
                    <div class="avatar">{{ initials(r.studentName) }}</div>
                    {{ r.studentName }}
                  </div>
                </td>
                <td>
                  <div class="user-cell">
                    <div class="avatar tutor-av">{{ initials(r.tutorName) }}</div>
                    {{ r.tutorName }}
                  </div>
                </td>
                <td>
                  <div class="rating-cell">
                    <span class="stars">{{ starStr(r.rating) }}</span>
                    <span class="rating-num">{{ r.rating }}/5</span>
                  </div>
                </td>
                <td class="comment-cell">
                  {{ r.comment || '—' }}
                </td>
                <td class="comment-cell muted">
                  @if (r.tutorReply) {
                    <span class="reply-badge">replied</span>
                    {{ r.tutorReply | slice:0:60 }}{{ r.tutorReply.length > 60 ? '…' : '' }}
                  } @else {
                    <span class="no-reply">No reply</span>
                  }
                </td>
                <td class="muted">{{ r.createdAt | date:'dd MMM yyyy' }}</td>
                <td>
                  <button class="action-btn danger"
                          (click)="deleteReview(r)"
                          [disabled]="deleting() === r.id">
                    @if (deleting() === r.id) {
                      <mat-spinner diameter="14" style="display:inline-block" />
                    } @else {
                      <mat-icon>delete</mat-icon>
                    }
                    Delete
                  </button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="empty-row">No reviews found</td></tr>
            }
          </tbody>
        </table>
      </div>
      <div class="table-footer">
        Showing {{ filtered().length }} of {{ reviews().length }} reviews
      </div>
    }
  `,
  styles: [`
    .page-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px; }
    .page-title { font-size:26px;font-weight:800;color:#1e293b; }
    .filters { display:flex;gap:12px; }
    .search-input { padding:8px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;min-width:200px;outline:none; }
    .search-input:focus { border-color:#4f46e5; }
    .filter-select { padding:8px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none; }
    .stats-row { display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px; }
    .stat-pill { display:flex;align-items:center;gap:8px;background:white;border:1px solid #e2e8f0;border-radius:10px;padding:10px 16px;font-size:14px; }
    .stat-pill mat-icon { font-size:20px;width:20px;height:20px;color:#4f46e5; }
    .stat-pill.warn mat-icon { color:#f59e0b; }
    .stat-pill strong { font-weight:700; }
    .spinner-wrap { display:flex;justify-content:center;padding:80px; }
    .table-card { background:white;border-radius:14px;box-shadow:0 1px 3px rgb(0 0 0/.07);overflow:hidden; }
    .data-table { width:100%;border-collapse:collapse; }
    .data-table th { background:#f8fafc;padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #e2e8f0; }
    .data-table td { padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;vertical-align:top; }
    .data-table tr:last-child td { border:none; }
    .data-table tr:hover td { background:#fafbff; }
    .low-rating-row td { background:#fff5f5 !important; }
    .user-cell { display:flex;align-items:center;gap:8px;font-weight:600;white-space:nowrap; }
    .avatar { width:32px;height:32px;min-width:32px;border-radius:50%;background:#4f46e5;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700; }
    .tutor-av { background:#059669; }
    .rating-cell { display:flex;align-items:center;gap:6px; }
    .stars { color:#f59e0b;font-size:16px;letter-spacing:1px; }
    .rating-num { font-size:12px;color:#64748b; }
    .comment-cell { max-width:200px;color:#475569;font-size:13px; }
    .muted { color:#94a3b8; }
    .reply-badge { background:#eef2ff;color:#4f46e5;font-size:11px;font-weight:600;padding:1px 6px;border-radius:4px;margin-right:4px; }
    .no-reply { color:#cbd5e1;font-style:italic;font-size:12px; }
    .action-btn { display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:opacity .15s; }
    .action-btn:disabled { opacity:.5;cursor:not-allowed; }
    .action-btn mat-icon { font-size:16px;width:16px;height:16px; }
    .action-btn.danger { background:#fee2e2;color:#dc2626; }
    .empty-row { text-align:center;color:#94a3b8;padding:40px !important; }
    .table-footer { margin-top:12px;font-size:13px;color:#94a3b8;text-align:right; }
  `]
})
export class AdminReviewsComponent {
  private adminService = inject(AdminService);
  private snack        = inject(MatSnackBar);

  loading   = signal(true);
  deleting  = signal<number | null>(null);
  reviews   = signal<any[]>([]);
  filtered  = signal<any[]>([]);
  search    = '';
  ratingFilter = '';

  avgRating    = computed(() => {
    const r = this.reviews();
    if (!r.length) return '—';
    const avg = r.reduce((s, x) => s + x.rating, 0) / r.length;
    return avg.toFixed(1);
  });
  lowRatingCount = computed(() => this.reviews().filter(r => r.rating <= 2).length);

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.adminService.getReviews().subscribe({
      next: r => {
        this.reviews.set(r);
        this.filtered.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilter() {
    const q = this.search.toLowerCase();
    const rat = this.ratingFilter ? +this.ratingFilter : null;
    this.filtered.set(
      this.reviews().filter(r =>
        (!q || r.studentName.toLowerCase().includes(q) ||
               r.tutorName.toLowerCase().includes(q) ||
               (r.comment ?? '').toLowerCase().includes(q)) &&
        (rat === null || r.rating === rat)
      )
    );
  }

  deleteReview(r: any) {
    if (!confirm(`Delete review by ${r.studentName} for ${r.tutorName}? This will recalculate the tutor's rating.`))
      return;
    this.deleting.set(r.id);
    this.adminService.deleteReview(r.id).subscribe({
      next: () => {
        this.snack.open('✅ Review deleted and tutor rating updated.', 'Close', { duration: 3000 });
        this.deleting.set(null);
        this.load();
      },
      error: () => {
        this.snack.open('Failed to delete review.', 'Close', { duration: 3000 });
        this.deleting.set(null);
      }
    });
  }

  starStr(n: number) { return '★'.repeat(n) + '☆'.repeat(5 - n); }
  initials(name: string) {
    return (name ?? '').split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) || '?';
  }
}
