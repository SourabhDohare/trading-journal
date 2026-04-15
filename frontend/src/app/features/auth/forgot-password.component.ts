// src/app/features/auth/forgot-password.component.ts

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-shell">
      <div class="auth-card">

        <div class="brand">
          <span class="brand-icon">◈</span>
          <span class="brand-name">MarketSaga</span>
        </div>

        <div class="fp-icon">🔑</div>
        <h1 class="auth-title">Reset password</h1>
        <p class="auth-sub">Enter your email and we'll send a reset code.</p>

        <div class="form-fields" *ngIf="!sent()">
          <div class="field">
            <label>Email address</label>
            <input type="email" [(ngModel)]="email"
                   placeholder="you@example.com" class="field-input"
                   (keydown.enter)="send()" autocomplete="email" />
          </div>
        </div>

        <div class="success-card" *ngIf="sent()">
          <div class="success-icon">📬</div>
          <h3 class="success-title">Check your inbox</h3>
          <p class="success-text">
            If <strong>{{ email }}</strong> has an account, a 6-digit reset code
            has been sent. It expires in 10 minutes.
          </p>
          <button class="btn-continue" (click)="goReset()">
            Enter reset code →
          </button>
        </div>

        <div class="error-box" *ngIf="error()">{{ error() }}</div>

        <button class="btn-primary" (click)="send()" [disabled]="loading() || sent()" *ngIf="!sent()">
          <span *ngIf="!loading()">Send reset code</span>
          <span *ngIf="loading()" class="btn-loading">
            <span class="btn-spinner"></span> Sending...
          </span>
        </button>

        <p class="back-link">
          <a routerLink="/auth/login" class="link">← Back to Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-shell { min-height:100vh; background:#0a0e1a; display:flex; align-items:center; justify-content:center; padding:24px; }
    .auth-card { background:#0d1117; border:1px solid #1e2433; border-radius:20px; padding:48px 40px; width:100%; max-width:420px; text-align:center; }
    .brand { display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:28px; }
    .brand-icon { font-size:22px; color:#3b82f6; }
    .brand-name { font-size:18px; font-weight:900; background:linear-gradient(135deg,#3b82f6,#8b5cf6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .fp-icon { font-size:44px; margin-bottom:16px; }
    .auth-title { font-size:24px; font-weight:700; color:#e2e8f0; margin:0 0 10px; }
    .auth-sub { font-size:14px; color:#64748b; margin:0 0 28px; line-height:1.6; }

    .form-fields { display:flex; flex-direction:column; gap:16px; margin-bottom:20px; text-align:left; }
    .field { display:flex; flex-direction:column; gap:6px; }
    label { font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.5px; }
    .field-input { background:#0a0e1a; border:1px solid #1e2433; border-radius:9px; color:#e2e8f0; padding:12px 14px; font-size:14px; outline:none; transition:border-color .15s; width:100%; box-sizing:border-box; }
    .field-input:focus { border-color:#3b82f6; }
    .field-input::placeholder { color:#334155; }

    .success-card { background:rgba(34,197,94,.05); border:1px solid rgba(34,197,94,.2); border-radius:12px; padding:24px; margin-bottom:20px; }
    .success-icon { font-size:36px; margin-bottom:12px; }
    .success-title { font-size:16px; font-weight:700; color:#22c55e; margin:0 0 8px; }
    .success-text { font-size:13px; color:#64748b; line-height:1.6; margin:0 0 16px; }
    .success-text strong { color:#94a3b8; }
    .btn-continue { background:rgba(34,197,94,.1); border:1px solid rgba(34,197,94,.3); color:#22c55e; padding:10px 20px; border-radius:8px; cursor:pointer; font-size:14px; font-weight:600; transition:all .15s; }
    .btn-continue:hover { background:rgba(34,197,94,.2); }

    .error-box { color:#ef4444; font-size:13px; padding:10px 14px; background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.2); border-radius:8px; margin-bottom:16px; }

    .btn-primary { width:100%; padding:14px; border-radius:10px; border:none; background:linear-gradient(135deg,#3b82f6,#6366f1); color:#fff; font-size:15px; font-weight:700; cursor:pointer; margin-bottom:20px; transition:all .15s; }
    .btn-primary:hover:not(:disabled) { transform:translateY(-1px); }
    .btn-primary:disabled { opacity:.5; cursor:not-allowed; transform:none; }
    .btn-loading { display:flex; align-items:center; justify-content:center; gap:8px; }
    .btn-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .back-link { margin:0; }
    .link { font-size:13px; color:#3b82f6; text-decoration:none; font-weight:600; }
    .link:hover { text-decoration:underline; }
  `]
})
export class ForgotPasswordComponent {
  email   = '';
  loading = signal(false);
  error   = signal('');
  sent    = signal(false);

  constructor(private http: HttpClient, private router: Router) {}

  send() {
    if (!this.email.trim()) { this.error.set('Please enter your email.'); return; }
    this.loading.set(true);
    this.error.set('');

    this.http.post<any>(`${environment.apiUrl}/auth/forgot-password`, {
      email: this.email.trim().toLowerCase()
    }).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Something went wrong. Please try again.');
      }
    });
  }

  goReset() {
    this.router.navigate(['/auth/reset-password'], {
      queryParams: { email: this.email.trim().toLowerCase() }
    });
  }
}
