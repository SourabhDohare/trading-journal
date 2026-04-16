// src/app/features/auth/register.component.ts
import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink, Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { AuthLogoComponent } from "../../shared/components/auth-logo/auth-logo.component";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AuthLogoComponent],
  template: `
    <div class="auth-shell">
      <div class="auth-card">
        <app-auth-logo />

        <h1 class="auth-title">Create your account</h1>
        <p class="auth-sub">Start your trading journey today</p>

        <div class="oauth-stack">
          <a [href]="googleUrl" class="oauth-btn google-btn">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </a>
          <a [href]="githubUrl" class="oauth-btn github-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            Sign up with GitHub
          </a>
        </div>

        <div class="divider"><span>or create with email</span></div>

        <div class="form-fields">
          <div class="field-row">
            <div class="field">
              <label>First Name</label>
              <input
                [(ngModel)]="firstName"
                placeholder="Sourabh"
                class="field-input"
                autocomplete="given-name"
              />
            </div>
            <div class="field">
              <label>Last Name</label>
              <input
                [(ngModel)]="lastName"
                placeholder="Dohare"
                class="field-input"
                autocomplete="family-name"
              />
            </div>
          </div>
          <div class="field">
            <label>Email</label>
            <input
              type="email"
              [(ngModel)]="email"
              placeholder="you@example.com"
              class="field-input"
              autocomplete="email"
            />
          </div>
          <div class="field">
            <label>Password <span class="hint">Min 8 chars</span></label>
            <div class="pw-wrap">
              <input
                [type]="showPw() ? 'text' : 'password'"
                [(ngModel)]="password"
                placeholder="••••••••"
                class="field-input"
                (keydown.enter)="register()"
                autocomplete="new-password"
              />
              <button type="button" class="pw-toggle" (click)="togglePw()">
                {{ showPw() ? "🙈" : "👁" }}
              </button>
            </div>
            <div class="strength-wrap" *ngIf="hasPassword()">
              <div class="strength-track">
                <div
                  class="strength-fill"
                  [style.width.%]="passwordStrength()"
                  [ngClass]="strengthClass()"
                ></div>
              </div>
              <span class="strength-label" [ngClass]="strengthClass()">{{
                strengthLabel()
              }}</span>
            </div>
          </div>
        </div>

        <div class="error-box" *ngIf="error()">{{ error() }}</div>

        <button class="btn-primary" (click)="register()" [disabled]="loading()">
          <span *ngIf="!loading()">Create account →</span>
          <span *ngIf="loading()" class="btn-loading"
            ><span class="btn-spinner"></span> Creating...</span
          >
        </button>

        <p class="switch-link">
          Already a trader? <a routerLink="/auth/login">Sign in</a>
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
        max-width: 440px;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
      }
      .auth-title {
        font-size: 22px;
        font-weight: 700;
        color: #e2e8f0;
        margin: 0 0 4px;
        text-align: center;
      }
      .auth-sub {
        font-size: 13px;
        color: #475569;
        margin: 0 0 24px;
        text-align: center;
      }
      .oauth-stack {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .oauth-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 11px 20px;
        border-radius: 10px;
        font-size: 13.5px;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.15s;
        border: 1px solid;
      }
      .google-btn {
        background: #fff;
        color: #1f2937;
        border-color: #e5e7eb;
      }
      .google-btn:hover {
        background: #f9fafb;
      }
      .github-btn {
        background: #161b22;
        color: #e6edf3;
        border-color: #30363d;
      }
      .github-btn:hover {
        background: #1c2128;
      }
      .divider {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 20px 0;
      }
      .divider::before,
      .divider::after {
        content: "";
        flex: 1;
        height: 1px;
        background: #1e2433;
      }
      .divider span {
        font-size: 11px;
        color: #334155;
        white-space: nowrap;
        letter-spacing: 0.5px;
      }
      .form-fields {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .field-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
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
      .hint {
        font-size: 10px;
        color: #334155;
        text-transform: none;
        font-weight: 400;
        letter-spacing: 0;
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
      .pw-wrap {
        position: relative;
      }
      .pw-wrap .field-input {
        padding-right: 44px;
      }
      .pw-toggle {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        color: #475569;
        padding: 0;
      }
      .strength-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
      }
      .strength-track {
        flex: 1;
        height: 3px;
        background: #1e2433;
        border-radius: 2px;
        overflow: hidden;
      }
      .strength-fill {
        height: 100%;
        border-radius: 2px;
        transition: width 0.3s;
      }
      .strength-fill.weak {
        background: #ef4444;
      }
      .strength-fill.fair {
        background: #f59e0b;
      }
      .strength-fill.good {
        background: #0d9488;
      }
      .strength-fill.strong {
        background: #5eead4;
      }
      .strength-label {
        font-size: 11px;
        font-weight: 600;
      }
      .strength-label.weak {
        color: #ef4444;
      }
      .strength-label.fair {
        color: #f59e0b;
      }
      .strength-label.good {
        color: #0d9488;
      }
      .strength-label.strong {
        color: #5eead4;
      }
      .error-box {
        color: #f87171;
        font-size: 13px;
        padding: 10px 14px;
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 8px;
        margin: 12px 0;
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
        margin-top: 14px;
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
      .switch-link {
        text-align: center;
        font-size: 13px;
        color: #475569;
        margin: 16px 0 0;
      }
      .switch-link a {
        color: #0d9488;
        text-decoration: none;
        font-weight: 600;
      }
      .switch-link a:hover {
        color: #5eead4;
      }
    `,
  ],
})
export class RegisterComponent {
  firstName = "";
  lastName = "";
  email = "";
  password = "";
  showPw = signal(false);
  loading = signal(false);
  error = signal("");
  readonly googleUrl = `${environment.apiUrl}/oauth2/authorization/google`;
  readonly githubUrl = `${environment.apiUrl}/oauth2/authorization/github`;
  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}
  togglePw(): void {
    this.showPw.update((v) => !v);
  }
  hasPassword(): boolean {
    return this.password.length > 0;
  }
  passwordStrength(): number {
    const p = this.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s += 25;
    if (p.length >= 12) s += 15;
    if (/[A-Z]/.test(p)) s += 20;
    if (/[0-9]/.test(p)) s += 20;
    if (/[^A-Za-z0-9]/.test(p)) s += 20;
    return Math.min(100, s);
  }
  strengthClass(): string {
    const s = this.passwordStrength();
    return s < 30 ? "weak" : s < 60 ? "fair" : s < 80 ? "good" : "strong";
  }
  strengthLabel(): string {
    return (
      ({ weak: "Weak", fair: "Fair", good: "Good", strong: "Strong" } as any)[
        this.strengthClass()
      ] ?? "Weak"
    );
  }
  register() {
    if (!this.firstName.trim() || !this.email.trim() || !this.password) {
      this.error.set("First name, email and password are required.");
      return;
    }
    if (this.password.length < 8) {
      this.error.set("Password must be at least 8 characters.");
      return;
    }
    this.loading.set(true);
    this.error.set("");
    const email = this.email.trim().toLowerCase();
    this.http
      .post<any>(`${environment.apiUrl}/auth/register`, {
        firstName: this.firstName.trim(),
        lastName: this.lastName.trim(),
        email,
        password: this.password,
      })
      .subscribe({
        next: (_res: any) => {
          this.loading.set(false);
          this.router.navigate(["/auth/verify-email"], {
            queryParams: { email },
          });
        },
        error: (err: any) => {
          this.loading.set(false);
          this.error.set(
            err?.error?.message || "Registration failed. Please try again.",
          );
        },
      });
  }
}
