// src/app/features/auth/oauth-callback.component.ts
// Spring Security redirects here after Google/GitHub auth succeeds
// URL format: /auth/callback?token=JWT&email=xxx&name=xxx

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="shell">
      <div class="card">

        <div class="brand">
          <span class="icon">◈</span>
          <span class="name">MarketSaga</span>
        </div>

        <ng-container *ngIf="!error">
          <div class="spinner"></div>
          <h2 class="title">{{ message }}</h2>
          <p class="sub">{{ sub }}</p>
        </ng-container>

        <ng-container *ngIf="error">
          <div class="err-icon">✗</div>
          <h2 class="title err-title">Authentication Failed</h2>
          <p class="err-msg">{{ error }}</p>
          <button (click)="goLogin()" class="btn-retry">← Back to Login</button>
        </ng-container>

      </div>
    </div>
  `,
  styles: [`
    .shell { min-height:100vh; background:#0a0e1a; display:flex; align-items:center; justify-content:center; padding:24px; }
    .card  { background:#0d1117; border:1px solid #1e2433; border-radius:20px; padding:56px 48px; width:100%; max-width:400px; text-align:center; }
    .brand { display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:40px; }
    .icon  { font-size:22px; color:#3b82f6; }
    .name  { font-size:18px; font-weight:900; background:linear-gradient(135deg,#3b82f6,#8b5cf6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .spinner { width:44px; height:44px; border:3px solid #1e2433; border-top-color:#3b82f6; border-radius:50%; animation:spin .8s linear infinite; margin:0 auto 24px; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .title { font-size:18px; font-weight:700; color:#e2e8f0; margin:0 0 8px; }
    .sub   { font-size:14px; color:#64748b; margin:0; }
    .err-icon  { font-size:40px; color:#ef4444; margin-bottom:16px; }
    .err-title { color:#f87171; }
    .err-msg   { font-size:13px; color:#64748b; margin:0 0 24px; background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.2); border-radius:8px; padding:12px 16px; }
    .btn-retry { background:none; border:1px solid #1e2433; color:#3b82f6; padding:10px 20px; border-radius:8px; cursor:pointer; font-size:14px; }
    .btn-retry:hover { border-color:#3b82f6; }
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
    // Read params from URL — Spring sends:
    // /auth/callback?token=eyJ...&email=user@gmail.com&name=John
    const params = this.activatedRoute.snapshot.queryParams;

    // Backend sent an error
    if (params['error']) {
      this.error = 'OAuth2 login failed: ' + params['error'] + '. Please try again.';
      setTimeout(() => this.goLogin(), 4000);
      return;
    }

    const token = params['token']  || '';
    const email = params['email']  || '';
    const name  = params['name']   || '';

    // Validate JWT (all JWTs start with eyJ)
    if (!token || !token.startsWith('eyJ')) {
      this.error = 'No valid token received from server. Please try again.';
      setTimeout(() => this.goLogin(), 4000);
      return;
    }

    try {
      // Store in localStorage + update auth state
      this.authService.storeOAuthToken(token, email, name);

      const displayName = name ? decodeURIComponent(name) : 'Trader';
      this.message = 'Welcome, ' + displayName + '!';
      this.sub     = 'Redirecting to your dashboard...';

      // Give it a moment for the spinner to feel natural
      setTimeout(() => {
        this.router.navigate(['/dashboard'], { replaceUrl: true });
      }, 1200);

    } catch (err) {
      console.error('OAuth callback error:', err);
      this.error = 'Failed to complete sign-in. Please try again.';
      setTimeout(() => this.goLogin(), 4000);
    }
  }

  goLogin() {
    this.router.navigate(['/auth/login']);
  }
}