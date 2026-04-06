// src/app/features/trades/trade-list.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TradeService } from '../../core/services/trade.service';
import { Trade } from '../../shared/models/trade.model';

@Component({
  selector: 'app-trade-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DecimalPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Trade Journal</h1>
          <p class="page-subtitle">{{ total() }} total trades recorded</p>
        </div>
        <a routerLink="/trades/new" class="btn-primary">+ Log Trade</a>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <select [(ngModel)]="selectedOutcome" (change)="applyFilters()" class="filter-select">
          <option value="">All Outcomes</option>
          <option value="PROFIT">Profit</option>
          <option value="LOSS">Loss</option>
          <option value="BREAKEVEN">Breakeven</option>
          <option value="OPEN">Open</option>
        </select>

        <select [(ngModel)]="selectedEmotion" (change)="applyFilters()" class="filter-select">
          <option value="">All Emotions</option>
          <option value="CALM">Calm</option>
          <option value="DISCIPLINED">Disciplined</option>
          <option value="FOMO">FOMO</option>
          <option value="REVENGE">Revenge</option>
          <option value="HESITATION">Hesitation</option>
          <option value="OVERCONFIDENT">Overconfident</option>
          <option value="ANXIOUS">Anxious</option>
        </select>

        <select [(ngModel)]="selectedSetup" (change)="applyFilters()" class="filter-select">
          <option value="">All Setups</option>
          <option value="BREAKOUT">Breakout</option>
          <option value="REVERSAL">Reversal</option>
          <option value="PULLBACK">Pullback</option>
          <option value="TREND_FOLLOW">Trend Follow</option>
          <option value="MOMENTUM">Momentum</option>
          <option value="RANGE_TRADE">Range Trade</option>
          <option value="GAP_PLAY">Gap Play</option>
          <option value="MEAN_REVERSION">Mean Reversion</option>
          <option value="VOLUME_BASED">Volume Based</option>
          <option value="NEWS_BASED">News Based</option>
          <option value="OTHER">Other</option>
        </select>

        <select [(ngModel)]="selectedSL" (change)="applyFilters()" class="filter-select">
          <option value="">SL — All</option>
          <option value="breached">SL Breached</option>
          <option value="respected">SL Respected</option>
        </select>

        <select [(ngModel)]="selectedInstrumentType" (change)="applyFilters()" class="filter-select">
          <option value="">All Types</option>
          <option value="STOCK">Stock</option>
          <option value="FO_FUTURES">F&O Futures</option>
          <option value="FO_OPTIONS">F&O Options</option>
          <option value="CRYPTO">Crypto</option>
          <option value="INDEX">Index</option>
          <option value="FOREX">Forex</option>
          <option value="COMMODITY">Commodity</option>
        </select>

        <input
          [(ngModel)]="searchInstrument"
          (ngModelChange)="onSearchChange()"
          placeholder="Search symbol (NIFTY, BTC...)"
          class="filter-input"
        />

        <button (click)="clearFilters()" class="btn-ghost">Clear</button>
      </div>

      <!-- Results count when filtered -->
      <div class="results-info" *ngIf="isFiltered()">
        Showing {{ filteredTrades().length }} of {{ total() }} trades
        <span *ngIf="filteredTrades().length === 0" class="no-results"> — no matches</span>
      </div>

      <!-- Trade Table -->
      <div class="table-wrapper">
        <table class="trade-table" *ngIf="pagedTrades().length; else empty">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Instrument</th>
              <th>Type</th>
              <th>Dir</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>SL</th>
              <th>Target</th>
              <th>RR</th>
              <th>P&L</th>
              <th>Setup</th>
              <th>Emotion</th>
              <th>Tags</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of pagedTrades()" [class.sl-breach]="!t.slRespected">
              <td class="trade-id">{{ t.tradeId }}</td>
              <td class="date-cell">{{ t.tradeDate | date:'dd MMM, HH:mm' }}</td>
              <td><span class="instrument-tag">{{ t.instrument }}</span></td>
              <td><span class="type-badge">{{ t.tradeType }}</span></td>
              <td [class.buy]="t.direction==='BUY'" [class.sell]="t.direction==='SELL'" class="dir-cell">
                {{ t.direction }}
              </td>
              <td>₹{{ t.entryPrice | number:'1.2-2' }}</td>
              <td>{{ t.exitPrice ? '₹' + (t.exitPrice | number:'1.2-2') : '—' }}</td>
              <td class="sl-cell">₹{{ t.stopLoss | number:'1.2-2' }}</td>
              <td>₹{{ t.target | number:'1.2-2' }}</td>
              <td>
                <span *ngIf="t.actualRR" [class.rr-good]="t.actualRR >= 1" [class.rr-bad]="t.actualRR < 1">
                  {{ t.actualRR | number:'1.2-2' }}
                </span>
                <span *ngIf="!t.actualRR && t.plannedRR" class="muted">
                  {{ t.plannedRR | number:'1.2-2' }}p
                </span>
                <span *ngIf="!t.actualRR && !t.plannedRR" class="muted">—</span>
              </td>
              <td [class.positive]="(t.pnlAbsolute || 0) >= 0"
                  [class.negative]="(t.pnlAbsolute || 0) < 0"
                  class="pnl-cell">
                {{ t.pnlAbsolute != null
                    ? ((t.pnlAbsolute >= 0 ? '+' : '') + '₹' + (t.pnlAbsolute | number:'1.0-0'))
                    : '—' }}
              </td>
              <td><span class="setup-badge">{{ t.setupType }}</span></td>
              <td>
                <span class="emotion-badge" [ngClass]="t.emotionalState?.toLowerCase()">
                  {{ t.emotionalState }}
                </span>
              </td>
              <td>
                <span *ngFor="let tag of (t.tags || []).slice(0, 2)" class="tag">{{ tag }}</span>
              </td>
              <td>
                <span class="status-badge" [ngClass]="t.outcomeTag?.toLowerCase()">
                  {{ t.outcomeTag }}
                </span>
              </td>
              <td>
                <a [routerLink]="['/trades', t.id]" class="action-btn">View</a>
              </td>
            </tr>
          </tbody>
        </table>

        <ng-template #empty>
          <div class="empty-state">
            <p *ngIf="isFiltered()">No trades match your filters. Try clearing some filters.</p>
            <p *ngIf="!isFiltered()">No trades yet.</p>
            <a routerLink="/trades/new" class="btn-primary-inline">Log your first trade →</a>
          </div>
        </ng-template>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalPages() > 1">
        <button (click)="goToPage(0)" [disabled]="currentPage() === 0" class="page-btn">«</button>
        <button (click)="prevPage()" [disabled]="currentPage() === 0" class="page-btn">← Prev</button>

        <div class="page-numbers">
          <button
            *ngFor="let p of visiblePages()"
            (click)="goToPage(p)"
            [class.active]="currentPage() === p"
            class="page-num-btn">
            {{ p + 1 }}
          </button>
        </div>

        <button (click)="nextPage()" [disabled]="currentPage() === totalPages() - 1" class="page-btn">Next →</button>
        <button (click)="goToPage(totalPages() - 1)" [disabled]="currentPage() === totalPages() - 1" class="page-btn">»</button>

        <span class="page-info">
          Page {{ currentPage() + 1 }} of {{ totalPages() }}
          · showing {{ pagedTrades().length }} of {{ filteredTrades().length }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 1600px; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .page-title { font-size: 26px; font-weight: 700; color: #e2e8f0; margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: #64748b; margin: 0; }

    .btn-primary {
      background: #3b82f6; color: #fff; padding: 10px 20px;
      border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;
    }
    .btn-primary:hover { background: #2563eb; }

    .filter-bar {
      display: flex; gap: 10px; flex-wrap: wrap;
      margin-bottom: 12px; align-items: center;
    }

    .filter-select {
      background: #0d1117; border: 1px solid #1e2433; color: #94a3b8;
      padding: 8px 12px; border-radius: 8px; font-size: 13px; outline: none;
      cursor: pointer;
    }
    .filter-select:focus { border-color: #3b82f6; }

    .filter-input {
      background: #0d1117; border: 1px solid #1e2433; color: #94a3b8;
      padding: 8px 12px; border-radius: 8px; font-size: 13px; outline: none;
      min-width: 190px;
    }
    .filter-input:focus { border-color: #3b82f6; }
    .filter-input::placeholder { color: #334155; }

    .btn-ghost {
      background: none; border: 1px solid #1e2433; color: #64748b;
      padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px;
    }
    .btn-ghost:hover { border-color: #ef4444; color: #ef4444; }

    .results-info {
      font-size: 13px; color: #64748b; margin-bottom: 12px; padding: 6px 0;
    }
    .no-results { color: #f59e0b; font-weight: 500; }

    .table-wrapper { overflow-x: auto; }

    .trade-table { width: 100%; border-collapse: collapse; font-size: 13px; }

    .trade-table th {
      padding: 10px 12px; text-align: left; color: #475569;
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
      border-bottom: 1px solid #1e2433; white-space: nowrap;
    }

    .trade-table td {
      padding: 12px; border-bottom: 1px solid #111827;
      color: #94a3b8; vertical-align: middle;
    }

    .trade-table tr:hover td { background: rgba(30, 36, 51, 0.4); }
    .trade-table tr.sl-breach td { border-left: 2px solid #ef4444; }

    .trade-id { font-family: monospace; font-size: 11px; color: #475569; }
    .date-cell { white-space: nowrap; color: #64748b; }

    .instrument-tag {
      font-weight: 700; color: #e2e8f0; background: #1e2433;
      padding: 3px 8px; border-radius: 4px; font-size: 12px;
    }

    .type-badge {
      font-size: 11px; color: #64748b; background: #111827;
      padding: 2px 6px; border-radius: 4px;
    }

    .dir-cell { font-weight: 700; font-size: 12px; }
    .dir-cell.buy { color: #22c55e; }
    .dir-cell.sell { color: #ef4444; }
    .sl-cell { color: #f59e0b; }
    .rr-good { color: #22c55e; font-weight: 600; }
    .rr-bad { color: #ef4444; font-weight: 600; }
    .muted { color: #475569; }

    .pnl-cell { font-weight: 600; white-space: nowrap; }
    .positive { color: #22c55e; }
    .negative { color: #ef4444; }

    .setup-badge {
      font-size: 11px; color: #7c3aed;
      background: rgba(124, 58, 237, 0.1);
      padding: 2px 7px; border-radius: 4px; white-space: nowrap;
    }

    .emotion-badge { font-size: 11px; padding: 2px 7px; border-radius: 4px; }
    .emotion-badge.calm, .emotion-badge.disciplined { color: #22c55e; background: rgba(34,197,94,0.1); }
    .emotion-badge.fomo { color: #f59e0b; background: rgba(245,158,11,0.1); }
    .emotion-badge.revenge { color: #ef4444; background: rgba(239,68,68,0.1); }
    .emotion-badge.hesitation, .emotion-badge.anxious { color: #94a3b8; background: rgba(148,163,184,0.1); }
    .emotion-badge.overconfident { color: #fb923c; background: rgba(251,146,60,0.1); }

    .tag {
      font-size: 11px; color: #475569; background: #111827;
      padding: 2px 6px; border-radius: 4px; margin-right: 4px;
    }

    .status-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; }
    .status-badge.profit { color: #22c55e; background: rgba(34,197,94,0.12); }
    .status-badge.loss { color: #ef4444; background: rgba(239,68,68,0.12); }
    .status-badge.open { color: #3b82f6; background: rgba(59,130,246,0.12); }
    .status-badge.breakeven { color: #94a3b8; background: rgba(148,163,184,0.12); }

    .action-btn { color: #3b82f6; font-size: 12px; text-decoration: none; }
    .action-btn:hover { text-decoration: underline; }

    .empty-state { text-align: center; padding: 60px; color: #64748b; }
    .empty-state p { margin-bottom: 16px; font-size: 15px; }
    .btn-primary-inline { color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500; }

    .pagination {
      display: flex; align-items: center; gap: 8px;
      justify-content: center; margin-top: 28px; flex-wrap: wrap;
    }

    .page-btn {
      background: #0d1117; border: 1px solid #1e2433; color: #94a3b8;
      padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px;
    }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-btn:hover:not(:disabled) { border-color: #3b82f6; color: #3b82f6; }

    .page-numbers { display: flex; gap: 4px; }

    .page-num-btn {
      background: #0d1117; border: 1px solid #1e2433; color: #94a3b8;
      width: 36px; height: 36px; border-radius: 8px; cursor: pointer;
      font-size: 13px; display: flex; align-items: center; justify-content: center;
    }
    .page-num-btn.active { background: #3b82f6; border-color: #3b82f6; color: #fff; font-weight: 600; }
    .page-num-btn:hover:not(.active) { border-color: #3b82f6; color: #3b82f6; }

    .page-info { font-size: 13px; color: #64748b; margin-left: 8px; }
  `]
})
export class TradeListComponent implements OnInit {

  // Source data — all trades from API loaded once
  private allTradesData: Trade[] = [];

  // Computed signals
  allTrades = signal<Trade[]>([]);
  filteredTrades = signal<Trade[]>([]);
  pagedTrades = signal<Trade[]>([]);
  total = signal(0);
  currentPage = signal(0);

  readonly pageSize = 50;

  // Filter state — empty string = "All" (default)
  selectedOutcome = '';
  selectedEmotion = '';
  selectedSetup = '';
  selectedSL = '';
  selectedInstrumentType = '';
  searchInstrument = '';

  private searchTimer: any;

  constructor(private tradeService: TradeService) {}

  ngOnInit() {
    this.loadAllTrades();
  }

  loadAllTrades() {
    // Load all trades once into memory, filter client-side
    this.tradeService.getTrades(0, 10000, 'tradeDate', 'desc').subscribe(res => {
      this.allTradesData = res.content;
      this.allTrades.set(res.content);
      this.total.set(res.totalElements);
      this.applyFilters();
    });
  }

  applyFilters() {
    let result = [...this.allTradesData];

    // Outcome filter
    if (this.selectedOutcome) {
      result = result.filter(t => t.outcomeTag === this.selectedOutcome);
    }

    // Emotion filter
    if (this.selectedEmotion) {
      result = result.filter(t => t.emotionalState === this.selectedEmotion);
    }

    // Setup filter
    if (this.selectedSetup) {
      result = result.filter(t => t.setupType === this.selectedSetup);
    }

    // SL filter
    if (this.selectedSL === 'breached') {
      result = result.filter(t => !t.slRespected);
    } else if (this.selectedSL === 'respected') {
      result = result.filter(t => t.slRespected);
    }

    // Instrument type filter
    if (this.selectedInstrumentType) {
      result = result.filter(t => t.instrumentType === this.selectedInstrumentType);
    }

    // Instrument symbol search — case-insensitive, partial match
    if (this.searchInstrument.trim()) {
      const q = this.searchInstrument.trim().toLowerCase();
      result = result.filter(t =>
        t.instrument?.toLowerCase().includes(q)
      );
    }

    this.filteredTrades.set(result);
    this.currentPage.set(0);
    this.updatePage();
  }

  onSearchChange() {
    // Debounce 300ms so search doesn't fire on every keystroke
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.applyFilters(), 300);
  }

  updatePage() {
    const start = this.currentPage() * this.pageSize;
    const end = start + this.pageSize;
    this.pagedTrades.set(this.filteredTrades().slice(start, end));
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTrades().length / this.pageSize));
  }

  // Show max 5 page numbers centered around current page
  visiblePages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(0, current - 2);
    const end = Math.min(total - 1, start + 4);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.updatePage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevPage() {
    if (this.currentPage() > 0) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  isFiltered(): boolean {
    return !!(this.selectedOutcome || this.selectedEmotion || this.selectedSetup ||
              this.selectedSL || this.selectedInstrumentType || this.searchInstrument.trim());
  }

  clearFilters() {
    this.selectedOutcome = '';
    this.selectedEmotion = '';
    this.selectedSetup = '';
    this.selectedSL = '';
    this.selectedInstrumentType = '';
    this.searchInstrument = '';
    clearTimeout(this.searchTimer);
    this.applyFilters();
  }
}