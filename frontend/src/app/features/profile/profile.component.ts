// src/app/features/profile/profile.component.ts
import { Component, OnInit, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { RouterLink } from "@angular/router";
import { environment } from "../../../environments/environment";
import { AuthService } from "../../core/services/auth.service";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  displayName: string;
  phone: string;
  city: string;
  country: string;
  avatarBase64?: string;
  experienceLevel: string;
  primaryStyle: string;
  marketsTraded: string[];
  platformsUsed: string[];
  primaryBroker: string;
  tradingCapital: number;
  riskPerTradePercent: number;
  maxDrawdownTolerance: number;
  targetMonthlyReturnPct: number;
  avgTradesPerMonth: number;
  tradingGoal: string;
  biggestWeakness: string;
  whyImproving: string;
  strictMode: boolean;
  emailNotifications: boolean;
  weeklyReportEmail: boolean;
  role: string;
  planType: string;
  createdAt: string;
}

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">My Profile</h1>
          <p class="page-subtitle">
            Manage your trading identity and preferences
          </p>
        </div>
        <div class="header-right">
          <span
            class="plan-badge"
            [ngClass]="'plan-' + (profile()?.planType || 'free').toLowerCase()"
          >
            {{ profile()?.planType || "FREE" }}
          </span>
          <span class="member-since" *ngIf="profile()?.createdAt">
            Member since {{ profile()!.createdAt | date: "MMM yyyy" }}
          </span>
        </div>
      </div>

      <div class="profile-layout" *ngIf="profile()">
        <!-- ─── LEFT: Avatar + Quick Summary ─── -->
        <div class="sidebar">
          <!-- Avatar card -->
          <div class="card avatar-card">
            <div class="avatar-wrap" (click)="triggerAvatarUpload()">
              <img
                *ngIf="avatarPreview()"
                [src]="avatarPreview()!"
                class="avatar-img"
                alt="Avatar"
              />
              <div *ngIf="!avatarPreview()" class="avatar-initials">
                {{ initials() }}
              </div>
              <div class="avatar-overlay"><span>📷 Change</span></div>
            </div>
            <input
              type="file"
              #avatarInput
              accept="image/*"
              style="display:none"
              (change)="onAvatarSelected($event)"
            />

            <div class="avatar-info">
              <h2 class="avatar-name">
                {{ profile()!.displayName || profile()!.fullName || "—" }}
              </h2>
              <p class="avatar-email">{{ profile()!.email }}</p>
              <span class="role-badge">{{ profile()!.role }}</span>
            </div>

            <div class="quick-stats">
              <div class="qs-item">
                <span class="qs-l">Style</span>
                <span class="qs-v">{{ profile()!.primaryStyle || "—" }}</span>
              </div>
              <div class="qs-item">
                <span class="qs-l">Experience</span>
                <span class="qs-v">{{
                  expLabel(profile()!.experienceLevel)
                }}</span>
              </div>
              <div class="qs-item">
                <span class="qs-l">Capital</span>
                <span class="qs-v">{{
                  profile()!.tradingCapital
                    ? "₹" + formatNum(profile()!.tradingCapital)
                    : "—"
                }}</span>
              </div>
              <div class="qs-item">
                <span class="qs-l">Risk/Trade</span>
                <span class="qs-v">{{
                  profile()!.riskPerTradePercent
                    ? profile()!.riskPerTradePercent + "%"
                    : "—"
                }}</span>
              </div>
            </div>
          </div>

          <!-- Account Settings — toggles auto-save on click -->
          <div class="card settings-card">
            <h3 class="card-title">Account Settings</h3>

            <div class="toggle-row">
              <div class="toggle-info">
                <span class="toggle-label">Strict Mode</span>
                <span class="toggle-desc">Reject incomplete trade entries</span>
              </div>
              <label class="switch">
                <input
                  type="checkbox"
                  [checked]="form.strictMode"
                  (change)="onToggleChange('strictMode', $event)"
                />
                <span class="slider"></span>
              </label>
            </div>

            <div class="toggle-row">
              <div class="toggle-info">
                <span class="toggle-label">Email Notifications</span>
                <span class="toggle-desc">Trade alerts & reminders</span>
              </div>
              <label class="switch">
                <input
                  type="checkbox"
                  [checked]="form.emailNotifications"
                  (change)="onToggleChange('emailNotifications', $event)"
                />
                <span class="slider"></span>
              </label>
            </div>

            <div class="toggle-row">
              <div class="toggle-info">
                <span class="toggle-label">Weekly Report Email</span>
                <span class="toggle-desc"
                  >Performance summary every Saturday</span
                >
              </div>
              <label class="switch">
                <input
                  type="checkbox"
                  [checked]="form.weeklyReportEmail"
                  (change)="onToggleChange('weeklyReportEmail', $event)"
                />
                <span class="slider"></span>
              </label>
            </div>

            <div class="toggle-saving" *ngIf="toggleSaving()">Saving...</div>
          </div>
        </div>

        <!-- ─── RIGHT: Edit Form ─── -->
        <div class="main-col">
          <!-- Personal Info -->
          <div class="card">
            <h3 class="card-title">Personal Information</h3>
            <div class="form-grid">
              <div class="fg">
                <label>Full Name</label>
                <input
                  [(ngModel)]="form.fullName"
                  class="fi"
                  placeholder="Sourabh Dohare"
                />
              </div>
              <div class="fg">
                <label
                  >Display Name
                  <span class="hint">Shown in the app</span></label
                >
                <input
                  [(ngModel)]="form.displayName"
                  class="fi"
                  placeholder="SD"
                />
              </div>
              <div class="fg">
                <label>Email <span class="hint">Cannot change</span></label>
                <input [value]="profile()!.email" class="fi" disabled />
              </div>
              <div class="fg">
                <label>Phone</label>
                <input
                  [(ngModel)]="form.phone"
                  class="fi"
                  placeholder="+91 9876543210"
                />
              </div>
              <div class="fg">
                <label>City</label>
                <input [(ngModel)]="form.city" class="fi" placeholder="Pune" />
              </div>
              <div class="fg">
                <label>Country</label>
                <input
                  [(ngModel)]="form.country"
                  class="fi"
                  placeholder="India"
                />
              </div>
            </div>
          </div>

          <!-- Trading Identity -->
          <div class="card">
            <h3 class="card-title">Trading Identity</h3>
            <div class="form-grid">
              <div class="fg">
                <label>Experience Level</label>
                <select [(ngModel)]="form.experienceLevel" class="fi">
                  <option value="">Select level</option>
                  <option value="BEGINNER">Beginner (0–1 year)</option>
                  <option value="INTERMEDIATE">Intermediate (1–3 years)</option>
                  <option value="ADVANCED">Advanced (3–7 years)</option>
                  <option value="PROFESSIONAL">Professional (7+ years)</option>
                </select>
              </div>
              <div class="fg">
                <label>Primary Trading Style</label>
                <select [(ngModel)]="form.primaryStyle" class="fi">
                  <option value="">Select style</option>
                  <option value="INTRADAY">Intraday</option>
                  <option value="SWING">Swing</option>
                  <option value="POSITIONAL">Positional</option>
                  <option value="ALL">All (Mixed)</option>
                </select>
              </div>
              <div class="fg">
                <label>Primary Broker / Platform</label>
                <select [(ngModel)]="form.primaryBroker" class="fi">
                  <option value="">Select broker</option>
                  <option *ngFor="let b of brokers" [value]="b">{{ b }}</option>
                </select>
              </div>
              <div class="fg">
                <label>Avg Trades per Month</label>
                <input
                  type="number"
                  [(ngModel)]="form.avgTradesPerMonth"
                  class="fi"
                  placeholder="20"
                />
              </div>
            </div>

            <div class="fg full-width" style="margin-top:16px">
              <label
                >Markets Traded
                <span class="hint">Select all that apply</span></label
              >
              <div class="chip-grid">
                <button
                  *ngFor="let m of marketOptions"
                  type="button"
                  class="chip-btn"
                  [class.active]="form.marketsTraded.includes(m)"
                  (click)="toggleList(form.marketsTraded, m)"
                >
                  {{ m }}
                </button>
              </div>
            </div>

            <div class="fg full-width" style="margin-top:16px">
              <label>All Platforms / Brokers Used</label>
              <div class="chip-grid">
                <button
                  *ngFor="let p of brokers"
                  type="button"
                  class="chip-btn"
                  [class.active]="form.platformsUsed.includes(p)"
                  (click)="toggleList(form.platformsUsed, p)"
                >
                  {{ p }}
                </button>
              </div>
            </div>
          </div>

          <!-- Capital & Risk -->
          <div class="card">
            <h3 class="card-title">Capital & Risk Profile</h3>
            <p class="card-desc">
              This data helps personalise your analytics and risk alerts.
            </p>
            <div class="form-grid">
              <div class="fg">
                <label>Trading Capital (₹)</label>
                <input
                  type="number"
                  [(ngModel)]="form.tradingCapital"
                  class="fi"
                  placeholder="500000"
                />
              </div>
              <div class="fg">
                <label
                  >Risk per Trade (%)
                  <span class="hint">Recommended: 0.5–2%</span></label
                >
                <input
                  type="number"
                  [(ngModel)]="form.riskPerTradePercent"
                  class="fi"
                  placeholder="1.0"
                  step="0.1"
                />
              </div>
              <div class="fg">
                <label
                  >Max Drawdown Tolerance (%)
                  <span class="hint">Stop trading limit</span></label
                >
                <input
                  type="number"
                  [(ngModel)]="form.maxDrawdownTolerance"
                  class="fi"
                  placeholder="10"
                  step="0.5"
                />
              </div>
              <div class="fg">
                <label>Monthly Return Target (%)</label>
                <input
                  type="number"
                  [(ngModel)]="form.targetMonthlyReturnPct"
                  class="fi"
                  placeholder="5"
                  step="0.5"
                />
              </div>
            </div>

            <div class="risk-meter" *ngIf="form.riskPerTradePercent">
              <span class="risk-label">Risk Profile:</span>
              <div class="risk-bar-track">
                <div
                  class="risk-bar-fill"
                  [style.width.%]="Math.min(100, form.riskPerTradePercent * 20)"
                  [ngClass]="
                    form.riskPerTradePercent <= 1
                      ? 'safe'
                      : form.riskPerTradePercent <= 2
                        ? 'moderate'
                        : 'aggressive'
                  "
                ></div>
              </div>
              <span
                class="risk-tag"
                [ngClass]="
                  form.riskPerTradePercent <= 1
                    ? 'tag-safe'
                    : form.riskPerTradePercent <= 2
                      ? 'tag-moderate'
                      : 'tag-aggressive'
                "
              >
                {{
                  form.riskPerTradePercent <= 1
                    ? "Conservative"
                    : form.riskPerTradePercent <= 2
                      ? "Moderate"
                      : "Aggressive"
                }}
              </span>
            </div>
          </div>

          <!-- Goals & Self-Assessment -->
          <div class="card">
            <h3 class="card-title">Goals & Self-Assessment</h3>
            <p class="card-desc">
              This helps MarketSaga give you better personalised insights.
            </p>
            <div class="form-grid">
              <div class="fg full-width">
                <label>Primary Trading Goal</label>
                <div class="chip-grid">
                  <button
                    *ngFor="let g of goalOptions"
                    type="button"
                    class="chip-btn goal-chip"
                    [class.active]="form.tradingGoal === g"
                    (click)="form.tradingGoal = g"
                  >
                    {{ g }}
                  </button>
                </div>
              </div>
              <div class="fg full-width">
                <label>Your Biggest Trading Weakness</label>
                <div class="chip-grid">
                  <button
                    *ngFor="let w of weaknessOptions"
                    type="button"
                    class="chip-btn"
                    [class.active]="form.biggestWeakness === w"
                    (click)="form.biggestWeakness = w"
                  >
                    {{ w }}
                  </button>
                </div>
              </div>
              <div class="fg full-width">
                <label>What do you most want to improve?</label>
                <textarea
                  [(ngModel)]="form.whyImproving"
                  rows="2"
                  class="fi fta"
                  placeholder="e.g. I keep overtrading after losses and want to build better discipline..."
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Save -->
          <div class="save-row">
            <div class="save-error" *ngIf="saveError()">{{ saveError() }}</div>
            <button class="btn-save" (click)="save()" [disabled]="saving()">
              {{ saving() ? "Saving..." : "Save Profile" }}
            </button>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="!profile()">Loading profile...</div>

      <!-- Toast -->
      <div
        class="toast"
        *ngIf="toastVisible()"
        [ngClass]="'toast-' + toastType()"
      >
        <span>{{ toastType() === "success" ? "✓" : "✗" }}</span>
        <span class="toast-msg">{{ toastMessage() }}</span>
        <button (click)="toastVisible.set(false)" class="toast-close">✕</button>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 32px;
        max-width: 1300px;
        position: relative;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 28px;
        flex-wrap: wrap;
        gap: 12px;
      }
      .page-title {
        font-size: 26px;
        font-weight: 700;
        color: #e2e8f0;
        margin: 0 0 4px;
      }
      .page-subtitle {
        font-size: 14px;
        color: #64748b;
        margin: 0;
      }
      .header-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .plan-badge {
        font-size: 11px;
        font-weight: 800;
        padding: 4px 12px;
        border-radius: 20px;
        letter-spacing: 1px;
      }
      .plan-free {
        background: rgba(100, 116, 139, 0.15);
        color: #94a3b8;
        border: 1px solid #334155;
      }
      .plan-pro {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
        border: 1px solid rgba(59, 130, 246, 0.4);
      }
      .plan-enterprise {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.4);
      }
      .member-since {
        font-size: 12px;
        color: #475569;
      }

      .profile-layout {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 20px;
        align-items: start;
      }
      .sidebar {
        display: flex;
        flex-direction: column;
        gap: 16px;
        position: sticky;
        top: 24px;
      }
      .main-col {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .card {
        background: #0d1117;
        border: 1px solid #1e2433;
        border-radius: 12px;
        padding: 22px;
      }
      .card-title {
        font-size: 12px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin: 0 0 16px;
      }
      .card-desc {
        font-size: 13px;
        color: #475569;
        margin: -8px 0 16px;
      }

      .avatar-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        padding: 28px 22px;
      }
      .avatar-wrap {
        position: relative;
        width: 88px;
        height: 88px;
        border-radius: 50%;
        cursor: pointer;
        overflow: hidden;
      }
      .avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
      }
      .avatar-initials {
        width: 88px;
        height: 88px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        font-weight: 800;
        color: #fff;
      }
      .avatar-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: #fff;
        opacity: 0;
        transition: opacity 0.15s;
        border-radius: 50%;
      }
      .avatar-wrap:hover .avatar-overlay {
        opacity: 1;
      }
      .avatar-info {
        text-align: center;
      }
      .avatar-name {
        font-size: 16px;
        font-weight: 700;
        color: #e2e8f0;
        margin: 0 0 4px;
      }
      .avatar-email {
        font-size: 12px;
        color: #64748b;
        margin: 0 0 8px;
      }
      .role-badge {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 9px;
        border-radius: 12px;
        background: rgba(59, 130, 246, 0.12);
        color: #3b82f6;
        border: 1px solid rgba(59, 130, 246, 0.3);
      }
      .quick-stats {
        width: 100%;
        border-top: 1px solid #1e2433;
        padding-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .qs-item {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
      }
      .qs-l {
        color: #475569;
      }
      .qs-v {
        color: #94a3b8;
        font-weight: 600;
      }

      .settings-card {
      }
      .toggle-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #111827;
      }
      .toggle-row:last-of-type {
        border-bottom: none;
      }
      .toggle-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .toggle-label {
        font-size: 13px;
        color: #94a3b8;
        font-weight: 600;
      }
      .toggle-desc {
        font-size: 11px;
        color: #475569;
      }
      .toggle-saving {
        font-size: 11px;
        color: #3b82f6;
        text-align: right;
        padding-top: 8px;
      }

      .switch {
        position: relative;
        width: 40px;
        height: 22px;
        flex-shrink: 0;
      }
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .slider {
        position: absolute;
        inset: 0;
        background: #1e2433;
        border-radius: 22px;
        transition: background 0.2s;
        cursor: pointer;
      }
      .slider:before {
        content: "";
        position: absolute;
        width: 16px;
        height: 16px;
        left: 3px;
        top: 3px;
        background: #fff;
        border-radius: 50%;
        transition: transform 0.2s;
      }
      .switch input:checked + .slider {
        background: #3b82f6;
      }
      .switch input:checked + .slider:before {
        transform: translateX(18px);
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .fg {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .full-width {
        grid-column: 1/-1;
      }
      label {
        font-size: 11px;
        font-weight: 600;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .hint {
        font-size: 10px;
        color: #334155;
        text-transform: none;
        font-weight: 400;
        letter-spacing: 0;
      }
      .fi {
        background: #0a0e1a;
        border: 1px solid #1e2433;
        border-radius: 8px;
        color: #e2e8f0;
        padding: 9px 12px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.15s;
        width: 100%;
        box-sizing: border-box;
      }
      .fi:focus {
        border-color: #3b82f6;
      }
      .fi:disabled {
        color: #334155;
        cursor: not-allowed;
      }
      .fi::placeholder {
        color: #334155;
      }
      .fta {
        resize: vertical;
        min-height: 64px;
        font-family: inherit;
        line-height: 1.5;
      }

      .chip-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 4px;
      }
      .chip-btn {
        padding: 6px 14px;
        border-radius: 20px;
        border: 1px solid #1e2433;
        background: #0a0e1a;
        color: #64748b;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
      }
      .chip-btn:hover {
        border-color: #3b82f6;
        color: #3b82f6;
      }
      .chip-btn.active {
        background: rgba(59, 130, 246, 0.1);
        border-color: #3b82f6;
        color: #3b82f6;
      }
      .goal-chip.active {
        background: rgba(139, 92, 246, 0.1);
        border-color: #8b5cf6;
        color: #a78bfa;
      }

      .risk-meter {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 16px;
        padding: 12px 14px;
        background: #0a0e1a;
        border-radius: 8px;
        border: 1px solid #1e2433;
      }
      .risk-label {
        font-size: 12px;
        color: #475569;
        white-space: nowrap;
      }
      .risk-bar-track {
        flex: 1;
        height: 6px;
        background: #1e2433;
        border-radius: 3px;
        overflow: hidden;
      }
      .risk-bar-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.4s;
      }
      .risk-bar-fill.safe {
        background: #22c55e;
      }
      .risk-bar-fill.moderate {
        background: #f59e0b;
      }
      .risk-bar-fill.aggressive {
        background: #ef4444;
      }
      .risk-tag {
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 10px;
        white-space: nowrap;
      }
      .tag-safe {
        color: #22c55e;
        background: rgba(34, 197, 94, 0.1);
      }
      .tag-moderate {
        color: #f59e0b;
        background: rgba(245, 158, 11, 0.1);
      }
      .tag-aggressive {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
      }

      .save-row {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 16px;
      }
      .save-error {
        font-size: 13px;
        color: #ef4444;
      }
      .btn-save {
        background: #3b82f6;
        color: #fff;
        padding: 12px 32px;
        border-radius: 10px;
        border: none;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s;
        box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
      }
      .btn-save:hover:not(:disabled) {
        background: #2563eb;
        transform: translateY(-1px);
      }
      .btn-save:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      .loading {
        text-align: center;
        padding: 80px;
        color: #64748b;
      }

      .toast {
        position: fixed;
        bottom: 32px;
        right: 32px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        z-index: 9999;
        animation: slide-up 0.25s ease;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      }
      @keyframes slide-up {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .toast-success {
        background: rgba(34, 197, 94, 0.12);
        border: 1px solid rgba(34, 197, 94, 0.4);
        color: #22c55e;
      }
      .toast-error {
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.4);
        color: #ef4444;
      }
      .toast-msg {
        flex: 1;
      }
      .toast-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 14px;
        opacity: 0.6;
      }
      .toast-close:hover {
        opacity: 1;
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  profile = signal<UserProfile | null>(null);
  avatarPreview = signal<string | null>(null);
  saving = signal(false);
  toggleSaving = signal(false);
  saveError = signal("");
  toastMessage = signal("");
  toastType = signal<"success" | "error">("success");
  toastVisible = signal(false);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private avatarChanged = false;
  readonly Math = Math;

  form = {
    fullName: "",
    displayName: "",
    phone: "",
    city: "",
    country: "",
    avatarBase64: "",
    experienceLevel: "",
    primaryStyle: "",
    primaryBroker: "",
    marketsTraded: [] as string[],
    platformsUsed: [] as string[],
    avgTradesPerMonth: null as number | null,
    tradingCapital: null as number | null,
    riskPerTradePercent: null as number | null,
    maxDrawdownTolerance: null as number | null,
    targetMonthlyReturnPct: null as number | null,
    tradingGoal: "",
    biggestWeakness: "",
    whyImproving: "",
    strictMode: false,
    emailNotifications: false,
    weeklyReportEmail: false,
  };

  readonly marketOptions = [
    "Equity",
    "F&O Futures",
    "F&O Options",
    "Crypto",
    "Commodity",
    "Forex",
    "Index",
  ];
  readonly brokers = [
    "Zerodha",
    "Upstox",
    "Angel One",
    "Groww",
    "ICICI Direct",
    "HDFC Securities",
    "Kotak Securities",
    "Motilal Oswal",
    "Sharekhan",
    "5paisa",
    "Delta Exchange",
    "CoinDCX",
    "WazirX",
    "Other",
  ];
  readonly goalOptions = [
    "Full-time Trading Income",
    "Supplement Salary",
    "Retirement Planning",
    "Build Capital",
    "Learn & Improve",
    "Side Business",
  ];
  readonly weaknessOptions = [
    "FOMO Entries",
    "Early Exits",
    "Revenge Trading",
    "Overtrading",
    "Moving Stop Loss",
    "No Trading Plan",
    "Poor Risk Management",
    "Emotional Decisions",
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.http.get<UserProfile>(`${environment.apiUrl}/profile`).subscribe({
      next: (p) => {
        this.profile.set(p);
        this.populateForm(p);
        if (p.avatarBase64) this.avatarPreview.set(p.avatarBase64);
      },
      error: () => this.showToast("Failed to load profile.", "error"),
    });
  }

  private populateForm(p: UserProfile) {
    this.form.fullName = p.fullName || "";
    this.form.displayName = p.displayName || "";
    this.form.phone = p.phone || "";
    this.form.city = p.city || "";
    this.form.country = p.country || "";
    this.form.experienceLevel = p.experienceLevel || "";
    this.form.primaryStyle = p.primaryStyle || "";
    this.form.primaryBroker = p.primaryBroker || "";
    this.form.marketsTraded = p.marketsTraded || [];
    this.form.platformsUsed = p.platformsUsed || [];
    this.form.avgTradesPerMonth = p.avgTradesPerMonth || null;
    this.form.tradingCapital = p.tradingCapital || null;
    this.form.riskPerTradePercent = p.riskPerTradePercent || null;
    this.form.maxDrawdownTolerance = p.maxDrawdownTolerance || null;
    this.form.targetMonthlyReturnPct = p.targetMonthlyReturnPct || null;
    this.form.tradingGoal = p.tradingGoal || "";
    this.form.biggestWeakness = p.biggestWeakness || "";
    this.form.whyImproving = p.whyImproving || "";
    this.form.strictMode = p.strictMode === true;
    this.form.emailNotifications = p.emailNotifications === true;
    this.form.weeklyReportEmail = p.weeklyReportEmail === true;

    // ── Restore avatar preview from backend data ──────────────────────
    this.form.avatarBase64 = ""; // always blank in form payload unless user picks new image
    if (p.avatarBase64 && p.avatarBase64.length > 0) {
      this.avatarPreview.set(p.avatarBase64); // ← show existing avatar on load
    }
  }

  // ── Toggle auto-save — fires immediately, no Save button needed ───────────
  onToggleChange(
    field: "strictMode" | "emailNotifications" | "weeklyReportEmail",
    event: Event,
  ) {
    const checked = (event.target as HTMLInputElement).checked;
    this.form[field] = checked;

    // ── INSTANT UI UPDATE — no page refresh needed ─────────────────
    this.authService.updateLocalUser({ [field]: checked });

    this.toggleSaving.set(true);

    this.http
      .put<any>(`${environment.apiUrl}/profile`, { [field]: checked })
      .subscribe({
        next: (updated) => {
          this.profile.set(updated);
          this.form.strictMode = updated.strictMode === true;
          this.form.emailNotifications = updated.emailNotifications === true;
          this.form.weeklyReportEmail = updated.weeklyReportEmail === true;
          // Sync auth signal with confirmed backend values
          this.authService.updateLocalUser({
            strictMode: updated.strictMode === true,
            emailNotifications: updated.emailNotifications === true,
            weeklyReportEmail: updated.weeklyReportEmail === true,
          });
          this.toggleSaving.set(false);
          this.showToast(
            field === "strictMode"
              ? checked
                ? "Strict Mode ON"
                : "Strict Mode OFF"
              : field === "emailNotifications"
                ? checked
                  ? "Email alerts enabled"
                  : "Email alerts disabled"
                : checked
                  ? "Weekly report enabled"
                  : "Weekly report disabled",
            "success",
          );
        },
        error: () => {
          // Revert both form and auth signal
          this.form[field] = !checked;
          this.authService.updateLocalUser({ [field]: !checked });
          this.toggleSaving.set(false);
          this.showToast("Failed to save setting. Try again.", "error");
        },
      });
  }

  // ── Save full profile ─────────────────────────────────────────────────────
  save() {
    if (this.saving()) return;
    this.saving.set(true);
    this.saveError.set("");

    // ── Only send avatarBase64 if user explicitly picked a new image ──────────
    // This prevents "" from overwriting a valid saved avatar in the DB
    const { avatarBase64, ...restOfForm } = this.form;
    const payload = this.avatarChanged
      ? { ...this.form } // include new avatar
      : { ...restOfForm }; // exclude — backend keeps existing DB value

    this.http.put<any>(`${environment.apiUrl}/profile`, payload).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.populateForm(updated);
        this.saving.set(false);
        this.avatarChanged = false; // ← reset flag after save

        // Preserve avatar in auth signal — if backend echoes it use that,
        // otherwise keep what's already in localStorage (current session value)
        const existingAvatar = (this.authService.currentUser() as any)
          ?.avatarBase64;
        this.authService.updateLocalUser({
          displayName: updated.displayName || updated.fullName || updated.email,
          fullName: updated.fullName,
          avatarBase64:
            updated.avatarBase64 && updated.avatarBase64.length > 0
              ? updated.avatarBase64 // fresh from backend
              : existingAvatar || undefined, // keep current
          planType: updated.planType,
          strictMode: updated.strictMode === true,
          emailNotifications: updated.emailNotifications === true,
          weeklyReportEmail: updated.weeklyReportEmail === true,
        });

        this.showToast("Profile saved successfully ✓", "success");
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message || "Failed to save. Please try again.";
        this.saveError.set(msg);
        this.showToast(msg, "error");
      },
    });
  }

  // ── Avatar ────────────────────────────────────────────────────────────────
  triggerAvatarUpload() {
    (document.querySelector('input[type="file"]') as HTMLInputElement)?.click();
  }

  onAvatarSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024) {
      this.showToast("Avatar must be under 200KB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      this.avatarPreview.set(base64);
      this.form.avatarBase64 = base64;
      this.avatarChanged = true; // ← mark as changed
      this.authService.updateLocalUser({ avatarBase64: base64 }); // instant sidebar update
    };
    reader.readAsDataURL(file);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  toggleList(list: string[], item: string) {
    const idx = list.indexOf(item);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(item);
  }

  initials(): string {
    const name = this.profile()?.fullName || this.profile()?.email || "U";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  expLabel(level: string): string {
    return (
      (
        {
          BEGINNER: "< 1 year",
          INTERMEDIATE: "1–3 yrs",
          ADVANCED: "3–7 yrs",
          PROFESSIONAL: "7+ yrs",
        } as any
      )[level] || "—"
    );
  }

  formatNum(n: number): string {
    if (n >= 1_00_00_000) return (n / 1_00_00_000).toFixed(1) + "Cr";
    if (n >= 1_00_000) return (n / 1_00_000).toFixed(1) + "L";
    if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
    return n.toString();
  }

  private showToast(message: string, type: "success" | "error") {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);
    this.toastTimer = setTimeout(() => this.toastVisible.set(false), 3500);
  }
}
