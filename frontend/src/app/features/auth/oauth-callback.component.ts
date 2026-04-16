// src/app/features/auth/oauth-callback.component.ts
import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, ActivatedRoute } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { AuthLogoComponent } from "../../shared/components/auth-logo/auth-logo.component";

@Component({
  selector: "app-oauth-callback",
  standalone: true,
  imports: [CommonModule, AuthLogoComponent],
  template: `
    <div class="auth-shell">
      <div class="auth-card">
        <app-auth-logo />

        <ng-container *ngIf="!error">
          <div class="spinner-wrap">
            <div class="ring"></div>
          </div>
          <h2 class="title">{{ message }}</h2>
          <p class="sub">{{ sub }}</p>
        </ng-container>

        <ng-container *ngIf="error">
          <div class="err-icon">✗</div>
          <h2 class="err-title">Authentication Failed</h2>
          <p class="err-msg">{{ error }}</p>
          <button (click)="goLogin()" class="btn-retry">
            ← Back to Sign in
          </button>
        </ng-container>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-shell {
        min-height: 100vh;
        background: #070b14;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background-image: radial-gradient(
          ellipse at 20% 50%,
          rgba(13, 148, 136, 0.06) 0%,
          transparent 60%
        );
      }
      .auth-card {
        background: #0d1117;
        border: 1px solid #1e2433;
        border-radius: 20px;
        padding: 48px 40px;
        width: 100%;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
      }
      .spinner-wrap {
        display: flex;
        justify-content: center;
        margin-bottom: 24px;
      }
      .ring {
        width: 44px;
        height: 44px;
        border: 3px solid #1e2433;
        border-top-color: #0d9488;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .title {
        font-size: 18px;
        font-weight: 700;
        color: #e2e8f0;
        margin: 0 0 8px;
      }
      .sub {
        font-size: 14px;
        color: #475569;
        margin: 0;
      }
      .err-icon {
        font-size: 40px;
        color: #ef4444;
        margin-bottom: 16px;
      }
      .err-title {
        font-size: 18px;
        font-weight: 700;
        color: #f87171;
        margin: 0 0 12px;
      }
      .err-msg {
        font-size: 13px;
        color: #64748b;
        margin: 0 0 24px;
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 8px;
        padding: 12px 16px;
      }
      .btn-retry {
        background: none;
        border: 1px solid #1e2433;
        color: #0d9488;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.15s;
      }
      .btn-retry:hover {
        border-color: #0d9488;
      }
    `,
  ],
})
export class OAuthCallbackComponent implements OnInit {
  message = "Signing you in...";
  sub = "Securely completing authentication";
  error = "";

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    const params = this.activatedRoute.snapshot.queryParams;

    if (params["error"]) {
      this.error =
        "OAuth2 login failed: " + params["error"] + ". Please try again.";
      setTimeout(() => this.goLogin(), 4000);
      return;
    }

    const token = params["token"] || "";
    const email = params["email"] || "";
    const name = params["name"] || "";

    if (!token || !token.startsWith("eyJ")) {
      this.error = "No valid token received. Please try again.";
      setTimeout(() => this.goLogin(), 4000);
      return;
    }

    try {
      this.authService.storeOAuthToken(token, email, name);
      const displayName = name ? decodeURIComponent(name) : "Trader";
      this.message = "Welcome, " + displayName + "!";
      this.sub = "Redirecting to your dashboard...";
      setTimeout(
        () => this.router.navigate(["/dashboard"], { replaceUrl: true }),
        1200,
      );
    } catch (err) {
      this.error = "Failed to complete sign-in. Please try again.";
      setTimeout(() => this.goLogin(), 4000);
    }
  }

  goLogin() {
    this.router.navigate(["/auth/login"]);
  }
}
