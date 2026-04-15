// src/app/features/auth/verify-email.component.ts
// Enterprise 6-digit OTP input with auto-advance, paste support, countdown timer

import { Component, OnInit, OnDestroy, signal, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="auth-shell">
      <div class="auth-card">

        <div class="brand">
          <span class="brand-icon">◈</span>
          <span class="brand-name">MarketSaga</span>
        </div>

        <!-- Icon + title -->
        <div class="verify-icon">🔐</div>
        <h1 class="auth-title">Verify your email</h1>
        <p class="auth-sub">
          We sent a 6-digit code to<br>
          <strong class="email-display">{{ email }}</strong>
        </p>

        <!-- OTP Input boxes -->
        <div class="otp-row">
          <input *ngFor="let i of [0,1,2,3,4,5]"
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
                 autocomplete="one-time-code" />
        </div>

        <!-- Error -->
        <div class="error-box" *ngIf="error()">{{ error() }}</div>

        <!-- Success -->
        <div class="success-box" *ngIf="success()">{{ success() }}</div>

        <!-- Verify button -->
        <button class="btn-primary" (click)="verify()" [disabled]="loading() || !isComplete()">
          <span *ngIf="!loading()">Verify Email →</span>
          <span *ngIf="loading()" class="btn-loading">
            <span class="btn-spinner"></span> Verifying...
          </span>
        </button>

        <!-- Resend section -->
        <div class="resend-row">
          <span class="resend-label">Didn't receive it?</span>
          <button class="resend-btn" (click)="resend()" [disabled]="countdown() > 0 || resending()">
            <span *ngIf="countdown() === 0 && !resending()">Resend code</span>
            <span *ngIf="resending()">Sending...</span>
            <span *ngIf="countdown() > 0" class="countdown">Resend in {{ countdown() }}s</span>
          </button>
        </div>

        <p class="change-email">
          Wrong email? <a (click)="goRegister()" class="link">Change email</a>
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

    .verify-icon { font-size:48px; margin-bottom:16px; }
    .auth-title { font-size:24px; font-weight:700; color:#e2e8f0; margin:0 0 10px; }
    .auth-sub { font-size:14px; color:#64748b; margin:0 0 32px; line-height:1.7; }
    .email-display { color:#94a3b8; font-weight:600; }

    /* OTP boxes */
    .otp-row { display:flex; justify-content:center; gap:10px; margin-bottom:24px; }
    .otp-box {
      width:52px; height:64px; border-radius:12px;
      border:1.5px solid #1e2433; background:#0a0e1a;
      color:#e2e8f0; font-size:26px; font-weight:800;
      text-align:center; outline:none; caret-color:transparent;
      transition:all .15s; font-family:monospace;
    }
    .otp-box:focus { border-color:#3b82f6; background:rgba(59,130,246,.06); box-shadow:0 0 0 3px rgba(59,130,246,.15); }
    .otp-box.otp-filled { border-color:#3b82f6; color:#3b82f6; }
    .otp-box.otp-error  { border-color:#ef4444 !important; color:#ef4444 !important; animation:shake .4s; }
    @keyframes shake {
      0%,100%{transform:translateX(0)}
      20%{transform:translateX(-4px)}
      40%{transform:translateX(4px)}
      60%{transform:translateX(-3px)}
      80%{transform:translateX(3px)}
    }

    .error-box { color:#ef4444; font-size:13px; padding:10px 14px; background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.2); border-radius:8px; margin-bottom:16px; }
    .success-box { color:#22c55e; font-size:13px; padding:10px 14px; background:rgba(34,197,94,.08); border:1px solid rgba(34,197,94,.2); border-radius:8px; margin-bottom:16px; }

    .btn-primary {
      width:100%; padding:14px; border-radius:10px; border:none;
      background:linear-gradient(135deg,#3b82f6,#6366f1); color:#fff;
      font-size:15px; font-weight:700; cursor:pointer; margin-bottom:20px;
      transition:all .15s; box-shadow:0 4px 14px rgba(59,130,246,.3);
    }
    .btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 18px rgba(59,130,246,.4); }
    .btn-primary:disabled { opacity:.5; cursor:not-allowed; transform:none; }
    .btn-loading { display:flex; align-items:center; justify-content:center; gap:8px; }
    .btn-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .resend-row { display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:16px; }
    .resend-label { font-size:13px; color:#475569; }
    .resend-btn { background:none; border:none; color:#3b82f6; font-size:13px; font-weight:600; cursor:pointer; padding:0; transition:color .15s; }
    .resend-btn:disabled { color:#475569; cursor:default; }
    .resend-btn:hover:not(:disabled) { color:#60a5fa; }
    .countdown { color:#475569; font-weight:400; }

    .change-email { font-size:13px; color:#475569; margin:0; }
    .link { color:#3b82f6; cursor:pointer; font-weight:600; }
    .link:hover { text-decoration:underline; }
  `]
})
export class VerifyEmailComponent implements OnInit, OnDestroy {

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;

  email     = '';
  digits    = ['', '', '', '', '', ''];
  loading   = signal(false);
  resending = signal(false);
  error     = signal('');
  success   = signal('');
  countdown = signal(0);
  private timer: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Email passed as query param from register page
    this.email = this.route.snapshot.queryParams['email'] || '';
    if (!this.email) this.router.navigate(['/auth/register']);

    // Start 60s cooldown immediately (OTP was just sent by register)
    this.startCountdown(60);
  }

  ngOnDestroy() { clearInterval(this.timer); }

  isComplete(): boolean { return this.digits.every(d => d !== ''); }
  hasError():    boolean { return !!this.error(); }

  getCode(): string { return this.digits.join(''); }

  // ── Input handlers ────────────────────────────────────────────────────

  onInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const val   = input.value.replace(/\D/g, '').slice(-1);
    this.digits[index] = val;
    input.value = val;
    this.error.set('');

    if (val && index < 5) {
      setTimeout(() => this.focusBox(index + 1));
    }
    if (this.isComplete()) setTimeout(() => this.verify(), 300);
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      if (this.digits[index]) {
        this.digits[index] = '';
        (event.target as HTMLInputElement).value = '';
      } else if (index > 0) {
        this.digits[index - 1] = '';
        this.focusBox(index - 1);
      }
      this.error.set('');
    } else if (event.key === 'ArrowLeft'  && index > 0) this.focusBox(index - 1);
    else if  (event.key === 'ArrowRight' && index < 5) this.focusBox(index + 1);
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    pasted.split('').forEach((ch, i) => { if (i < 6) this.digits[i] = ch; });
    // Update DOM
    const inputs = this.otpInputs.toArray();
    this.digits.forEach((d, i) => { if (inputs[i]) inputs[i].nativeElement.value = d; });
    // Focus last filled or next empty
    const nextEmpty = this.digits.findIndex(d => !d);
    this.focusBox(nextEmpty === -1 ? 5 : nextEmpty);
    this.error.set('');
    if (this.isComplete()) setTimeout(() => this.verify(), 300);
  }

  onFocus(index: number) {
    // Focus first empty box when clicking any box
    const first = this.digits.findIndex(d => !d);
    if (first !== -1 && first < index) this.focusBox(first);
  }

  private focusBox(index: number) {
    const inputs = this.otpInputs.toArray();
    if (inputs[index]) inputs[index].nativeElement.focus();
  }

  // ── API calls ─────────────────────────────────────────────────────────

  verify() {
    if (!this.isComplete() || this.loading()) return;
    this.loading.set(true);
    this.error.set('');

    this.http.post<any>(`${environment.apiUrl}/auth/verify-email`, {
      email: this.email,
      otp:   this.getCode()
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set('Email verified! Welcome to MarketSaga 🎉');
        // Store JWT and navigate
        this.authService.storeOAuthToken(res.accessToken, this.email,
          res.user?.displayName || res.user?.firstName || '');
        setTimeout(() => this.router.navigate(['/dashboard'], { replaceUrl: true }), 800);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Verification failed. Please try again.');
        // Shake + clear on wrong OTP
        this.digits = ['', '', '', '', '', ''];
        const inputs = this.otpInputs.toArray();
        inputs.forEach(i => { i.nativeElement.value = ''; });
        setTimeout(() => this.focusBox(0));
      }
    });
  }

  resend() {
    if (this.countdown() > 0 || this.resending()) return;
    this.resending.set(true);
    this.error.set('');

    this.http.post<any>(`${environment.apiUrl}/auth/resend-otp`, {
      email: this.email,
      type:  'EMAIL_VERIFICATION'
    }).subscribe({
      next: (res) => {
        this.resending.set(false);
        this.success.set(res.message || 'New code sent!');
        this.startCountdown(60);
        setTimeout(() => this.success.set(''), 4000);
      },
      error: (err) => {
        this.resending.set(false);
        this.error.set(err?.error?.message || 'Could not resend. Please try again.');
      }
    });
  }

  private startCountdown(seconds: number) {
    this.countdown.set(seconds);
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.countdown.update(v => {
        if (v <= 1) { clearInterval(this.timer); return 0; }
        return v - 1;
      });
    }, 1000);
  }

  goRegister() { this.router.navigate(['/auth/register']); }
}
