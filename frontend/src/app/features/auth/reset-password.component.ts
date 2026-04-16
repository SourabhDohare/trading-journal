// src/app/features/auth/reset-password.component.ts

import { Component, OnInit, OnDestroy, signal, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-shell">
      <div class="auth-card">

        <app-auth-logo/>

        <!-- Step 1: Enter OTP -->
        <ng-container *ngIf="step() === 1">
          <div class="step-icon">🔐</div>
          <h1 class="auth-title">Enter reset code</h1>
          <p class="auth-sub">
            6-digit code sent to<br>
            <strong class="email-display">{{ email }}</strong>
          </p>

          <div class="otp-row">
            <input *ngFor="let i of [0,1,2,3,4,5]"
                   #otpInput type="text" inputmode="numeric"
                   maxlength="1" class="otp-box"
                   [class.otp-filled]="digits[i]"
                   [class.otp-error]="hasError()"
                   [value]="digits[i]"
                   (keydown)="onKeyDown($event, i)"
                   (input)="onInput($event, i)"
                   (paste)="onPaste($event)"
                   autocomplete="one-time-code" />
          </div>

          <div class="error-box" *ngIf="error()">{{ error() }}</div>

          <button class="btn-primary" (click)="nextStep()" [disabled]="loading() || !isComplete()">
            <span *ngIf="!loading()">Continue →</span>
            <span *ngIf="loading()" class="btn-loading"><span class="btn-spinner"></span> Verifying...</span>
          </button>

          <div class="resend-row">
            <span class="resend-label">Didn't receive it?</span>
            <button class="resend-btn" (click)="resend()" [disabled]="countdown() > 0 || resending()">
              <span *ngIf="countdown() === 0 && !resending()">Resend code</span>
              <span *ngIf="resending()">Sending...</span>
              <span *ngIf="countdown() > 0" class="countdown">Resend in {{ countdown() }}s</span>
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
                <input [type]="showPw() ? 'text' : 'password'"
                       [(ngModel)]="newPassword" placeholder="Min 8 characters"
                       class="field-input" autocomplete="new-password" />
                <button type="button" class="pw-toggle" (click)="togglePw()">
                  {{ showPw() ? '🙈' : '👁' }}
                </button>
              </div>
              <div class="strength-wrap" *ngIf="hasPassword()">
                <div class="strength-track">
                  <div class="strength-fill" [style.width.%]="strength()" [ngClass]="strengthClass()"></div>
                </div>
                <span class="strength-label" [ngClass]="strengthClass()">{{ strengthLabel() }}</span>
              </div>
            </div>
            <div class="field">
              <label>Confirm Password</label>
              <input [type]="showPw() ? 'text' : 'password'"
                     [(ngModel)]="confirmPassword" placeholder="Repeat password"
                     class="field-input" (keydown.enter)="reset()"
                     autocomplete="new-password" />
              <span class="mismatch" *ngIf="confirmPassword && newPassword !== confirmPassword">
                Passwords don't match
              </span>
            </div>
          </div>

          <div class="error-box"   *ngIf="error()">{{ error() }}</div>
          <div class="success-box" *ngIf="success()">{{ success() }}</div>

          <button class="btn-primary" (click)="reset()"
                  [disabled]="loading() || !newPassword || newPassword !== confirmPassword">
            <span *ngIf="!loading()">Reset Password</span>
            <span *ngIf="loading()" class="btn-loading"><span class="btn-spinner"></span> Updating...</span>
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
  styles: [`
    .auth-shell { min-height:100vh; background:#0a0e1a; display:flex; align-items:center; justify-content:center; padding:24px; }
    .auth-card { background:#0d1117; border:1px solid #1e2433; border-radius:20px; padding:48px 40px; width:100%; max-width:420px; text-align:center; }
    .brand { display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:28px; }
    .brand-icon { font-size:22px; color:#3b82f6; }
    .brand-name { font-size:18px; font-weight:900; background:linear-gradient(135deg,#3b82f6,#8b5cf6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .step-icon { font-size:44px; margin-bottom:16px; }
    .auth-title { font-size:24px; font-weight:700; color:#e2e8f0; margin:0 0 10px; }
    .auth-sub { font-size:14px; color:#64748b; margin:0 0 28px; line-height:1.7; }
    .email-display { color:#94a3b8; font-weight:600; }

    .otp-row { display:flex; justify-content:center; gap:10px; margin-bottom:20px; }
    .otp-box { width:52px; height:64px; border-radius:12px; border:1.5px solid #1e2433; background:#0a0e1a; color:#e2e8f0; font-size:26px; font-weight:800; text-align:center; outline:none; caret-color:transparent; transition:all .15s; font-family:monospace; }
    .otp-box:focus { border-color:#3b82f6; background:rgba(59,130,246,.06); box-shadow:0 0 0 3px rgba(59,130,246,.15); }
    .otp-box.otp-filled { border-color:#3b82f6; color:#3b82f6; }
    .otp-box.otp-error  { border-color:#ef4444 !important; color:#ef4444 !important; animation:shake .4s; }
    @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }

    .form-fields { display:flex; flex-direction:column; gap:16px; margin-bottom:20px; text-align:left; }
    .field { display:flex; flex-direction:column; gap:6px; }
    label { font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.5px; }
    .field-input { background:#0a0e1a; border:1px solid #1e2433; border-radius:9px; color:#e2e8f0; padding:12px 14px; font-size:14px; outline:none; transition:border-color .15s; width:100%; box-sizing:border-box; }
    .field-input:focus { border-color:#3b82f6; }
    .field-input::placeholder { color:#334155; }
    .pw-wrap { position:relative; }
    .pw-wrap .field-input { padding-right:44px; }
    .pw-toggle { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:16px; color:#64748b; padding:0; }
    .mismatch { font-size:11px; color:#ef4444; margin-top:2px; }

    .strength-wrap { display:flex; align-items:center; gap:8px; margin-top:4px; }
    .strength-track { flex:1; height:4px; background:#1e2433; border-radius:2px; overflow:hidden; }
    .strength-fill { height:100%; border-radius:2px; transition:width .3s; }
    .strength-fill.weak{background:#ef4444} .strength-fill.fair{background:#f59e0b}
    .strength-fill.good{background:#3b82f6} .strength-fill.strong{background:#22c55e}
    .strength-label{font-size:11px;font-weight:600}
    .strength-label.weak{color:#ef4444} .strength-label.fair{color:#f59e0b}
    .strength-label.good{color:#3b82f6} .strength-label.strong{color:#22c55e}

    .error-box   { color:#ef4444; font-size:13px; padding:10px 14px; background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.2); border-radius:8px; margin-bottom:16px; }
    .success-box { color:#22c55e; font-size:13px; padding:10px 14px; background:rgba(34,197,94,.08); border:1px solid rgba(34,197,94,.2); border-radius:8px; margin-bottom:16px; }

    .btn-primary { width:100%; padding:14px; border-radius:10px; border:none; background:linear-gradient(135deg,#3b82f6,#6366f1); color:#fff; font-size:15px; font-weight:700; cursor:pointer; margin-bottom:20px; transition:all .15s; }
    .btn-primary:hover:not(:disabled) { transform:translateY(-1px); }
    .btn-primary:disabled { opacity:.5; cursor:not-allowed; transform:none; }
    .btn-loading { display:flex; align-items:center; justify-content:center; gap:8px; }
    .btn-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .resend-row { display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:16px; }
    .resend-label { font-size:13px; color:#475569; }
    .resend-btn { background:none; border:none; color:#3b82f6; font-size:13px; font-weight:600; cursor:pointer; padding:0; }
    .resend-btn:disabled { color:#475569; cursor:default; }
    .countdown { color:#475569; font-weight:400; }

    .back-link { margin:0; }
    .link { font-size:13px; color:#3b82f6; text-decoration:none; font-weight:600; }
    .link:hover { text-decoration:underline; }
  `]
})
export class ResetPasswordComponent implements OnInit, OnDestroy {

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;

  email          = '';
  digits         = ['', '', '', '', '', ''];
  newPassword    = '';
  confirmPassword= '';
  showPw         = signal(false);
  step           = signal(1);
  loading        = signal(false);
  resending      = signal(false);
  error          = signal('');
  success        = signal('');
  countdown      = signal(60);
  private timer: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.email = this.route.snapshot.queryParams['email'] || '';
    if (!this.email) this.router.navigate(['/auth/forgot-password']);
    this.startCountdown(60);
  }

  ngOnDestroy() { clearInterval(this.timer); }

  isComplete(): boolean { return this.digits.every(d => d !== ''); }
  hasError():    boolean { return !!this.error(); }
  hasPassword(): boolean { return this.newPassword.length > 0; }

  onInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const val   = input.value.replace(/\D/g, '').slice(-1);
    this.digits[index] = val; input.value = val; this.error.set('');
    if (val && index < 5) setTimeout(() => this.focusBox(index + 1));
  }
  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      if (this.digits[index]) { this.digits[index] = ''; (event.target as HTMLInputElement).value = ''; }
      else if (index > 0) { this.digits[index-1] = ''; this.focusBox(index-1); }
      this.error.set('');
    }
  }
  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const p = (event.clipboardData?.getData('text') || '').replace(/\D/g,'').slice(0,6);
    p.split('').forEach((c,i) => { if (i<6) this.digits[i]=c; });
    const inputs = this.otpInputs.toArray();
    this.digits.forEach((d,i) => { if (inputs[i]) inputs[i].nativeElement.value = d; });
    const next = this.digits.findIndex(d => !d); this.focusBox(next === -1 ? 5 : next);
  }
  private focusBox(i: number) { const a = this.otpInputs.toArray(); if (a[i]) a[i].nativeElement.focus(); }

  togglePw() { this.showPw.update(v => !v); }

  strength(): number {
    const p = this.newPassword; if (!p) return 0; let s = 0;
    if (p.length >= 8) s+=25; if (p.length>=12) s+=15;
    if (/[A-Z]/.test(p)) s+=20; if (/[0-9]/.test(p)) s+=20;
    if (/[^A-Za-z0-9]/.test(p)) s+=20; return Math.min(100,s);
  }
  strengthClass(): string { const s=this.strength(); return s<30?'weak':s<60?'fair':s<80?'good':'strong'; }
  strengthLabel(): string { return ({weak:'Weak',fair:'Fair',good:'Good',strong:'Strong'})[this.strengthClass()]??'Weak'; }

  // Step 1: just advance (OTP verified on server in step 2)
  nextStep() {
    if (!this.isComplete()) return;
    this.step.set(2);
  }

  // Step 2: send OTP + new password together
  reset() {
    if (!this.newPassword || this.newPassword !== this.confirmPassword) return;
    if (this.newPassword.length < 8) { this.error.set('Password must be at least 8 characters.'); return; }

    this.loading.set(true); this.error.set('');
    this.http.post<any>(`${environment.apiUrl}/auth/reset-password`, {
      email:       this.email,
      otp:         this.digits.join(''),
      newPassword: this.newPassword
    }).subscribe({
      next: () => { this.loading.set(false); this.step.set(3); },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message || 'Reset failed.';
        if (msg.includes('OTP') || msg.includes('attempt') || msg.includes('expire')) {
          // Bad OTP — go back to step 1
          this.digits = ['','','','','',''];
          this.error.set(msg + ' Please re-enter the code.');
          this.step.set(1);
          setTimeout(() => this.focusBox(0), 100);
        } else {
          this.error.set(msg);
        }
      }
    });
  }

  resend() {
    if (this.countdown() > 0 || this.resending()) return;
    this.resending.set(true);
    this.http.post<any>(`${environment.apiUrl}/auth/resend-otp`, {
      email: this.email, type: 'PASSWORD_RESET'
    }).subscribe({
      next: () => { this.resending.set(false); this.success.set('New code sent!'); this.startCountdown(60); setTimeout(() => this.success.set(''), 3000); },
      error: (err) => { this.resending.set(false); this.error.set(err?.error?.message || 'Could not resend.'); }
    });
  }

  private startCountdown(s: number) {
    this.countdown.set(s); clearInterval(this.timer);
    this.timer = setInterval(() => { this.countdown.update(v => { if (v<=1){clearInterval(this.timer);return 0;}return v-1; }); }, 1000);
  }

  goLogin() { this.router.navigate(['/auth/login']); }
}
