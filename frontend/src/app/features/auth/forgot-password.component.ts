// src/app/features/auth/forgot-password.component.ts
import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink, Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { AuthLogoComponent } from "../../shared/components/auth-logo/auth-logo.component";

@Component({
  selector: "app-forgot-password",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AuthLogoComponent],
  template: `
    <div class="auth-shell">
      <div class="auth-card">
        <app-auth-logo />

        <div class="fp-icon">🔑</div>
        <h1 class="auth-title">Reset password</h1>
        <p class="auth-sub">Enter your email and we'll send a reset code.</p>

        <div class="form-fields" *ngIf="!sent()">
          <div class="field">
            <label>Email address</label>
            <input
              type="email"
              [(ngModel)]="email"
              placeholder="you@example.com"
              class="field-input"
              (keydown.enter)="send()"
              autocomplete="email"
            />
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

        <button
          class="btn-primary"
          (click)="send()"
          [disabled]="loading() || sent()"
          *ngIf="!sent()"
        >
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
        padding: 40px 36px;
        width: 100%;
        max-width: 420px;
        text-align: center;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
      }
      .fp-icon {
        font-size: 40px;
        margin-bottom: 12px;
      }
      .auth-title {
        font-size: 22px;
        font-weight: 700;
        color: #e2e8f0;
        margin: 0 0 6px;
      }
      .auth-sub {
        font-size: 13px;
        color: #475569;
        margin: 0 0 24px;
        line-height: 1.6;
      }
      .form-fields {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 16px;
        text-align: left;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      label {
        font-size: 11px;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.7px;
      }
      .field-input {
        background: #070b14;
        border: 1px solid #1e2433;
        border-radius: 9px;
        color: #e2e8f0;
        padding: 11px 14px;
        font-size: 14px;
        outline: none;
        transition:
          border-color 0.15s,
          box-shadow 0.15s;
        width: 100%;
        box-sizing: border-box;
      }
      .field-input:focus {
        border-color: #0d9488;
        box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12);
      }
      .field-input::placeholder {
        color: #2d3748;
      }
      .success-card {
        background: rgba(13, 148, 136, 0.05);
        border: 1px solid rgba(13, 148, 136, 0.2);
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 16px;
      }
      .success-icon {
        font-size: 32px;
        margin-bottom: 10px;
      }
      .success-title {
        font-size: 16px;
        font-weight: 700;
        color: #5eead4;
        margin: 0 0 8px;
      }
      .success-text {
        font-size: 13px;
        color: #64748b;
        line-height: 1.6;
        margin: 0 0 16px;
      }
      .success-text strong {
        color: #94a3b8;
      }
      .btn-continue {
        background: rgba(13, 148, 136, 0.1);
        border: 1px solid rgba(13, 148, 136, 0.3);
        color: #5eead4;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.15s;
      }
      .btn-continue:hover {
        background: rgba(13, 148, 136, 0.2);
      }
      .error-box {
        color: #f87171;
        font-size: 13px;
        padding: 10px 14px;
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 8px;
        margin-bottom: 14px;
      }
      .btn-primary {
        width: 100%;
        padding: 13px;
        border-radius: 10px;
        border: none;
        background: linear-gradient(135deg, #0d9488, #0891b2);
        color: #fff;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        margin-bottom: 16px;
        transition: all 0.15s;
        box-shadow: 0 4px 14px rgba(13, 148, 136, 0.3);
      }
      .btn-primary:hover:not(:disabled) {
        transform: translateY(-1px);
      }
      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
      .btn-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .btn-spinner {
        width: 15px;
        height: 15px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .back-link {
        margin: 0;
      }
      .link {
        font-size: 13px;
        color: #0d9488;
        text-decoration: none;
        font-weight: 600;
      }
      .link:hover {
        color: #5eead4;
      }
    `,
  ],
})
export class ForgotPasswordComponent {
  email = "";
  loading = signal(false);
  error = signal("");
  sent = signal(false);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  send() {
    if (!this.email.trim()) {
      this.error.set("Please enter your email.");
      return;
    }
    this.loading.set(true);
    this.error.set("");
    this.http
      .post<any>(`${environment.apiUrl}/auth/forgot-password`, {
        email: this.email.trim().toLowerCase(),
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.sent.set(true);
        },
        error: (err: any) => {
          this.loading.set(false);
          this.error.set(err?.error?.message || "Something went wrong.");
        },
      });
  }

  goReset() {
    this.router.navigate(["/auth/reset-password"], {
      queryParams: { email: this.email.trim().toLowerCase() },
    });
  }
}
