// src/app/features/trades/trade-list.component.ts
import { Component, OnInit, signal } from "@angular/core";
import { CommonModule, DecimalPipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { TradeService } from "../../core/services/trade.service";
import {
  Trade,
  TradeQuery,
  OutcomeTag,
  EmotionalState,
} from "../../shared/models/trade.model";

@Component({
  selector: "app-trade-list",
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
        <select
          [(ngModel)]="filters.outcomeTag"
          (change)="applyFilters()"
          class="filter-select"
        >
          <option value="">All Outcomes</option>
          <option value="PROFIT">Profit</option>
          <option value="LOSS">Loss</option>
          <option value="BREAKEVEN">Breakeven</option>
          <option value="OPEN">Open</option>
        </select>
        <select
          [(ngModel)]="filters.emotionalState"
          (change)="applyFilters()"
          class="filter-select"
        >
          <option value="">All Emotions</option>
          <option value="CALM">Calm</option>
          <option value="FOMO">FOMO</option>
          <option value="REVENGE">Revenge</option>
          <option value="HESITATION">Hesitation</option>
          <option value="OVERCONFIDENT">Overconfident</option>
        </select>
        <select
          [(ngModel)]="filters.setupType"
          (change)="applyFilters()"
          class="filter-select"
        >
          <option value="">All Setups</option>
          <option value="BREAKOUT">Breakout</option>
          <option value="REVERSAL">Reversal</option>
          <option value="PULLBACK">Pullback</option>
          <option value="TREND_FOLLOW">Trend Follow</option>
          <option value="MOMENTUM">Momentum</option>
          <option value="RANGE_TRADE">Range Trade</option>
        </select>
        <select
          [(ngModel)]="slFilter"
          (change)="applySlFilter()"
          class="filter-select"
        >
          <option value="">SL — All</option>
          <option value="breached">SL Breached</option>
          <option value="respected">SL Respected</option>
        </select>
        // ADD ✓ — two separate filters: instrument type dropdown + instrument
        text search
        <select
          [(ngModel)]="filters.instrumentType"
          (change)="applyFilters()"
          class="filter-select"
        >
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
          [(ngModel)]="filters.instrument"
          (input)="applyFilters()"
          placeholder="Symbol (NIFTY, BTC...)"
          class="filter-input"
        />
        <button (click)="clearFilters()" class="btn-ghost">Clear</button>
      </div>

      <!-- Trade Table -->
      <div class="table-wrapper">
        <table class="trade-table" *ngIf="trades().length; else empty">
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
            <tr *ngFor="let t of trades()" [class.sl-breach]="!t.slRespected">
              <td class="trade-id">{{ t.tradeId }}</td>
              <td class="date-cell">
                {{ t.tradeDate | date: "dd MMM, HH:mm" }}
              </td>
              <td>
                <span class="instrument-tag">{{ t.instrument }}</span>
              </td>
              <td>
                <span class="type-badge">{{ t.tradeType }}</span>
              </td>
              <td
                [class.buy]="t.direction === 'BUY'"
                [class.sell]="t.direction === 'SELL'"
                class="dir-cell"
              >
                {{ t.direction }}
              </td>
              <td>₹{{ t.entryPrice | number: "1.2-2" }}</td>
              <td>
                {{ t.exitPrice ? "₹" + (t.exitPrice | number: "1.2-2") : "—" }}
              </td>
              <td class="sl-cell">₹{{ t.stopLoss | number: "1.2-2" }}</td>
              <td>₹{{ t.target | number: "1.2-2" }}</td>
              <td>
                <span
                  *ngIf="t.actualRR"
                  [class.rr-good]="t.actualRR >= 1"
                  [class.rr-bad]="t.actualRR < 1"
                  >{{ t.actualRR | number: "1.2-2" }}</span
                >
                <span *ngIf="!t.actualRR" class="muted"
                  >{{ t.plannedRR | number: "1.2-2" }}p</span
                >
              </td>
              <td
                [class.positive]="(t.pnlAbsolute || 0) >= 0"
                [class.negative]="(t.pnlAbsolute || 0) < 0"
                class="pnl-cell"
              >
                {{
                  t.pnlAbsolute != null
                    ? (t.pnlAbsolute >= 0 ? "+" : "") +
                      "₹" +
                      (t.pnlAbsolute | number: "1.0-0")
                    : "—"
                }}
              </td>
              <td>
                <span class="setup-badge">{{ t.setupType }}</span>
              </td>
              <td>
                <span
                  class="emotion-badge"
                  [class]="emotionClass(t.emotionalState)"
                  >{{ t.emotionalState }}</span
                >
              </td>
              <td>
                <span
                  *ngFor="let tag of (t.tags || []).slice(0, 2)"
                  class="tag"
                  >{{ tag }}</span
                >
              </td>
              <td>
                <span
                  class="status-badge"
                  [class]="statusClass(t.outcomeTag)"
                  >{{ t.outcomeTag }}</span
                >
              </td>
              <td>
                <a [routerLink]="['/trades', t.id]" class="action-btn">View</a>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #empty>
          <div class="empty-state">
            <p>No trades match your filters.</p>
            <a routerLink="/trades/new" class="btn-primary"
              >Log your first trade</a
            >
          </div>
        </ng-template>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalPages() > 1">
        <button (click)="prevPage()" [disabled]="page() === 0" class="page-btn">
          ← Prev
        </button>
        <span class="page-info"
          >Page {{ page() + 1 }} of {{ totalPages() }}</span
        >
        <button
          (click)="nextPage()"
          [disabled]="page() === totalPages() - 1"
          class="page-btn"
        >
          Next →
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 32px;
        max-width: 1600px;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
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
      .btn-primary {
        background: #3b82f6;
        color: #fff;
        padding: 10px 20px;
        border-radius: 8px;
        text-decoration: none;
        font-size: 14px;
        font-weight: 600;
      }

      .filter-bar {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 20px;
        align-items: center;
      }
      .filter-select,
      .filter-input {
        background: #0d1117;
        border: 1px solid #1e2433;
        color: #94a3b8;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 13px;
        outline: none;
        &:focus {
          border-color: #3b82f6;
        }
      }
      .filter-input {
        min-width: 140px;
      }
      .btn-ghost {
        background: none;
        border: 1px solid #1e2433;
        color: #64748b;
        padding: 8px 14px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        &:hover {
          border-color: #ef4444;
          color: #ef4444;
        }
      }

      .table-wrapper {
        overflow-x: auto;
      }
      .trade-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        th {
          padding: 10px 12px;
          text-align: left;
          color: #475569;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #1e2433;
          white-space: nowrap;
        }
        td {
          padding: 12px 12px;
          border-bottom: 1px solid #111827;
          color: #94a3b8;
          vertical-align: middle;
        }
        tr:hover td {
          background: rgba(30, 36, 51, 0.4);
        }
        tr.sl-breach td {
          border-left: 2px solid #ef4444;
        }
      }

      .trade-id {
        font-family: monospace;
        font-size: 11px;
        color: #475569;
      }
      .date-cell {
        white-space: nowrap;
        color: #64748b;
      }
      .instrument-tag {
        font-weight: 700;
        color: #e2e8f0;
        background: #1e2433;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 12px;
      }
      .type-badge {
        font-size: 11px;
        color: #64748b;
        background: #111827;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .dir-cell {
        font-weight: 700;
        font-size: 12px;
        &.buy {
          color: #22c55e;
        }
        &.sell {
          color: #ef4444;
        }
      }
      .sl-cell {
        color: #f59e0b;
      }
      .rr-good {
        color: #22c55e;
        font-weight: 600;
      }
      .rr-bad {
        color: #ef4444;
        font-weight: 600;
      }
      .muted {
        color: #475569;
      }
      .pnl-cell {
        font-weight: 600;
        white-space: nowrap;
        &.positive {
          color: #22c55e;
        }
        &.negative {
          color: #ef4444;
        }
      }
      .setup-badge {
        font-size: 11px;
        color: #7c3aed;
        background: rgba(124, 58, 237, 0.1);
        padding: 2px 7px;
        border-radius: 4px;
      }
      .emotion-badge {
        font-size: 11px;
        padding: 2px 7px;
        border-radius: 4px;
        &.fomo {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
        }
        &.revenge {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
        &.calm,
        &.disciplined {
          color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
        }
        &.hesitation {
          color: #94a3b8;
          background: rgba(148, 163, 184, 0.1);
        }
        &.overconfident {
          color: #fb923c;
          background: rgba(251, 146, 60, 0.1);
        }
      }
      .tag {
        font-size: 11px;
        color: #475569;
        background: #111827;
        padding: 2px 6px;
        border-radius: 4px;
        margin-right: 4px;
      }
      .status-badge {
        font-size: 11px;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 4px;
        &.profit {
          color: #22c55e;
          background: rgba(34, 197, 94, 0.12);
        }
        &.loss {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.12);
        }
        &.open {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.12);
        }
        &.breakeven {
          color: #94a3b8;
          background: rgba(148, 163, 184, 0.12);
        }
      }
      .action-btn {
        color: #3b82f6;
        font-size: 12px;
        text-decoration: none;
        &:hover {
          text-decoration: underline;
        }
      }
      .positive {
        color: #22c55e;
      }
      .negative {
        color: #ef4444;
      }

      .empty-state {
        text-align: center;
        padding: 60px;
        color: #64748b;
        p {
          margin-bottom: 16px;
        }
      }
      .pagination {
        display: flex;
        align-items: center;
        gap: 16px;
        justify-content: center;
        margin-top: 24px;
      }
      .page-btn {
        background: #0d1117;
        border: 1px solid #1e2433;
        color: #94a3b8;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        &:hover:not(:disabled) {
          border-color: #3b82f6;
          color: #3b82f6;
        }
      }
      .page-info {
        font-size: 13px;
        color: #64748b;
      }
    `,
  ],
})
export class TradeListComponent implements OnInit {
  trades = signal<Trade[]>([]);
  total = signal(0);
  page = signal(0);
  totalPages = signal(1);
  filters: TradeQuery = {};
  slFilter = "";

  constructor(private tradeService: TradeService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    const query: TradeQuery = { ...this.filters };
    if (this.slFilter === "breached") query.slRespected = false;
    else if (this.slFilter === "respected") query.slRespected = true;

    if (Object.values(query).some((v) => v !== undefined && v !== "")) {
      this.tradeService.queryTrades(query).subscribe((trades) => {
        this.trades.set(trades);
        this.total.set(trades.length);
      });
    } else {
      this.tradeService.getTrades(this.page()).subscribe((res) => {
        this.trades.set(res.content);
        this.total.set(res.totalElements);
        this.totalPages.set(res.totalPages);
      });
    }
  }

  applyFilters() {
    this.page.set(0);
    // Remove empty strings
    Object.keys(this.filters).forEach((k) => {
      if ((this.filters as any)[k] === "") delete (this.filters as any)[k];
    });
    this.load();
  }

  applySlFilter() {
    this.applyFilters();
  }

  clearFilters() {
    this.filters = {};
    this.slFilter = "";
    this.applyFilters();
  }

  prevPage() {
    if (this.page() > 0) {
      this.page.update((p) => p - 1);
      this.load();
    }
  }
  nextPage() {
    if (this.page() < this.totalPages() - 1) {
      this.page.update((p) => p + 1);
      this.load();
    }
  }

  emotionClass(e: string) {
    return e?.toLowerCase() || "";
  }
  statusClass(s: string) {
    return s?.toLowerCase() || "";
  }
}
