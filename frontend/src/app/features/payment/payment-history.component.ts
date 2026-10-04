import { Component, OnInit, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DecimalPipe, DatePipe } from '@angular/common';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { Payment } from '../../shared/models/payment.model';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule, DecimalPipe, DatePipe],
  template: `
    <div class="page-container" style="padding-top:24px">
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
          <h1 style="font-size:24px;font-weight:700">
            {{ auth.isTutor() ? 'Earnings' : 'Payment History' }}
          </h1>
          @if (auth.isTutor() && payments().length) {
            <div class="earnings-badge">
              Total: ₹{{ totalEarnings() | number:'1.0-0' }}
            </div>
          }
        </div>

        @if (loading()) {
          <div style="text-align:center;padding:48px">
            <mat-spinner diameter="40" style="margin:0 auto" />
          </div>
        } @else if (payments().length === 0) {
          <div style="text-align:center;padding:48px;color:#94a3b8">
            <mat-icon style="font-size:48px;width:48px;height:48px">receipt_long</mat-icon>
            <h3 style="margin-top:12px;color:#64748b">No payments yet</h3>
          </div>
        } @else {
          <div class="payment-list">
            @for (p of payments(); track p.id) {
              <div class="payment-row">
                <div class="payment-icon">
                  <mat-icon>{{ auth.isTutor() ? 'arrow_downward' : 'arrow_upward' }}</mat-icon>
                </div>
                <div style="flex:1">
                  <strong>
                    {{ auth.isTutor() ? 'From: ' + p.studentName : 'To: ' + p.tutorName }}
                  </strong>
                  <div style="font-size:13px;color:#94a3b8">
                    {{ p.createdAt | date:'medium' }} · ID: {{ p.razorpayPaymentId ?? '—' }}
                  </div>
                </div>
                <div style="text-align:right">
                  <strong style="font-size:18px;color:#4f46e5">
                    ₹{{ p.amount | number:'1.0-0' }}
                  </strong>
                  <div>
                    <span class="badge" [class]="'badge-' + statusClass(p.status)">
                      {{ p.status }}
                    </span>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .earnings-badge { background:#4f46e5;color:white;padding:8px 20px;border-radius:100px;font-weight:600;font-size:16px; }
    .payment-list { display:flex;flex-direction:column; }
    .payment-row { display:flex;align-items:center;gap:16px;padding:16px 0;border-bottom:1px solid #f1f5f9; }
    .payment-row:last-child { border:none; }
    .payment-icon { width:40px;height:40px;border-radius:50%;background:#eef2ff;color:#4f46e5;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
  `]
})
export class PaymentHistoryComponent implements OnInit {
  private paymentService = inject(PaymentService);
  auth = inject(AuthService);

  payments      = signal<Payment[]>([]);
  loading       = signal(true);
  totalEarnings = () => this.payments().reduce((s, p) => s + (p.amount ?? 0), 0);

  ngOnInit() {
    this.paymentService.getMyPayments().subscribe({
      next:  (p: Payment[]) => { this.payments.set(p); this.loading.set(false); },
      error: ()             => this.loading.set(false),
    });
  }

  statusClass(s: string): string {
    return ({ CAPTURED: 'success', CREATED: 'warning', FAILED: 'danger', REFUNDED: 'info' } as Record<string, string>)[s] ?? 'warning';
  }
}
