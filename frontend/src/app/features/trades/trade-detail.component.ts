// src/app/features/trades/trade-detail.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TradeService } from '../../core/services/trade.service';
import { Trade } from '../../shared/models/trade.model';

@Component({
  selector: 'app-trade-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DecimalPipe],
  template: `
    <div class="page" *ngIf="trade()">
      <div class="page-header">
        <a routerLink="/trades" class="back-link">← Back to Journal</a>
        <div class="header-top">
          <div>
            <h1 class="page-title">
              {{ trade()!.instrument }}
              <span class="dir-badge" [class.buy]="trade()!.direction==='BUY'" [class.sell]="trade()!.direction==='SELL'">
                {{ trade()!.direction }}
              </span>
            </h1>
            <p class="trade-id-text">{{ trade()!.tradeId }} · {{ trade()!.tradeDate | date:'MMM d, y HH:mm' }}</p>
          </div>
          <div class="pnl-hero" [class.positive]="(trade()!.pnlAbsolute||0)>=0" [class.negative]="(trade()!.pnlAbsolute||0)<0"
               *ngIf="trade()!.pnlAbsolute != null">
            <span class="pnl-amount">{{ (trade()!.pnlAbsolute||0)>=0?'+':'' }}₹{{ trade()!.pnlAbsolute | number:'1.0-0' }}</span>
            <span class="pnl-pct">{{ (trade()!.pnlPercent||0)>=0?'+':'' }}{{ trade()!.pnlPercent | number:'1.2-2' }}%</span>
          </div>
        </div>
      </div>

      <div class="detail-grid">
        <!-- Trade Data -->
        <div class="card">
          <h3 class="card-title">Trade Data</h3>
          <div class="data-grid">
            <div class="data-row"><span class="dl">Type</span><span class="dv">{{ trade()!.tradeType }} · {{ trade()!.instrumentType }}</span></div>
            <div class="data-row"><span class="dl">Entry</span><span class="dv">₹{{ trade()!.entryPrice | number:'1.2-2' }}</span></div>
            <div class="data-row"><span class="dl">Exit</span><span class="dv">{{ trade()!.exitPrice ? '₹'+(trade()!.exitPrice|number:'1.2-2') : 'Open' }}</span></div>
            <div class="data-row"><span class="dl">Stop Loss</span><span class="dv sl">₹{{ trade()!.stopLoss | number:'1.2-2' }}</span></div>
            <div class="data-row"><span class="dl">Target</span><span class="dv">₹{{ trade()!.target | number:'1.2-2' }}</span></div>
            <div class="data-row"><span class="dl">Size</span><span class="dv">{{ trade()!.positionSize }}{{ trade()!.lotSize ? ' × lot '+trade()!.lotSize : '' }}</span></div>
            <div class="data-row"><span class="dl">Planned R:R</span><span class="dv">1:{{ trade()!.plannedRR | number:'1.2-2' }}</span></div>
            <div class="data-row"><span class="dl">Actual R:R</span>
              <span class="dv" [class.positive]="(trade()!.actualRR||0)>=1" [class.negative]="(trade()!.actualRR||0)<1">
                {{ trade()!.actualRR ? '1:' + (trade()!.actualRR|number:'1.2-2') : '—' }}
              </span>
            </div>
            <div class="data-row"><span class="dl">Setup</span><span class="dv">{{ trade()!.setupType }}</span></div>
            <div class="data-row"><span class="dl">Market</span><span class="dv">{{ trade()!.marketContext }}</span></div>
            <div class="data-row"><span class="dl">SL Respected</span>
              <span class="dv" [class.positive]="trade()!.slRespected" [class.negative]="!trade()!.slRespected">
                {{ trade()!.slRespected ? '✓ Yes' : '✖ No — #DisciplineBreak' }}
              </span>
            </div>
            <div class="data-row"><span class="dl">Status</span><span class="status-badge" [class]="trade()!.outcomeTag.toLowerCase()">{{ trade()!.outcomeTag }}</span></div>
          </div>
        </div>

        <!-- Thinking Layer -->
        <div class="card">
          <h3 class="card-title">Thinking Layer</h3>
          <div class="thinking-item">
            <span class="tl">Why I took this trade</span>
            <p class="tv">{{ trade()!.whyTookTrade }}</p>
          </div>
          <div class="thinking-item">
            <span class="tl">Edge / Setup Logic</span>
            <p class="tv">{{ trade()!.edgeOrSetupLogic }}</p>
          </div>
          <div class="thinking-item">
            <span class="tl">Confirmation Used</span>
            <p class="tv">{{ trade()!.confirmationUsed }}</p>
          </div>
          <div class="thinking-item">
            <span class="tl">Invalidation Condition</span>
            <p class="tv">{{ trade()!.invalidationReason }}</p>
          </div>
          <div class="thinking-item">
            <span class="tl">Emotional State</span>
            <span class="emotion-tag" [class]="trade()!.emotionalState.toLowerCase()">{{ trade()!.emotionalState }}</span>
          </div>
          <div class="thinking-item" *ngIf="trade()!.tags?.length">
            <span class="tl">Tags</span>
            <div class="tags-row">
              <span *ngFor="let tag of trade()!.tags" class="tag">{{ tag }}</span>
            </div>
          </div>
        </div>

        <!-- Post-Trade Reflection -->
        <div class="card reflection-card" *ngIf="!editingReflection()">
          <div class="card-header-row">
            <h3 class="card-title">Post-Trade Reflection</h3>
            <button (click)="editingReflection.set(true)" class="edit-btn">
              {{ trade()!.whatWentRight ? 'Edit' : 'Add Reflection →' }}
            </button>
          </div>
          <div *ngIf="trade()!.whatWentRight || trade()!.whatWentWrong; else noReflection">
            <div class="thinking-item" *ngIf="trade()!.whatWentRight">
              <span class="tl positive">✓ What went right</span>
              <p class="tv">{{ trade()!.whatWentRight }}</p>
            </div>
            <div class="thinking-item" *ngIf="trade()!.whatWentWrong">
              <span class="tl negative">✗ What went wrong</span>
              <p class="tv">{{ trade()!.whatWentWrong }}</p>
            </div>
            <div class="thinking-item" *ngIf="trade()!.willRepeat">
              <span class="tl">→ Will repeat</span>
              <p class="tv">{{ trade()!.willRepeat }}</p>
            </div>
            <div class="thinking-item" *ngIf="trade()!.willAvoid">
              <span class="tl">✗ Will avoid</span>
              <p class="tv">{{ trade()!.willAvoid }}</p>
            </div>
            <div class="discipline-score" *ngIf="trade()!.disciplineScore">
              Discipline Score: <strong>{{ trade()!.disciplineScore }}/10</strong>
            </div>
          </div>
          <ng-template #noReflection>
            <div class="no-reflection">⚠ Post-trade reflection not completed. Add it now — this is where the learning happens.</div>
          </ng-template>
        </div>

        <!-- Reflection Edit Form -->
        <div class="card reflection-card" *ngIf="editingReflection()">
          <h3 class="card-title">Add / Update Reflection</h3>
          <div class="reflection-form">
            <div class="form-group">
              <label>Exit Price</label>
              <input type="number" [(ngModel)]="ref.exitPrice" class="form-input" placeholder="If not already set" />
            </div>
            <div class="form-group">
              <label>What went right?</label>
              <textarea [(ngModel)]="ref.whatWentRight" rows="2" class="form-textarea" placeholder="Process, execution, patience..."></textarea>
            </div>
            <div class="form-group">
              <label>What went wrong?</label>
              <textarea [(ngModel)]="ref.whatWentWrong" rows="2" class="form-textarea" placeholder="Be honest. Mistakes only compound if unacknowledged."></textarea>
            </div>
            <div class="form-group">
              <label>What will you repeat?</label>
              <textarea [(ngModel)]="ref.willRepeat" rows="2" class="form-textarea"></textarea>
            </div>
            <div class="form-group">
              <label>What will you avoid?</label>
              <textarea [(ngModel)]="ref.willAvoid" rows="2" class="form-textarea"></textarea>
            </div>
            <div class="form-group">
              <label>Discipline Score (1-10)</label>
              <input type="number" [(ngModel)]="ref.disciplineScore" min="1" max="10" class="form-input" />
            </div>
            <div class="form-group sl-check">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="ref.slRespected" />
                <span>SL was respected</span>
              </label>
            </div>
            <div class="form-actions">
              <button (click)="editingReflection.set(false)" class="btn-ghost">Cancel</button>
              <button (click)="saveReflection()" class="btn-primary" [disabled]="saving()">
                {{ saving() ? 'Saving...' : 'Save Reflection' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 1200px; }
    .back-link { color: #64748b; text-decoration: none; font-size: 13px; display: block; margin-bottom: 12px; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .page-title { font-size: 28px; font-weight: 700; color: #e2e8f0; margin: 0 0 4px; display: flex; align-items: center; gap: 12px; }
    .trade-id-text { font-size: 13px; color: #475569; font-family: monospace; margin: 0; }
    .dir-badge { font-size: 14px; padding: 4px 12px; border-radius: 6px; &.buy { background: rgba(34,197,94,0.12); color: #22c55e; } &.sell { background: rgba(239,68,68,0.12); color: #ef4444; } }
    .pnl-hero { text-align: right; }
    .pnl-amount { display: block; font-size: 36px; font-weight: 800; &.positive { color: #22c55e; } &.negative { color: #ef4444; } }
    .pnl-pct { font-size: 16px; color: #64748b; }
    .positive { color: #22c55e !important; } .negative { color: #ef4444 !important; }

    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .reflection-card { grid-column: 1 / -1; }

    .card { background: #0d1117; border: 1px solid #1e2433; border-radius: 12px; padding: 20px; }
    .card-title { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 16px; }
    .card-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; .card-title { margin: 0; } }
    .edit-btn { font-size: 13px; color: #3b82f6; background: none; border: none; cursor: pointer; &:hover { text-decoration: underline; } }

    .data-grid { display: flex; flex-direction: column; gap: 8px; }
    .data-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #111827; }
    .dl { font-size: 12px; color: #475569; }
    .dv { font-size: 13px; color: #94a3b8; font-weight: 500; }
    .dv.sl { color: #f59e0b; }
    .status-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px;
      &.profit { color: #22c55e; background: rgba(34,197,94,0.12); }
      &.loss { color: #ef4444; background: rgba(239,68,68,0.12); }
      &.open { color: #3b82f6; background: rgba(59,130,246,0.12); }
      &.breakeven { color: #94a3b8; background: rgba(148,163,184,0.12); }
    }

    .thinking-item { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #111827; &:last-child { border-bottom: none; } }
    .tl { font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px; &.positive { color: #22c55e; } &.negative { color: #ef4444; } }
    .tv { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0; }
    .emotion-tag { font-size: 12px; padding: 3px 10px; border-radius: 4px;
      &.calm, &.disciplined { color: #22c55e; background: rgba(34,197,94,0.1); }
      &.fomo { color: #f59e0b; background: rgba(245,158,11,0.1); }
      &.revenge { color: #ef4444; background: rgba(239,68,68,0.1); }
      &.hesitation, &.anxious { color: #94a3b8; background: rgba(148,163,184,0.1); }
      &.overconfident { color: #fb923c; background: rgba(251,146,60,0.1); }
    }
    .tags-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag { font-size: 11px; color: #7c3aed; background: rgba(124,58,237,0.1); padding: 3px 8px; border-radius: 4px; }

    .no-reflection { font-size: 13px; color: #f59e0b; padding: 16px; background: rgba(245,158,11,0.06); border-radius: 8px; border-left: 3px solid #f59e0b; }
    .discipline-score { font-size: 13px; color: #64748b; margin-top: 12px; strong { color: #3b82f6; } }

    .reflection-form { display: flex; flex-direction: column; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-input, .form-textarea { background: #0a0e1a; border: 1px solid #1e2433; border-radius: 8px; color: #e2e8f0; padding: 10px 12px; font-size: 14px; outline: none; &:focus { border-color: #3b82f6; } font-family: inherit; line-height: 1.5; }
    .form-textarea { resize: vertical; min-height: 70px; }
    .sl-check { flex-direction: row; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: #94a3b8; text-transform: none; letter-spacing: 0; font-weight: 400; input { accent-color: #3b82f6; } }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; }
    .btn-primary { background: #3b82f6; color: #fff; padding: 10px 24px; border-radius: 8px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; &:disabled { opacity: 0.6; } }
    .btn-ghost { background: none; border: 1px solid #1e2433; color: #64748b; padding: 10px 20px; border-radius: 8px; font-size: 14px; cursor: pointer; }
  `]
})
export class TradeDetailComponent implements OnInit {
  trade = signal<Trade | null>(null);
  editingReflection = signal(false);
  saving = signal(false);
  ref: any = {};

  constructor(private route: ActivatedRoute, private tradeService: TradeService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.tradeService.getTradeById(id).subscribe(t => {
      this.trade.set(t);
      this.ref = {
        exitPrice: t.exitPrice,
        whatWentRight: t.whatWentRight || '',
        whatWentWrong: t.whatWentWrong || '',
        willRepeat: t.willRepeat || '',
        willAvoid: t.willAvoid || '',
        disciplineScore: t.disciplineScore,
        slRespected: t.slRespected,
        isReviewed: true
      };
    });
  }

  saveReflection() {
    const id = this.trade()!.id;
    this.saving.set(true);
    this.tradeService.updateTrade(id, this.ref).subscribe(t => {
      this.trade.set(t);
      this.saving.set(false);
      this.editingReflection.set(false);
    });
  }
}
