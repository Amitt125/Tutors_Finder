import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { Payment } from '../../shared/models/payment.model';

@Component({
  selector: 'app-payment-button',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <button mat-raised-button class="pay-btn"
            (click)="pay()"
            [disabled]="loading || !isStudent">
      <mat-icon>payments</mat-icon>
      @if (loading) { <span>Processing…</span> }
      @else { <span>Pay ₹{{ amount() }}</span> }
    </button>
    @if (!isStudent) {
      <p class="hint">Login as a student to pay</p>
    }
  `,
  styles: [`
    .pay-btn { background:linear-gradient(135deg,#10b981,#059669) !important;color:white !important;border-radius:8px !important;font-weight:600 !important; }
    .pay-btn mat-icon { margin-right:6px;font-size:18px; }
    .hint { font-size:12px;color:#94a3b8;margin-top:4px; }
  `]
})
export class PaymentButtonComponent {
  // Angular 19: input() / output() signals
  tutorId     = input.required<number>();
  tutorName   = input('Tutor');
  amount      = input.required<number>();
  description = input('');

  paymentSuccess = output<Payment>();
  paymentFailed  = output<string>();

  private paymentService = inject(PaymentService);
  private authService    = inject(AuthService);
  private snack          = inject(MatSnackBar);

  loading = false;

  get isStudent() {
    return this.authService.isAuthenticated() &&
           this.authService.currentUser()?.role === 'STUDENT';
  }

  pay() {
    if (!this.isStudent) return;
    this.loading = true;

    this.paymentService.createOrder({
      tutorId: this.tutorId(),
      amount: this.amount(),
      description: this.description() || `Session with ${this.tutorName()}`,
    }).subscribe({
      next: (order) => {
        this.paymentService.openCheckout(
          order,
          this.tutorName(),
          (razorpayRes) => {
            this.paymentService.verifyPayment(razorpayRes).subscribe({
              next: (payment) => {
                this.loading = false;
                this.snack.open('✅ Payment successful!', 'Close',
                  { duration: 4000, panelClass: ['success-snack'] });
                this.paymentSuccess.emit(payment);
              },
              error: (err) => {
                this.loading = false;
                const msg = err?.error?.message ?? 'Payment verification failed';
                this.snack.open(`❌ ${msg}`, 'Close',
                  { duration: 4000, panelClass: ['error-snack'] });
                this.paymentFailed.emit(msg);
              },
            });
          },
          () => {
            this.loading = false;
            this.snack.open('Payment cancelled', 'Close', { duration: 2000 });
            this.paymentFailed.emit('dismissed');
          }
        );
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message ?? 'Could not initiate payment';
        this.snack.open(`❌ ${msg}`, 'Close',
          { duration: 4000, panelClass: ['error-snack'] });
        this.paymentFailed.emit(msg);
      },
    });
  }
}
