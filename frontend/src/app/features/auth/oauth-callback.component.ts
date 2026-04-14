// src/app/features/auth/oauth-callback.component.ts
// Route: /auth/callback
// Spring Security redirects here after Google/GitHub login
// Reads ?token, ?email, ?name — stores JWT — navigates to dashboard

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-shell">
      <div class="callback-card">

        <div class="brand">
          <span class="brand-icon">◈</span>
          <span class="brand-name">TradePulse</span>
        </div>

        <!-- Loading state -->
        <div *ngIf="!error" class="loading-state">
          <div class="spinner"></div>
          <h2 class="cb-title">{{ message }}</h2>
          <p class="cb-sub">{{ sub }}</p>
        </div>

        <!-- Error state -->
        <div *ngIf="error" class="error-state">
          <div class="error-icon">✗</div>
          <h2 class="cb-title error-title">Authentication Failed</h2>
          <p class="cb-error">{{ error }}</p>
          <button (click)="goToLogin()" class="btn-retry">← Back to Login</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .callback-shell {
      min-height: 100vh; background: #0a0e1a;
      display: flex; align-items: center; justify-content: center; padding: 24px;
    }
    .callback-card {
      background: #0d1117; border: 1px solid #1e2433; border-radius: 20px;
      padding: 56px 48px; width: 100%; max-width: 400px; text-align: center;
    }

    .brand {
      display: flex; align-items: center; justify-content: center;
      gap: 10px; margin-bottom: 40px;
    }
    .brand-icon { font-size: 22px; color: #3b82f6; }
    .brand-name {
      font-size: 18px; font-weight: 900;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    /* Spinner */
    .spinner {
      width: 44px; height: 44px;
      border: 3px solid #1e2433; border-top-color: #3b82f6;
      border-radius: 50%; animation: spin .8s linear infinite;
      margin: 0 auto 24px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .cb-title { font-size: 18px; font-weight: 700; color: #e2e8f0; margin: 0 0 8px; }
    .cb-sub   { font-size: 14px; color: #64748b; margin: 0; }

    /* Error */
    .error-state  { }
    .error-icon   { font-size: 40px; color: #ef4444; margin-bottom: 16px; }
    .error-title  { color: #f87171; }
    .cb-error {
      font-size: 13px; color: #64748b; margin: 0 0 24px;
      background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2);
      border-radius: 8px; padding: 12px 16px;
    }
    .btn-retry {
      background: none; border: 1px solid #1e2433; color: #3b82f6;
      padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px;
      transition: all .15s;
    }
    .btn-retry:hover { border-color: #3b82f6; background: rgba(59,130,246,.08); }
  `]
})
export class OAuthCallbackComponent implements OnInit {

  message = 'Signing you in...';
  sub     = 'Securely completing authentication';
  error   = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const params = this.activatedRoute.snapshot.queryParams;
    const token  = params['token'];
    const email  = params['email'];
    const name   = params['name'];

    // Check for backend error redirect
    if (params['error']) {
      this.error = 'OAuth2 login failed. Please try again or use email/password.';
      setTimeout(() => this.goToLogin(), 4000);
      return;
    }

    // Validate token
    if (!token || !token.startsWith('eyJ')) {
      this.error = 'No valid token received from server. Please try again.';
      setTimeout(() => this.goToLogin(), 4000);
      return;
    }

    // Store token + minimal user — profile hydrated in background
    this.authService.storeOAuthToken(token, email, name);

    const displayName = decodeURIComponent(name || 'Trader');
    this.message = `Welcome, ${displayName}! 👋`;
    this.sub     = 'Redirecting to your dashboard...';

    setTimeout(() => this.router.navigate(['/dashboard'], { replaceUrl: true }), 1200);
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
