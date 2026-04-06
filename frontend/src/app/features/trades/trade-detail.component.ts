// src/app/features/trades/trade-detail.component.ts
import { Component, OnInit, signal } from "@angular/core";
import { CommonModule, DecimalPipe } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { TradeService } from "../../core/services/trade.service";
import { Trade } from "../../shared/models/trade.model";

@Component({
  selector: "app-trade-detail",
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink, FormsModule],
  template: `
    <div class="page" *ngIf="trade(); else loading">
      <!-- Header -->
      <div class="trade-header">
        <a routerLink="/trades" class="back-link">← Back to Journal</a>
        <div class="header-main">
          <div class="header-left">
            <h1 class="trade-instrument">{{ trade()!.instrument }}</h1>
            <span
              class="dir-badge"
              [class.buy]="trade()!.direction === 'BUY'"
              [class.sell]="trade()!.direction === 'SELL'"
            >
              {{ trade()!.direction }}
            </span>
            <span class="reviewed-badge" *ngIf="trade()!.isReviewed"
              >✓ Reviewed</span
            >
          </div>
          <div class="header-right">
            <div
              class="pnl-display"
              *ngIf="trade()!.pnlAbsolute != null"
              [class.pnl-pos]="trade()!.pnlAbsolute! >= 0"
              [class.pnl-neg]="trade()!.pnlAbsolute! < 0"
            >
              {{ trade()!.pnlAbsolute! >= 0 ? "+" : "" }}₹{{
                trade()!.pnlAbsolute | number: "1.0-0"
              }}
            </div>
            <div class="pnl-pct" *ngIf="trade()!.pnlPercent">
              {{ trade()!.pnlPercent! >= 0 ? "+" : ""
              }}{{ trade()!.pnlPercent | number: "1.2-2" }}%
            </div>
          </div>
        </div>
        <div class="header-meta">
          <span class="meta-id">{{ trade()!.tradeId }}</span>
          <span class="meta-dot">·</span>
          <span>{{ trade()!.tradeDate | date: "MMM d, yyyy HH:mm" }}</span>
          <span class="meta-dot">·</span>
          <span
            class="status-pill"
            [ngClass]="trade()!.outcomeTag?.toLowerCase()"
            >{{ trade()!.outcomeTag }}</span
          >
        </div>
      </div>

      <!-- Body Grid -->
      <div class="detail-grid">
        <!-- LEFT: Trade Data -->
        <div class="card">
          <h3 class="card-title">Trade Data</h3>
          <div class="data-rows">
            <div class="data-row">
              <span class="dl">Type</span>
              <span class="dv"
                >{{ trade()!.tradeType }} · {{ trade()!.instrumentType }}</span
              >
            </div>
            <div class="data-row">
              <span class="dl">Entry</span>
              <span class="dv"
                >₹{{ trade()!.entryPrice | number: "1.2-2" }}</span
              >
            </div>
            <div class="data-row">
              <span class="dl">Exit</span>
              <span class="dv" [class.open-val]="!trade()!.exitPrice">
                {{
                  trade()!.exitPrice
                    ? "₹" + (trade()!.exitPrice | number: "1.2-2")
                    : "Open"
                }}
              </span>
            </div>
            <div class="data-row">
              <span class="dl">Stop Loss</span>
              <span class="dv sl-val"
                >₹{{ trade()!.stopLoss | number: "1.2-2" }}</span
              >
            </div>
            <div class="data-row">
              <span class="dl">Target</span>
              <span class="dv">₹{{ trade()!.target | number: "1.2-2" }}</span>
            </div>
            <div class="data-row">
              <span class="dl">Size</span>
              <span class="dv"
                >{{ trade()!.positionSize }}
                <span *ngIf="trade()!.lotSize" class="sub-val"
                  >× lot {{ trade()!.lotSize }}</span
                >
              </span>
            </div>
            <div class="data-row">
              <span class="dl">Planned R:R</span>
              <span class="dv">{{
                trade()!.plannedRR
                  ? "1:" + (trade()!.plannedRR | number: "1.2-2")
                  : "—"
              }}</span>
            </div>
            <div class="data-row">
              <span class="dl">Actual R:R</span>
              <span
                class="dv"
                [class.rr-good]="(trade()!.actualRR || 0) >= 1"
                [class.rr-bad]="
                  (trade()!.actualRR || 0) < 1 && trade()!.actualRR
                "
              >
                {{
                  trade()!.actualRR
                    ? (trade()!.actualRR | number: "1.2-2")
                    : "—"
                }}
              </span>
            </div>
            <div class="data-row" *ngIf="trade()!.brokerage || trade()!.taxes">
              <span class="dl">Costs</span>
              <span class="dv neg-val">
                ₹{{
                  (trade()!.brokerage || 0) + (trade()!.taxes || 0)
                    | number: "1.2-2"
                }}
              </span>
            </div>
            <div class="data-row">
              <span class="dl">Setup</span>
              <span class="dv setup-val">{{ trade()!.setupType }}</span>
            </div>
            <div class="data-row">
              <span class="dl">Market</span>
              <span class="dv">{{ trade()!.marketContext }}</span>
            </div>
            <div class="data-row">
              <span class="dl">Exchange</span>
              <span class="dv">{{ trade()!.exchange || "—" }}</span>
            </div>
            <div class="data-row">
              <span class="dl">SL Respected</span>
              <span
                class="dv"
                [class.pos-val]="trade()!.slRespected"
                [class.neg-val]="!trade()!.slRespected"
              >
                {{ trade()!.slRespected ? "✓ Yes" : "✗ No — #DisciplineBreak" }}
              </span>
            </div>
            <div class="data-row">
              <span class="dl">Status</span>
              <span
                class="status-pill"
                [ngClass]="trade()!.outcomeTag?.toLowerCase()"
                >{{ trade()!.outcomeTag }}</span
              >
            </div>
          </div>

          <!-- Time Frames -->
          <div class="tf-section" *ngIf="(trade()!.timeFrames || []).length">
            <h4 class="sub-title">Time Frames Used</h4>
            <div class="tf-list">
              <span
                *ngFor="let tf of trade()!.timeFrames"
                class="tf-pill"
                [ngClass]="tfColorClass(tf)"
                >{{ tf }}</span
              >
            </div>
          </div>

          <!-- Tags -->
          <div class="tags-section" *ngIf="(trade()!.tags || []).length">
            <h4 class="sub-title">Tags</h4>
            <div class="tags-list">
              <span *ngFor="let tag of trade()!.tags" class="tag-chip">{{
                tag
              }}</span>
            </div>
          </div>
        </div>

        <!-- RIGHT: Thinking Layer -->
        <div class="card">
          <h3 class="card-title">Thinking Layer</h3>
          <div class="thinking-rows">
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
              <span
                class="emotion-pill"
                [ngClass]="trade()!.emotionalState?.toLowerCase()"
              >
                {{ trade()!.emotionalState }}
              </span>
            </div>
            <div class="thinking-item" *ngIf="(trade()!.tags || []).length">
              <span class="tl">Tags</span>
              <div class="tags-list" style="margin-top:4px">
                <span *ngFor="let tag of trade()!.tags" class="tag-chip">{{
                  tag
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Chart Images — full width if present -->
        <div
          class="card images-card"
          *ngIf="(trade()!.chartImageUrls || []).length"
        >
          <h3 class="card-title">
            Chart Screenshots
            <span class="img-count"
              >{{ (trade()!.chartImageUrls || []).length }} image{{
                (trade()!.chartImageUrls || []).length > 1 ? "s" : ""
              }}</span
            >
          </h3>
          <div class="images-grid">
            <div
              *ngFor="let img of trade()!.chartImageUrls; let i = index"
              class="image-wrap"
              (click)="openImage(img)"
            >
              <img [src]="img" [alt]="'Chart ' + (i + 1)" class="chart-img" />
              <div class="image-hover-label">
                Chart {{ i + 1 }} · Click to expand
              </div>
            </div>
          </div>
        </div>

        <!-- Lightbox -->
        <div
          class="lightbox"
          *ngIf="lightboxImg()"
          (click)="lightboxImg.set(null)"
        >
          <img [src]="lightboxImg()!" class="lightbox-img" />
          <button class="lightbox-close" (click)="lightboxImg.set(null)">
            ✕
          </button>
        </div>

        <!-- Post-Trade Reflection — single form, always editable -->
        <div class="card reflection-card">
          <div class="reflection-header">
            <h3 class="card-title">Post-Trade Reflection</h3>
            <button
              *ngIf="!editingReflection()"
              (click)="editingReflection.set(true)"
              class="edit-btn"
            >
              {{ hasReflection() ? "Edit ✏" : "Add Reflection +" }}
            </button>
          </div>

          <!-- View mode — shown when not editing and reflection exists -->
          <div
            *ngIf="!editingReflection() && hasReflection()"
            class="reflection-view"
          >
            <div class="rv-row" *ngIf="trade()!.exitPrice">
              <span class="rl">Exit Price</span>
              <span class="rv"
                >₹{{ trade()!.exitPrice | number: "1.2-2" }}</span
              >
            </div>
            <div class="rv-row" *ngIf="trade()!.whatWentRight">
              <span class="rl pos-label">✓ What went right</span>
              <p class="rv">{{ trade()!.whatWentRight }}</p>
            </div>
            <div class="rv-row" *ngIf="trade()!.whatWentWrong">
              <span class="rl neg-label">✗ What went wrong</span>
              <p class="rv">{{ trade()!.whatWentWrong }}</p>
            </div>
            <div class="rv-row" *ngIf="trade()!.willRepeat">
              <span class="rl">→ Will repeat</span>
              <p class="rv">{{ trade()!.willRepeat }}</p>
            </div>
            <div class="rv-row" *ngIf="trade()!.willAvoid">
              <span class="rl">✗ Will avoid</span>
              <p class="rv">{{ trade()!.willAvoid }}</p>
            </div>
            <div class="score-display" *ngIf="trade()!.disciplineScore">
              <span class="rl">Discipline Score</span>
              <div class="score-chips">
                <span
                  *ngFor="let s of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
                  class="score-chip"
                  [class.active]="trade()!.disciplineScore === s"
                  [ngClass]="
                    s <= 3 ? 'score-low' : s <= 6 ? 'score-mid' : 'score-high'
                  "
                >
                  {{ s }}
                </span>
              </div>
            </div>
          </div>

          <!-- No reflection placeholder -->
          <div
            *ngIf="!editingReflection() && !hasReflection()"
            class="no-reflection"
          >
            <p>Exit price update is not set</p>
            <p class="no-ref-sub">
              Post-trade reflection not filled in yet. Take 2 minutes to review
              this trade.
            </p>
            <button
              (click)="editingReflection.set(true)"
              class="add-reflection-btn"
            >
              Add Reflection →
            </button>
          </div>

          <!-- Edit / Add form -->
          <div *ngIf="editingReflection()" class="reflection-form">
            <div class="rf-group">
              <label class="rf-label"
                >Exit Price
                <span class="rf-hint">Update if not set</span></label
              >
              <input
                type="number"
                [(ngModel)]="ref.exitPrice"
                class="rf-input"
                placeholder="Exit price"
              />
            </div>
            <div class="rf-group">
              <label class="rf-label pos-label">What went right?</label>
              <textarea
                [(ngModel)]="ref.whatWentRight"
                rows="2"
                class="rf-textarea"
                placeholder="Process, execution, patience — be specific"
              ></textarea>
            </div>
            <div class="rf-group">
              <label class="rf-label neg-label">What went wrong?</label>
              <textarea
                [(ngModel)]="ref.whatWentWrong"
                rows="2"
                class="rf-textarea"
                placeholder="Be honest. Mistakes only compound if unacknowledged."
              ></textarea>
            </div>
            <div class="rf-group">
              <label class="rf-label">What will you repeat?</label>
              <textarea
                [(ngModel)]="ref.willRepeat"
                rows="2"
                class="rf-textarea"
              ></textarea>
            </div>
            <div class="rf-group">
              <label class="rf-label">What will you avoid?</label>
              <textarea
                [(ngModel)]="ref.willAvoid"
                rows="2"
                class="rf-textarea"
              ></textarea>
            </div>
            <div class="rf-group">
              <label class="rf-label">Discipline Score (1–10)</label>
              <div class="score-btn-row">
                <button
                  *ngFor="let s of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
                  type="button"
                  class="score-btn"
                  [class.active]="ref.disciplineScore === s"
                  [ngClass]="
                    s <= 3 ? 'sbtn-low' : s <= 6 ? 'sbtn-mid' : 'sbtn-high'
                  "
                  (click)="ref.disciplineScore = s"
                >
                  {{ s }}
                </button>
              </div>
            </div>
            <div class="rf-group rf-check">
              <label class="check-label">
                <input type="checkbox" [(ngModel)]="ref.slRespected" />
                <span>SL was respected</span>
              </label>
            </div>
            <div class="rf-error" *ngIf="saveError()">{{ saveError() }}</div>
            <div class="rf-actions">
              <button (click)="cancelEdit()" class="btn-ghost-sm">
                Cancel
              </button>
              <button
                (click)="saveReflection()"
                class="btn-primary-sm"
                [disabled]="saving()"
              >
                {{ saving() ? "Saving..." : "Save Reflection ✓" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div class="loading-page">Loading trade...</div>
    </ng-template>
  `,
  styles: [
    `
      .page {
        padding: 32px;
        max-width: 1400px;
      }
      .loading-page {
        text-align: center;
        padding: 100px;
        color: #64748b;
      }

      /* ─── Header ─────────────────────────────────────────── */
      .back-link {
        color: #64748b;
        text-decoration: none;
        font-size: 13px;
        display: block;
        margin-bottom: 12px;
      }
      .back-link:hover {
        color: #3b82f6;
      }
      .trade-header {
        margin-bottom: 28px;
      }
      .header-main {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      }
      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .trade-instrument {
        font-size: 28px;
        font-weight: 800;
        color: #e2e8f0;
        margin: 0;
      }
      .dir-badge {
        font-size: 12px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 6px;
      }
      .dir-badge.buy {
        background: rgba(34, 197, 94, 0.12);
        color: #22c55e;
        border: 1px solid #22c55e;
      }
      .dir-badge.sell {
        background: rgba(239, 68, 68, 0.12);
        color: #ef4444;
        border: 1px solid #ef4444;
      }
      .reviewed-badge {
        font-size: 11px;
        color: #22c55e;
        background: rgba(34, 197, 94, 0.1);
        padding: 3px 8px;
        border-radius: 20px;
      }
      .header-right {
        text-align: right;
      }
      .pnl-display {
        font-size: 36px;
        font-weight: 800;
      }
      .pnl-display.pnl-pos {
        color: #22c55e;
      }
      .pnl-display.pnl-neg {
        color: #ef4444;
      }
      .pnl-pct {
        font-size: 13px;
        color: #64748b;
        margin-top: 2px;
      }
      .header-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #475569;
        flex-wrap: wrap;
      }
      .meta-id {
        font-family: monospace;
        font-size: 12px;
      }
      .meta-dot {
        color: #1e2433;
      }

      /* ─── Grid ───────────────────────────────────────────── */
      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      /* ─── Cards ──────────────────────────────────────────── */
      .card {
        background: #0d1117;
        border: 1px solid #1e2433;
        border-radius: 12px;
        padding: 22px;
      }
      .images-card {
        grid-column: 1 / -1;
      }
      .reflection-card {
        grid-column: 1 / -1;
      }
      .card-title {
        font-size: 12px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin: 0 0 16px;
      }

      /* ─── Data rows ──────────────────────────────────────── */
      .data-rows {
        display: flex;
        flex-direction: column;
        gap: 0;
      }
      .data-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid #111827;
      }
      .data-row:last-of-type {
        border-bottom: none;
      }
      .dl {
        font-size: 13px;
        color: #475569;
      }
      .dv {
        font-size: 13px;
        color: #94a3b8;
        font-weight: 500;
      }
      .sub-val {
        font-size: 11px;
        color: #475569;
        margin-left: 6px;
      }
      .open-val {
        color: #3b82f6;
      }
      .sl-val {
        color: #f59e0b;
        font-weight: 600;
      }
      .pos-val {
        color: #22c55e;
      }
      .neg-val {
        color: #ef4444;
      }
      .rr-good {
        color: #22c55e;
        font-weight: 600;
      }
      .rr-bad {
        color: #ef4444;
      }
      .setup-val {
        color: #7c3aed;
      }

      /* ─── Status pills ───────────────────────────────────── */
      .status-pill {
        font-size: 11px;
        font-weight: 700;
        padding: 3px 9px;
        border-radius: 4px;
      }
      .status-pill.profit {
        color: #22c55e;
        background: rgba(34, 197, 94, 0.12);
      }
      .status-pill.loss {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.12);
      }
      .status-pill.open {
        color: #3b82f6;
        background: rgba(59, 130, 246, 0.12);
      }
      .status-pill.breakeven {
        color: #f59e0b;
        background: rgba(245, 158, 11, 0.12);
      }

      /* ─── Time Frames ────────────────────────────────────── */
      .tf-section {
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid #1e2433;
      }
      .sub-title {
        font-size: 11px;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0 0 10px;
      }
      .tf-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .tf-pill {
        font-size: 12px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 14px;
        border: 1px solid;
      }
      .tf-short {
        background: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.4);
        color: #3b82f6;
      }
      .tf-medium {
        background: rgba(139, 92, 246, 0.1);
        border-color: rgba(139, 92, 246, 0.4);
        color: #a78bfa;
      }
      .tf-long {
        background: rgba(20, 184, 166, 0.1);
        border-color: rgba(20, 184, 166, 0.4);
        color: #2dd4bf;
      }

      /* ─── Tags ───────────────────────────────────────────── */
      .tags-section {
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid #1e2433;
      }
      .tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .tag-chip {
        font-size: 12px;
        color: #a78bfa;
        background: rgba(139, 92, 246, 0.1);
        border: 1px solid rgba(139, 92, 246, 0.3);
        padding: 3px 9px;
        border-radius: 12px;
      }

      /* ─── Thinking Layer ─────────────────────────────────── */
      .thinking-rows {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .thinking-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .tl {
        font-size: 11px;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .tv {
        font-size: 14px;
        color: #94a3b8;
        margin: 0;
        line-height: 1.6;
      }
      .emotion-pill {
        display: inline-block;
        font-size: 12px;
        font-weight: 700;
        padding: 4px 12px;
        border-radius: 20px;
      }
      .emotion-pill.calm,
      .emotion-pill.disciplined {
        color: #22c55e;
        background: rgba(34, 197, 94, 0.1);
      }
      .emotion-pill.fomo {
        color: #f59e0b;
        background: rgba(245, 158, 11, 0.1);
      }
      .emotion-pill.revenge {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
      }
      .emotion-pill.hesitation,
      .emotion-pill.anxious {
        color: #94a3b8;
        background: rgba(148, 163, 184, 0.1);
      }
      .emotion-pill.overconfident {
        color: #fb923c;
        background: rgba(251, 146, 60, 0.1);
      }

      /* ─── Chart Images ───────────────────────────────────── */
      .img-count {
        font-size: 12px;
        color: #a78bfa;
        background: rgba(139, 92, 246, 0.1);
        padding: 2px 8px;
        border-radius: 12px;
        margin-left: 8px;
        font-weight: 600;
        text-transform: none;
        letter-spacing: 0;
      }
      .images-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
      }
      .image-wrap {
        position: relative;
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid #1e2433;
        cursor: pointer;
        aspect-ratio: 16/9;
        transition: border-color 0.15s;
      }
      .image-wrap:hover {
        border-color: #3b82f6;
      }
      .chart-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .image-hover-label {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
        color: #fff;
        font-size: 11px;
        padding: 12px 8px 6px;
        opacity: 0;
        transition: opacity 0.15s;
      }
      .image-wrap:hover .image-hover-label {
        opacity: 1;
      }

      /* ─── Lightbox ───────────────────────────────────────── */
      .lightbox {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.92);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: zoom-out;
      }
      .lightbox-img {
        max-width: 92vw;
        max-height: 88vh;
        border-radius: 8px;
        object-fit: contain;
      }
      .lightbox-close {
        position: fixed;
        top: 20px;
        right: 24px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #fff;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        font-size: 16px;
        cursor: pointer;
      }
      .lightbox-close:hover {
        background: rgba(239, 68, 68, 0.4);
      }

      /* ─── Reflection ─────────────────────────────────────── */
      .reflection-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .reflection-header .card-title {
        margin: 0;
      }
      .edit-btn {
        font-size: 13px;
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
        color: #3b82f6;
        padding: 6px 14px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .edit-btn:hover {
        background: rgba(59, 130, 246, 0.2);
      }

      .reflection-view {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .rv-row {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .rl {
        font-size: 11px;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .rv {
        font-size: 14px;
        color: #94a3b8;
        margin: 0;
        line-height: 1.6;
      }
      .pos-label {
        color: #22c55e !important;
      }
      .neg-label {
        color: #ef4444 !important;
      }
      .score-display {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .score-chips {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .score-chip {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        background: #0a0e1a;
        border: 1px solid #1e2433;
        color: #475569;
      }
      .score-chip.active.score-low {
        background: rgba(239, 68, 68, 0.15);
        border-color: #ef4444;
        color: #ef4444;
      }
      .score-chip.active.score-mid {
        background: rgba(245, 158, 11, 0.15);
        border-color: #f59e0b;
        color: #f59e0b;
      }
      .score-chip.active.score-high {
        background: rgba(34, 197, 94, 0.15);
        border-color: #22c55e;
        color: #22c55e;
      }

      .no-reflection {
        text-align: center;
        padding: 28px 16px;
        color: #475569;
      }
      .no-reflection p {
        margin: 0 0 6px;
        font-size: 14px;
      }
      .no-ref-sub {
        font-size: 12px;
        color: #334155;
      }
      .add-reflection-btn {
        margin-top: 12px;
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
        color: #3b82f6;
        padding: 8px 18px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
      }

      .reflection-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .rf-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .rf-label {
        font-size: 11px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .rf-hint {
        font-size: 10px;
        color: #334155;
        text-transform: none;
        font-weight: 400;
      }
      .rf-input,
      .rf-textarea {
        background: #0a0e1a;
        border: 1px solid #1e2433;
        border-radius: 8px;
        color: #e2e8f0;
        padding: 10px 12px;
        font-size: 14px;
        outline: none;
      }
      .rf-input:focus,
      .rf-textarea:focus {
        border-color: #3b82f6;
      }
      .rf-textarea {
        resize: vertical;
        min-height: 72px;
        font-family: inherit;
        line-height: 1.5;
      }
      .rf-check {
        flex-direction: row;
        align-items: center;
      }
      .check-label {
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
      .check-label input {
        width: 16px;
        height: 16px;
        accent-color: #3b82f6;
      }
      .score-btn-row {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .score-btn {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 1px solid #1e2433;
        background: #0a0e1a;
        color: #64748b;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
      }
      .score-btn:hover {
        border-color: #3b82f6;
        color: #3b82f6;
      }
      .score-btn.active.sbtn-low {
        background: rgba(239, 68, 68, 0.15);
        border-color: #ef4444;
        color: #ef4444;
      }
      .score-btn.active.sbtn-mid {
        background: rgba(245, 158, 11, 0.15);
        border-color: #f59e0b;
        color: #f59e0b;
      }
      .score-btn.active.sbtn-high {
        background: rgba(34, 197, 94, 0.15);
        border-color: #22c55e;
        color: #22c55e;
      }
      .rf-error {
        font-size: 12px;
        color: #ef4444;
      }
      .rf-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        padding-top: 4px;
      }
      .btn-primary-sm {
        background: #3b82f6;
        color: #fff;
        padding: 9px 20px;
        border-radius: 8px;
        border: none;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-primary-sm:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .btn-ghost-sm {
        background: none;
        border: 1px solid #1e2433;
        color: #64748b;
        padding: 9px 16px;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
      }
      .btn-ghost-sm:hover {
        border-color: #ef4444;
        color: #ef4444;
      }
    `,
  ],
})
export class TradeDetailComponent implements OnInit {
  trade = signal<Trade | null>(null);
  editingReflection = signal(false);
  saving = signal(false);
  saveError = signal("");
  lightboxImg = signal<string | null>(null);

  ref: {
    exitPrice?: number | null;
    whatWentRight: string;
    whatWentWrong: string;
    willRepeat: string;
    willAvoid: string;
    disciplineScore?: number;
    slRespected: boolean;
    isReviewed: boolean;
  } = {
    exitPrice: null,
    whatWentRight: "",
    whatWentWrong: "",
    willRepeat: "",
    willAvoid: "",
    disciplineScore: undefined,
    slRespected: true,
    isReviewed: true,
  };

  constructor(
    private route: ActivatedRoute,
    private tradeService: TradeService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get("id")!;
    this.tradeService.getTradeById(id).subscribe((t) => {
      this.trade.set(t);
      // Pre-fill ref from existing data
      this.ref = {
        exitPrice: t.exitPrice ?? null,
        whatWentRight: t.whatWentRight || "",
        whatWentWrong: t.whatWentWrong || "",
        willRepeat: t.willRepeat || "",
        willAvoid: t.willAvoid || "",
        disciplineScore: t.disciplineScore,
        slRespected: t.slRespected,
        isReviewed: true,
      };
      // Auto-open reflection if incomplete
      if (!this.hasReflection()) {
        this.editingReflection.set(true);
      }
    });
  }

  hasReflection(): boolean {
    const t = this.trade();
    return !!(
      t?.whatWentRight ||
      t?.whatWentWrong ||
      t?.willRepeat ||
      t?.willAvoid ||
      t?.disciplineScore
    );
  }

  cancelEdit() {
    const t = this.trade();
    if (t) {
      this.ref = {
        exitPrice: t.exitPrice ?? null,
        whatWentRight: t.whatWentRight || "",
        whatWentWrong: t.whatWentWrong || "",
        willRepeat: t.willRepeat || "",
        willAvoid: t.willAvoid || "",
        disciplineScore: t.disciplineScore,
        slRespected: t.slRespected,
        isReviewed: true,
      };
    }
    this.editingReflection.set(false);
    this.saveError.set("");
  }

  saveReflection() {
    const t = this.trade();
    if (!t) return;
    this.saving.set(true);
    this.saveError.set("");

    const payload: Partial<Trade> = {
      whatWentRight: this.ref.whatWentRight,
      whatWentWrong: this.ref.whatWentWrong,
      willRepeat: this.ref.willRepeat,
      willAvoid: this.ref.willAvoid,
      disciplineScore: this.ref.disciplineScore,
      slRespected: this.ref.slRespected,
      isReviewed: true,
    };
    if (this.ref.exitPrice && +this.ref.exitPrice > 0) {
      payload.exitPrice = +this.ref.exitPrice;
    }

    this.tradeService.updateTrade(t.id, payload).subscribe({
      next: (updated) => {
        this.trade.set(updated);
        this.saving.set(false);
        this.editingReflection.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.saveError.set(
          err?.error?.message || "Failed to save. Please try again.",
        );
      },
    });
  }

  openImage(img: string) {
    this.lightboxImg.set(img);
  }

  // Time frame color helpers
  tfColorClass(tf: string): string {
    const short = ["1min", "3min", "5min", "10min", "15min"];
    const medium = ["30min", "45min", "90min", "1hr", "2hr"];
    if (short.includes(tf)) return "tf-short";
    if (medium.includes(tf)) return "tf-medium";
    return "tf-long";
  }
}
