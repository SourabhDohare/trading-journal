// src/app/features/trades/trade-form.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TradeService } from '../../core/services/trade.service';

@Component({
  selector: 'app-trade-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <a routerLink="/trades" class="back-link">← Back to Journal</a>
          <h1 class="page-title">Log New Trade</h1>
          <p class="page-subtitle warning-text" *ngIf="strictMode()">⚡ Strict Mode Active — Incomplete entries will be rejected</p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="trade-form">

        <!-- Section 1: Core Trade Data -->
        <div class="form-section">
          <h2 class="section-title">Core Trade Data</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Instrument *</label>
              <input formControlName="instrument" placeholder="NIFTY, RELIANCE, BTC..." class="form-input" />
              <span class="error" *ngIf="submitted && f['instrument'].errors">Instrument required</span>
            </div>
            <div class="form-group">
              <label>Instrument Type *</label>
              <select formControlName="instrumentType" class="form-select">
                <option value="">Select type</option>
                <option value="STOCK">Stock</option>
                <option value="FO_FUTURES">F&O Futures</option>
                <option value="FO_OPTIONS">F&O Options</option>
                <option value="CRYPTO">Crypto</option>
                <option value="INDEX">Index</option>
                <option value="FOREX">Forex</option>
                <option value="COMMODITY">Commodity</option>
              </select>
            </div>
            <div class="form-group">
              <label>Trade Type *</label>
              <div class="toggle-group">
                <button type="button" *ngFor="let t of ['INTRADAY','SWING','POSITIONAL']"
                  [class.active]="form.get('tradeType')?.value===t"
                  (click)="set('tradeType',t)" class="toggle-btn">{{ t }}</button>
              </div>
            </div>
            <div class="form-group">
              <label>Direction *</label>
              <div class="toggle-group">
                <button type="button" [class.active-buy]="form.get('direction')?.value==='BUY'"
                  (click)="set('direction','BUY')" class="toggle-btn buy">BUY ↑</button>
                <button type="button" [class.active-sell]="form.get('direction')?.value==='SELL'"
                  (click)="set('direction','SELL')" class="toggle-btn sell">SELL ↓</button>
              </div>
            </div>
            <div class="form-group">
              <label>Entry Price *</label>
              <input type="number" formControlName="entryPrice" placeholder="0.00" class="form-input" step="0.05" />
            </div>
            <div class="form-group">
              <label>Stop Loss * <span class="hint">Non-negotiable</span></label>
              <input type="number" formControlName="stopLoss" placeholder="0.00" class="form-input sl-input" step="0.05" />
              <span class="error" *ngIf="submitted && f['stopLoss'].errors">SL is mandatory — no SL, no trade</span>
            </div>
            <div class="form-group">
              <label>Target *</label>
              <input type="number" formControlName="target" placeholder="0.00" class="form-input" step="0.05" />
            </div>
            <div class="form-group">
              <label>Exit Price <span class="hint">If closed</span></label>
              <input type="number" formControlName="exitPrice" placeholder="0.00" class="form-input" step="0.05" />
            </div>
            <div class="form-group">
              <label>Position Size * <span class="hint">Shares/Contracts</span></label>
              <input type="number" formControlName="positionSize" placeholder="1" class="form-input" />
            </div>
            <div class="form-group">
              <label>Lot Size <span class="hint">F&O only</span></label>
              <input type="number" formControlName="lotSize" placeholder="50" class="form-input" />
            </div>
            <div class="form-group">
              <label>Risk % of Capital</label>
              <input type="number" formControlName="riskPerTradePercent" placeholder="1.0" class="form-input" step="0.1" />
            </div>
            <div class="form-group">
              <label>Exchange</label>
              <input formControlName="exchange" placeholder="NSE / BSE / MCX..." class="form-input" />
            </div>
          </div>

          <!-- Computed RR Preview -->
          <div class="rr-preview" *ngIf="computedRR()">
            <span class="rr-label">Planned R:R</span>
            <span class="rr-value" [class.rr-good]="computedRR()! >= 1.5" [class.rr-bad]="computedRR()! < 1">
              1 : {{ computedRR() | number:'1.2-2' }}
            </span>
            <span class="rr-warn" *ngIf="computedRR()! < 1">⚠ R:R below 1:1 — reconsider this trade</span>
          </div>
        </div>

        <!-- Section 2: Setup & Market -->
        <div class="form-section">
          <h2 class="section-title">Setup & Market Context</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Setup Type *</label>
              <select formControlName="setupType" class="form-select">
                <option value="">Select setup</option>
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
            </div>
            <div class="form-group">
              <label>Market Context *</label>
              <select formControlName="marketContext" class="form-select">
                <option value="">Select context</option>
                <option value="TRENDING_UP">Trending Up</option>
                <option value="TRENDING_DOWN">Trending Down</option>
                <option value="RANGING">Ranging</option>
                <option value="VOLATILE">Volatile</option>
                <option value="NEWS_DRIVEN">News Driven</option>
                <option value="CONSOLIDATION">Consolidation</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Section 3: MANDATORY THINKING LAYER -->
        <div class="form-section thinking-section">
          <h2 class="section-title">
            Mandatory Thinking Layer
            <span class="mandatory-badge">REQUIRED — Vague answers not accepted</span>
          </h2>

          <div class="form-group full-width">
            <label>Why did you take this trade? * <span class="hint">Be specific. "It looked good" is not acceptable.</span></label>
            <textarea formControlName="whyTookTrade" rows="3" class="form-textarea"
              placeholder="e.g. Price broke above 20-day resistance at 18450 with 2.5x average volume. RSI was 58 — not overbought. FII data showed net buying of ₹2300cr yesterday..."></textarea>
            <div class="char-count" [class.warn]="(f['whyTookTrade'].value?.length||0) < 30">
              {{ f['whyTookTrade'].value?.length || 0 }} chars (min 20)
            </div>
          </div>

          <div class="form-group full-width">
            <label>Your Edge / Setup Logic * <span class="hint">What gives you an advantage in this trade?</span></label>
            <textarea formControlName="edgeOrSetupLogic" rows="3" class="form-textarea"
              placeholder="e.g. Historical backtest shows breakouts above 52-week high with volume > 1.5x average have 68% win rate on NIFTY50 stocks..."></textarea>
          </div>

          <div class="form-group full-width">
            <label>Confirmation Used *</label>
            <textarea formControlName="confirmationUsed" rows="2" class="form-textarea"
              placeholder="e.g. 15min candle close above resistance, volume confirmation, sector momentum aligned..."></textarea>
          </div>

          <div class="form-group full-width">
            <label>Trade Invalidation — What would prove you wrong? *</label>
            <textarea formControlName="invalidationReason" rows="2" class="form-textarea"
              placeholder="e.g. If price closes below 18350 (the breakout zone) on a 15-min candle, the thesis is invalid..."></textarea>
          </div>

          <div class="form-group">
            <label>Emotional State Before Entry * <span class="hint">Be honest — this data is for your benefit</span></label>
            <div class="emotion-grid">
              <button type="button" *ngFor="let e of emotionOptions"
                [class.active]="form.get('emotionalState')?.value===e.value"
                [class]="'emotion-btn ' + e.cls"
                (click)="set('emotionalState', e.value)">
                {{ e.icon }} {{ e.label }}
              </button>
            </div>
            <div class="emotion-warn" *ngIf="form.get('emotionalState')?.value==='FOMO'">
              ⚠ FOMO trades statistically underperform by 40%. Are you sure?
            </div>
            <div class="emotion-warn danger" *ngIf="form.get('emotionalState')?.value==='REVENGE'">
              ✖ Revenge trading is a capital destruction pattern. Consider waiting.
            </div>
          </div>
        </div>

        <!-- Section 4: Outcome (if trade is already closed) -->
        <div class="form-section">
          <h2 class="section-title">Outcome & Tags</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Outcome</label>
              <select formControlName="outcomeTag" class="form-select">
                <option value="OPEN">Still Open</option>
                <option value="PROFIT">Profit</option>
                <option value="LOSS">Loss</option>
                <option value="BREAKEVEN">Breakeven</option>
                <option value="NO_TRADE">No Trade Taken</option>
              </select>
            </div>
            <div class="form-group">
              <label>P&L (₹)</label>
              <input type="number" formControlName="pnlAbsolute" placeholder="Auto-calculated if entry/exit set" class="form-input" />
            </div>
            <div class="form-group">
              <label>Brokerage (₹)</label>
              <input type="number" formControlName="brokerage" placeholder="0" class="form-input" />
            </div>
            <div class="form-group">
              <label>Taxes/STT (₹)</label>
              <input type="number" formControlName="taxes" placeholder="0" class="form-input" />
            </div>
          </div>

          <div class="form-group full-width">
            <label>Tags <span class="hint">Select all that apply</span></label>
            <div class="tags-grid">
              <button type="button" *ngFor="let tag of availableTags"
                [class.active]="selectedTags().includes(tag)"
                (click)="toggleTag(tag)" class="tag-btn">{{ tag }}</button>
            </div>
          </div>

          <div class="form-group full-width">
            <label>Notes / Chart Description</label>
            <textarea formControlName="notes" rows="2" class="form-textarea" placeholder="Additional context, chart observations..."></textarea>
          </div>

          <div class="form-group sl-check">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="slRespected" />
              <span>Stop Loss was respected (not moved / not ignored)</span>
            </label>
            <div class="sl-warn" *ngIf="!f['slRespected'].value">
              You moved or ignored your SL. This is a #DisciplineBreak and will be tracked.
            </div>
          </div>
        </div>

        <!-- Error summary -->
        <div class="error-summary" *ngIf="apiError()">
          <strong>Entry Rejected:</strong> {{ apiError() }}
        </div>

        <div class="form-actions">
          <a routerLink="/trades" class="btn-ghost">Cancel</a>
          <button type="submit" class="btn-primary" [disabled]="loading()">
            {{ loading() ? 'Logging...' : 'Log Trade →' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 900px; }
    .back-link { color: #64748b; text-decoration: none; font-size: 13px; display: block; margin-bottom: 8px; &:hover { color: #3b82f6; } }
    .page-title { font-size: 26px; font-weight: 700; color: #e2e8f0; margin: 0 0 4px; }
    .page-subtitle { margin: 0; font-size: 13px; }
    .warning-text { color: #f59e0b; }

    .trade-form { display: flex; flex-direction: column; gap: 24px; margin-top: 24px; }

    .form-section {
      background: #0d1117;
      border: 1px solid #1e2433;
      border-radius: 12px;
      padding: 24px;
    }
    .thinking-section { border-color: #3b82f6; border-width: 1px; }

    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin: 0 0 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .mandatory-badge { font-size: 10px; background: rgba(59,130,246,0.15); color: #3b82f6; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }

    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.full-width { grid-column: 1 / -1; }

    label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .hint { font-size: 11px; color: #475569; text-transform: none; font-weight: 400; letter-spacing: 0; }

    .form-input, .form-select, .form-textarea {
      background: #0a0e1a;
      border: 1px solid #1e2433;
      border-radius: 8px;
      color: #e2e8f0;
      padding: 10px 12px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s;
      &:focus { border-color: #3b82f6; }
      &::placeholder { color: #334155; }
    }
    .form-textarea { resize: vertical; min-height: 80px; font-family: inherit; line-height: 1.5; }
    .sl-input { border-color: #f59e0b !important; }

    .char-count { font-size: 11px; color: #475569; text-align: right; &.warn { color: #ef4444; } }

    .toggle-group { display: flex; gap: 8px; }
    .toggle-btn {
      flex: 1; padding: 9px 14px; background: #0a0e1a; border: 1px solid #1e2433;
      border-radius: 8px; color: #64748b; font-size: 13px; font-weight: 600; cursor: pointer;
      transition: all 0.15s;
      &.active { background: rgba(59,130,246,0.15); border-color: #3b82f6; color: #3b82f6; }
      &.active-buy { background: rgba(34,197,94,0.12); border-color: #22c55e; color: #22c55e; }
      &.active-sell { background: rgba(239,68,68,0.12); border-color: #ef4444; color: #ef4444; }
      &.buy:hover { border-color: #22c55e; }
      &.sell:hover { border-color: #ef4444; }
    }

    .emotion-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; }
    .emotion-btn {
      padding: 8px 12px; background: #0a0e1a; border: 1px solid #1e2433;
      border-radius: 8px; color: #64748b; font-size: 13px; cursor: pointer; transition: all 0.15s;
      &.calm.active { background: rgba(34,197,94,0.1); border-color: #22c55e; color: #22c55e; }
      &.fomo.active { background: rgba(245,158,11,0.1); border-color: #f59e0b; color: #f59e0b; }
      &.revenge.active { background: rgba(239,68,68,0.1); border-color: #ef4444; color: #ef4444; }
      &.hesitation.active { background: rgba(148,163,184,0.1); border-color: #94a3b8; color: #94a3b8; }
      &.active { border-color: #3b82f6; }
    }
    .emotion-warn { font-size: 12px; color: #f59e0b; margin-top: 6px; padding: 8px 12px; background: rgba(245,158,11,0.08); border-radius: 6px; border-left: 2px solid #f59e0b; &.danger { color: #ef4444; background: rgba(239,68,68,0.08); border-left-color: #ef4444; } }

    .tags-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag-btn { padding: 5px 12px; background: #0a0e1a; border: 1px solid #1e2433; border-radius: 20px; color: #64748b; font-size: 12px; cursor: pointer; transition: all 0.15s; &.active { background: rgba(139,92,246,0.1); border-color: #8b5cf6; color: #a78bfa; } }

    .rr-preview { display: flex; align-items: center; gap: 12px; margin-top: 16px; padding: 12px 16px; background: #0a0e1a; border-radius: 8px; border: 1px solid #1e2433; }
    .rr-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .rr-value { font-size: 20px; font-weight: 700; &.rr-good { color: #22c55e; } &.rr-bad { color: #ef4444; } }
    .rr-warn { font-size: 12px; color: #f59e0b; }

    .sl-check { flex-direction: row; align-items: flex-start; gap: 12px; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: #94a3b8; text-transform: none; letter-spacing: 0; font-weight: 400; input { width: 16px; height: 16px; accent-color: #3b82f6; } }
    .sl-warn { font-size: 12px; color: #ef4444; margin-top: 6px; }

    .error { font-size: 11px; color: #ef4444; }
    .error-summary { background: rgba(239,68,68,0.1); border: 1px solid #ef4444; border-radius: 8px; padding: 14px 16px; color: #f87171; font-size: 14px; }

    .form-actions { display: flex; gap: 12px; justify-content: flex-end; padding-top: 8px; }
    .btn-primary { background: #3b82f6; color: #fff; padding: 12px 28px; border-radius: 8px; border: none; font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none; &:hover { background: #2563eb; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-ghost { background: none; border: 1px solid #1e2433; color: #64748b; padding: 12px 24px; border-radius: 8px; font-size: 15px; cursor: pointer; text-decoration: none; &:hover { border-color: #ef4444; color: #ef4444; } }
  `]
})
export class TradeFormComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  loading = signal(false);
  apiError = signal('');
  selectedTags = signal<string[]>([]);
  strictMode = signal(false);

  availableTags = [
    '#HighConfidence', '#LowConfidence', '#DisciplineBreak', '#FOMO',
    '#PerfectExecution', '#EarlyExit', '#Overtrading', '#HighRR',
    '#Revenge', '#PatientEntry', '#GoodProcess', '#NewsPlay'
  ];

  emotionOptions = [
    { value: 'CALM', label: 'Calm', icon: '◎', cls: 'calm' },
    { value: 'DISCIPLINED', label: 'Disciplined', icon: '✓', cls: 'calm' },
    { value: 'HESITATION', label: 'Hesitation', icon: '?', cls: 'hesitation' },
    { value: 'FOMO', label: 'FOMO', icon: '⚡', cls: 'fomo' },
    { value: 'OVERCONFIDENT', label: 'Overconfident', icon: '↑', cls: 'hesitation' },
    { value: 'REVENGE', label: 'Revenge', icon: '✖', cls: 'revenge' },
    { value: 'ANXIOUS', label: 'Anxious', icon: '~', cls: 'hesitation' },
  ];

  constructor(private fb: FormBuilder, private tradeService: TradeService, private router: Router) {}

  ngOnInit() {
    this.form = this.fb.group({
      instrument: ['', Validators.required],
      instrumentType: ['', Validators.required],
      tradeType: ['INTRADAY', Validators.required],
      direction: ['BUY', Validators.required],
      entryPrice: [null, [Validators.required, Validators.min(0.01)]],
      exitPrice: [null],
      stopLoss: [null, [Validators.required, Validators.min(0.01)]],
      target: [null, [Validators.required, Validators.min(0.01)]],
      positionSize: [null, [Validators.required, Validators.min(1)]],
      lotSize: [null],
      riskPerTradePercent: [null],
      exchange: [''],
      setupType: ['', Validators.required],
      marketContext: ['', Validators.required],
      whyTookTrade: ['', [Validators.required, Validators.minLength(20)]],
      edgeOrSetupLogic: ['', [Validators.required, Validators.minLength(20)]],
      confirmationUsed: ['', Validators.required],
      invalidationReason: ['', Validators.required],
      emotionalState: ['CALM', Validators.required],
      outcomeTag: ['OPEN'],
      pnlAbsolute: [null],
      brokerage: [null],
      taxes: [null],
      notes: [''],
      slRespected: [true],
    });
  }

  get f() { return this.form.controls; }

  computedRR(): number | null {
    const entry = +this.f['entryPrice'].value;
    const sl = +this.f['stopLoss'].value;
    const target = +this.f['target'].value;
    if (!entry || !sl || !target) return null;
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(target - entry);
    return risk > 0 ? reward / risk : null;
  }

  set(field: string, value: string) { this.form.get(field)?.setValue(value); }

  toggleTag(tag: string) {
    this.selectedTags.update(tags =>
      tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]
    );
  }

  // Replace the submit() method entirely
submit() {
  this.submitted = true;
  this.apiError.set('');

  if (this.form.invalid) {
    this.form.markAllAsTouched();
    // Show which fields are invalid
    const invalidFields = Object.keys(this.form.controls)
      .filter(key => this.form.controls[key].invalid);
    this.apiError.set('Please fill required fields: ' + invalidFields.join(', '));
    return;
  }

  this.loading.set(true);
  const payload = { 
    ...this.form.value, 
    tags: this.selectedTags(),
    slRespected: this.form.value.slRespected ?? true
  };

  console.log('Submitting trade payload:', payload); // debug

  this.tradeService.createTrade(payload).subscribe({
    next: (trade) => {
      console.log('Trade saved:', trade);
      this.loading.set(false);
      this.router.navigateByUrl('/trades/' + trade.id, { replaceUrl: true });
    },
    error: (err) => {
      this.loading.set(false);
      console.error('Trade error:', err);
      const body = err.error;
      if (body?.fieldErrors) {
        // Show field-level validation errors from backend
        const msgs = Object.entries(body.fieldErrors)
          .map(([f, m]) => `${f}: ${m}`)
          .join(' | ');
        this.apiError.set(msgs);
      } else if (body?.details?.length) {
        this.apiError.set(body.details.join(' | '));
      } else {
        this.apiError.set(body?.message || JSON.stringify(body) || 'Failed to save trade');
      }
    }
  });
}
}
