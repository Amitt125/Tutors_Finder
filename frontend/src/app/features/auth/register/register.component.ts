import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule,
            MatButtonModule, MatIconModule, MatSnackBarModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="auth-header">
          <div class="logo"><mat-icon>school</mat-icon></div>
          <h1>Create Account</h1>
          <p>Join TutorFinder as a student or tutor</p>
        </div>

        <div class="role-selector">
          <button [class.active]="role() === 'STUDENT'" (click)="role.set('STUDENT')">
            <span>🎓</span> I'm a Student
          </button>
          <button [class.active]="role() === 'TUTOR'" (click)="role.set('TUTOR')">
            <span>👨‍🏫</span> I'm a Tutor
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline">
            <mat-label>Full Name</mat-label>
            <input matInput formControlName="fullName" placeholder="John Doe">
            <mat-icon matSuffix>person</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email">
            <mat-icon matSuffix>email</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Phone (optional)</mat-label>
            <input matInput formControlName="phone">
            <mat-icon matSuffix>phone</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPwd() ? 'text' : 'password'" formControlName="password">
            <button mat-icon-button matSuffix type="button" (click)="showPwd.update(v => !v)">
              <mat-icon>{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>
          <button mat-raised-button class="submit-btn" type="submit" [disabled]="loading()">
            {{ loading() ? 'Creating…' : 'Create Account' }}
          </button>
        </form>

        <p class="switch-link">Already have an account? <a routerLink="/auth/login">Login</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f0f4ff,#faf5ff);padding:20px; }
    .auth-card { width:100%;max-width:420px;padding:40px; }
    .auth-header { text-align:center;margin-bottom:24px; }
    .logo { width:64px;height:64px;background:#4f46e5;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px; }
    .logo mat-icon { color:white;font-size:36px;width:36px;height:36px; }
    h1 { font-size:24px;font-weight:700;margin-bottom:8px; }
    p { color:#64748b; }
    .role-selector { display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px; }
    .role-selector button { padding:16px;border:2px solid #e2e8f0;border-radius:12px;background:white;cursor:pointer;font-size:14px;font-weight:500;display:flex;flex-direction:column;align-items:center;gap:6px;transition:all .2s; }
    .role-selector button.active { border-color:#4f46e5;background:#f0f4ff;color:#4f46e5; }
    .role-selector button span { font-size:28px; }
    form { display:flex;flex-direction:column;gap:12px; }
    .submit-btn { background:#4f46e5 !important;color:white !important;height:48px !important;font-size:16px !important;border-radius:10px !important; }
    .switch-link { text-align:center;margin-top:16px;color:#64748b;font-size:14px; }
    .switch-link a { color:#4f46e5;font-weight:600;text-decoration:none; }
  `]
})
export class RegisterComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private snack  = inject(MatSnackBar);

  role    = signal<'STUDENT' | 'TUTOR'>('STUDENT');
  // signals instead of plain booleans — required for zoneless change detection
  loading = signal(false);
  showPwd = signal(false);

  form = this.fb.group({
    fullName: ['', Validators.required],
    email:    ['', [Validators.required, Validators.email]],
    phone:    [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth.register({ ...this.form.value as any, role: this.role() }).subscribe({
      next: () => {
        this.snack.open('Account created! Welcome to TutorFinder 🎉', 'Close', { duration: 3000 });
        this.router.navigate([this.role() === 'TUTOR' ? '/tutor/profile-setup' : '/student/dashboard']);
      },
      error: (err) => {
        this.snack.open(err.error?.message ?? 'Registration failed. Please try again.', 'Close',
          { duration: 4000, panelClass: ['error-snack'] });
        this.loading.set(false);
      }
    });
  }
}
