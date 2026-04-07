// src/app/features/analytics/analytics.component.ts
import { Component, OnInit, signal } from "@angular/core";
import { CommonModule, DecimalPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TradeService } from "../../core/services/trade.service";
import { Analytics } from "../../shared/models/analytics.model";

@Component({
  selector: "app-analytics",
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Analytics & Pattern Detection</h1>
          <p class="page-subtitle">
            Data-driven insights into your trading behavior
          </p>
        </div>
        <div class="date-range">
          <input type="date" [(ngModel)]="dateFrom" class="date-input" />
          <span class="date-sep">to</span>
          <input type="date" [(ngModel)]="dateTo" class="date-input" />
          <button (click)="loadCustom()" class="btn-primary">Apply</button>
          <button (click)="loadAll()" class="btn-ghost">All Time</button>
        </div>
      </div>

      <ng-container *ngIf="analytics()">
        <!-- Discipline Banner -->
        <div
          class="discipline-banner"
          [ngClass]="'grade-' + analytics()!.disciplineGrade"
        >
          <div class="discipline-left">
            <span class="grade-label">Discipline Grade</span>
            <span class="grade-value">{{ analytics()!.disciplineGrade }}</span>
          </div>
          <div class="discipline-right">
            <div class="discipline-bar">
              <div
                class="discipline-fill"
                [style.width.%]="analytics()!.disciplineRating"
              ></div>
            </div>
            <span class="discipline-pct"
              >{{ analytics()!.disciplineRating }}/100</span
            >
          </div>
          <div
            class="discipline-breaks"
            *ngIf="analytics()!.disciplineBreaks?.length"
          >
            <span class="breaks-label">Discipline Breaks:</span>
            <span
              *ngFor="let b of analytics()!.disciplineBreaks.slice(0, 3)"
              class="break-item"
              >{{ b }}</span
            >
          </div>
        </div>

        <!-- Summary Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="sl">Trades</span
            ><span class="sv">{{ analytics()!.totalTrades }}</span>
          </div>
          <div class="stat-card">
            <span class="sl">Win Rate</span
            ><span class="sv" [class.pos]="analytics()!.winRate >= 50"
              >{{ analytics()!.winRate | number: "1.1-1" }}%</span
            >
          </div>
          <div class="stat-card">
            <span class="sl">Total P&L</span
            ><span
              class="sv"
              [class.pos]="analytics()!.totalPnl >= 0"
              [class.neg]="analytics()!.totalPnl < 0"
              >₹{{ analytics()!.totalPnl | number: "1.0-0" }}</span
            >
          </div>
          <div class="stat-card">
            <span class="sl">Profit Factor</span
            ><span class="sv" [class.pos]="analytics()!.profitFactor >= 1.5">{{
              analytics()!.profitFactor | number: "1.2-2"
            }}</span>
          </div>
          <div class="stat-card">
            <span class="sl">Expectancy</span
            ><span
              class="sv"
              [class.pos]="analytics()!.expectancy >= 0"
              [class.neg]="analytics()!.expectancy < 0"
              >₹{{ analytics()!.expectancy | number: "1.0-0" }}</span
            >
          </div>
          <div class="stat-card">
            <span class="sl">Max Drawdown</span
            ><span class="sv neg"
              >₹{{ analytics()!.maxDrawdown | number: "1.0-0" }}</span
            >
          </div>
          <div class="stat-card">
            <span class="sl">Avg Win</span
            ><span class="sv pos"
              >₹{{ analytics()!.avgProfitPerWin | number: "1.0-0" }}</span
            >
          </div>
          <div class="stat-card">
            <span class="sl">Avg Loss</span
            ><span class="sv neg"
              >₹{{ analytics()!.avgLossPerLoss | number: "1.0-0" }}</span
            >
          </div>
          <div class="stat-card">
            <span class="sl">Best Trade</span
            ><span class="sv pos"
              >₹{{ analytics()!.bestTrade | number: "1.0-0" }}</span
            >
          </div>
          <div class="stat-card">
            <span class="sl">Worst Trade</span
            ><span class="sv neg"
              >₹{{ analytics()!.worstTrade | number: "1.0-0" }}</span
            >
          </div>
          <div class="stat-card">
            <span class="sl">Max Consec. Wins</span
            ><span class="sv pos">{{ analytics()!.maxConsecutiveWins }}</span>
          </div>
          <div class="stat-card">
            <span class="sl">Max Consec. Losses</span
            ><span class="sv neg">{{ analytics()!.maxConsecutiveLosses }}</span>
          </div>
        </div>

        <div class="analysis-grid">
          <!-- Setup Performance -->
          <div class="card" *ngIf="setupKeys().length">
            <h3 class="card-title">Setup Performance</h3>
            <div class="perf-table">
              <div class="perf-header">
                <span>Setup</span><span>Trades</span><span>Win %</span
                ><span>Avg P&L</span><span>Total P&L</span>
              </div>
              <div *ngFor="let key of setupKeys()" class="perf-row">
                <span class="setup-name">{{ key }}</span>
                <span>{{ analytics()!.setupPerformance[key].count }}</span>
                <span
                  [class.pos]="analytics()!.setupPerformance[key].winRate >= 50"
                  [class.neg]="analytics()!.setupPerformance[key].winRate < 50"
                >
                  {{
                    analytics()!.setupPerformance[key].winRate
                      | number: "1.1-1"
                  }}%
                </span>
                <span
                  [class.pos]="analytics()!.setupPerformance[key].avgPnl >= 0"
                  [class.neg]="analytics()!.setupPerformance[key].avgPnl < 0"
                >
                  ₹{{
                    analytics()!.setupPerformance[key].avgPnl | number: "1.0-0"
                  }}
                </span>
                <span
                  [class.pos]="analytics()!.setupPerformance[key].totalPnl >= 0"
                  [class.neg]="analytics()!.setupPerformance[key].totalPnl < 0"
                >
                  ₹{{
                    analytics()!.setupPerformance[key].totalPnl
                      | number: "1.0-0"
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- Emotion Performance -->
          <div class="card" *ngIf="emotionKeys().length">
            <h3 class="card-title">Emotion vs Performance</h3>
            <div class="perf-table">
              <div class="perf-header">
                <span>State</span><span>Trades</span><span>Win %</span
                ><span>Avg P&L</span>
              </div>
              <div
                *ngFor="let key of emotionKeys()"
                class="perf-row emotion-row"
              >
                <span class="emotion-name" [ngClass]="key.toLowerCase()">{{
                  key
                }}</span>
                <span>{{ analytics()!.emotionPerformance[key].count }}</span>
                <span
                  [class.pos]="
                    analytics()!.emotionPerformance[key].winRate >= 50
                  "
                  [class.neg]="
                    analytics()!.emotionPerformance[key].winRate < 50
                  "
                >
                  {{
                    analytics()!.emotionPerformance[key].winRate
                      | number: "1.1-1"
                  }}%
                </span>
                <span
                  [class.pos]="analytics()!.emotionPerformance[key].avgPnl >= 0"
                  [class.neg]="analytics()!.emotionPerformance[key].avgPnl < 0"
                >
                  ₹{{
                    analytics()!.emotionPerformance[key].avgPnl
                      | number: "1.0-0"
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- Time of Day Performance -->
          <div class="card" *ngIf="timeKeys().length">
            <h3 class="card-title">Time of Day Performance</h3>
            <div class="perf-table">
              <div class="perf-header">
                <span>Period</span><span>Trades</span><span>Win %</span
                ><span>Avg P&L</span>
              </div>
              <div *ngFor="let key of timeKeys()" class="perf-row emotion-row">
                <span>{{ formatPeriod(key) }}</span>
                <span>{{ analytics()!.timePerformance[key].count }}</span>
                <span
                  [class.pos]="analytics()!.timePerformance[key].winRate >= 50"
                >
                  {{
                    analytics()!.timePerformance[key].winRate | number: "1.1-1"
                  }}%
                </span>
                <span
                  [class.pos]="analytics()!.timePerformance[key].avgPnl >= 0"
                  [class.neg]="analytics()!.timePerformance[key].avgPnl < 0"
                >
                  ₹{{
                    analytics()!.timePerformance[key].avgPnl | number: "1.0-0"
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- Instrument Performance -->
          <div class="card" *ngIf="instrKeys().length">
            <h3 class="card-title">Instrument Performance</h3>
            <div class="perf-table">
              <div class="perf-header">
                <span>Instrument</span><span>Trades</span><span>Win %</span
                ><span>Total P&L</span>
              </div>
              <div *ngFor="let key of instrKeys()" class="perf-row instr-row">
                <span class="instr-name">{{ key }}</span>
                <span>{{ analytics()!.instrumentPerformance[key].count }}</span>
                <span
                  [class.pos]="
                    analytics()!.instrumentPerformance[key].winRate >= 50
                  "
                >
                  {{
                    analytics()!.instrumentPerformance[key].winRate
                      | number: "1.1-1"
                  }}%
                </span>
                <span
                  [class.pos]="
                    analytics()!.instrumentPerformance[key].totalPnl >= 0
                  "
                  [class.neg]="
                    analytics()!.instrumentPerformance[key].totalPnl < 0
                  "
                >
                  ₹{{
                    analytics()!.instrumentPerformance[key].totalPnl
                      | number: "1.0-0"
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- ─── Time Frame Performance (NEW) ─── -->
          <div class="card tf-card" *ngIf="timeFrameUsageEntries().length">
            <h3 class="card-title">Time Frame Usage & Performance</h3>

            <!-- Bar chart of usage -->
            <div class="tf-usage-bars">
              <div
                class="tf-bar-row"
                *ngFor="let item of timeFrameUsageEntries()"
              >
                <span class="tf-bar-label" [ngClass]="tfColorClass(item.tf)">{{
                  item.tf
                }}</span>
                <div class="tf-bar-track">
                  <div
                    class="tf-bar-fill"
                    [ngClass]="tfColorClass(item.tf)"
                    [style.width.%]="(item.count / maxTfUsage()) * 100"
                  ></div>
                </div>
                <span class="tf-bar-count"
                  >{{ item.count }} trade{{ item.count !== 1 ? "s" : "" }}</span
                >
              </div>
            </div>

            <!-- Performance table -->
            <div
              class="tf-perf"
              *ngIf="analytics()!.timeFramePerformance?.length"
            >
              <div class="perf-header">
                <span>Time Frame</span><span>Trades</span><span>Win %</span
                ><span>Avg P&L</span><span>Total P&L</span>
              </div>
              <div
                *ngFor="let t of analytics()!.timeFramePerformance"
                class="perf-row"
              >
                <span>
                  <span class="tf-pill" [ngClass]="tfColorClass(t.timeFrame)">{{
                    t.timeFrame
                  }}</span>
                </span>
                <span>{{ t.trades }}</span>
                <span
                  [class.pos]="t.winRate >= 50"
                  [class.neg]="t.winRate < 50"
                >
                  {{ t.winRate | number: "1.1-1" }}%
                </span>
                <span [class.pos]="t.avgPnl >= 0" [class.neg]="t.avgPnl < 0">
                  ₹{{ t.avgPnl | number: "1.0-0" }}
                </span>
                <span
                  [class.pos]="t.totalPnl >= 0"
                  [class.neg]="t.totalPnl < 0"
                >
                  ₹{{ t.totalPnl | number: "1.0-0" }}
                </span>
              </div>
            </div>
          </div>

          <!-- Monthly P&L -->
          <div class="card monthly-card" *ngIf="monthlyKeys().length">
            <h3 class="card-title">Monthly P&L</h3>
            <div class="monthly-bars">
              <div *ngFor="let m of monthlyKeys()" class="monthly-row">
                <span class="month-label">{{ m }}</span>
                <div class="bar-track">
                  <div
                    class="bar"
                    [style.width.%]="barWidth(analytics()!.monthlyPnl[m])"
                    [class.pos-bar]="analytics()!.monthlyPnl[m] >= 0"
                    [class.neg-bar]="analytics()!.monthlyPnl[m] < 0"
                  ></div>
                </div>
                <span
                  class="month-val"
                  [class.pos]="analytics()!.monthlyPnl[m] >= 0"
                  [class.neg]="analytics()!.monthlyPnl[m] < 0"
                >
                  ₹{{ analytics()!.monthlyPnl[m] | number: "1.0-0" }}
                </span>
              </div>
            </div>
          </div>

          <!-- Pattern Detection -->
          <div
            class="card pattern-card"
            *ngIf="
              analytics()!.recommendations?.length ||
              analytics()!.repeatingMistakes?.length
            "
          >
            <h3 class="card-title">Pattern Detection & Recommendations</h3>
            <div
              *ngFor="let r of analytics()!.recommendations"
              class="pattern-item warning"
            >
              {{ r }}
            </div>
            <div
              *ngFor="let m of analytics()!.repeatingMistakes"
              class="pattern-item danger"
            >
              {{ m }}
            </div>
            <div
              *ngFor="let s of analytics()!.bestSetups"
              class="pattern-item success"
            >
              ✓ {{ s }}
            </div>
            <div
              *ngFor="let b of analytics()!.worstBehaviors"
              class="pattern-item danger"
            >
              ✗ {{ b }}
            </div>
          </div>
        </div>
      </ng-container>

      <div class="loading" *ngIf="loading()">Loading analytics...</div>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 32px;
        max-width: 1400px;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;
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

      .date-range {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .date-input {
        background: #0d1117;
        border: 1px solid #1e2433;
        border-radius: 8px;
        color: #94a3b8;
        padding: 8px 12px;
        font-size: 13px;
        outline: none;
        color-scheme: dark;
      }
      .date-sep {
        color: #475569;
        font-size: 13px;
      }
      .btn-primary {
        background: #3b82f6;
        color: #fff;
        padding: 9px 18px;
        border-radius: 8px;
        border: none;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-ghost {
        background: none;
        border: 1px solid #1e2433;
        color: #64748b;
        padding: 9px 18px;
        border-radius: 8px;
        font-size: 13px;
        cursor: pointer;
      }

      /* ─── Discipline Banner ─────────────────────────── */
      .discipline-banner {
        border-radius: 12px;
        padding: 20px 24px;
        margin-bottom: 24px;
        display: flex;
        align-items: center;
        gap: 32px;
        flex-wrap: wrap;
      }
      .grade-A {
        background: rgba(34, 197, 94, 0.08);
        border: 1px solid rgba(34, 197, 94, 0.25);
      }
      .grade-B {
        background: rgba(34, 197, 94, 0.05);
        border: 1px solid rgba(34, 197, 94, 0.2);
      }
      .grade-C {
        background: rgba(245, 158, 11, 0.06);
        border: 1px solid rgba(245, 158, 11, 0.2);
      }
      .grade-D {
        background: rgba(239, 68, 68, 0.06);
        border: 1px solid rgba(239, 68, 68, 0.2);
      }
      .grade-F {
        background: rgba(239, 68, 68, 0.06);
        border: 1px solid rgba(239, 68, 68, 0.2);
      }

      .discipline-left {
        display: flex;
        flex-direction: column;
      }
      .grade-label {
        font-size: 11px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }
      .grade-value {
        font-size: 48px;
        font-weight: 900;
        color: #22c55e;
        line-height: 1;
      }
      .discipline-right {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }
      .discipline-bar {
        flex: 1;
        height: 8px;
        background: #1e2433;
        border-radius: 4px;
        overflow: hidden;
      }
      .discipline-fill {
        height: 100%;
        background: linear-gradient(90deg, #22c55e, #3b82f6);
        border-radius: 4px;
        transition: width 0.5s;
      }
      .discipline-pct {
        font-size: 14px;
        color: #94a3b8;
        font-weight: 600;
        white-space: nowrap;
      }
      .discipline-breaks {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .breaks-label {
        font-size: 11px;
        color: #ef4444;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .break-item {
        font-size: 11px;
        color: #94a3b8;
        background: #111827;
        padding: 2px 8px;
        border-radius: 4px;
      }

      /* ─── Stats Grid ────────────────────────────────── */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 12px;
        margin-bottom: 24px;
      }
      .stat-card {
        background: #0d1117;
        border: 1px solid #1e2433;
        border-radius: 10px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .sl {
        font-size: 11px;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .sv {
        font-size: 22px;
        font-weight: 700;
        color: #e2e8f0;
      }
      .sv.pos {
        color: #22c55e;
      }
      .sv.neg {
        color: #ef4444;
      }

      /* ─── Analysis Grid ─────────────────────────────── */
      .analysis-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      .monthly-card {
        grid-column: 1 / -1;
      }
      .pattern-card {
        grid-column: 1 / -1;
      }
      .tf-card {
        grid-column: 1 / -1;
      }

      .card {
        background: #0d1117;
        border: 1px solid #1e2433;
        border-radius: 12px;
        padding: 20px;
      }
      .card-title {
        font-size: 12px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin: 0 0 16px;
      }

      /* ─── Perf tables ───────────────────────────────── */
      .perf-table {
        font-size: 13px;
      }
      .perf-header {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
        gap: 8px;
        padding: 6px 0;
        border-bottom: 1px solid #1e2433;
        color: #475569;
        font-size: 11px;
        text-transform: uppercase;
      }
      .perf-row {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
        gap: 8px;
        padding: 10px 0;
        border-bottom: 1px solid #111827;
        color: #94a3b8;
        align-items: center;
      }
      .perf-row:last-child {
        border-bottom: none;
      }
      .emotion-row {
        grid-template-columns: 2fr 1fr 1fr 1fr;
      }
      .instr-row {
        grid-template-columns: 2fr 1fr 1fr 1fr;
      }

      .setup-name {
        font-weight: 600;
        color: #e2e8f0;
      }
      .instr-name {
        font-weight: 700;
        color: #e2e8f0;
      }
      .pos {
        color: #22c55e;
      }
      .neg {
        color: #ef4444;
      }

      .emotion-name {
        font-weight: 600;
      }
      .emotion-name.calm,
      .emotion-name.disciplined {
        color: #22c55e;
      }
      .emotion-name.fomo {
        color: #f59e0b;
      }
      .emotion-name.revenge {
        color: #ef4444;
      }
      .emotion-name.hesitation,
      .emotion-name.anxious {
        color: #94a3b8;
      }
      .emotion-name.overconfident {
        color: #fb923c;
      }

      /* ─── Time Frame section ────────────────────────── */
      .tf-usage-bars {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 20px;
      }
      .tf-bar-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .tf-bar-label {
        font-size: 12px;
        font-weight: 700;
        min-width: 52px;
      }
      .tf-bar-label.tf-short {
        color: #3b82f6;
      }
      .tf-bar-label.tf-medium {
        color: #a78bfa;
      }
      .tf-bar-label.tf-long {
        color: #2dd4bf;
      }
      .tf-bar-track {
        flex: 1;
        height: 8px;
        background: #1e2433;
        border-radius: 4px;
        overflow: hidden;
      }
      .tf-bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.4s ease;
      }
      .tf-bar-fill.tf-short {
        background: #3b82f6;
      }
      .tf-bar-fill.tf-medium {
        background: #8b5cf6;
      }
      .tf-bar-fill.tf-long {
        background: #14b8a6;
      }
      .tf-bar-count {
        font-size: 11px;
        color: #475569;
        min-width: 60px;
        text-align: right;
      }

      .tf-perf .perf-header {
        grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr;
      }
      .tf-perf .perf-row {
        grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr;
      }

      .tf-pill {
        font-size: 11px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 10px;
        border: 1px solid;
        display: inline-block;
      }
      .tf-pill.tf-short {
        background: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.4);
        color: #3b82f6;
      }
      .tf-pill.tf-medium {
        background: rgba(139, 92, 246, 0.1);
        border-color: rgba(139, 92, 246, 0.4);
        color: #a78bfa;
      }
      .tf-pill.tf-long {
        background: rgba(20, 184, 166, 0.1);
        border-color: rgba(20, 184, 166, 0.4);
        color: #2dd4bf;
      }

      /* ─── Monthly P&L ───────────────────────────────── */
      .monthly-bars {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .monthly-row {
        display: grid;
        grid-template-columns: 80px 1fr 100px;
        align-items: center;
        gap: 12px;
      }
      .month-label {
        font-size: 12px;
        color: #64748b;
        font-weight: 600;
      }
      .bar-track {
        height: 12px;
        background: #111827;
        border-radius: 6px;
        overflow: hidden;
      }
      .bar {
        height: 100%;
        border-radius: 6px;
        transition: width 0.5s;
      }
      .bar.pos-bar {
        background: #22c55e;
      }
      .bar.neg-bar {
        background: #ef4444;
      }
      .month-val {
        font-size: 13px;
        font-weight: 600;
        text-align: right;
      }
      .month-val.pos {
        color: #22c55e;
      }
      .month-val.neg {
        color: #ef4444;
      }

      /* ─── Patterns ──────────────────────────────────── */
      .pattern-item {
        font-size: 13px;
        padding: 10px 14px;
        border-radius: 8px;
        margin-bottom: 8px;
        line-height: 1.5;
      }
      .pattern-item.warning {
        background: rgba(245, 158, 11, 0.08);
        color: #fbbf24;
        border-left: 3px solid #f59e0b;
      }
      .pattern-item.danger {
        background: rgba(239, 68, 68, 0.08);
        color: #f87171;
        border-left: 3px solid #ef4444;
      }
      .pattern-item.success {
        background: rgba(34, 197, 94, 0.08);
        color: #4ade80;
        border-left: 3px solid #22c55e;
      }

      .loading {
        text-align: center;
        padding: 80px;
        color: #64748b;
      }
    `,
  ],
})
export class AnalyticsComponent implements OnInit {
  analytics = signal<Analytics | null>(null);
  loading = signal(false);
  dateFrom = "";
  dateTo = "";

  constructor(private tradeService: TradeService) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading.set(true);
    this.tradeService.getAnalytics().subscribe((a) => {
      this.analytics.set(a);
      this.loading.set(false);
    });
  }

  loadCustom() {
    if (!this.dateFrom || !this.dateTo) return;
    this.loading.set(true);
    this.tradeService
      .getAnalytics(this.dateFrom + "T00:00:00", this.dateTo + "T23:59:59")
      .subscribe((a) => {
        this.analytics.set(a);
        this.loading.set(false);
      });
  }

  // ─── Existing key helpers ──────────────────────────────────
  setupKeys(): string[] {
    return Object.keys(this.analytics()?.setupPerformance || {});
  }
  emotionKeys(): string[] {
    return Object.keys(this.analytics()?.emotionPerformance || {});
  }
  timeKeys(): string[] {
    return Object.keys(this.analytics()?.timePerformance || {});
  }
  instrKeys(): string[] {
    return Object.keys(this.analytics()?.instrumentPerformance || {});
  }
  monthlyKeys(): string[] {
    return Object.keys(this.analytics()?.monthlyPnl || {});
  }

  barWidth(val: number): number {
    const pnls = Object.values(this.analytics()?.monthlyPnl || {}) as number[];
    const maxAbs = Math.max(...pnls.map(Math.abs), 1);
    return Math.min(100, (Math.abs(val) / maxAbs) * 100);
  }

  formatPeriod(key: string): string {
    const map: Record<string, string> = {
      MORNING_9_11: "9 AM – 11 AM",
      MID_11_1: "11 AM – 1 PM",
      AFTERNOON_1_3: "1 PM – 3 PM",
      CLOSING_3_330: "3 PM – 3:30 PM",
    };
    return map[key] || key;
  }

  // ─── NEW: Time Frame helpers ───────────────────────────────
  timeFrameUsageEntries(): Array<{ tf: string; count: number }> {
    const usage = this.analytics()?.timeFrameUsage;
    if (!usage) return [];
    return Object.entries(usage)
      .map(([tf, count]) => ({ tf, count: count as number }))
      .sort((a, b) => b.count - a.count);
  }

  maxTfUsage(): number {
    const entries = this.timeFrameUsageEntries();
    return entries.length ? Math.max(...entries.map((e) => e.count)) : 1;
  }

  tfColorClass(tf: string): string {
    const short = ["1min", "3min", "5min", "10min", "15min"];
    const medium = ["30min", "45min", "90min", "1hr", "2hr"];
    if (short.includes(tf)) return "tf-short";
    if (medium.includes(tf)) return "tf-medium";
    return "tf-long";
  }
}
