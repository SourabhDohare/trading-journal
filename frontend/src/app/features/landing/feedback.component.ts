import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PublicNavbarComponent } from './public-navbar.component';
import { PublicFooterComponent } from './public-footer.component';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PublicNavbarComponent, PublicFooterComponent],
  template: `
    <div class="page-wrap">
      <app-public-navbar />

      <main class="main">
        <section class="feedback-hero">
          <div class="hero-glow"></div>
          <div class="container">
            <span class="section-label mono">HELP US IMPROVE</span>
            <h1 class="hero-title">Your feedback shapes<br><span class="teal">what we build next.</span></h1>
            <p class="hero-sub">
              We read every single submission. The most common requests directly influence our roadmap.
            </p>
          </div>
        </section>

        <section class="feedback-section">
          <div class="container narrow">

            <div class="feedback-card" *ngIf="!submitted()">

              <!-- Rating -->
              <div class="rating-section">
                <h3 class="field-label">Overall, how satisfied are you with MarketSaga?</h3>
                <div class="stars">
                  <button *ngFor="let star of [1,2,3,4,5]" type="button"
                          class="star-btn" [class.active]="form.rating >= star"
                          (click)="form.rating = star" (mouseenter)="hoverRating = star"
                          (mouseleave)="hoverRating = 0"
                          [class.hovered]="hoverRating >= star">
                    ★
                  </button>
                </div>
                <div class="rating-labels">
                  <span>Very Unsatisfied</span><span>Very Satisfied</span>
                </div>
                <div class="rating-label" *ngIf="form.rating > 0">
                  {{ ratingLabels[form.rating - 1] }}
                </div>
              </div>

              <div class="form-divider"></div>

              <!-- Category -->
              <div class="form-group">
                <label>What type of feedback is this? *</label>
                <div class="category-grid">
                  <button *ngFor="let cat of categories" type="button"
                          class="cat-btn" [class.active]="form.category === cat.value"
                          (click)="form.category = cat.value">
                    <span class="cat-icon">{{ cat.icon }}</span>
                    <span class="cat-label">{{ cat.label }}</span>
                  </button>
                </div>
              </div>

              <!-- What's working -->
              <div class="form-group">
                <label>What's working well for you?</label>
                <textarea [(ngModel)]="form.whatWorks" rows="3" class="form-textarea"
                  placeholder="Tell us what you love or find genuinely useful..."></textarea>
              </div>

              <!-- What needs improvement -->
              <div class="form-group">
                <label>What could be better? *</label>
                <textarea [(ngModel)]="form.improvements" rows="4" class="form-textarea"
                  placeholder="Be specific — the more detail you give, the faster we can fix it..."></textarea>
              </div>

              <!-- Feature request -->
              <div class="form-group">
                <label>Any features you'd love to see?</label>
                <textarea [(ngModel)]="form.featureRequest" rows="3" class="form-textarea"
                  placeholder="A specific feature, integration, or change you're missing..."></textarea>
              </div>

              <!-- Contact info (optional) -->
              <div class="form-divider"></div>
              <div class="optional-section">
                <div class="optional-label">
                  <span class="mono" style="font-size:10px;color:#334155">OPTIONAL</span>
                  <span class="optional-desc">Leave your contact info if you'd like us to follow up.</span>
                </div>
                <div class="optional-fields">
                  <div class="form-group">
                    <label>Name</label>
                    <input [(ngModel)]="form.name" type="text" placeholder="Your name" class="form-input" />
                  </div>
                  <div class="form-group">
                    <label>Email</label>
                    <input [(ngModel)]="form.email" type="email" placeholder="you@example.com" class="form-input" />
                  </div>
                </div>
              </div>

              <div class="form-error" *ngIf="error()">{{ error() }}</div>

              <button (click)="submit()" [disabled]="sending()" class="submit-btn">
                <span *ngIf="!sending()">Submit Feedback →</span>
                <span *ngIf="sending()" class="btn-loading"><span class="spinner"></span> Submitting...</span>
              </button>
            </div>

            <!-- Success -->
            <div class="success-card" *ngIf="submitted()">
              <div class="success-icon">🙏</div>
              <h2 class="success-title">Thank you for the feedback!</h2>
              <p class="success-text">
                We've received your submission. The MarketSaga team reads every piece of feedback personally.
                Your input directly shapes our roadmap.
              </p>
              <div class="success-stats">
                <div class="success-stat">
                  <span class="ss-v teal mono">{{ form.rating }}/5</span>
                  <span class="ss-l">Your Rating</span>
                </div>
                <div class="success-stat">
                  <span class="ss-v teal mono">&lt; 24h</span>
                  <span class="ss-l">Review Time</span>
                </div>
              </div>
              <a routerLink="/" class="back-btn">← Back to Home</a>
            </div>

          </div>
        </section>
      </main>

      <app-public-footer />
    </div>
  `,
  styles: [`
    .page-wrap { background: #070b14; min-height: 100vh; }
    .main { padding-top: 80px; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    .container.narrow { max-width: 680px; }
    .mono { font-family: 'JetBrains Mono', monospace !important; }
    .teal { color: #5EEAD4; }

    .feedback-hero {
      position: relative; padding: 80px 0 64px; text-align: center; overflow: hidden;
    }
    .hero-glow {
      position: absolute; top: -100px; left: 50%; transform: translateX(-50%);
      width: 600px; height: 400px;
      background: radial-gradient(ellipse, rgba(13,148,136,0.15) 0%, transparent 70%);
      pointer-events: none;
    }
    .section-label {
      font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700;
      color: #5EEAD4; letter-spacing: 2px; display: block; margin-bottom: 16px;
    }
    .hero-title {
      font-family: 'Syne', sans-serif; font-size: clamp(32px, 5vw, 52px); font-weight: 800;
      color: #f8fafc; line-height: 1.15; letter-spacing: -1px; margin-bottom: 16px;
    }
    .hero-sub { font-family: 'DM Sans', sans-serif; font-size: 16px; color: #64748b; }

    .feedback-section { padding: 16px 0 100px; }

    .feedback-card {
      background: #0d1117; border: 1px solid #1e2433; border-radius: 20px;
      padding: 40px; display: flex; flex-direction: column; gap: 28px;
    }

    .rating-section { display: flex; flex-direction: column; gap: 12px; }
    .field-label { font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 600; color: #e2e8f0; }
    .stars { display: flex; gap: 8px; }
    .star-btn {
      background: none; border: none; font-size: 36px; cursor: pointer;
      color: #1e2433; transition: all 0.15s; line-height: 1; padding: 0;
    }
    .star-btn.active, .star-btn.hovered { color: #f59e0b; transform: scale(1.1); }
    .rating-labels {
      display: flex; justify-content: space-between;
      font-size: 11px; color: #334155; font-family: 'JetBrains Mono', monospace;
    }
    .rating-label {
      font-family: 'DM Sans', sans-serif; font-size: 14px; color: #5EEAD4; font-weight: 600;
      background: rgba(13,148,136,0.1); border: 1px solid rgba(13,148,136,0.2);
      padding: 6px 14px; border-radius: 20px; align-self: flex-start;
    }

    .form-divider { height: 1px; background: #1e2433; }

    .form-group { display: flex; flex-direction: column; gap: 8px; }
    label { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.8px; }

    .category-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
    .cat-btn {
      display: flex; align-items: center; gap: 10px; padding: 12px 14px;
      background: #070b14; border: 1px solid #1e2433; border-radius: 10px;
      cursor: pointer; transition: all 0.15s; text-align: left;
    }
    .cat-btn:hover { border-color: #2d3748; }
    .cat-btn.active { background: rgba(13,148,136,0.08); border-color: rgba(13,148,136,0.4); }
    .cat-icon { font-size: 18px; flex-shrink: 0; }
    .cat-label { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; color: #94a3b8; }
    .cat-btn.active .cat-label { color: #5EEAD4; }

    .form-input, .form-textarea {
      background: #070b14; border: 1px solid #1e2433; border-radius: 9px;
      color: #e2e8f0; padding: 11px 14px; font-size: 14px; outline: none;
      font-family: 'DM Sans', sans-serif; transition: border-color 0.15s;
    }
    .form-input:focus, .form-textarea:focus { border-color: #0D9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
    .form-textarea { resize: vertical; line-height: 1.5; }
    .form-input::placeholder, .form-textarea::placeholder { color: #2d3748; }

    .optional-section { display: flex; flex-direction: column; gap: 16px; }
    .optional-label { display: flex; align-items: center; gap: 10px; }
    .optional-desc { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #475569; }
    .optional-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    .form-error {
      font-size: 13px; color: #f87171; background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 10px 14px;
      font-family: 'DM Sans', sans-serif;
    }
    .submit-btn {
      padding: 14px 28px; background: linear-gradient(135deg, #0D9488, #0891b2);
      color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 700;
      cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s;
      box-shadow: 0 4px 20px rgba(13,148,136,0.3); align-self: flex-start;
    }
    .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(13,148,136,0.4); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .btn-loading { display: flex; align-items: center; gap: 8px; }
    .spinner {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .success-card {
      background: #0d1117; border: 1px solid #1e2433; border-radius: 20px;
      padding: 64px 40px; text-align: center;
    }
    .success-icon { font-size: 52px; margin-bottom: 20px; }
    .success-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #f8fafc; margin-bottom: 14px; }
    .success-text { font-family: 'DM Sans', sans-serif; font-size: 15px; color: #64748b; line-height: 1.7; margin-bottom: 32px; max-width: 420px; margin-left: auto; margin-right: auto; }
    .success-stats { display: flex; justify-content: center; gap: 40px; margin-bottom: 32px; }
    .success-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .ss-v { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
    .ss-l { font-size: 11px; color: #475569; font-family: 'JetBrains Mono', monospace; }
    .back-btn {
      display: inline-block; padding: 10px 24px; border: 1px solid #1e2433;
      color: #64748b; text-decoration: none; border-radius: 8px;
      font-family: 'DM Sans', sans-serif; font-size: 14px; transition: all 0.15s;
    }
    .back-btn:hover { border-color: #5EEAD4; color: #5EEAD4; }

    @media (max-width: 600px) {
      .category-grid { grid-template-columns: 1fr; }
      .optional-fields { grid-template-columns: 1fr; }
      .feedback-card { padding: 24px; }
    }
  `]
})
export class FeedbackComponent {
  submitted = signal(false);
  sending   = signal(false);
  error     = signal('');
  hoverRating = 0;

  form = {
    rating: 0, category: '', whatWorks: '',
    improvements: '', featureRequest: '', name: '', email: ''
  };

  ratingLabels = ['Very Unsatisfied', 'Unsatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'];

  categories = [
    { value: 'Bug Report',          icon: '🐛', label: 'Bug Report' },
    { value: 'Feature Request',     icon: '💡', label: 'Feature Request' },
    { value: 'UI/UX Improvement',   icon: '🎨', label: 'UI / UX' },
    { value: 'General Feedback',    icon: '💬', label: 'General Feedback' },
  ];

  constructor(private http: HttpClient) {}

  submit() {
    if (!this.form.category || !this.form.improvements.trim()) {
      this.error.set('Please select a category and describe what could be improved.');
      return;
    }
    this.sending.set(true);
    this.error.set('');
    this.http.post(`${environment.apiUrl}/feedback`, this.form).subscribe({
      next: () => { this.sending.set(false); this.submitted.set(true); },
      error: (err) => {
        this.sending.set(false);
        this.error.set(err?.error?.message || 'Failed to submit. Please try again.');
      }
    });
  }
}