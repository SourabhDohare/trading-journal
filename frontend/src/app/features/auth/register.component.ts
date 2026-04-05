// src/app/features/auth/register.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-shell">
      <div class="auth-card">
        <div class="auth-logo">◈ TradePulse</div>
        <h1 class="auth-title">Create account</h1>
        <p class="auth-sub">Start tracking. Start improving.</p>

        <div class="form">
          <div class="form-row">
            <div class="form-group">
              <label>First Name</label>
              <input [(ngModel)]="firstName" class="form-input" placeholder="Raj" />
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input [(ngModel)]="lastName" class="form-input" placeholder="Sharma" />
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" class="form-input" placeholder="raj@example.com" />
          </div>
          <div class="form-group">
            <label>Password <span class="hint">min 8 chars</span></label>
            <input type="password" [(ngModel)]="password" class="form-input" placeholder="••••••••" />
          </div>
          <div class="error" *ngIf="error()">{{ error() }}</div>
          <button (click)="register()" class="btn-primary" [disabled]="loading()">
            {{ loading() ? 'Creating account...' : 'Create account →' }}
          </button>
        </div>

        <p class="auth-footer">Already registered? <a routerLink="/auth/login">Sign in</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-shell { min-height: 100vh; background: #0a0e1a; display: flex; align-items: center; justify-content: center; }
    .auth-card { background: #0d1117; border: 1px solid #1e2433; border-radius: 16px; padding: 40px; width: 100%; max-width: 420px; }
    .auth-logo { font-size: 18px; font-weight: 700; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 28px; }
    .auth-title { font-size: 24px; font-weight: 700; color: #e2e8f0; margin: 0 0 6px; }
    .auth-sub { font-size: 14px; color: #64748b; margin: 0 0 28px; }
    .form { display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .hint { font-size: 10px; color: #475569; text-transform: none; letter-spacing: 0; }
    .form-input { background: #0a0e1a; border: 1px solid #1e2433; border-radius: 8px; color: #e2e8f0; padding: 11px 14px; font-size: 14px; outline: none; transition: border-color 0.15s; &:focus { border-color: #3b82f6; } }
    .error { font-size: 13px; color: #ef4444; padding: 10px 14px; background: rgba(239,68,68,0.08); border-radius: 8px; border-left: 3px solid #ef4444; }
    .btn-primary { background: #3b82f6; color: #fff; padding: 12px; border-radius: 8px; border: none; font-size: 15px; font-weight: 600; cursor: pointer; &:hover { background: #2563eb; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .auth-footer { font-size: 13px; color: #64748b; text-align: center; margin-top: 24px; a { color: #3b82f6; text-decoration: none; } }
  `]
})
export class RegisterComponent {
  firstName = ''; lastName = ''; email = ''; password = '';
  loading = signal(false); error = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  register() {
    if (!this.firstName || !this.lastName || !this.email || !this.password) {
      this.error.set('All fields required'); return;
    }
    this.loading.set(true);
    this.authService.register(this.firstName, this.lastName, this.email, this.password).subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/dashboard']); },
      error: (err) => { this.loading.set(false); this.error.set(err.error?.message || 'Registration failed'); }
    });
  }
}
