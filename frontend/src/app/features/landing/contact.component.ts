import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PublicNavbarComponent } from './public-navbar.component';
import { PublicFooterComponent } from './public-footer.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PublicNavbarComponent, PublicFooterComponent],
  template: `
    <div class="page-wrap">
      <app-public-navbar />

      <main class="main">
        <section class="contact-hero">
          <div class="hero-glow"></div>
          <div class="container">
            <span class="section-label mono">GET IN TOUCH</span>
            <h1 class="hero-title">We'd love to hear<br><span class="teal">from you.</span></h1>
            <p class="hero-sub">A real person will read and reply to every message. Usually within 24 hours.</p>
          </div>
        </section>

        <section class="contact-section">
          <div class="container">
            <div class="contact-layout">

              <!-- Contact info -->
              <div class="contact-info">
                <div class="info-card">
                  <div class="info-icon">📧</div>
                  <h3 class="info-title">Email</h3>
                  <p class="info-text">For anything and everything.</p>
                  <a href="mailto:support@marketsaga.site" class="info-link">support&#64;marketsaga.site</a>
                </div>
                <div class="info-card">
                  <div class="info-icon">⚡</div>
                  <h3 class="info-title">Response Time</h3>
                  <p class="info-text">We reply to all messages within 24 hours, typically much faster on trading days.</p>
                </div>
                <div class="info-card">
                  <div class="info-icon">🇮🇳</div>
                  <h3 class="info-title">Based In India</h3>
                  <p class="info-text">Built by traders, for Indian retail traders. We understand your market, your instruments, and your challenges.</p>
                </div>
                <div class="info-card info-card--feedback">
                  <div class="info-icon">💡</div>
                  <h3 class="info-title">Have Feedback?</h3>
                  <p class="info-text">Want to share what's working and what's not? We have a dedicated feedback page for that.</p>
                  <a routerLink="/feedback" class="info-link teal-link">Go to Feedback Page →</a>
                </div>
              </div>

              <!-- Contact form -->
              <div class="contact-form-wrap">
                <div class="form-card" *ngIf="!submitted()">
                  <h2 class="form-title">Send us a message</h2>
                  <p class="form-sub">Fill in the form and we'll get back to you shortly.</p>

                  <div class="form-body">
                    <div class="form-row">
                      <div class="form-group">
                        <label>Your Name</label>
                        <input [(ngModel)]="form.name" type="text" placeholder="Sourabh Dohare" class="form-input" />
                      </div>
                      <div class="form-group">
                        <label>Email Address *</label>
                        <input [(ngModel)]="form.email" type="email" placeholder="you@example.com" class="form-input" />
                      </div>
                    </div>
                    <div class="form-group">
                      <label>Subject *</label>
                      <select [(ngModel)]="form.subject" class="form-select">
                        <option value="">Select a subject</option>
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Technical Support">Technical Support</option>
                        <option value="Feature Request">Feature Request</option>
                        <option value="Bug Report">Bug Report</option>
                        <option value="Billing">Billing</option>
                        <option value="Enterprise / Team Plan">Enterprise / Team Plan</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Message *</label>
                      <textarea [(ngModel)]="form.message" rows="6" placeholder="Tell us what's on your mind..." class="form-textarea"></textarea>
                    </div>
                    <div class="form-error" *ngIf="error()">{{ error() }}</div>
                    <button (click)="send()" [disabled]="sending()" class="submit-btn">
                      <span *ngIf="!sending()">Send Message →</span>
                      <span *ngIf="sending()" class="btn-loading"><span class="spinner"></span> Sending...</span>
                    </button>
                  </div>
                </div>

                <!-- Success state -->
                <div class="success-card" *ngIf="submitted()">
                  <div class="success-icon">✓</div>
                  <h2 class="success-title">Message sent!</h2>
                  <p class="success-text">
                    Thanks for reaching out. We've received your message and will reply to
                    <strong>{{ form.email }}</strong> within 24 hours.
                  </p>
                  <button (click)="reset()" class="reset-btn">Send another message</button>
                </div>
              </div>
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
    .mono { font-family: 'JetBrains Mono', monospace !important; }
    .teal { color: #5EEAD4; }

    .contact-hero {
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
      font-family: 'Syne', sans-serif; font-size: clamp(32px, 5vw, 52px);
      font-weight: 800; color: #f8fafc; line-height: 1.15; letter-spacing: -1px; margin-bottom: 16px;
    }
    .hero-sub { font-family: 'DM Sans', sans-serif; font-size: 16px; color: #64748b; }

    .contact-section { padding: 32px 0 100px; }
    .contact-layout { display: grid; grid-template-columns: 1fr 2fr; gap: 40px; align-items: start; }

    .contact-info { display: flex; flex-direction: column; gap: 16px; }
    .info-card {
      background: #0d1117; border: 1px solid #1e2433; border-radius: 14px; padding: 22px;
      transition: border-color 0.15s;
    }
    .info-card:hover { border-color: rgba(13,148,136,0.3); }
    .info-card--feedback { border-color: rgba(13,148,136,0.2); background: rgba(13,148,136,0.04); }
    .info-icon { font-size: 22px; margin-bottom: 10px; }
    .info-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #e2e8f0; margin-bottom: 6px; }
    .info-text { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 10px; }
    .info-link { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #0D9488; text-decoration: none; }
    .info-link:hover { color: #5EEAD4; }
    .teal-link { color: #5EEAD4 !important; }

    .form-card, .success-card {
      background: #0d1117; border: 1px solid #1e2433; border-radius: 18px; padding: 36px;
    }
    .form-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #f8fafc; margin-bottom: 6px; letter-spacing: -0.3px; }
    .form-sub { font-family: 'DM Sans', sans-serif; font-size: 14px; color: #64748b; margin-bottom: 28px; }
    .form-body { display: flex; flex-direction: column; gap: 18px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 7px; }
    label { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.8px; }
    .form-input, .form-select, .form-textarea {
      background: #070b14; border: 1px solid #1e2433; border-radius: 9px;
      color: #e2e8f0; padding: 11px 14px; font-size: 14px; outline: none;
      font-family: 'DM Sans', sans-serif; transition: border-color 0.15s;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: #0D9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
    .form-input::placeholder, .form-textarea::placeholder { color: #2d3748; }
    .form-textarea { resize: vertical; min-height: 120px; line-height: 1.5; }
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

    .success-card { text-align: center; padding: 56px 36px; }
    .success-icon {
      width: 64px; height: 64px; background: rgba(13,148,136,0.15); border: 2px solid #0D9488;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 28px; color: #5EEAD4; margin: 0 auto 20px; font-weight: 700;
    }
    .success-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #f8fafc; margin-bottom: 12px; }
    .success-text { font-family: 'DM Sans', sans-serif; font-size: 15px; color: #64748b; line-height: 1.7; margin-bottom: 24px; }
    .success-text strong { color: #94a3b8; }
    .reset-btn {
      background: none; border: 1px solid #1e2433; color: #64748b; padding: 10px 20px;
      border-radius: 8px; cursor: pointer; font-size: 14px; font-family: 'DM Sans', sans-serif;
      transition: all 0.15s;
    }
    .reset-btn:hover { border-color: #5EEAD4; color: #5EEAD4; }

    @media (max-width: 768px) {
      .contact-layout { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class ContactComponent {
  submitted = signal(false);
  sending   = signal(false);
  error     = signal('');

  form = { name: '', email: '', subject: '', message: '' };

  constructor(private http: HttpClient) {}

  send() {
    if (!this.form.email.trim() || !this.form.subject || !this.form.message.trim()) {
      this.error.set('Please fill in all required fields.');
      return;
    }
    this.sending.set(true);
    this.error.set('');
    this.http.post(`${environment.apiUrl}/contact`, this.form).subscribe({
      next: () => { this.sending.set(false); this.submitted.set(true); },
      error: (err) => {
        this.sending.set(false);
        this.error.set(err?.error?.message || 'Failed to send. Please email us directly at support@marketsaga.site');
      }
    });
  }

  reset() { this.submitted.set(false); this.form = { name: '', email: '', subject: '', message: '' }; }
}