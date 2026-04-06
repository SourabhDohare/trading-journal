// src/app/features/reports/reports.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TradeService } from '../../core/services/trade.service';
import { Analytics } from '../../shared/models/analytics.model';
import { Trade } from '../../shared/models/trade.model';

interface TabConfig {
  key: string;
  label: string;
  dateRange: () => { from: string; to: string };
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Reports</h1>
        <p class="page-subtitle">Automated performance summaries</p>
      </div>

      <!-- Tabs -->
      <div class="report-tabs">
        <button *ngFor="let t of tabs" (click)="selectTab(t.key)"
                [class.active]="activeTab() === t.key" class="tab-btn">
          {{ t.label }}
        </button>
      </div>

      <!-- Summary stats -->
      <div class="report-body" *ngIf="report()">
        <div class="report-header-block">
          <div class="rh-stat">
            <span class="rhl">Total P&L</span>
            <span class="rhv" [class.pos]="report()!.totalPnl >= 0" [class.neg]="report()!.totalPnl < 0">
              {{ report()!.totalPnl >= 0 ? '+' : '' }}₹{{ report()!.totalPnl | number:'1.0-0' }}
            </span>
          </div>
          <div class="rh-stat">
            <span class="rhl">Win Rate</span>
            <span class="rhv" [class.pos]="report()!.winRate >= 50">
              {{ report()!.winRate | number:'1.1-1' }}%
            </span>
          </div>
          <div class="rh-stat">
            <span class="rhl">Trades</span>
            <span class="rhv">{{ report()!.totalTrades }}</span>
          </div>
          <div class="rh-stat">
            <span class="rhl">Discipline</span>
            <span class="rhv" [class.pos]="report()!.disciplineGrade === 'A' || report()!.disciplineGrade === 'B'"
                              [class.neg]="report()!.disciplineGrade === 'D' || report()!.disciplineGrade === 'F'">
              {{ report()!.disciplineGrade }}
            </span>
          </div>
          <div class="rh-stat">
            <span class="rhl">Profit Factor</span>
            <span class="rhv" [class.pos]="report()!.profitFactor >= 1.5">
              {{ report()!.profitFactor | number:'1.2-2' }}
            </span>
          </div>
          <div class="rh-stat">
            <span class="rhl">Expectancy</span>
            <span class="rhv">₹{{ report()!.expectancy | number:'1.0-0' }}</span>
          </div>
          <div class="rh-stat">
            <span class="rhl">Avg Win</span>
            <span class="rhv pos">₹{{ report()!.avgProfitPerWin | number:'1.0-0' }}</span>
          </div>
          <div class="rh-stat">
            <span class="rhl">Avg Loss</span>
            <span class="rhv neg">₹{{ report()!.avgLossPerLoss | number:'1.0-0' }}</span>
          </div>
        </div>

        <!-- Agent insights -->
        <div class="insights-block"
             *ngIf="report()!.recommendations.length || report()!.repeatingMistakes.length || report()!.bestSetups.length">
          <h3 class="block-title">Agent Assessment</h3>
          <div *ngFor="let r of report()!.recommendations" class="insight warning">{{ r }}</div>
          <div *ngFor="let m of report()!.repeatingMistakes" class="insight danger">✗ Mistake: {{ m }}</div>
          <div *ngFor="let s of report()!.bestSetups" class="insight success">✓ Strong: {{ s }}</div>
          <div *ngFor="let b of report()!.worstBehaviors" class="insight danger">⚠ {{ b }}</div>
        </div>

        <!-- Discipline breaks -->
        <div class="discipline-block">
          <h3 class="block-title">Discipline Breaks</h3>
          <div *ngIf="report()!.disciplineBreaks.length; else noDiscipline">
            <div *ngFor="let d of report()!.disciplineBreaks" class="discipline-item">{{ d }}</div>
          </div>
          <ng-template #noDiscipline>
            <div class="clean-slate">✓ No discipline breaks in this period. Solid work.</div>
          </ng-template>
        </div>

        <!-- Trade List for this period -->
        <div class="trades-block">
          <div class="trades-block-header">
            <h3 class="block-title">Trades in This Period</h3>
            <span class="trade-count-badge">{{ filteredTrades().length }} trades</span>
          </div>

          <div class="table-wrapper" *ngIf="pagedTrades().length; else noTrades">
            <table class="trade-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Instrument</th>
                  <th>Type</th>
                  <th>Dir</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>P&L</th>
                  <th>RR</th>
                  <th>Setup</th>
                  <th>TF</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let t of pagedTrades()">
                  <td class="date-cell">{{ t.tradeDate | date:'dd MMM, HH:mm' }}</td>
                  <td><span class="instr-tag">{{ t.instrument }}</span></td>
                  <td><span class="type-tag">{{ t.tradeType }}</span></td>
                  <td [class.buy]="t.direction==='BUY'" [class.sell]="t.direction==='SELL'" class="dir-cell">{{ t.direction }}</td>
                  <td>₹{{ t.entryPrice | number:'1.2-2' }}</td>
                  <td>{{ t.exitPrice ? '₹'+(t.exitPrice | number:'1.2-2') : '—' }}</td>
                  <td [class.pos]="(t.pnlAbsolute||0)>=0" [class.neg]="(t.pnlAbsolute||0)<0" class="pnl-cell">
                    {{ t.pnlAbsolute != null ? ((t.pnlAbsolute>=0?'+':'')+'₹'+(t.pnlAbsolute|number:'1.0-0')) : '—' }}
                  </td>
                  <td [class.rr-good]="(t.actualRR||0)>=1" [class.rr-bad]="(t.actualRR||0)<1 && t.actualRR">
                    {{ t.actualRR ? (t.actualRR|number:'1.2-2') : (t.plannedRR ? (t.plannedRR|number:'1.2-2')+'p' : '—') }}
                  </td>
                  <td><span class="setup-tag">{{ t.setupType }}</span></td>
                  <td>
                    <div class="tf-mini-list">
                      <span *ngFor="let tf of (t.timeFrames||[]).slice(0,2)" class="tf-mini">{{ tf }}</span>
                      <span *ngIf="(t.timeFrames||[]).length > 2" class="tf-more">+{{ (t.timeFrames||[]).length - 2 }}</span>
                    </div>
                  </td>
                  <td><span class="status-tag" [ngClass]="t.outcomeTag?.toLowerCase()">{{ t.outcomeTag }}</span></td>
                  <td><a [routerLink]="['/trades', t.id]" class="view-link">View</a></td>
                </tr>
              </tbody>
            </table>
          </div>

          <ng-template #noTrades>
            <div class="no-trades">No trades in this period.</div>
          </ng-template>

          <!-- Pagination -->
          <div class="pagination" *ngIf="totalTradePagesCount() > 1">
            <button (click)="goToTradePage(0)" [disabled]="tradePage()===0" class="page-btn">«</button>
            <button (click)="prevTradePage()" [disabled]="tradePage()===0" class="page-btn">← Prev</button>
            <div class="page-numbers">
              <button *ngFor="let p of visibleTradePages()"
                      (click)="goToTradePage(p)"
                      [class.active]="tradePage()===p"
                      class="page-num-btn">{{ p + 1 }}</button>
            </div>
            <button (click)="nextTradePage()" [disabled]="tradePage()===totalTradePagesCount()-1" class="page-btn">Next →</button>
            <button (click)="goToTradePage(totalTradePagesCount()-1)" [disabled]="tradePage()===totalTradePagesCount()-1" class="page-btn">»</button>
            <span class="page-info">
              Page {{ tradePage()+1 }} of {{ totalTradePagesCount() }} · {{ pagedTrades().length }} of {{ filteredTrades().length }}
            </span>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="loading()">Loading report...</div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 1400px; }
    .page-title { font-size: 26px; font-weight: 700; color: #e2e8f0; margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: #64748b; margin: 0 0 24px; }

    .report-tabs { display: flex; gap: 4px; border-bottom: 1px solid #1e2433; margin-bottom: 28px; }
    .tab-btn {
      background: none; border: none; color: #64748b; padding: 10px 20px; font-size: 14px;
      cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s;
    }
    .tab-btn:hover { color: #94a3b8; }
    .tab-btn.active { color: #3b82f6; border-bottom-color: #3b82f6; }

    .report-header-block {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px; margin-bottom: 24px;
    }
    .rh-stat {
      background: #0d1117; border: 1px solid #1e2433; border-radius: 10px;
      padding: 16px; display: flex; flex-direction: column; gap: 4px;
    }
    .rhl { font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
    .rhv { font-size: 22px; font-weight: 700; color: #e2e8f0; }
    .rhv.pos { color: #22c55e; } .rhv.neg { color: #ef4444; }

    .insights-block, .discipline-block, .trades-block {
      background: #0d1117; border: 1px solid #1e2433; border-radius: 12px;
      padding: 20px; margin-bottom: 20px;
    }
    .block-title { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 14px; }

    .trades-block-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .trades-block-header .block-title { margin: 0; }
    .trade-count-badge { font-size: 12px; background: rgba(59,130,246,0.1); color: #3b82f6; padding: 3px 10px; border-radius: 20px; font-weight: 600; }

    .insight { font-size: 13px; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; line-height: 1.5; }
    .insight.warning { background: rgba(245,158,11,0.08); color: #fbbf24; border-left: 3px solid #f59e0b; }
    .insight.danger  { background: rgba(239,68,68,0.08);  color: #f87171; border-left: 3px solid #ef4444; }
    .insight.success { background: rgba(34,197,94,0.08);  color: #4ade80; border-left: 3px solid #22c55e; }
    .discipline-item { font-size: 13px; color: #94a3b8; padding: 8px 0; border-bottom: 1px solid #111827; }
    .discipline-item:last-child { border-bottom: none; }
    .clean-slate { font-size: 13px; color: #22c55e; padding: 12px 16px; background: rgba(34,197,94,0.08); border-radius: 8px; border-left: 3px solid #22c55e; }

    /* Trade table */
    .table-wrapper { overflow-x: auto; }
    .trade-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .trade-table th {
      padding: 9px 10px; text-align: left; color: #475569; font-size: 11px;
      text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1e2433; white-space: nowrap;
    }
    .trade-table td { padding: 10px; border-bottom: 1px solid #111827; color: #94a3b8; vertical-align: middle; }
    .trade-table tr:hover td { background: rgba(30,36,51,0.4); }

    .date-cell { white-space: nowrap; color: #64748b; font-size: 12px; }
    .instr-tag { font-weight: 700; color: #e2e8f0; background: #1e2433; padding: 2px 7px; border-radius: 4px; font-size: 12px; }
    .type-tag { font-size: 11px; color: #64748b; background: #111827; padding: 2px 5px; border-radius: 4px; }
    .dir-cell { font-weight: 700; font-size: 12px; }
    .dir-cell.buy { color: #22c55e; } .dir-cell.sell { color: #ef4444; }
    .pnl-cell { font-weight: 600; white-space: nowrap; }
    .pos { color: #22c55e; } .neg { color: #ef4444; }
    .rr-good { color: #22c55e; font-weight: 600; } .rr-bad { color: #ef4444; }
    .setup-tag { font-size: 11px; color: #7c3aed; background: rgba(124,58,237,0.1); padding: 2px 6px; border-radius: 4px; white-space: nowrap; }

    /* Time frames in table */
    .tf-mini-list { display: flex; gap: 3px; flex-wrap: wrap; }
    .tf-mini { font-size: 10px; background: rgba(59,130,246,0.1); color: #3b82f6; padding: 1px 5px; border-radius: 10px; white-space: nowrap; }
    .tf-more { font-size: 10px; color: #64748b; }

    .status-tag { font-size: 11px; font-weight: 600; padding: 3px 7px; border-radius: 4px; }
    .status-tag.profit    { color: #22c55e; background: rgba(34,197,94,0.12); }
    .status-tag.loss      { color: #ef4444; background: rgba(239,68,68,0.12); }
    .status-tag.open      { color: #3b82f6; background: rgba(59,130,246,0.12); }
    .status-tag.breakeven { color: #94a3b8; background: rgba(148,163,184,0.12); }
    .view-link { color: #3b82f6; font-size: 12px; text-decoration: none; }
    .view-link:hover { text-decoration: underline; }

    .no-trades { text-align: center; padding: 32px; color: #64748b; font-size: 14px; }

    /* Pagination */
    .pagination {
      display: flex; align-items: center; gap: 8px;
      justify-content: center; margin-top: 20px; flex-wrap: wrap;
    }
    .page-btn {
      background: #0a0e1a; border: 1px solid #1e2433; color: #94a3b8;
      padding: 7px 13px; border-radius: 8px; cursor: pointer; font-size: 13px;
    }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-btn:hover:not(:disabled) { border-color: #3b82f6; color: #3b82f6; }
    .page-numbers { display: flex; gap: 4px; }
    .page-num-btn {
      background: #0a0e1a; border: 1px solid #1e2433; color: #94a3b8;
      width: 34px; height: 34px; border-radius: 8px; cursor: pointer; font-size: 13px;
    }
    .page-num-btn.active { background: #3b82f6; border-color: #3b82f6; color: #fff; font-weight: 600; }
    .page-num-btn:hover:not(.active) { border-color: #3b82f6; color: #3b82f6; }
    .page-info { font-size: 13px; color: #64748b; margin-left: 8px; }

    .loading { text-align: center; padding: 80px; color: #64748b; }
  `]
})
export class ReportsComponent implements OnInit {

  report = signal<Analytics | null>(null);
  loading = signal(false);
  activeTab = signal('weekly');

  // Trade list for the period
  private allPeriodTrades: Trade[] = [];
  filteredTrades = signal<Trade[]>([]);
  pagedTrades = signal<Trade[]>([]);
  tradePage = signal(0);
  readonly tradePageSize = 50;

  tabs: TabConfig[] = [
    {
      key: 'today',
      label: 'Today',
      dateRange: () => {
        const d = new Date().toISOString().split('T')[0];
        return { from: d, to: d };
      }
    },
    {
      key: 'weekly',
      label: 'This Week',
      dateRange: () => {
        const now = new Date();
        const day = now.getDay();
        const diff = (day === 0 ? -6 : 1) - day;
        const mon = new Date(now);
        mon.setDate(now.getDate() + diff);
        return {
          from: mon.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        };
      }
    },
    {
      key: 'monthly',
      label: 'This Month',
      dateRange: () => {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        return { from, to: now.toISOString().split('T')[0] };
      }
    },
    {
      key: 'yearly',
      label: 'This Year',
      dateRange: () => {
        const now = new Date();
        const from = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        return { from, to: now.toISOString().split('T')[0] };
      }
    }
  ];

  constructor(private tradeService: TradeService) {}

  ngOnInit() { this.selectTab('weekly'); }

  selectTab(key: string) {
    this.activeTab.set(key);
    this.loading.set(true);
    this.tradePage.set(0);

    const tab = this.tabs.find(t => t.key === key)!;
    const range = tab.dateRange();

    // Load analytics summary
    const obs = key === 'today'   ? this.tradeService.getDailyReport()
              : key === 'monthly' ? this.tradeService.getMonthlyReport()
              : key === 'yearly'  ? this.tradeService.getYearlyReport()
              : this.tradeService.getWeeklyReport();

    obs.subscribe(r => { this.report.set(r); this.loading.set(false); });

    // Load trade list for this period
    this.tradeService.getTradesInRange(range.from, range.to).subscribe(trades => {
      this.allPeriodTrades = trades;
      this.filteredTrades.set(trades);
      this.tradePage.set(0);
      this.updateTradePage();
    });
  }

  updateTradePage() {
    const start = this.tradePage() * this.tradePageSize;
    const end   = start + this.tradePageSize;
    this.pagedTrades.set(this.filteredTrades().slice(start, end));
  }

  totalTradePagesCount(): number {
    return Math.max(1, Math.ceil(this.filteredTrades().length / this.tradePageSize));
  }

  visibleTradePages(): number[] {
    const total = this.totalTradePagesCount();
    const cur = this.tradePage();
    const pages: number[] = [];
    const start = Math.max(0, cur - 2);
    const end   = Math.min(total - 1, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  goToTradePage(p: number) {
    if (p < 0 || p >= this.totalTradePagesCount()) return;
    this.tradePage.set(p);
    this.updateTradePage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevTradePage() { if (this.tradePage() > 0) this.goToTradePage(this.tradePage() - 1); }
  nextTradePage() { if (this.tradePage() < this.totalTradePagesCount() - 1) this.goToTradePage(this.tradePage() + 1); }
}
