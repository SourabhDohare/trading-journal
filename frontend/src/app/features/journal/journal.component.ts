// src/app/features/journal/journal.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TradeService } from '../../core/services/trade.service';
import { Analytics } from '../../shared/models/analytics.model';
import { environment } from '../../../environments/environment';

interface DailySession {
  id?: string;
  sessionDate: string;
  marketBias: string;
  preMarketNotes: string;
  newsToWatch: string;
  lessonLearned: string;
  sessionMood: string;
  disciplineScore: number;
  additionalNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-journal',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Daily Journal</h1>
          <p class="page-subtitle">Pre/post market notes and session review</p>
        </div>
        <!-- Tab toggle -->
        <div class="tab-toggle">
          <button (click)="activeTab.set('today')" [class.active]="activeTab()==='today'" class="tab-btn">
            Today
          </button>
          <button (click)="loadHistory()" [class.active]="activeTab()==='history'" class="tab-btn">
            History <span class="history-count" *ngIf="historyCount()">{{ historyCount() }}</span>
          </button>
        </div>
      </div>

      <!-- ══ TODAY TAB ══════════════════════════════════════════════ -->
      <div *ngIf="activeTab() === 'today'">
        <div class="journal-grid">

          <!-- Left: Journal Form -->
          <div class="card">
            <div class="card-title-row">
              <h3 class="card-title">{{ today | date:'EEEE, MMM d, y' }}</h3>
              <span class="saved-indicator" *ngIf="lastSaved()">
                ✓ Saved {{ lastSaved() | date:'HH:mm' }}
              </span>
            </div>

            <div class="journal-form">
              <div class="form-group">
                <label>Market Bias</label>
                <div class="bias-group">
                  <button *ngFor="let b of ['Bullish','Neutral','Bearish']"
                          (click)="bias = b"
                          [class.active]="bias === b"
                          [ngClass]="'bias-btn ' + b.toLowerCase()">{{ b }}</button>
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
                          class="mood-btn">{{ m.icon }} {{ m.label }}</button>
                </div>
              </div>

              <div class="form-group">
                <label>Overall Discipline Score (1–10)</label>
                <input type="range" [(ngModel)]="disciplineScore" min="1" max="10" class="score-range" />
                <span class="score-display"
                      [class.score-low]="disciplineScore <= 3"
                      [class.score-mid]="disciplineScore >= 4 && disciplineScore <= 6"
                      [class.score-high]="disciplineScore >= 7">
                  {{ disciplineScore }}/10
                </span>
              </div>

              <div class="form-group">
                <label>Additional Notes</label>
                <textarea [(ngModel)]="additionalNotes" rows="2" class="form-textarea"
                  placeholder="Any other observations..."></textarea>
              </div>

              <button class="btn-save" (click)="save()" [disabled]="saving()">
                {{ saving() ? 'Saving...' : 'Save Journal Entry' }}
              </button>
            </div>
          </div>

          <!-- Right: Today's Stats -->
          <div class="stats-col">
            <div class="card today-stats" *ngIf="todayStats()">
              <h3 class="card-title">Today's Stats</h3>
              <div class="stat-row"><span>Trades</span><span>{{ todayStats()!.totalTrades }}</span></div>
              <div class="stat-row">
                <span>Win Rate</span>
                <span [class.pos]="todayStats()!.winRate >= 50">{{ todayStats()!.winRate | number:'1.1-1' }}%</span>
              </div>
              <div class="stat-row">
                <span>P&L</span>
                <span [class.pos]="todayStats()!.totalPnl >= 0" [class.neg]="todayStats()!.totalPnl < 0">
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

            <!-- No trades today -->
            <div class="card no-trades-card" *ngIf="!todayStats()">
              <h3 class="card-title">Today's Stats</h3>
              <p class="no-trades-text">No closed trades today yet.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ HISTORY TAB ════════════════════════════════════════════ -->
      <div *ngIf="activeTab() === 'history'">

        <div class="loading-history" *ngIf="loadingHistory()">
          Loading journal history...
        </div>

        <div class="no-history" *ngIf="!loadingHistory() && history().length === 0">
          <p>No journal entries saved yet.</p>
          <button (click)="activeTab.set('today')" class="btn-start">Start journaling today →</button>
        </div>

        <div class="history-list" *ngIf="!loadingHistory() && history().length > 0">

          <!-- Expanded entry -->
          <div *ngFor="let entry of history(); let i = index"
               class="history-card"
               [class.expanded]="expandedIndex() === i">

            <!-- Header row — always visible -->
            <div class="history-header" (click)="toggleExpand(i)">
              <div class="history-header-left">
                <span class="history-date">{{ entry.sessionDate | date:'EEE, MMM d, y' }}</span>
                <span class="bias-pill" [ngClass]="entry.marketBias?.toLowerCase()">
                  {{ entry.marketBias || '—' }}
                </span>
                <span class="mood-pill" [ngClass]="entry.sessionMood?.toLowerCase()">
                  {{ moodIcon(entry.sessionMood) }} {{ entry.sessionMood || '—' }}
                </span>
              </div>
              <div class="history-header-right">
                <span class="disc-score"
                      [class.score-low]="(entry.disciplineScore||0) <= 3"
                      [class.score-mid]="(entry.disciplineScore||0) >= 4 && (entry.disciplineScore||0) <= 6"
                      [class.score-high]="(entry.disciplineScore||0) >= 7">
                  {{ entry.disciplineScore || '—' }}/10
                </span>
                <span class="expand-icon">{{ expandedIndex() === i ? '▲' : '▼' }}</span>
              </div>
            </div>

            <!-- Expanded body -->
            <div class="history-body" *ngIf="expandedIndex() === i">
              <div class="hb-section" *ngIf="entry.preMarketNotes">
                <span class="hb-label">Pre-Market Notes</span>
                <p class="hb-text">{{ entry.preMarketNotes }}</p>
              </div>
              <div class="hb-section" *ngIf="entry.newsToWatch">
                <span class="hb-label">News Watched</span>
                <p class="hb-text">{{ entry.newsToWatch }}</p>
              </div>
              <div class="hb-section" *ngIf="entry.lessonLearned">
                <span class="hb-label">Lesson Learned</span>
                <p class="hb-text lesson-text">{{ entry.lessonLearned }}</p>
              </div>
              <div class="hb-section" *ngIf="entry.additionalNotes">
                <span class="hb-label">Additional Notes</span>
                <p class="hb-text">{{ entry.additionalNotes }}</p>
              </div>
              <div class="hb-footer">
                <span>Saved {{ entry.updatedAt | date:'MMM d, y HH:mm' }}</span>
                <button (click)="loadEntryForEdit(entry)" class="btn-edit-entry">Edit →</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Toast notification ─────────────────────────────────── -->
      <div class="toast" *ngIf="toastVisible()" [ngClass]="'toast-' + toastType()">
        <span class="toast-icon">{{ toastType() === 'success' ? '✓' : '✗' }}</span>
        <span class="toast-msg">{{ toastMessage() }}</span>
        <button class="toast-close" (click)="toastVisible.set(false)">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 1200px; position: relative; }

    /* ─── Header ──────────────────────────────────────── */
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .page-title { font-size: 26px; font-weight: 700; color: #e2e8f0; margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: #64748b; margin: 0; }

    .tab-toggle { display: flex; gap: 4px; background: #0d1117; border: 1px solid #1e2433; border-radius: 10px; padding: 4px; }
    .tab-btn { padding: 8px 18px; border: none; background: none; color: #64748b; font-size: 14px; font-weight: 600; border-radius: 7px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 6px; }
    .tab-btn.active { background: #1e2433; color: #e2e8f0; }
    .history-count { background: #3b82f6; color: #fff; font-size: 11px; padding: 1px 6px; border-radius: 10px; }

    /* ─── Today layout ────────────────────────────────── */
    .journal-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }

    .card { background: #0d1117; border: 1px solid #1e2433; border-radius: 12px; padding: 24px; }
    .card-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .card-title { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin: 0; }
    .saved-indicator { font-size: 12px; color: #22c55e; font-weight: 600; }

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

    .bias-group { display: flex; gap: 8px; }
    .bias-btn { padding: 7px 16px; background: #0a0e1a; border: 1px solid #1e2433; border-radius: 8px; color: #64748b; font-size: 13px; cursor: pointer; transition: all 0.15s; }
    .bias-btn.bullish.active { background: rgba(34,197,94,0.1);  border-color: #22c55e; color: #22c55e; }
    .bias-btn.neutral.active { background: rgba(59,130,246,0.1); border-color: #3b82f6; color: #3b82f6; }
    .bias-btn.bearish.active { background: rgba(239,68,68,0.1);  border-color: #ef4444; color: #ef4444; }

    .mood-group { display: flex; gap: 8px; flex-wrap: wrap; }
    .mood-btn { padding: 7px 14px; background: #0a0e1a; border: 1px solid #1e2433; border-radius: 8px; color: #64748b; font-size: 12px; cursor: pointer; transition: all 0.15s; }
    .mood-btn.active { border-color: #3b82f6; color: #3b82f6; background: rgba(59,130,246,0.08); }

    .score-range { width: 100%; accent-color: #3b82f6; }
    .score-display { font-size: 14px; font-weight: 700; text-align: center; display: block; }
    .score-low  { color: #ef4444; }
    .score-mid  { color: #f59e0b; }
    .score-high { color: #22c55e; }

    .divider { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #334155; text-align: center; border-top: 1px solid #1e2433; padding-top: 12px; margin-top: 4px; }

    .btn-save { background: #3b82f6; color: #fff; padding: 11px 24px; border-radius: 8px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; align-self: flex-start; transition: background 0.15s; }
    .btn-save:hover:not(:disabled) { background: #2563eb; }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

    /* ─── Right column ────────────────────────────────── */
    .stats-col { display: flex; flex-direction: column; gap: 16px; }
    .today-stats { height: fit-content; }
    .stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #111827; font-size: 14px; color: #94a3b8; }
    .stat-row:last-of-type { border-bottom: none; }
    .pos { color: #22c55e; }
    .neg { color: #ef4444; }
    .no-trades-card { }
    .no-trades-text { font-size: 13px; color: #475569; margin: 0; }

    .agent-feedback { margin-top: 16px; border-top: 1px solid #1e2433; padding-top: 16px; }
    .agent-feedback h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #475569; margin: 0 0 10px; }
    .feedback-item { font-size: 12px; padding: 8px 12px; border-radius: 6px; margin-bottom: 6px; line-height: 1.4; }
    .feedback-item.warning { background: rgba(245,158,11,0.08); color: #fbbf24; border-left: 2px solid #f59e0b; }
    .feedback-item.danger  { background: rgba(239,68,68,0.08);  color: #f87171; border-left: 2px solid #ef4444; }

    /* ─── History tab ─────────────────────────────────── */
    .loading-history { text-align: center; padding: 60px; color: #64748b; }
    .no-history { text-align: center; padding: 60px; color: #475569; }
    .no-history p { margin-bottom: 16px; font-size: 15px; }
    .btn-start { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); color: #3b82f6; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; }

    .history-list { display: flex; flex-direction: column; gap: 10px; }
    .history-card { background: #0d1117; border: 1px solid #1e2433; border-radius: 12px; overflow: hidden; transition: border-color 0.15s; }
    .history-card.expanded { border-color: #3b82f6; }

    .history-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer; transition: background 0.15s; }
    .history-header:hover { background: rgba(30,36,51,0.4); }
    .history-header-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .history-date { font-size: 15px; font-weight: 700; color: #e2e8f0; }

    .bias-pill { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 12px; }
    .bias-pill.bullish { background: rgba(34,197,94,0.12);  color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
    .bias-pill.neutral { background: rgba(59,130,246,0.12); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
    .bias-pill.bearish { background: rgba(239,68,68,0.12);  color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }

    .mood-pill { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 12px; color: #94a3b8; background: #111827; border: 1px solid #1e2433; }
    .mood-pill.excellent { color: #22c55e; background: rgba(34,197,94,0.08);  border-color: rgba(34,197,94,0.3); }
    .mood-pill.good      { color: #3b82f6; background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.3); }
    .mood-pill.poor      { color: #f59e0b; background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.3); }
    .mood-pill.terrible  { color: #ef4444; background: rgba(239,68,68,0.08);  border-color: rgba(239,68,68,0.3); }

    .history-header-right { display: flex; align-items: center; gap: 12px; }
    .disc-score { font-size: 14px; font-weight: 700; }
    .expand-icon { font-size: 11px; color: #475569; }

    .history-body { padding: 16px 20px; border-top: 1px solid #111827; display: flex; flex-direction: column; gap: 14px; }
    .hb-section { display: flex; flex-direction: column; gap: 4px; }
    .hb-label { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
    .hb-text { font-size: 14px; color: #94a3b8; margin: 0; line-height: 1.6; white-space: pre-wrap; }
    .lesson-text { color: #e2e8f0; font-style: italic; }
    .hb-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #111827; font-size: 12px; color: #475569; }
    .btn-edit-entry { background: none; border: 1px solid #1e2433; color: #3b82f6; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; }
    .btn-edit-entry:hover { background: rgba(59,130,246,0.08); }

    /* ─── Toast ───────────────────────────────────────── */
    .toast { position: fixed; bottom: 32px; right: 32px; display: flex; align-items: center; gap: 10px; padding: 14px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; z-index: 9999; animation: slide-up 0.25s ease; max-width: 380px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    @keyframes slide-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    .toast-success { background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.4); color: #22c55e; }
    .toast-error   { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.4); color: #ef4444; }
    .toast-icon  { font-size: 16px; font-weight: 800; flex-shrink: 0; }
    .toast-msg   { flex: 1; }
    .toast-close { background: none; border: none; cursor: pointer; color: inherit; font-size: 14px; opacity: 0.6; padding: 0; flex-shrink: 0; }
    .toast-close:hover { opacity: 1; }
  `]
})
export class JournalComponent implements OnInit {

  today           = new Date();
  bias            = 'Neutral';
  preNote         = '';
  newsNote        = '';
  lesson          = '';
  mood            = 'GOOD';
  disciplineScore = 7;
  additionalNotes = '';

  activeTab     = signal<'today' | 'history'>('today');
  todayStats    = signal<Analytics | null>(null);
  history       = signal<DailySession[]>([]);
  historyCount  = signal<number>(0);
  expandedIndex = signal<number | null>(null);
  lastSaved     = signal<Date | null>(null);

  saving         = signal(false);
  loadingHistory = signal(false);
  toastMessage   = signal('');
  toastType      = signal<'success' | 'error'>('success');
  toastVisible   = signal(false);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly apiBase = `${environment.apiUrl}/sessions`;

  moodOptions = [
    { val: 'EXCELLENT', label: 'Excellent', icon: '◎' },
    { val: 'GOOD',      label: 'Good',      icon: '○' },
    { val: 'NEUTRAL',   label: 'Neutral',   icon: '—' },
    { val: 'POOR',      label: 'Poor',      icon: '▽' },
    { val: 'TERRIBLE',  label: 'Terrible',  icon: '✗' },
  ];

  constructor(
    private tradeService: TradeService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Load today's trading stats
    this.tradeService.getDailyReport().subscribe(s => this.todayStats.set(s));

    // Load today's existing journal entry if any
    this.http.get<DailySession>(`${this.apiBase}/today`).subscribe({
      next: (entry) => {
        if (entry) this.populateForm(entry);
      },
      error: () => {} // 204 No Content is fine — just leave form blank
    });

    // Get history count for badge
    this.http.get<DailySession[]>(this.apiBase, { params: { limit: '365' } }).subscribe({
      next: (sessions) => this.historyCount.set(sessions.length),
      error: () => {}
    });
  }

  // ─── Save journal to MongoDB via API ──────────────────────
  save() {
    if (this.saving()) return;
    this.saving.set(true);

    const payload = {
      marketBias:      this.bias.toUpperCase(),
      preMarketNotes:  this.preNote,
      newsToWatch:     this.newsNote,
      lessonLearned:   this.lesson,
      sessionMood:     this.mood,
      disciplineScore: this.disciplineScore,
      additionalNotes: this.additionalNotes,
    };

    // setTimeout(0) defers off main thread — fixes INP block
    setTimeout(() => {
      this.http.post<DailySession>(this.apiBase, payload).subscribe({
        next: (saved) => {
          this.saving.set(false);
          this.lastSaved.set(new Date());
          this.historyCount.update(c => c); // refresh count
          this.showToast('Journal entry saved to database ✓', 'success');
          // Reload history count
          this.http.get<DailySession[]>(this.apiBase, { params: { limit: '365' } })
            .subscribe(s => this.historyCount.set(s.length));
        },
        error: (err) => {
          this.saving.set(false);
          const msg = err?.error?.message || 'Failed to save. Please try again.';
          this.showToast(msg, 'error');
        }
      });
    }, 0);
  }

  // ─── Load history tab ─────────────────────────────────────
  loadHistory() {
    this.activeTab.set('history');
    if (this.history().length > 0) return; // already loaded

    this.loadingHistory.set(true);
    this.http.get<DailySession[]>(this.apiBase, { params: { limit: '365' } }).subscribe({
      next: (sessions) => {
        this.history.set(sessions);
        this.historyCount.set(sessions.length);
        this.loadingHistory.set(false);
      },
      error: () => {
        this.loadingHistory.set(false);
        this.showToast('Failed to load history.', 'error');
      }
    });
  }

  // ─── Expand / collapse a history entry ────────────────────
  toggleExpand(index: number) {
    this.expandedIndex.set(this.expandedIndex() === index ? null : index);
  }

  // ─── Load a history entry into the form for editing ───────
  loadEntryForEdit(entry: DailySession) {
    this.populateForm(entry);
    this.activeTab.set('today');
    this.showToast(`Loaded entry for ${entry.sessionDate} — make changes and save.`, 'success');
  }

  // ─── Helper: fill form from a DailySession object ─────────
  private populateForm(entry: DailySession) {
    this.bias            = this.capitalise(entry.marketBias  || 'Neutral');
    this.preNote         = entry.preMarketNotes              || '';
    this.newsNote        = entry.newsToWatch                 || '';
    this.lesson          = entry.lessonLearned               || '';
    this.mood            = entry.sessionMood                 || 'GOOD';
    this.disciplineScore = entry.disciplineScore             ?? 7;
    this.additionalNotes = entry.additionalNotes             || '';
  }

  private capitalise(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  moodIcon(mood: string): string {
    const icons: Record<string, string> = {
      EXCELLENT: '◎', GOOD: '○', NEUTRAL: '—', POOR: '▽', TERRIBLE: '✗'
    };
    return icons[mood] || '—';
  }

  private showToast(message: string, type: 'success' | 'error') {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);
    this.toastTimer = setTimeout(() => this.toastVisible.set(false), 3500);
  }
}
