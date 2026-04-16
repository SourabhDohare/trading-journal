// src/app/features/auth/verify-email.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  ElementRef,
  ViewChildren,
  QueryList,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { AuthService } from "../../core/services/auth.service";
import { AuthLogoComponent } from "../../shared/components/auth-logo/auth-logo.component";

@Component({
  selector: "app-verify-email",
  standalone: true,
  imports: [CommonModule, AuthLogoComponent],
  template: `
    <div class="auth-shell">
      <div class="auth-card">
        <app-auth-logo />

        <div class="verify-icon">🔐</div>
        <h1 class="auth-title">Verify your email</h1>
        <p class="auth-sub">
          We sent a 6-digit code to<br />
          <strong class="email-display">{{ email }}</strong>
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
            (focus)="onFocus(i)"
            autocomplete="one-time-code"
          />
        </div>

        <div class="error-box" *ngIf="error()">{{ error() }}</div>
        <div class="success-box" *ngIf="success()">{{ success() }}</div>

        <button
          class="btn-primary"
          (click)="verify()"
          [disabled]="loading() || !isComplete()"
        >
          <span *ngIf="!loading()">Verify Email →</span>
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

        <p class="change-email">
          Wrong email? <a (click)="goRegister()" class="link">Change email</a>
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
      .verify-icon {
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
        margin: 0 0 28px;
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
        background: rgba(13, 148, 136, 0.06);
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
      .error-box {
        color: #f87171;
        font-size: 13px;
        padding: 10px 14px;
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 8px;
        margin-bottom: 14px;
      }
      .success-box {
        color: #5eead4;
        font-size: 13px;
        padding: 10px 14px;
        background: rgba(13, 148, 136, 0.08);
        border: 1px solid rgba(13, 148, 136, 0.2);
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
        margin-bottom: 18px;
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
      .resend-btn:hover:not(:disabled) {
        color: #5eead4;
      }
      .countdown {
        color: #475569;
        font-weight: 400;
      }
      .change-email {
        font-size: 13px;
        color: #475569;
        margin: 0;
      }
      .link {
        color: #0d9488;
        cursor: pointer;
        font-weight: 600;
      }
      .link:hover {
        color: #5eead4;
      }
    `,
  ],
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  @ViewChildren("otpInput") otpInputs!: QueryList<ElementRef>;
  email = "";
  digits = ["", "", "", "", "", ""];
  loading = signal(false);
  resending = signal(false);
  error = signal("");
  success = signal("");
  countdown = signal(0);
  private timer: any;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
  ) {}
  ngOnInit() {
    this.email = this.route.snapshot.queryParams["email"] || "";
    if (!this.email) this.router.navigate(["/auth/register"]);
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
  getCode(): string {
    return this.digits.join("");
  }
  onInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, "").slice(-1);
    this.digits[index] = val;
    input.value = val;
    this.error.set("");
    if (val && index < 5) setTimeout(() => this.focusBox(index + 1));
    if (this.isComplete()) setTimeout(() => this.verify(), 300);
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
    } else if (event.key === "ArrowLeft" && index > 0) this.focusBox(index - 1);
    else if (event.key === "ArrowRight" && index < 5) this.focusBox(index + 1);
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
    if (this.isComplete()) setTimeout(() => this.verify(), 300);
  }
  onFocus(index: number) {
    const first = this.digits.findIndex((d) => !d);
    if (first !== -1 && first < index) this.focusBox(first);
  }
  private focusBox(i: number) {
    const a = this.otpInputs.toArray();
    if (a[i]) a[i].nativeElement.focus();
  }
  verify() {
    if (!this.isComplete() || this.loading()) return;
    this.loading.set(true);
    this.error.set("");
    this.http
      .post<any>(`${environment.apiUrl}/auth/verify-email`, {
        email: this.email,
        otp: this.getCode(),
      })
      .subscribe({
        next: (res: any) => {
          this.loading.set(false);
          this.success.set("Email verified! Welcome to Market Saga 🎉");
          this.authService.storeOAuthToken(
            res.accessToken,
            this.email,
            res.user?.displayName || res.user?.firstName || "",
          );
          setTimeout(
            () => this.router.navigate(["/dashboard"], { replaceUrl: true }),
            800,
          );
        },
        error: (err: any) => {
          this.loading.set(false);
          this.error.set(err?.error?.message || "Verification failed.");
          this.digits = ["", "", "", "", "", ""];
          const inputs = this.otpInputs.toArray();
          inputs.forEach((i) => {
            i.nativeElement.value = "";
          });
          setTimeout(() => this.focusBox(0));
        },
      });
  }
  resend() {
    if (this.countdown() > 0 || this.resending()) return;
    this.resending.set(true);
    this.error.set("");
    this.http
      .post<any>(`${environment.apiUrl}/auth/resend-otp`, {
        email: this.email,
        type: "EMAIL_VERIFICATION",
      })
      .subscribe({
        next: (res: any) => {
          this.resending.set(false);
          this.success.set(res.message || "New code sent!");
          this.startCountdown(60);
          setTimeout(() => this.success.set(""), 4000);
        },
        error: (err: any) => {
          this.resending.set(false);
          this.error.set(err?.error?.message || "Could not resend.");
        },
      });
  }
  private startCountdown(seconds: number) {
    this.countdown.set(seconds);
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
  goRegister() {
    this.router.navigate(["/auth/register"]);
  }
}
