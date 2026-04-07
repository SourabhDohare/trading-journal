// src/app/features/journal/journal.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TradeService } from '../../core/services/trade.service';
import { Analytics } from '../../shared/models/analytics.model';

@Component({
  selector: 'app-journal',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Daily Journal</h1>
        <p class="page-subtitle">Pre/post market notes and session review</p>
      </div>

      <div class="journal-grid">
        <!-- ─── Left: Journal Form ─── -->
        <div class="card">
          <h3 class="card-title">Today's Session — {{ today | date:'EEEE, MMM d' }}</h3>

          <div class="journal-form">

            <div class="form-group">
              <label>Market Bias</label>
              <div class="bias-group">
                <button *ngFor="let b of ['Bullish','Neutral','Bearish']"
                        (click)="bias = b"
                        [class.active]="bias === b"
                        [ngClass]="'bias-btn ' + b.toLowerCase()">
                  {{ b }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Pre-Market Notes / Key Levels</label>
              <textarea [(ngModel)]="preNote" rows="4" class="form-textarea"
                placeholder="Support: 18,200 | Resistance: 18,500&#10;Watch: CPI data at 12:00, FII flow...&#10;Plan: Only trade breakouts above 18,450 with volume">
              </textarea>
            </div>

            <div class="form-group">
              <label>News to Watch</label>
              <input [(ngModel)]="newsNote" class="form-input"
                     placeholder="Fed minutes, budget announcement, results..." />
            </div>

            <div class="divider">Post-Session Review</div>

            <div class="form-group">
              <label>Lesson Learned Today</label>
              <textarea [(ngModel)]="lesson" rows="3" class="form-textarea"
                placeholder="What did the market teach you today?"></textarea>
            </div>

            <div class="form-group">
              <label>Session Mood</label>
              <div class="mood-group">
                <button *ngFor="let m of moodOptions"
                        (click)="mood = m.val"
                        [class.active]="mood === m.val"
                        class="mood-btn">
                  {{ m.icon }} {{ m.label }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Overall Discipline Score (1–10)</label>
              <input type="range" [(ngModel)]="disciplineScore" min="1" max="10" class="score-range" />
              <span class="score-display">{{ disciplineScore }}/10</span>
            </div>

            <!-- Save button — disabled while saving to prevent double-click INP -->
            <button class="btn-save" (click)="save()" [disabled]="saving()">
              {{ saving() ? 'Saving...' : 'Save Journal Entry' }}
            </button>

          </div>
        </div>

        <!-- ─── Right: Today's Stats ─── -->
        <div class="card today-stats" *ngIf="todayStats()">
          <h3 class="card-title">Today's Stats</h3>

          <div class="stat-row">
            <span>Trades</span>
            <span>{{ todayStats()!.totalTrades }}</span>
          </div>
          <div class="stat-row">
            <span>Win Rate</span>
            <span>{{ todayStats()!.winRate | number:'1.1-1' }}%</span>
          </div>
          <div class="stat-row">
            <span>P&L</span>
            <span [class.pos]="todayStats()!.totalPnl >= 0"
                  [class.neg]="todayStats()!.totalPnl < 0">
              ₹{{ todayStats()!.totalPnl | number:'1.0-0' }}
            </span>
          </div>
          <div class="stat-row">
            <span>Best Trade</span>
            <span class="pos">₹{{ todayStats()!.bestTrade | number:'1.0-0' }}</span>
          </div>
          <div class="stat-row">
            <span>Worst Trade</span>
            <span class="neg">₹{{ todayStats()!.worstTrade | number:'1.0-0' }}</span>
          </div>

          <div class="agent-feedback"
               *ngIf="todayStats()!.recommendations?.length || todayStats()!.repeatingMistakes?.length">
            <h4>Agent Feedback</h4>
            <div *ngFor="let r of todayStats()!.recommendations"  class="feedback-item warning">{{ r }}</div>
            <div *ngFor="let m of todayStats()!.repeatingMistakes" class="feedback-item danger">{{ m }}</div>
          </div>
        </div>
      </div>

      <!-- ─── Toast — replaces alert() ─── -->
      <div class="toast" *ngIf="toastVisible()" [ngClass]="'toast-' + toastType()">
        <span class="toast-icon">{{ toastType() === 'success' ? '✓' : '✗' }}</span>
        <span class="toast-msg">{{ toastMessage() }}</span>
        <button class="toast-close" (click)="toastVisible.set(false)">✕</button>
      </div>

    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 1200px; position: relative; }
    .page-title { font-size: 26px; font-weight: 700; color: #e2e8f0; margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: #64748b; margin: 0 0 24px; }

    .journal-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }

    .card { background: #0d1117; border: 1px solid #1e2433; border-radius: 12px; padding: 24px; }
    .card-title { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 20px; }

    .journal-form { display: flex; flex-direction: column; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }

    label { font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }

    .form-input, .form-textarea {
      background: #0a0e1a; border: 1px solid #1e2433; border-radius: 8px;
      color: #e2e8f0; padding: 10px 12px; font-size: 14px; outline: none;
      font-family: inherit; line-height: 1.5;
    }
    .form-input:focus, .form-textarea:focus { border-color: #3b82f6; }
    .form-textarea { resize: vertical; }

    /* ─── Market Bias ───────────────────────────────── */
    .bias-group { display: flex; gap: 8px; }
    .bias-btn {
      padding: 7px 16px; background: #0a0e1a; border: 1px solid #1e2433;
      border-radius: 8px; color: #64748b; font-size: 13px; cursor: pointer; transition: all 0.15s;
    }
    .bias-btn.bullish.active { background: rgba(34,197,94,0.1);  border-color: #22c55e; color: #22c55e; }
    .bias-btn.neutral.active { background: rgba(59,130,246,0.1); border-color: #3b82f6; color: #3b82f6; }
    .bias-btn.bearish.active { background: rgba(239,68,68,0.1);  border-color: #ef4444; color: #ef4444; }

    /* ─── Session Mood ──────────────────────────────── */
    .mood-group { display: flex; gap: 8px; flex-wrap: wrap; }
    .mood-btn {
      padding: 7px 14px; background: #0a0e1a; border: 1px solid #1e2433;
      border-radius: 8px; color: #64748b; font-size: 12px; cursor: pointer; transition: all 0.15s;
    }
    .mood-btn.active { border-color: #3b82f6; color: #3b82f6; background: rgba(59,130,246,0.08); }

    /* ─── Discipline score ──────────────────────────── */
    .score-range { width: 100%; accent-color: #3b82f6; }
    .score-display { font-size: 14px; font-weight: 700; color: #3b82f6; text-align: center; display: block; }

    .divider {
      font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
      color: #334155; text-align: center;
      border-top: 1px solid #1e2433; padding-top: 12px; margin-top: 4px;
    }

    /* ─── Save button ───────────────────────────────── */
    .btn-save {
      background: #3b82f6; color: #fff; padding: 11px 24px;
      border-radius: 8px; border: none; font-size: 14px; font-weight: 600;
      cursor: pointer; align-self: flex-start; transition: background 0.15s;
    }
    .btn-save:hover:not(:disabled) { background: #2563eb; }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

    /* ─── Today's Stats ─────────────────────────────── */
    .today-stats { height: fit-content; }
    .stat-row {
      display: flex; justify-content: space-between;
      padding: 10px 0; border-bottom: 1px solid #111827;
      font-size: 14px; color: #94a3b8;
    }
    .stat-row:last-of-type { border-bottom: none; }
    .pos { color: #22c55e; }
    .neg { color: #ef4444; }

    .agent-feedback { margin-top: 16px; border-top: 1px solid #1e2433; padding-top: 16px; }
    .agent-feedback h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #475569; margin: 0 0 10px; }
    .feedback-item { font-size: 12px; padding: 8px 12px; border-radius: 6px; margin-bottom: 6px; line-height: 1.4; }
    .feedback-item.warning { background: rgba(245,158,11,0.08); color: #fbbf24; border-left: 2px solid #f59e0b; }
    .feedback-item.danger  { background: rgba(239,68,68,0.08);  color: #f87171; border-left: 2px solid #ef4444; }

    /* ─── Toast — NO alert() blocking ──────────────── */
    .toast {
      position: fixed;
      bottom: 32px;
      right: 32px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      z-index: 9999;
      animation: slide-up 0.25s ease;
      max-width: 380px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .toast-success {
      background: rgba(34,197,94,0.12);
      border: 1px solid rgba(34,197,94,0.4);
      color: #22c55e;
    }
    .toast-error {
      background: rgba(239,68,68,0.12);
      border: 1px solid rgba(239,68,68,0.4);
      color: #ef4444;
    }
    .toast-icon { font-size: 16px; font-weight: 800; flex-shrink: 0; }
    .toast-msg  { flex: 1; }
    .toast-close {
      background: none; border: none; cursor: pointer;
      color: inherit; font-size: 14px; opacity: 0.6; padding: 0; flex-shrink: 0;
    }
    .toast-close:hover { opacity: 1; }
  `]
})
export class JournalComponent implements OnInit {

  today          = new Date();
  bias           = 'Neutral';
  preNote        = '';
  newsNote       = '';
  lesson         = '';
  mood           = 'GOOD';
  disciplineScore = 7;

  todayStats = signal<Analytics | null>(null);

  // ─── Toast state (replaces blocking alert) ─────────────
  saving       = signal(false);
  toastMessage = signal('');
  toastType    = signal<'success' | 'error'>('success');
  toastVisible = signal(false);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  moodOptions = [
    { val: 'EXCELLENT', label: 'Excellent', icon: '◎' },
    { val: 'GOOD',      label: 'Good',      icon: '○' },
    { val: 'NEUTRAL',   label: 'Neutral',   icon: '—' },
    { val: 'POOR',      label: 'Poor',      icon: '▽' },
    { val: 'TERRIBLE',  label: 'Terrible',  icon: '✗' },
  ];

  constructor(private tradeService: TradeService) {}

  ngOnInit() {
    this.tradeService.getDailyReport().subscribe(s => this.todayStats.set(s));

    // Load any previously saved journal for today
    const savedKey = this.todayKey();
    const saved = localStorage.getItem(savedKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.bias            = data.bias            ?? 'Neutral';
        this.preNote         = data.preNote         ?? '';
        this.newsNote        = data.newsNote         ?? '';
        this.lesson          = data.lesson          ?? '';
        this.mood            = data.mood            ?? 'GOOD';
        this.disciplineScore = data.disciplineScore ?? 7;
      } catch (_) {}
    }
  }

  save() {
    if (this.saving()) return; // prevent double-click
    this.saving.set(true);

    // Build payload
    const payload = {
      bias:            this.bias,
      preNote:         this.preNote,
      newsNote:        this.newsNote,
      lesson:          this.lesson,
      mood:            this.mood,
      disciplineScore: this.disciplineScore,
      savedAt:         new Date().toISOString(),
    };

    // setTimeout(0) defers the work off the main thread click handler
    // → fixes the 3791ms INP block caused by synchronous alert()
    setTimeout(() => {
      try {
        localStorage.setItem(this.todayKey(), JSON.stringify(payload));
        this.saving.set(false);
        this.showToast('Journal entry saved ✓', 'success');

        // ── When DailySession API is ready, replace localStorage with:
        // this.journalService.saveSession(payload).subscribe({
        //   next:  () => { this.saving.set(false); this.showToast('Saved ✓', 'success'); },
        //   error: () => { this.saving.set(false); this.showToast('Save failed.', 'error'); }
        // });

      } catch (e) {
        this.saving.set(false);
        this.showToast('Failed to save. Please try again.', 'error');
      }
    }, 0);
  }

  private showToast(message: string, type: 'success' | 'error') {
    // Clear any existing timer so rapid saves don't stack
    if (this.toastTimer) clearTimeout(this.toastTimer);

    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);

    // Auto-dismiss after 3 seconds
    this.toastTimer = setTimeout(() => this.toastVisible.set(false), 3000);
  }

  private todayKey(): string {
    return 'tradepulse_journal_' + new Date().toISOString().split('T')[0];
  }
}