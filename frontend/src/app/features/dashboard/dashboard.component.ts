// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TradeService } from '../../core/services/trade.service';
import { Analytics } from '../../shared/models/analytics.model';
import { Trade } from '../../shared/models/trade.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">{{ today | date:'EEEE, MMMM d, y' }}</p>
        </div>
        <div class="header-actions">
          <a routerLink="/trades/new" class="btn-primary">+ Log Trade</a>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid" *ngIf="analytics()">
        <div class="kpi-card">
          <span class="kpi-label">Total P&L</span>
          <span class="kpi-value"
                [class.positive]="analytics()!.totalPnl >= 0"
                [class.negative]="analytics()!.totalPnl < 0">
            {{ analytics()!.totalPnl >= 0 ? '+' : '' }}₹{{ analytics()!.totalPnl | number:'1.0-0' }}
          </span>
          <span class="kpi-sub">{{ analytics()!.totalTrades }} closed trades</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">Win Rate</span>
          <span class="kpi-value" [class.positive]="analytics()!.winRate >= 50">
            {{ analytics()!.winRate | number:'1.1-1' }}%
          </span>
          <span class="kpi-sub">{{ analytics()!.winningTrades }}W / {{ analytics()!.losingTrades }}L</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">Avg R:R</span>
          <span class="kpi-value" [class.positive]="analytics()!.avgActualRR >= 1">
            {{ analytics()!.avgActualRR | number:'1.2-2' }}
          </span>
          <span class="kpi-sub">Planned: {{ analytics()!.avgPlannedRR | number:'1.2-2' }}</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">Profit Factor</span>
          <span class="kpi-value" [class.positive]="analytics()!.profitFactor >= 1.5">
            {{ analytics()!.profitFactor | number:'1.2-2' }}
          </span>
          <span class="kpi-sub">Expectancy: ₹{{ analytics()!.expectancy | number:'1.0-0' }}</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">Max Drawdown</span>
          <span class="kpi-value negative">₹{{ analytics()!.maxDrawdown | number:'1.0-0' }}</span>
          <span class="kpi-sub">Max consec. losses: {{ analytics()!.maxConsecutiveLosses }}</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">Discipline</span>
          <span class="kpi-value" [ngClass]="gradeClass(analytics()!.disciplineGrade)">
            {{ analytics()!.disciplineGrade }}
          </span>
          <span class="kpi-sub">Score: {{ analytics()!.disciplineRating }}/100</span>
        </div>
      </div>

      <!-- Open Positions Banner -->
      <div class="open-positions-banner" *ngIf="openTrades().length > 0">
        <div class="open-banner-left">
          <span class="open-dot"></span>
          <span class="open-label">{{ openTrades().length }} Open Position{{ openTrades().length > 1 ? 's' : '' }}</span>
        </div>
        <div class="open-trades-list">
          <div *ngFor="let t of openTrades()" class="open-trade-item">
            <span class="open-instrument">{{ t.instrument }}</span>
            <span class="open-dir" [class.buy]="t.direction==='BUY'" [class.sell]="t.direction==='SELL'">
              {{ t.direction }}
            </span>
            <span class="open-entry">Entry: ₹{{ t.entryPrice | number:'1.2-2' }}</span>
            <span class="open-sl">SL: ₹{{ t.stopLoss | number:'1.2-2' }}</span>
            <span class="open-target">Target: ₹{{ t.target | number:'1.2-2' }}</span>
            <a [routerLink]="['/trades', t.id]" class="open-view">View →</a>
          </div>
        </div>
      </div>

      <div class="content-grid">

        <!-- Agent Insights -->
        <div class="card alerts-card"
             *ngIf="analytics() && (analytics()!.recommendations.length || analytics()!.repeatingMistakes.length)">
          <h3 class="card-title">⚠ Agent Insights</h3>
          <ul class="insights-list">
            <li *ngFor="let r of analytics()!.recommendations" class="insight-item warning">{{ r }}</li>
            <li *ngFor="let m of analytics()!.repeatingMistakes" class="insight-item danger">{{ m }}</li>
          </ul>
        </div>

        <!-- Recent Trades -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent Trades</h3>
            <div class="header-right">
              <span class="open-badge" *ngIf="openTrades().length">
                {{ openTrades().length }} open
              </span>
              <a routerLink="/trades" class="card-link">View all →</a>
            </div>
          </div>
          <div class="trades-list" *ngIf="recentTrades().length; else noTrades">
            <div *ngFor="let trade of recentTrades()" class="trade-row"
                 [class.trade-open]="trade.outcomeTag === 'OPEN'">
              <div class="trade-instrument">
                <span class="instrument-badge">{{ trade.instrument }}</span>
                <span class="trade-type-badge">{{ trade.tradeType }}</span>
              </div>
              <div class="trade-dir"
                   [class.buy]="trade.direction==='BUY'"
                   [class.sell]="trade.direction==='SELL'">
                {{ trade.direction }}
              </div>
              <div class="trade-pnl"
                   [class.positive]="(trade.pnlAbsolute || 0) >= 0"
                   [class.negative]="(trade.pnlAbsolute || 0) < 0">
                {{ trade.outcomeTag === 'OPEN'
                    ? 'OPEN'
                    : ((trade.pnlAbsolute || 0) >= 0 ? '+' : '') + '₹' + (trade.pnlAbsolute || 0 | number:'1.0-0') }}
              </div>
              <div class="trade-tag" [ngClass]="trade.outcomeTag?.toLowerCase()">
                {{ trade.outcomeTag }}
              </div>
            </div>
          </div>
          <ng-template #noTrades>
            <div class="empty-state">
              No trades yet. <a routerLink="/trades/new">Log your first trade →</a>
            </div>
          </ng-template>
        </div>

        <!-- Best Setups -->
        <div class="card" *ngIf="analytics() && analytics()!.bestSetups.length">
          <h3 class="card-title">✓ Best Performing Setups</h3>
          <ul class="setup-list">
            <li *ngFor="let s of analytics()!.bestSetups" class="setup-item positive">{{ s }}</li>
          </ul>
        </div>

        <!-- Worst Behaviors -->
        <div class="card" *ngIf="analytics() && analytics()!.worstBehaviors.length">
          <h3 class="card-title">✗ Behavioral Issues</h3>
          <ul class="setup-list">
            <li *ngFor="let b of analytics()!.worstBehaviors" class="setup-item danger">{{ b }}</li>
          </ul>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 1400px; }

    .page-header {
      display: flex; justify-content: space-between;
      align-items: flex-start; margin-bottom: 32px;
    }
    .page-title { font-size: 26px; font-weight: 700; color: #e2e8f0; margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: #64748b; margin: 0; }
    .header-actions { display: flex; gap: 12px; }

    .btn-primary {
      background: #3b82f6; color: #fff; padding: 10px 20px;
      border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;
    }
    .btn-primary:hover { background: #2563eb; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px; margin-bottom: 20px;
    }

    .kpi-card {
      background: #0d1117; border: 1px solid #1e2433;
      border-radius: 12px; padding: 20px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .kpi-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; }
    .kpi-value { font-size: 28px; font-weight: 700; color: #e2e8f0; }
    .kpi-sub { font-size: 12px; color: #475569; }
    .kpi-value.positive { color: #22c55e; }
    .kpi-value.negative { color: #ef4444; }

    /* Open Positions Banner */
    .open-positions-banner {
      background: rgba(59, 130, 246, 0.06);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 12px; padding: 16px 20px;
      margin-bottom: 20px;
    }
    .open-banner-left {
      display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
    }
    .open-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #3b82f6; animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .open-label { font-size: 13px; font-weight: 600; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.5px; }
    .open-trades-list { display: flex; flex-direction: column; gap: 8px; }
    .open-trade-item {
      display: flex; align-items: center; gap: 16px;
      padding: 8px 12px; background: rgba(59,130,246,0.05);
      border-radius: 8px; font-size: 13px;
    }
    .open-instrument { font-weight: 700; color: #e2e8f0; min-width: 100px; }
    .open-dir { font-weight: 700; font-size: 12px; }
    .open-dir.buy { color: #22c55e; }
    .open-dir.sell { color: #ef4444; }
    .open-entry, .open-sl, .open-target { color: #64748b; white-space: nowrap; }
    .open-sl { color: #f59e0b; }
    .open-target { color: #22c55e; }
    .open-view { color: #3b82f6; text-decoration: none; margin-left: auto; font-size: 12px; }
    .open-view:hover { text-decoration: underline; }

    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    .card {
      background: #0d1117; border: 1px solid #1e2433;
      border-radius: 12px; padding: 20px;
    }
    .alerts-card { grid-column: 1 / -1; }

    .card-header {
      display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 16px;
    }
    .header-right { display: flex; align-items: center; gap: 10px; }

    .card-title {
      font-size: 14px; font-weight: 600; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px;
    }
    .card-header .card-title { margin: 0; }

    .card-link { font-size: 13px; color: #3b82f6; text-decoration: none; }
    .card-link:hover { text-decoration: underline; }

    .open-badge {
      font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px;
      color: #3b82f6; background: rgba(59,130,246,0.12);
      border: 1px solid rgba(59,130,246,0.2);
    }

    .insights-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
    .insight-item {
      padding: 10px 14px; border-radius: 8px; font-size: 13px; line-height: 1.5;
    }
    .insight-item.warning { background: rgba(245,158,11,0.08); border-left: 3px solid #f59e0b; color: #fbbf24; }
    .insight-item.danger { background: rgba(239,68,68,0.08); border-left: 3px solid #ef4444; color: #f87171; }

    .trades-list { display: flex; flex-direction: column; gap: 8px; }
    .trade-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; background: #0a0e1a;
      border-radius: 8px; border: 1px solid #1e2433;
    }
    .trade-row.trade-open { border-color: rgba(59,130,246,0.3); }

    .trade-instrument { display: flex; gap: 8px; align-items: center; flex: 1; }
    .instrument-badge { font-size: 13px; font-weight: 600; color: #e2e8f0; }
    .trade-type-badge {
      font-size: 11px; color: #64748b; background: #1e2433;
      padding: 2px 6px; border-radius: 4px;
    }
    .trade-dir { font-size: 12px; font-weight: 700; letter-spacing: 0.5px; }
    .trade-dir.buy { color: #22c55e; }
    .trade-dir.sell { color: #ef4444; }
    .trade-pnl {
      font-size: 14px; font-weight: 600; min-width: 80px; text-align: right;
    }
    .trade-pnl.positive { color: #22c55e; }
    .trade-pnl.negative { color: #ef4444; }

    .trade-tag { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; }
    .trade-tag.profit { background: rgba(34,197,94,0.12); color: #22c55e; }
    .trade-tag.loss { background: rgba(239,68,68,0.12); color: #ef4444; }
    .trade-tag.open { background: rgba(59,130,246,0.12); color: #3b82f6; }
    .trade-tag.breakeven { background: rgba(148,163,184,0.12); color: #94a3b8; }

    .empty-state {
      text-align: center; padding: 32px; color: #64748b; font-size: 14px;
    }
    .empty-state a { color: #3b82f6; }

    .setup-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
    .setup-item { font-size: 13px; padding: 8px 12px; border-radius: 6px; }
    .setup-item.positive { background: rgba(34,197,94,0.08); color: #4ade80; border-left: 2px solid #22c55e; }
    .setup-item.danger { background: rgba(239,68,68,0.08); color: #f87171; border-left: 2px solid #ef4444; }
  `]
})
export class DashboardComponent implements OnInit {

  analytics = signal<Analytics | null>(null);
  recentTrades = signal<Trade[]>([]);
  openTrades = signal<Trade[]>([]);
  today = new Date();

  constructor(private tradeService: TradeService) {}

  ngOnInit() {
    // Load analytics for KPI cards (only closed trades)
    this.tradeService.getAnalytics().subscribe(a => this.analytics.set(a));

    // Load recent 10 trades — all statuses including OPEN
    this.tradeService.queryTrades({
      limit: 10,
      sortBy: 'tradeDate',
      sortDir: 'desc'
    }).subscribe(trades => {
      this.recentTrades.set(trades);
      // Separate open positions for the banner
      this.openTrades.set(trades.filter(t => t.outcomeTag === 'OPEN'));
    });
  }

  gradeClass(grade: string): string {
    const map: Record<string, string> = {
      A: 'positive', B: 'positive', C: '', D: 'negative', F: 'negative'
    };
    return map[grade] || '';
  }
}