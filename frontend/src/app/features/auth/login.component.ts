// src/app/features/auth/login.component.ts
import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink, Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "../../core/services/auth.service";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-shell">
      <div class="auth-card">
        <!-- ── LOGO ───────────────────────────────────────────────── -->
        <div class="logo-wrap">
          <svg
            width="240"
            height="72"
            viewBox="0 0 240 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g transform="translate(16, 6) scale(0.52)">
              <path
                d="M50 15L15 30V65C15 85 50 105 50 105C50 105 85 85 85 65V30L50 15Z"
                fill="#0D9488"
              />
              <path
                d="M35 68L48 50L58 60L75 35"
                stroke="#5EEAD4"
                stroke-width="6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle cx="75" cy="35" r="7" fill="white" />
            </g>
            <text
              x="74"
              y="38"
              fill="white"
              style="font-family:Arial,sans-serif;font-weight:700;font-size:28px;letter-spacing:-0.5px"
            >
              Market
              <tspan fill="#5EEAD4" font-weight="400">Saga</tspan>
            </text>
            <text
              x="75"
              y="56"
              fill="#475569"
              style="font-family:Arial,sans-serif;font-weight:800;font-size:8px;letter-spacing:3px"
            >
              TRADE WITH CLARITY
            </text>
          </svg>
        </div>

        <h1 class="auth-title">Welcome back</h1>
        <p class="auth-sub">Sign in to your trading journal</p>

        <!-- ── OAUTH ───────────────────────────────────────────────── -->
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
            Continue with Google
          </a>
          <a [href]="githubUrl" class="oauth-btn github-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            Continue with GitHub
          </a>
        </div>

        <div class="divider"><span>or sign in with email</span></div>

        <!-- ── FORM ────────────────────────────────────────────────── -->
        <div class="form-fields">
          <div class="field">
            <label>Email</label>
            <input
              type="email"
              [(ngModel)]="email"
              placeholder="you@example.com"
              class="field-input"
              (keydown.enter)="login()"
              autocomplete="email"
            />
          </div>
          <div class="field">
            <label>Password</label>
            <div class="pw-wrap">
              <input
                [type]="showPw() ? 'text' : 'password'"
                [(ngModel)]="password"
                placeholder="••••••••"
                class="field-input"
                (keydown.enter)="login()"
                autocomplete="current-password"
              />
              <button type="button" class="pw-toggle" (click)="togglePw()">
                {{ showPw() ? "🙈" : "👁" }}
              </button>
            </div>
          </div>
        </div>

        <div class="forgot-row">
          <a routerLink="/auth/forgot-password" class="forgot-link"
            >Forgot password?</a
          >
        </div>

        <div class="error-box" *ngIf="error()">{{ error() }}</div>

        <button class="btn-primary" (click)="login()" [disabled]="loading()">
          <span *ngIf="!loading()">Sign in →</span>
          <span *ngIf="loading()" class="btn-loading"
            ><span class="spinner"></span> Signing in...</span
          >
        </button>

        <p class="switch-link">
          New trader? <a routerLink="/auth/register">Create account</a>
        </p>

        <div class="auth-footer">
          <svg
            width="16"
            height="19"
            viewBox="0 0 100 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style="opacity:.4"
          >
            <path
              d="M50 15L15 30V65C15 85 50 105 50 105C50 105 85 85 85 65V30L50 15Z"
              fill="#0D9488"
            />
            <path
              d="M35 68L48 50L58 60L75 35"
              stroke="#5EEAD4"
              stroke-width="6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <circle cx="75" cy="35" r="7" fill="white" />
          </svg>
          <span
            >Market Saga ·
            <a href="/auth/login" class="policy-link">Privacy</a> ·
            <a href="/auth/login" class="policy-link">Terms</a></span
          >
        </div>
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
        background-image:
          radial-gradient(
            ellipse at 20% 50%,
            rgba(13, 148, 136, 0.06) 0%,
            transparent 60%
          ),
          radial-gradient(
            ellipse at 80% 20%,
            rgba(8, 145, 178, 0.04) 0%,
            transparent 50%
          );
      }
      .auth-card {
        background: #0d1117;
        border: 1px solid #1e2433;
        border-radius: 20px;
        padding: 40px 36px;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
      }
      .logo-wrap {
        display: flex;
        justify-content: center;
        margin-bottom: 28px;
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

      /* OAuth */
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
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      }
      .github-btn {
        background: #161b22;
        color: #e6edf3;
        border-color: #30363d;
      }
      .github-btn:hover {
        background: #1c2128;
      }

      /* Divider */
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

      /* Form */
      .form-fields {
        display: flex;
        flex-direction: column;
        gap: 14px;
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

      .forgot-row {
        display: flex;
        justify-content: flex-end;
        margin: 6px 0 2px;
      }
      .forgot-link {
        font-size: 12px;
        color: #0d9488;
        text-decoration: none;
        font-weight: 600;
      }
      .forgot-link:hover {
        color: #5eead4;
      }

      .error-box {
        color: #f87171;
        font-size: 13px;
        padding: 10px 14px;
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 8px;
        margin: 10px 0;
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
        box-shadow: 0 6px 20px rgba(13, 148, 136, 0.4);
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
      .spinner {
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

      .auth-footer {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-top: 20px;
        font-size: 11px;
        color: #334155;
      }
      .policy-link {
        color: #334155;
        text-decoration: none;
      }
      .policy-link:hover {
        color: #475569;
      }
    `,
  ],
})
export class LoginComponent {
  email = "";
  password = "";
  loading = signal(false);
  error = signal("");
  showPw = signal(false);
  readonly googleUrl = `${environment.apiUrl}/oauth2/authorization/google`;
  readonly githubUrl = `${environment.apiUrl}/oauth2/authorization/github`;
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
  ) {}
  togglePw(): void {
    this.showPw.update((v) => !v);
  }
  login() {
    if (!this.email.trim() || !this.password) {
      this.error.set("Please enter email and password.");
      return;
    }
    this.loading.set(true);
    this.error.set("");
    this.http
      .post<any>(`${environment.apiUrl}/auth/login`, {
        email: this.email.trim().toLowerCase(),
        password: this.password,
      })
      .subscribe({
        next: (res: any) => {
          this.loading.set(false);
          this.authService.storeOAuthToken(
            res.accessToken,
            res.user?.email || this.email,
            res.user?.displayName || res.user?.firstName || "",
          );
          this.router.navigate(["/dashboard"], { replaceUrl: true });
        },
        error: (err: any) => {
          this.loading.set(false);
          const msg: string = err?.error?.message || "";
          if (msg.startsWith("EMAIL_NOT_VERIFIED:")) {
            this.router.navigate(["/auth/verify-email"], {
              queryParams: {
                email: msg.split(":")[1] || this.email.trim().toLowerCase(),
              },
            });
            return;
          }
          this.error.set(msg || "Invalid email or password.");
        },
      });
  }
}
