import { Component, inject, signal, resource, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { absoluteUrl } from '../../../shared/utils/url.util';

@Component({
  selector: 'app-admin-documents',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, DatePipe],
  template: `
    <div class="page-header">
      <h1 class="page-title">Tutor Verifications</h1>
      <div class="tabs">
        <button class="tab" [class.active]="filter() === 'all'"     (click)="filter.set('all')">All ({{ all().length }})</button>
        <button class="tab" [class.active]="filter() === 'pending'" (click)="filter.set('pending')">
          Pending ({{ pending().length }})
          @if (pending().length) { <span class="dot"></span> }
        </button>
        <button class="tab" [class.active]="filter() === 'verified'" (click)="filter.set('verified')">Verified ({{ verified().length }})</button>
      </div>
    </div>

    @if (docsRes.isLoading()) {
      <div class="spinner-wrap"><mat-spinner diameter="48" /></div>
    } @else if (filtered().length === 0) {
      <div class="empty-state">
        <mat-icon>task_alt</mat-icon>
        <h3>All caught up!</h3>
        <p>No {{ filter() === 'pending' ? 'pending' : '' }} documents to review.</p>
      </div>
    } @else {
      <div class="doc-grid">
        @for (doc of filtered(); track doc.id) {
          <div class="doc-card" [class.verified]="doc.verified">
            <div class="doc-header">
              <div class="doc-icon">
                <mat-icon>{{ docIcon(doc.documentType) }}</mat-icon>
              </div>
              <div class="doc-meta">
                <strong>{{ doc.certificateName ?? doc.documentType }}</strong>
                <span>{{ doc.documentType }}</span>
              </div>
              <span class="doc-status" [class]="doc.verified ? 'verified' : 'pending'">
                {{ doc.verified ? '✓ Verified' : 'Pending' }}
              </span>
            </div>

            <div class="tutor-info">
              <mat-icon>person</mat-icon>
              <div>
                <strong>{{ doc.tutorName }}</strong>
                <span>{{ doc.tutorEmail }}</span>
              </div>
            </div>

            <div class="doc-date">
              <mat-icon>schedule</mat-icon>
              Uploaded {{ doc.uploadedAt | date:'dd MMM yyyy, h:mm a' }}
            </div>

            <div class="doc-actions">
              <a [href]="safe(doc.fileUrl)" target="_blank" class="action-btn view">
                <mat-icon>open_in_new</mat-icon> View Document
              </a>
              @if (!doc.verified) {
                <button class="action-btn approve" (click)="verify(doc)" [disabled]="busy()">
                  <mat-icon>check_circle</mat-icon> Approve
                </button>
              } @else {
                <button class="action-btn revoke" (click)="reject(doc)" [disabled]="busy()">
                  <mat-icon>cancel</mat-icon> Revoke
                </button>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .page-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px; }
    .page-title { font-size:26px;font-weight:800;color:#1e293b; }
    .tabs { display:flex;gap:4px;background:#f1f5f9;border-radius:10px;padding:4px; }
    .tab { padding:6px 16px;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;background:transparent;color:#64748b;display:flex;align-items:center;gap:6px;transition:all .15s; }
    .tab.active { background:white;color:#4f46e5;font-weight:700;box-shadow:0 1px 3px rgb(0 0 0/.1); }
    .dot { width:8px;height:8px;background:#dc2626;border-radius:50%; }
    .spinner-wrap { display:flex;justify-content:center;padding:80px; }
    .empty-state { text-align:center;padding:80px 16px;color:#94a3b8; }
    .empty-state mat-icon { font-size:64px;width:64px;height:64px;margin-bottom:16px;color:#d1fae5; }
    .empty-state h3 { font-size:18px;font-weight:700;color:#475569;margin-bottom:8px; }

    /* doc grid */
    .doc-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px; }
    .doc-card { background:white;border-radius:14px;padding:20px;box-shadow:0 1px 3px rgb(0 0 0/.07);border:2px solid transparent;display:flex;flex-direction:column;gap:14px; }
    .doc-card.verified { border-color:#d1fae5; }
    .doc-header { display:flex;align-items:center;gap:12px; }
    .doc-icon { width:44px;height:44px;border-radius:10px;background:#eef2ff;display:flex;align-items:center;justify-content:center;color:#4f46e5;flex-shrink:0; }
    .doc-meta { flex:1;min-width:0; }
    .doc-meta strong { display:block;font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .doc-meta span { font-size:12px;color:#94a3b8; }
    .doc-status { padding:3px 10px;border-radius:100px;font-size:12px;font-weight:600;flex-shrink:0; }
    .doc-status.verified { background:#d1fae5;color:#065f46; }
    .doc-status.pending  { background:#fef3c7;color:#92400e; }
    .tutor-info { display:flex;align-items:center;gap:8px;background:#f8fafc;border-radius:8px;padding:10px 12px; }
    .tutor-info mat-icon { color:#64748b;font-size:18px;width:18px;height:18px;flex-shrink:0; }
    .tutor-info div { min-width:0; }
    .tutor-info strong { display:block;font-size:13px;font-weight:600; }
    .tutor-info span { font-size:12px;color:#94a3b8; }
    .doc-date { display:flex;align-items:center;gap:6px;font-size:12px;color:#94a3b8; }
    .doc-date mat-icon { font-size:14px;width:14px;height:14px; }
    .doc-actions { display:flex;gap:8px;flex-wrap:wrap; }
    .action-btn { display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;transition:opacity .15s; }
    .action-btn:disabled { opacity:.5;cursor:not-allowed; }
    .action-btn mat-icon { font-size:16px;width:16px;height:16px; }
    .view    { background:#eef2ff;color:#4f46e5; }
    .approve { background:#d1fae5;color:#065f46; }
    .revoke  { background:#fee2e2;color:#dc2626; }
  `]
})
export class AdminDocumentsComponent {
  private adminService = inject(AdminService);
  private snack        = inject(MatSnackBar);

  filter = signal<'all'|'pending'|'verified'>('pending');
  busy   = signal(false);

  docsRes  = resource<any[], void>({ loader: () => firstValueFrom(this.adminService.getDocuments()) });
  docs     = computed(() => this.docsRes.value() ?? []);
  all      = computed(() => this.docs());
  pending  = computed(() => this.docs().filter(d => !d.verified));
  verified = computed(() => this.docs().filter(d =>  d.verified));
  filtered = computed(() => this.filter() === 'all' ? this.all() : this.filter() === 'pending' ? this.pending() : this.verified());

  verify(doc: any) {
    this.busy.set(true);
    this.adminService.verifyDoc(doc.id).subscribe({
      next: () => { doc.verified = true; this.busy.set(false); this.snack.open('✅ Document verified!', 'Close', { duration: 2500 }); },
      error: () => { this.busy.set(false); this.snack.open('Failed', 'Close', { duration: 2500 }); }
    });
  }

  reject(doc: any) {
    this.busy.set(true);
    this.adminService.rejectDoc(doc.id).subscribe({
      next: () => { doc.verified = false; this.busy.set(false); this.snack.open('Document unverified', 'Close', { duration: 2500 }); },
      error: () => { this.busy.set(false); this.snack.open('Failed', 'Close', { duration: 2500 }); }
    });
  }

  docIcon(type?: string) {
    const m: Record<string,string> = { DEGREE:'school', CERTIFICATION:'workspace_premium', ID_PROOF:'badge', OTHER:'description' };
    return m[type ?? ''] ?? 'description';
  }
  safe = (url: string) => absoluteUrl(url);
}
