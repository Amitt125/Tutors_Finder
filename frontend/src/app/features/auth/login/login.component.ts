import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { MessageService } from '../../../core/services/message.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule,
            MatButtonModule, MatIconModule, MatSnackBarModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="auth-header">
          <div class="logo"><mat-icon>school</mat-icon></div>
          <h1>Welcome back</h1>
          <p>Sign in to your TutorFinder account</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" placeholder="you@example.com">
            <mat-icon matSuffix>email</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPwd() ? 'text' : 'password'" formControlName="password">
            <button mat-icon-button matSuffix type="button" (click)="showPwd.update(v => !v)">
              <mat-icon>{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          <button mat-raised-button class="submit-btn" type="submit" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Sign In' }}
          </button>
        </form>

        <p class="switch-link">
          Don't have an account? <a routerLink="/auth/register">Register</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f0f4ff,#faf5ff);padding:20px; }
    .auth-card { width:100%;max-width:420px;padding:40px; }
    .auth-header { text-align:center;margin-bottom:32px; }
    .logo { width:64px;height:64px;background:#4f46e5;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px; }
    .logo mat-icon { color:white;font-size:36px;width:36px;height:36px; }
    h1 { font-size:24px;font-weight:700;color:#1e293b;margin-bottom:8px; }
    p { color:#64748b; }
    form { display:flex;flex-direction:column;gap:16px; }
    .submit-btn { background:#4f46e5 !important;color:white !important;height:48px !important;font-size:16px !important;border-radius:10px !important; }
    .switch-link { text-align:center;margin-top:20px;color:#64748b;font-size:14px; }
    .switch-link a { color:#4f46e5;font-weight:600;text-decoration:none; }
  `]
})
export class LoginComponent {
  private fb         = inject(FormBuilder);
  private auth       = inject(AuthService);
  private router     = inject(Router);
  private snack      = inject(MatSnackBar);
  private msgService = inject(MessageService);

  // signals instead of plain booleans — required for zoneless change detection
  loading = signal(false);
  showPwd = signal(false);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth.login(this.form.value as any).subscribe({
      next: (res) => {
        this.msgService.connect();
        const dest = res.role === 'ADMIN'  ? '/admin' :
                     res.role === 'TUTOR'  ? '/tutor/dashboard' : '/student/dashboard';
        this.router.navigate([dest]);
      },
      error: (err) => {
        this.snack.open(err.error?.message ?? 'Invalid email or password', 'Close',
          { duration: 4000, panelClass: ['error-snack'] });
        this.loading.set(false);
      }
    });
  }
}
