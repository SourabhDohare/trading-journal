// src/app/features/reports/reports.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { TradeService } from '../../core/services/trade.service';
import { Analytics } from '../../shared/models/analytics.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Reports</h1>
        <p class="page-subtitle">Automated performance summaries</p>
      </div>

      <div class="report-tabs">
        <button *ngFor="let t of tabs" (click)="selectTab(t.key)" [class.active]="activeTab()===t.key" class="tab-btn">{{ t.label }}</button>
      </div>

      <div class="report-body" *ngIf="report()">
        <div class="report-header-block">
          <div class="rh-stat">
            <span class="rhl">Total P&L</span>
            <span class="rhv" [class.pos]="report()!.totalPnl>=0" [class.neg]="report()!.totalPnl<0">
              {{ report()!.totalPnl>=0?'+':'' }}₹{{ report()!.totalPnl | number:'1.0-0' }}
            </span>
          </div>
          <div class="rh-stat">
            <span class="rhl">Win Rate</span>
            <span class="rhv">{{ report()!.winRate | number:'1.1-1' }}%</span>
          </div>
          <div class="rh-stat">
            <span class="rhl">Trades</span>
            <span class="rhv">{{ report()!.totalTrades }}</span>
          </div>
          <div class="rh-stat">
            <span class="rhl">Discipline</span>
            <span class="rhv">{{ report()!.disciplineGrade }}</span>
          </div>
          <div class="rh-stat">
            <span class="rhl">Profit Factor</span>
            <span class="rhv">{{ report()!.profitFactor | number:'1.2-2' }}</span>
          </div>
          <div class="rh-stat">
            <span class="rhl">Expectancy</span>
            <span class="rhv">₹{{ report()!.expectancy | number:'1.0-0' }}</span>
          </div>
        </div>

        <div class="insights-block" *ngIf="report()!.recommendations.length || report()!.repeatingMistakes.length || report()!.bestSetups.length">
          <h3 class="block-title">Agent Assessment</h3>
          <div *ngFor="let r of report()!.recommendations" class="insight warning">{{ r }}</div>
          <div *ngFor="let m of report()!.repeatingMistakes" class="insight danger">✗ Mistake: {{ m }}</div>
          <div *ngFor="let s of report()!.bestSetups" class="insight success">✓ Strong: {{ s }}</div>
          <div *ngFor="let b of report()!.worstBehaviors" class="insight danger">⚠ {{ b }}</div>
        </div>

        <div class="discipline-block">
          <h3 class="block-title">Discipline Breaks</h3>
          <div *ngIf="report()!.disciplineBreaks.length; else noDiscipline">
            <div *ngFor="let d of report()!.disciplineBreaks" class="discipline-item">{{ d }}</div>
          </div>
          <ng-template #noDiscipline>
            <div class="clean-slate">✓ No discipline breaks in this period. Solid work.</div>
          </ng-template>
        </div>
      </div>

      <div class="loading" *ngIf="loading()">Loading report...</div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 1000px; }
    .page-title { font-size: 26px; font-weight: 700; color: #e2e8f0; margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: #64748b; margin: 0 0 24px; }
    .report-tabs { display: flex; gap: 4px; border-bottom: 1px solid #1e2433; margin-bottom: 28px; }
    .tab-btn { background: none; border: none; color: #64748b; padding: 10px 20px; font-size: 14px; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s; &:hover { color: #94a3b8; } &.active { color: #3b82f6; border-bottom-color: #3b82f6; } }
    .report-header-block { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .rh-stat { background: #0d1117; border: 1px solid #1e2433; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
    .rhl { font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
    .rhv { font-size: 22px; font-weight: 700; color: #e2e8f0; &.pos { color: #22c55e; } &.neg { color: #ef4444; } }
    .insights-block, .discipline-block { background: #0d1117; border: 1px solid #1e2433; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .block-title { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 14px; }
    .insight { font-size: 13px; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; line-height: 1.5;
      &.warning { background: rgba(245,158,11,0.08); color: #fbbf24; border-left: 3px solid #f59e0b; }
      &.danger { background: rgba(239,68,68,0.08); color: #f87171; border-left: 3px solid #ef4444; }
      &.success { background: rgba(34,197,94,0.08); color: #4ade80; border-left: 3px solid #22c55e; }
    }
    .discipline-item { font-size: 13px; color: #94a3b8; padding: 8px 0; border-bottom: 1px solid #111827; &:last-child { border-bottom: none; } }
    .clean-slate { font-size: 13px; color: #22c55e; padding: 12px 16px; background: rgba(34,197,94,0.08); border-radius: 8px; border-left: 3px solid #22c55e; }
    .loading { text-align: center; padding: 80px; color: #64748b; }
  `]
})
export class ReportsComponent implements OnInit {
  report = signal<Analytics | null>(null);
  loading = signal(false);
  activeTab = signal('weekly');

  tabs = [
    { key: 'daily', label: 'Today' },
    { key: 'weekly', label: 'This Week' },
    { key: 'monthly', label: 'This Month' },
  ];

  constructor(private tradeService: TradeService) {}

  ngOnInit() { this.selectTab('weekly'); }

  selectTab(key: string) {
    this.activeTab.set(key);
    this.loading.set(true);
    const obs = key === 'daily' ? this.tradeService.getDailyReport()
               : key === 'monthly' ? this.tradeService.getMonthlyReport()
               : this.tradeService.getWeeklyReport();
    obs.subscribe(r => { this.report.set(r); this.loading.set(false); });
  }
}
