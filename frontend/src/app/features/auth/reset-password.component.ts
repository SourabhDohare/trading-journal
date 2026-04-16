// src/app/features/auth/reset-password.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  ViewChildren,
  QueryList,
  ElementRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink, Router, ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { AuthLogoComponent } from "../../shared/components/auth-logo/auth-logo.component";

@Component({
  selector: "app-reset-password",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AuthLogoComponent],
  template: `
    <div class="auth-shell">
      <div class="auth-card">
        <app-auth-logo />

        <!-- Step 1: OTP -->
        <ng-container *ngIf="step() === 1">
          <div class="step-icon">🔐</div>
          <h1 class="auth-title">Enter reset code</h1>
          <p class="auth-sub">
            6-digit code sent to<br /><strong class="email-display">{{
              email
            }}</strong>
          </p>
          <div class="otp-row">
            <input
              *ngFor="let i of [0, 1, 2, 3, 4, 5]"
              #otpInput
              type="text"
              inputmode="numeric"
              maxlength="1"
              class="otp-box"
              [class.otp-filled]="digits[i]"
              [class.otp-error]="hasError()"
              [value]="digits[i]"
              (keydown)="onKeyDown($event, i)"
              (input)="onInput($event, i)"
              (paste)="onPaste($event)"
              autocomplete="one-time-code"
            />
          </div>
          <div class="error-box" *ngIf="error()">{{ error() }}</div>
          <button
            class="btn-primary"
            (click)="nextStep()"
            [disabled]="loading() || !isComplete()"
          >
            <span *ngIf="!loading()">Continue →</span>
            <span *ngIf="loading()" class="btn-loading"
              ><span class="btn-spinner"></span> Verifying...</span
            >
          </button>
          <div class="resend-row">
            <span class="resend-label">Didn't receive it?</span>
            <button
              class="resend-btn"
              (click)="resend()"
              [disabled]="countdown() > 0 || resending()"
            >
              <span *ngIf="countdown() === 0 && !resending()">Resend code</span>
              <span *ngIf="resending()">Sending...</span>
              <span *ngIf="countdown() > 0" class="countdown"
                >Resend in {{ countdown() }}s</span
              >
            </button>
          </div>
        </ng-container>

        <!-- Step 2: New password -->
        <ng-container *ngIf="step() === 2">
          <div class="step-icon">🔒</div>
          <h1 class="auth-title">New password</h1>
          <p class="auth-sub">Choose a strong password for your account.</p>
          <div class="form-fields">
            <div class="field">
              <label>New Password</label>
              <div class="pw-wrap">
                <input
                  [type]="showPw() ? 'text' : 'password'"
                  [(ngModel)]="newPassword"
                  placeholder="Min 8 characters"
                  class="field-input"
                  autocomplete="new-password"
                />
                <button type="button" class="pw-toggle" (click)="togglePw()">
                  {{ showPw() ? "🙈" : "👁" }}
                </button>
              </div>
            </div>
            <div class="field">
              <label>Confirm Password</label>
              <input
                [type]="showPw() ? 'text' : 'password'"
                [(ngModel)]="confirmPassword"
                placeholder="Repeat password"
                class="field-input"
                (keydown.enter)="reset()"
                autocomplete="new-password"
              />
              <span
                class="mismatch"
                *ngIf="confirmPassword && newPassword !== confirmPassword"
                >Passwords don't match</span
              >
            </div>
          </div>
          <div class="error-box" *ngIf="error()">{{ error() }}</div>
          <button
            class="btn-primary"
            (click)="reset()"
            [disabled]="
              loading() || !newPassword || newPassword !== confirmPassword
            "
          >
            <span *ngIf="!loading()">Reset Password</span>
            <span *ngIf="loading()" class="btn-loading"
              ><span class="btn-spinner"></span> Updating...</span
            >
          </button>
        </ng-container>

        <!-- Step 3: Success -->
        <ng-container *ngIf="step() === 3">
          <div class="step-icon">✅</div>
          <h1 class="auth-title">Password updated!</h1>
          <p class="auth-sub">Your password has been reset successfully.</p>
          <button class="btn-primary" (click)="goLogin()">Sign in now →</button>
        </ng-container>

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
      .step-icon {
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
        line-height: 1.7;
      }
      .email-display {
        color: #5eead4;
        font-weight: 600;
      }
      .otp-row {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-bottom: 20px;
      }
      .otp-box {
        width: 50px;
        height: 60px;
        border-radius: 12px;
        border: 1.5px solid #1e2433;
        background: #070b14;
        color: #e2e8f0;
        font-size: 26px;
        font-weight: 800;
        text-align: center;
        outline: none;
        caret-color: transparent;
        transition: all 0.15s;
        font-family: monospace;
      }
      .otp-box:focus {
        border-color: #0d9488;
        box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
      }
      .otp-box.otp-filled {
        border-color: #0d9488;
        color: #5eead4;
      }
      .otp-box.otp-error {
        border-color: #ef4444 !important;
        color: #ef4444 !important;
        animation: shake 0.4s;
      }
      @keyframes shake {
        0%,
        100% {
          transform: translateX(0);
        }
        20% {
          transform: translateX(-4px);
        }
        40% {
          transform: translateX(4px);
        }
        60% {
          transform: translateX(-3px);
        }
        80% {
          transform: translateX(3px);
        }
      }
      .form-fields {
        display: flex;
        flex-direction: column;
        gap: 14px;
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
      .mismatch {
        font-size: 11px;
        color: #ef4444;
        margin-top: 2px;
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
      .resend-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 14px;
      }
      .resend-label {
        font-size: 13px;
        color: #475569;
      }
      .resend-btn {
        background: none;
        border: none;
        color: #0d9488;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        padding: 0;
      }
      .resend-btn:disabled {
        color: #475569;
        cursor: default;
      }
      .countdown {
        color: #475569;
        font-weight: 400;
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
export class ResetPasswordComponent implements OnInit, OnDestroy {
  @ViewChildren("otpInput") otpInputs!: QueryList<ElementRef>;
  email = "";
  digits = ["", "", "", "", "", ""];
  newPassword = "";
  confirmPassword = "";
  showPw = signal(false);
  step = signal(1);
  loading = signal(false);
  resending = signal(false);
  error = signal("");
  success = signal("");
  countdown = signal(60);
  private timer: any;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}
  ngOnInit() {
    this.email = this.route.snapshot.queryParams["email"] || "";
    if (!this.email) this.router.navigate(["/auth/forgot-password"]);
    this.startCountdown(60);
  }
  ngOnDestroy() {
    clearInterval(this.timer);
  }
  isComplete(): boolean {
    return this.digits.every((d) => d !== "");
  }
  hasError(): boolean {
    return !!this.error();
  }
  onInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, "").slice(-1);
    this.digits[index] = val;
    input.value = val;
    this.error.set("");
    if (val && index < 5) setTimeout(() => this.focusBox(index + 1));
  }
  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === "Backspace") {
      if (this.digits[index]) {
        this.digits[index] = "";
        (event.target as HTMLInputElement).value = "";
      } else if (index > 0) {
        this.digits[index - 1] = "";
        this.focusBox(index - 1);
      }
      this.error.set("");
    }
  }
  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const p = (event.clipboardData?.getData("text") || "")
      .replace(/\D/g, "")
      .slice(0, 6);
    p.split("").forEach((c, i) => {
      if (i < 6) this.digits[i] = c;
    });
    const inputs = this.otpInputs.toArray();
    this.digits.forEach((d, i) => {
      if (inputs[i]) inputs[i].nativeElement.value = d;
    });
    const next = this.digits.findIndex((d) => !d);
    this.focusBox(next === -1 ? 5 : next);
  }
  private focusBox(i: number) {
    const a = this.otpInputs.toArray();
    if (a[i]) a[i].nativeElement.focus();
  }
  togglePw() {
    this.showPw.update((v) => !v);
  }
  nextStep() {
    if (!this.isComplete()) return;
    this.step.set(2);
  }
  reset() {
    if (!this.newPassword || this.newPassword !== this.confirmPassword) return;
    if (this.newPassword.length < 8) {
      this.error.set("Password must be at least 8 characters.");
      return;
    }
    this.loading.set(true);
    this.error.set("");
    this.http
      .post<any>(`${environment.apiUrl}/auth/reset-password`, {
        email: this.email,
        otp: this.digits.join(""),
        newPassword: this.newPassword,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.step.set(3);
        },
        error: (err: any) => {
          this.loading.set(false);
          const msg = err?.error?.message || "Reset failed.";
          if (
            msg.includes("OTP") ||
            msg.includes("attempt") ||
            msg.includes("expire")
          ) {
            this.digits = ["", "", "", "", "", ""];
            this.error.set(msg + " Please re-enter the code.");
            this.step.set(1);
            setTimeout(() => this.focusBox(0), 100);
          } else {
            this.error.set(msg);
          }
        },
      });
  }
  resend() {
    if (this.countdown() > 0 || this.resending()) return;
    this.resending.set(true);
    this.http
      .post<any>(`${environment.apiUrl}/auth/resend-otp`, {
        email: this.email,
        type: "PASSWORD_RESET",
      })
      .subscribe({
        next: () => {
          this.resending.set(false);
          this.success.set("New code sent!");
          this.startCountdown(60);
          setTimeout(() => this.success.set(""), 3000);
        },
        error: (err: any) => {
          this.resending.set(false);
          this.error.set(err?.error?.message || "Could not resend.");
        },
      });
  }
  private startCountdown(s: number) {
    this.countdown.set(s);
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.countdown.update((v) => {
        if (v <= 1) {
          clearInterval(this.timer);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }
  goLogin() {
    this.router.navigate(["/auth/login"]);
  }
}
