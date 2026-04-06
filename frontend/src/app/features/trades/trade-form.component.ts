// src/app/features/trades/trade-form.component.ts
import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { TradeService } from "../../core/services/trade.service";
import { TIME_FRAMES } from "../../shared/models/trade.model";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";

@Component({
  selector: "app-trade-form",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <a routerLink="/trades" class="back-link">← Back to Journal</a>
          <h1 class="page-title">Log New Trade</h1>
          <p class="page-subtitle warning-text" *ngIf="strictMode()">
            ⚡ Strict Mode Active — Incomplete entries will be rejected
          </p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="trade-form">
        <!-- Section 1: Core Trade Data -->
        <div class="form-section">
          <h2 class="section-title">Core Trade Data</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Instrument *</label>
              <input
                formControlName="instrument"
                placeholder="NIFTY, RELIANCE, BTC..."
                class="form-input"
              />
              <span class="error" *ngIf="submitted && f['instrument'].errors"
                >Instrument required</span
              >
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
                <button
                  type="button"
                  *ngFor="let t of ['INTRADAY', 'SWING', 'POSITIONAL']"
                  [class.active]="form.get('tradeType')?.value === t"
                  (click)="set('tradeType', t)"
                  class="toggle-btn"
                >
                  {{ t }}
                </button>
              </div>
            </div>
            <div class="form-group">
              <label>Direction *</label>
              <div class="toggle-group">
                <button
                  type="button"
                  [class.active-buy]="form.get('direction')?.value === 'BUY'"
                  (click)="set('direction', 'BUY')"
                  class="toggle-btn buy"
                >
                  BUY ↑
                </button>
                <button
                  type="button"
                  [class.active-sell]="form.get('direction')?.value === 'SELL'"
                  (click)="set('direction', 'SELL')"
                  class="toggle-btn sell"
                >
                  SELL ↓
                </button>
              </div>
            </div>
            <div class="form-group">
              <label>Entry Price *</label>
              <input
                type="number"
                formControlName="entryPrice"
                placeholder="0.00"
                class="form-input"
                step="0.05"
              />
            </div>
            <div class="form-group">
              <label
                >Stop Loss * <span class="hint">Non-negotiable</span></label
              >
              <input
                type="number"
                formControlName="stopLoss"
                placeholder="0.00"
                class="form-input sl-input"
                step="0.05"
              />
              <span class="error" *ngIf="submitted && f['stopLoss'].errors"
                >SL is mandatory</span
              >
            </div>
            <div class="form-group">
              <label>Target *</label>
              <input
                type="number"
                formControlName="target"
                placeholder="0.00"
                class="form-input"
                step="0.05"
              />
            </div>
            <div class="form-group">
              <label>
                Exit Price
                <span class="hint" *ngIf="!isExitPriceSet()"
                  >Leave blank if still open</span
                >
                <span class="hint-green" *ngIf="isExitPriceSet()"
                  >✓ Trade will be marked closed</span
                >
              </label>
              <input
                type="number"
                formControlName="exitPrice"
                placeholder="0.00"
                class="form-input"
                [class.exit-set]="isExitPriceSet()"
                step="0.05"
              />
            </div>
            <div class="form-group">
              <label
                >Position Size *
                <span class="hint">Shares/Contracts</span></label
              >
              <input
                type="number"
                formControlName="positionSize"
                placeholder="1"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>Lot Size <span class="hint">F&O only</span></label>
              <input
                type="number"
                formControlName="lotSize"
                placeholder="50"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>Risk % of Capital</label>
              <input
                type="number"
                formControlName="riskPerTradePercent"
                placeholder="1.0"
                class="form-input"
                step="0.1"
              />
            </div>
            <div class="form-group">
              <label>Exchange</label>
              <input
                formControlName="exchange"
                placeholder="NSE / BSE / MCX..."
                class="form-input"
              />
            </div>
          </div>

          <!-- RR Preview -->
          <div class="rr-preview" *ngIf="computedRR()">
            <span class="rr-label">Planned R:R</span>
            <span
              class="rr-value"
              [class.rr-good]="computedRR()! >= 1.5"
              [class.rr-bad]="computedRR()! < 1"
            >
              1 : {{ computedRR() | number: "1.2-2" }}
            </span>
            <span class="rr-warn" *ngIf="computedRR()! < 1"
              >⚠ R:R below 1:1 — reconsider this trade</span
            >
          </div>
        </div>

        <!-- Section 2: Setup, Market & Time Frames -->
        <div class="form-section">
          <h2 class="section-title">Setup, Market Context & Time Frames</h2>
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

          <!-- Time Frames — multi-select tags -->
          <div class="form-group full-width tf-section">
            <label>
              Time Frame(s) Used
              <span class="hint"
                >Select all time frames you analysed for this trade</span
              >
            </label>
            <div class="tf-grid">
              <button
                type="button"
                *ngFor="let tf of timeFrameOptions"
                [class.active]="selectedTimeFrames().includes(tf)"
                [class.tf-short]="isShortTf(tf)"
                [class.tf-medium]="isMediumTf(tf)"
                [class.tf-long]="isLongTf(tf)"
                (click)="toggleTimeFrame(tf)"
                class="tf-btn"
              >
                {{ tf }}
              </button>
            </div>
            <div class="tf-selected" *ngIf="selectedTimeFrames().length">
              Selected:
              <span *ngFor="let tf of selectedTimeFrames()" class="tf-chip">{{
                tf
              }}</span>
            </div>
          </div>
        </div>

        <!-- Section 3: MANDATORY THINKING LAYER -->
        <div class="form-section thinking-section">
          <h2 class="section-title">
            Mandatory Thinking Layer
            <span class="mandatory-badge"
              >REQUIRED — Vague answers not accepted</span
            >
          </h2>

          <div class="form-group full-width">
            <label
              >Why did you take this trade? *
              <span class="hint"
                >Be specific. "It looked good" is not acceptable.</span
              ></label
            >
            <textarea
              formControlName="whyTookTrade"
              rows="3"
              class="form-textarea"
              placeholder="e.g. Price broke above 20-day resistance at 18450 with 2.5x average volume..."
            ></textarea>
            <div
              class="char-count"
              [class.warn]="(f['whyTookTrade'].value?.length || 0) < 30"
            >
              {{ f["whyTookTrade"].value?.length || 0 }} chars (min 20)
            </div>
          </div>

          <div class="form-group full-width">
            <label
              >Your Edge / Setup Logic *
              <span class="hint">What gives you an advantage?</span></label
            >
            <textarea
              formControlName="edgeOrSetupLogic"
              rows="3"
              class="form-textarea"
              placeholder="e.g. Historical backtest shows breakouts above 52-week high with volume > 1.5x have 68% win rate..."
            ></textarea>
          </div>

          <div class="form-group full-width">
            <label>Confirmation Used *</label>
            <textarea
              formControlName="confirmationUsed"
              rows="2"
              class="form-textarea"
              placeholder="e.g. 15min candle close above resistance, volume confirmation, sector momentum aligned..."
            ></textarea>
          </div>

          <div class="form-group full-width">
            <label>Trade Invalidation — What would prove you wrong? *</label>
            <textarea
              formControlName="invalidationReason"
              rows="2"
              class="form-textarea"
              placeholder="e.g. If price closes below 18350 on a 15-min candle, the thesis is invalid..."
            ></textarea>
          </div>

          <div class="form-group">
            <label
              >Emotional State Before Entry *
              <span class="hint"
                >Be honest — this data is for your benefit</span
              ></label
            >
            <div class="emotion-grid">
              <button
                type="button"
                *ngFor="let e of emotionOptions"
                [class.active]="form.get('emotionalState')?.value === e.value"
                [class]="'emotion-btn ' + e.cls"
                (click)="set('emotionalState', e.value)"
              >
                {{ e.icon }} {{ e.label }}
              </button>
            </div>
            <div
              class="emotion-warn"
              *ngIf="form.get('emotionalState')?.value === 'FOMO'"
            >
              ⚠ FOMO trades statistically underperform by 40%. Are you sure?
            </div>
            <div
              class="emotion-warn danger"
              *ngIf="form.get('emotionalState')?.value === 'REVENGE'"
            >
              ✖ Revenge trading is a capital destruction pattern. Consider
              waiting.
            </div>
          </div>
        </div>

        <!-- Section 4: Outcome & Tags -->
        <div class="form-section">
          <h2 class="section-title">Outcome & Tags</h2>
          <div class="form-grid">
            <!-- Outcome -->
            <div class="form-group">
              <label>
                Outcome
                <span class="hint" *ngIf="!isExitPriceSet()"
                  >Select if trade is closed</span
                >
                <span class="hint-green" *ngIf="isExitPriceSet()"
                  >Auto-calculated from exit price</span
                >
              </label>
              <select
                *ngIf="!isExitPriceSet()"
                formControlName="outcomeTag"
                class="form-select"
              >
                <option value="OPEN">Still Open</option>
                <option value="PROFIT">Profit</option>
                <option value="LOSS">Loss</option>
                <option value="BREAKEVEN">Breakeven</option>
                <option value="NO_TRADE">No Trade Taken</option>
              </select>
              <div
                *ngIf="isExitPriceSet()"
                class="outcome-display"
                [ngClass]="outcomeColorClass()"
              >
                <span class="outcome-lock-icon">🔒</span>
                <span class="outcome-lock-text">{{
                  form.getRawValue().outcomeTag
                }}</span>
              </div>
              <span
                *ngIf="isExitPriceSet()"
                class="auto-badge"
                [ngClass]="'badge-' + outcomeColorClass()"
              >
                ✓ Auto-set — {{ form.getRawValue().outcomeTag }} based on exit
                price
              </span>
            </div>

            <div class="form-group">
              <label
                >P&L (₹)
                <span class="hint" *ngIf="isExitPriceSet()"
                  >Auto-calculated</span
                ></label
              >
              <input
                type="number"
                formControlName="pnlAbsolute"
                [placeholder]="
                  isExitPriceSet()
                    ? 'Calculated on save'
                    : 'Enter manually if known'
                "
                class="form-input"
                [class.input-muted]="isExitPriceSet()"
              />
            </div>
            <div class="form-group">
              <label>Brokerage (₹)</label>
              <input
                type="number"
                formControlName="brokerage"
                placeholder="0"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>Taxes/STT (₹)</label>
              <input
                type="number"
                formControlName="taxes"
                placeholder="0"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group full-width">
            <label>Tags <span class="hint">Select all that apply</span></label>
            <div class="tags-grid">
              <button
                type="button"
                *ngFor="let tag of availableTags"
                [class.active]="selectedTags().includes(tag)"
                (click)="toggleTag(tag)"
                class="tag-btn"
              >
                {{ tag }}
              </button>
            </div>
          </div>

          <div class="form-group full-width">
            <label>Notes / Chart Description</label>
            <textarea
              formControlName="notes"
              rows="2"
              class="form-textarea"
              placeholder="Additional context, chart observations..."
            ></textarea>
          </div>

          <div class="form-group sl-check">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="slRespected" />
              <span>Stop Loss was respected (not moved / not ignored)</span>
            </label>
            <div class="sl-warn" *ngIf="!f['slRespected'].value">
              You moved or ignored your SL. This is a #DisciplineBreak and will
              be tracked.
            </div>
          </div>
        </div>

        <!-- Section 5: Chart Images -->
        <div class="form-section">
          <h2 class="section-title">
            Chart Screenshots
            <span class="img-count-badge">{{ chartImages().length }}/5</span>
          </h2>
          <p class="section-sub">
            Attach up to 5 chart images — entry, exit, multi-timeframe analysis
          </p>

          <!-- Upload area -->
          <div
            class="upload-area"
            (click)="triggerFileInput()"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event)"
            [class.drag-over]="isDragOver()"
            *ngIf="chartImages().length < 5"
          >
            <input
              type="file"
              #fileInput
              accept="image/*"
              multiple
              style="display:none"
              (change)="onFilesSelected($event)"
            />
            <div class="upload-icon">↑</div>
            <div class="upload-text">Click or drag images here</div>
            <div class="upload-sub">
              PNG, JPG, WebP — max 500KB each ·
              {{ 5 - chartImages().length }} slot(s) remaining
            </div>
          </div>

          <!-- Image previews -->
          <div class="image-grid" *ngIf="chartImages().length">
            <div
              *ngFor="let img of chartImages(); let i = index"
              class="image-card"
            >
              <img [src]="img" alt="Chart {{ i + 1 }}" class="chart-preview" />
              <div class="image-overlay">
                <button
                  type="button"
                  class="img-remove-btn"
                  (click)="removeImage(i)"
                  title="Remove"
                >
                  ✕
                </button>
                <span class="img-label">Chart {{ i + 1 }}</span>
              </div>
            </div>
          </div>

          <div class="img-error" *ngIf="imageError()">{{ imageError() }}</div>
        </div>

        <!-- Error summary -->
        <div class="error-summary" *ngIf="apiError()">
          <strong>Entry Rejected:</strong> {{ apiError() }}
        </div>

        <div class="form-actions">
          <a routerLink="/trades" class="btn-ghost">Cancel</a>
          <button type="submit" class="btn-primary" [disabled]="loading()">
            {{ loading() ? "Logging..." : "Log Trade →" }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 32px;
        max-width: 900px;
      }
      .back-link {
        color: #64748b;
        text-decoration: none;
        font-size: 13px;
        display: block;
        margin-bottom: 8px;
      }
      .back-link:hover {
        color: #3b82f6;
      }
      .page-title {
        font-size: 26px;
        font-weight: 700;
        color: #e2e8f0;
        margin: 0 0 4px;
      }
      .page-subtitle {
        margin: 0;
        font-size: 13px;
      }
      .warning-text {
        color: #f59e0b;
      }
      .trade-form {
        display: flex;
        flex-direction: column;
        gap: 24px;
        margin-top: 24px;
      }

      .form-section {
        background: #0d1117;
        border: 1px solid #1e2433;
        border-radius: 12px;
        padding: 24px;
      }
      .thinking-section {
        border-color: #3b82f6;
      }
      .section-sub {
        font-size: 13px;
        color: #475569;
        margin: -12px 0 16px;
      }

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
      .mandatory-badge {
        font-size: 10px;
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
        padding: 3px 8px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .img-count-badge {
        font-size: 12px;
        background: rgba(139, 92, 246, 0.15);
        color: #a78bfa;
        padding: 3px 10px;
        border-radius: 20px;
        font-weight: 600;
        text-transform: none;
        letter-spacing: 0;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .form-group.full-width {
        grid-column: 1 / -1;
      }

      label {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .hint {
        font-size: 11px;
        color: #475569;
        text-transform: none;
        font-weight: 400;
        letter-spacing: 0;
      }
      .hint-green {
        font-size: 11px;
        color: #22c55e;
        text-transform: none;
        font-weight: 600;
        letter-spacing: 0;
      }

      .form-input,
      .form-select,
      .form-textarea {
        background: #0a0e1a;
        border: 1px solid #1e2433;
        border-radius: 8px;
        color: #e2e8f0;
        padding: 10px 12px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.15s;
      }
      .form-input:focus,
      .form-select:focus,
      .form-textarea:focus {
        border-color: #3b82f6;
      }
      .form-input::placeholder,
      .form-textarea::placeholder {
        color: #334155;
      }
      .form-textarea {
        resize: vertical;
        min-height: 80px;
        font-family: inherit;
        line-height: 1.5;
      }
      .sl-input {
        border-color: #f59e0b !important;
      }
      .form-input.exit-set {
        border-color: #22c55e !important;
      }
      .form-input.input-muted {
        border-color: #1e2433;
        color: #475569;
      }

      /* ─── Outcome locked display ───────────────────────── */
      .outcome-display {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border-radius: 8px;
        border: 1px solid;
        min-height: 42px;
      }
      .outcome-lock-icon {
        font-size: 14px;
        flex-shrink: 0;
      }
      .outcome-lock-text {
        font-size: 15px;
        font-weight: 800;
        letter-spacing: 1px;
      }
      .outcome-profit {
        background: rgba(34, 197, 94, 0.08);
        border-color: #22c55e;
        color: #22c55e;
      }
      .outcome-loss {
        background: rgba(239, 68, 68, 0.08);
        border-color: #ef4444;
        color: #ef4444;
      }
      .outcome-breakeven {
        background: rgba(245, 158, 11, 0.08);
        border-color: #f59e0b;
        color: #f59e0b;
      }
      .outcome-open {
        background: rgba(59, 130, 246, 0.08);
        border-color: #3b82f6;
        color: #3b82f6;
      }
      .auto-badge {
        font-size: 11px;
        font-weight: 600;
        margin-top: 4px;
        display: block;
      }
      .badge-outcome-profit {
        color: #22c55e;
      }
      .badge-outcome-loss {
        color: #ef4444;
      }
      .badge-outcome-breakeven {
        color: #f59e0b;
      }
      .badge-outcome-open {
        color: #3b82f6;
      }

      /* ─── Time Frames ──────────────────────────────────── */
      .tf-section {
        margin-top: 16px;
      }
      .tf-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 4px;
      }
      .tf-btn {
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
      .tf-btn:hover {
        border-color: #3b82f6;
        color: #3b82f6;
      }
      /* Short timeframes — blue family */
      .tf-btn.tf-short.active {
        background: rgba(59, 130, 246, 0.12);
        border-color: #3b82f6;
        color: #3b82f6;
      }
      /* Medium timeframes — purple family */
      .tf-btn.tf-medium.active {
        background: rgba(139, 92, 246, 0.12);
        border-color: #8b5cf6;
        color: #a78bfa;
      }
      /* Long timeframes — teal family */
      .tf-btn.tf-long.active {
        background: rgba(20, 184, 166, 0.12);
        border-color: #14b8a6;
        color: #2dd4bf;
      }

      .tf-selected {
        margin-top: 10px;
        font-size: 12px;
        color: #64748b;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
      }
      .tf-chip {
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
        color: #3b82f6;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }

      /* ─── RR Preview ───────────────────────────────────── */
      .rr-preview {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 16px;
        padding: 12px 16px;
        background: #0a0e1a;
        border-radius: 8px;
        border: 1px solid #1e2433;
      }
      .rr-label {
        font-size: 12px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .rr-value {
        font-size: 20px;
        font-weight: 700;
      }
      .rr-value.rr-good {
        color: #22c55e;
      }
      .rr-value.rr-bad {
        color: #ef4444;
      }
      .rr-warn {
        font-size: 12px;
        color: #f59e0b;
      }

      /* ─── Toggle buttons ───────────────────────────────── */
      .toggle-group {
        display: flex;
        gap: 8px;
      }
      .toggle-btn {
        flex: 1;
        padding: 9px 14px;
        background: #0a0e1a;
        border: 1px solid #1e2433;
        border-radius: 8px;
        color: #64748b;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
      }
      .toggle-btn.active {
        background: rgba(59, 130, 246, 0.15);
        border-color: #3b82f6;
        color: #3b82f6;
      }
      .toggle-btn.active-buy {
        background: rgba(34, 197, 94, 0.12);
        border-color: #22c55e;
        color: #22c55e;
      }
      .toggle-btn.active-sell {
        background: rgba(239, 68, 68, 0.12);
        border-color: #ef4444;
        color: #ef4444;
      }
      .toggle-btn.buy:hover {
        border-color: #22c55e;
      }
      .toggle-btn.sell:hover {
        border-color: #ef4444;
      }

      /* ─── Emotion buttons ──────────────────────────────── */
      .emotion-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 8px;
      }
      .emotion-btn {
        padding: 8px 12px;
        background: #0a0e1a;
        border: 1px solid #1e2433;
        border-radius: 8px;
        color: #64748b;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .emotion-btn.calm.active {
        background: rgba(34, 197, 94, 0.1);
        border-color: #22c55e;
        color: #22c55e;
      }
      .emotion-btn.fomo.active {
        background: rgba(245, 158, 11, 0.1);
        border-color: #f59e0b;
        color: #f59e0b;
      }
      .emotion-btn.revenge.active {
        background: rgba(239, 68, 68, 0.1);
        border-color: #ef4444;
        color: #ef4444;
      }
      .emotion-btn.hesitation.active {
        background: rgba(148, 163, 184, 0.1);
        border-color: #94a3b8;
        color: #94a3b8;
      }
      .emotion-btn.active {
        border-color: #3b82f6;
      }
      .emotion-warn {
        font-size: 12px;
        color: #f59e0b;
        margin-top: 6px;
        padding: 8px 12px;
        background: rgba(245, 158, 11, 0.08);
        border-radius: 6px;
        border-left: 2px solid #f59e0b;
      }
      .emotion-warn.danger {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.08);
        border-left-color: #ef4444;
      }

      /* ─── Tags ─────────────────────────────────────────── */
      .tags-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .tag-btn {
        padding: 5px 12px;
        background: #0a0e1a;
        border: 1px solid #1e2433;
        border-radius: 20px;
        color: #64748b;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .tag-btn.active {
        background: rgba(139, 92, 246, 0.1);
        border-color: #8b5cf6;
        color: #a78bfa;
      }

      /* ─── Chart Image Upload ───────────────────────────── */
      .upload-area {
        border: 2px dashed #1e2433;
        border-radius: 12px;
        padding: 32px 24px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        background: #0a0e1a;
        margin-bottom: 16px;
      }
      .upload-area:hover,
      .upload-area.drag-over {
        border-color: #3b82f6;
        background: rgba(59, 130, 246, 0.05);
      }
      .upload-icon {
        font-size: 28px;
        color: #3b82f6;
        margin-bottom: 8px;
        font-weight: 700;
      }
      .upload-text {
        font-size: 14px;
        color: #94a3b8;
        font-weight: 600;
        margin-bottom: 4px;
      }
      .upload-sub {
        font-size: 12px;
        color: #475569;
      }

      .image-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 12px;
        margin-top: 8px;
      }
      .image-card {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #1e2433;
        aspect-ratio: 16/9;
      }
      .chart-preview {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .image-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        padding: 6px;
        opacity: 0;
        transition: opacity 0.15s;
      }
      .image-card:hover .image-overlay {
        opacity: 1;
      }
      .img-remove-btn {
        background: #ef4444;
        border: none;
        color: #fff;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        font-size: 11px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .img-label {
        font-size: 11px;
        color: #fff;
        font-weight: 600;
        background: rgba(0, 0, 0, 0.6);
        padding: 2px 6px;
        border-radius: 4px;
      }
      .img-error {
        font-size: 12px;
        color: #ef4444;
        margin-top: 8px;
      }

      /* ─── SL Check ─────────────────────────────────────── */
      .sl-check {
        flex-direction: row;
        align-items: flex-start;
        gap: 12px;
      }
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 13px;
        color: #94a3b8;
        text-transform: none;
        letter-spacing: 0;
        font-weight: 400;
      }
      .checkbox-label input {
        width: 16px;
        height: 16px;
        accent-color: #3b82f6;
      }
      .sl-warn {
        font-size: 12px;
        color: #ef4444;
        margin-top: 6px;
      }

      .char-count {
        font-size: 11px;
        color: #475569;
        text-align: right;
      }
      .char-count.warn {
        color: #ef4444;
      }
      .error {
        font-size: 11px;
        color: #ef4444;
      }
      .error-summary {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid #ef4444;
        border-radius: 8px;
        padding: 14px 16px;
        color: #f87171;
        font-size: 14px;
      }

      .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding-top: 8px;
      }
      .btn-primary {
        background: #3b82f6;
        color: #fff;
        padding: 12px 28px;
        border-radius: 8px;
        border: none;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
      }
      .btn-primary:hover {
        background: #2563eb;
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .btn-ghost {
        background: none;
        border: 1px solid #1e2433;
        color: #64748b;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 15px;
        cursor: pointer;
        text-decoration: none;
      }
      .btn-ghost:hover {
        border-color: #ef4444;
        color: #ef4444;
      }
    `,
  ],
})
export class TradeFormComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  loading = signal(false);
  apiError = signal("");
  selectedTags = signal<string[]>([]);
  selectedTimeFrames = signal<string[]>([]);
  chartImages = signal<string[]>([]);
  imageError = signal("");
  isDragOver = signal(false);
  strictMode = signal(false);

  readonly timeFrameOptions = [...TIME_FRAMES];

  availableTags = [
    "#HighConfidence",
    "#LowConfidence",
    "#DisciplineBreak",
    "#FOMO",
    "#PerfectExecution",
    "#EarlyExit",
    "#Overtrading",
    "#HighRR",
    "#Revenge",
    "#PatientEntry",
    "#GoodProcess",
    "#NewsPlay",
  ];

  emotionOptions = [
    { value: "CALM", label: "Calm", icon: "◎", cls: "calm" },
    { value: "DISCIPLINED", label: "Disciplined", icon: "✓", cls: "calm" },
    { value: "HESITATION", label: "Hesitation", icon: "?", cls: "hesitation" },
    { value: "FOMO", label: "FOMO", icon: "⚡", cls: "fomo" },
    {
      value: "OVERCONFIDENT",
      label: "Overconfident",
      icon: "↑",
      cls: "hesitation",
    },
    { value: "REVENGE", label: "Revenge", icon: "✖", cls: "revenge" },
    { value: "ANXIOUS", label: "Anxious", icon: "~", cls: "hesitation" },
  ];

  constructor(
    private fb: FormBuilder,
    private tradeService: TradeService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      instrument: ["", Validators.required],
      instrumentType: ["", Validators.required],
      tradeType: ["INTRADAY", Validators.required],
      direction: ["BUY", Validators.required],
      entryPrice: [null, [Validators.required, Validators.min(0.01)]],
      exitPrice: [null],
      stopLoss: [null, [Validators.required, Validators.min(0.01)]],
      target: [null, [Validators.required, Validators.min(0.01)]],
      positionSize: [null, [Validators.required, Validators.min(1)]],
      lotSize: [null],
      riskPerTradePercent: [null],
      exchange: [""],
      setupType: ["", Validators.required],
      marketContext: ["", Validators.required],
      whyTookTrade: ["", [Validators.required, Validators.minLength(20)]],
      edgeOrSetupLogic: ["", [Validators.required, Validators.minLength(20)]],
      confirmationUsed: ["", Validators.required],
      invalidationReason: ["", Validators.required],
      emotionalState: ["CALM", Validators.required],
      outcomeTag: ["OPEN"],
      pnlAbsolute: [null],
      brokerage: [null],
      taxes: [null],
      notes: [""],
      slRespected: [true],
    });

    // Auto-set outcome when exit price is filled
    this.form
      .get("exitPrice")
      ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((exitPrice) => {
        const oc = this.form.get("outcomeTag");
        if (exitPrice && +exitPrice > 0) {
          const entry = +this.form.get("entryPrice")?.value || 0;
          const dir = this.form.get("direction")?.value;
          if (entry > 0) {
            const diff =
              dir === "BUY" ? +exitPrice - entry : entry - +exitPrice;
            oc?.setValue(diff > 0 ? "PROFIT" : diff < 0 ? "LOSS" : "BREAKEVEN");
          }
          oc?.disable();
        } else {
          oc?.enable();
          oc?.setValue("OPEN");
        }
      });

    this.form
      .get("entryPrice")
      ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        const exit = this.form.get("exitPrice")?.value;
        if (exit && +exit > 0)
          this.form.get("exitPrice")?.setValue(exit, { emitEvent: true });
      });

    this.form
      .get("direction")
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe(() => {
        const exit = this.form.get("exitPrice")?.value;
        if (exit && +exit > 0)
          this.form.get("exitPrice")?.setValue(exit, { emitEvent: true });
      });
  }

  get f() {
    return this.form.controls;
  }

  computedRR(): number | null {
    const entry = +this.f["entryPrice"].value;
    const sl = +this.f["stopLoss"].value;
    const target = +this.f["target"].value;
    if (!entry || !sl || !target) return null;
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(target - entry);
    return risk > 0 ? reward / risk : null;
  }

  isExitPriceSet(): boolean {
    const exit = this.form.get("exitPrice")?.value;
    return exit != null && +exit > 0;
  }

  outcomeColorClass(): string {
    const o = this.form.getRawValue().outcomeTag;
    return o === "PROFIT"
      ? "outcome-profit"
      : o === "LOSS"
        ? "outcome-loss"
        : o === "BREAKEVEN"
          ? "outcome-breakeven"
          : "outcome-open";
  }

  set(field: string, value: string) {
    this.form.get(field)?.setValue(value);
  }

  toggleTag(tag: string) {
    this.selectedTags.update((t) =>
      t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag],
    );
  }

  // ─── Time Frame helpers ────────────────────────────────
  toggleTimeFrame(tf: string) {
    this.selectedTimeFrames.update((t) =>
      t.includes(tf) ? t.filter((x) => x !== tf) : [...t, tf],
    );
  }

  isShortTf(tf: string): boolean {
    return ["1min", "3min", "5min", "10min", "15min"].includes(tf);
  }
  isMediumTf(tf: string): boolean {
    return ["30min", "45min", "90min", "1hr", "2hr"].includes(tf);
  }
  isLongTf(tf: string): boolean {
    return ["4hr", "6hr", "12hr", "1day", "1week"].includes(tf);
  }

  // ─── Image Upload ──────────────────────────────────────
  triggerFileInput() {
    const input = document.querySelector(
      "input[type=file]",
    ) as HTMLInputElement;
    input?.click();
  }

  onFilesSelected(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files) this.processFiles(Array.from(files));
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    const files = Array.from(event.dataTransfer?.files || []);
    this.processFiles(files);
  }

  private processFiles(files: File[]) {
    this.imageError.set("");
    const remaining = 5 - this.chartImages().length;
    const toProcess = files.slice(0, remaining);

    if (files.length > remaining) {
      this.imageError.set(
        `Only ${remaining} slot(s) remaining. Extra images were skipped.`,
      );
    }

    toProcess.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        this.imageError.set("Only image files are allowed.");
        return;
      }
      if (file.size > 500 * 1024) {
        this.imageError.set(
          `"${file.name}" exceeds 500KB. Please compress it before uploading.`,
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        if (this.chartImages().length < 5) {
          this.chartImages.update((imgs) => [...imgs, base64]);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    this.chartImages.update((imgs) => imgs.filter((_, i) => i !== index));
  }

  // ─── Submit ────────────────────────────────────────────
  submit() {
    this.submitted = true;
    this.apiError.set("");

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const invalid = Object.keys(this.form.controls).filter(
        (k) => this.form.controls[k].invalid && this.form.controls[k].enabled,
      );
      this.apiError.set("Please fill required fields: " + invalid.join(", "));
      return;
    }

    this.loading.set(true);
    const raw = this.form.getRawValue();

    const payload = {
      ...raw,
      tags: this.selectedTags(),
      timeFrames: this.selectedTimeFrames(),
      chartImageUrls: this.chartImages(),
      slRespected: raw.slRespected ?? true,
    };

    this.tradeService.createTrade(payload).subscribe({
      next: (trade) => {
        this.loading.set(false);
        this.router.navigateByUrl("/trades/" + trade.id, { replaceUrl: true });
      },
      error: (err) => {
        this.loading.set(false);
        const body = err.error;
        if (body?.fieldErrors) {
          this.apiError.set(
            Object.entries(body.fieldErrors)
              .map(([f, m]) => `${f}: ${m}`)
              .join(" | "),
          );
        } else if (body?.details?.length) {
          this.apiError.set(body.details.join(" | "));
        } else {
          this.apiError.set(body?.message || "Failed to save trade");
        }
      },
    });
  }
}
