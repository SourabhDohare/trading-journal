import { Component, OnInit, signal, HostListener, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PublicNavbarComponent } from './public-navbar.component';
import { PublicFooterComponent } from './public-footer.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicNavbarComponent, PublicFooterComponent],
  template: `
    <div class="landing">
      <app-public-navbar />

      <!-- ── HERO ─────────────────────────────────────────────────────────── -->
      <section class="hero" id="hero">
        <div class="hero-bg">
          <div class="glow glow-1"></div>
          <div class="glow glow-2"></div>
          <div class="glow glow-3"></div>
          <div class="grid-pattern"></div>
        </div>
        <div class="hero-container">
          <div class="hero-content">
            <div class="hero-badge">
              <span class="live-dot"></span>
              <span class="badge-mono">LIVE · Built for serious Indian traders</span>
            </div>
            <h1 class="hero-headline">
              Stop Logging Trades.<br>
              <span class="headline-gradient">Start Understanding Them.</span>
            </h1>
            <p class="hero-sub">
              MarketSaga's mandatory thinking layer forces you to articulate your edge
              before every entry — revealing your actual patterns, behavioral
              blindspots, and what's really driving your P&L.
            </p>
            <div class="hero-ctas">
              <a routerLink="/auth/register" class="cta-primary">
                Start Free Today
                <span class="cta-arrow">→</span>
              </a>
              <a href="#features" class="cta-ghost">
                See How It Works
              </a>
            </div>
            <p class="hero-note">No credit card required · Free forever plan available</p>
          </div>

          <!-- Hero card mockup -->
          <div class="hero-visual">
            <div class="mockup-card">
              <div class="mockup-header">
                <div class="mockup-dots">
                  <span class="dot dot-red"></span>
                  <span class="dot dot-yellow"></span>
                  <span class="dot dot-green"></span>
                </div>
                <span class="mockup-title">NIFTY · BUY · ₹22,450</span>
                <span class="mockup-live">● LIVE</span>
              </div>
              <div class="mockup-body">
                <div class="mockup-row">
                  <span class="label">Why I'm taking this</span>
                  <div class="thinking-bar">
                    <div class="thinking-fill" style="width:85%"></div>
                  </div>
                </div>
                <div class="mockup-row">
                  <span class="label">My edge</span>
                  <div class="thinking-bar">
                    <div class="thinking-fill tf-2" style="width:72%"></div>
                  </div>
                </div>
                <div class="mockup-row">
                  <span class="label">Emotion state</span>
                  <span class="emotion-badge calm">CALM</span>
                </div>
                <div class="mockup-row">
                  <span class="label">Planned R:R</span>
                  <span class="rr-badge">1 : 2.4</span>
                </div>
                <div class="mockup-divider"></div>
                <div class="mockup-metrics">
                  <div class="metric">
                    <span class="metric-v green">+68%</span>
                    <span class="metric-l">Win Rate</span>
                  </div>
                  <div class="metric">
                    <span class="metric-v teal">A</span>
                    <span class="metric-l">Discipline</span>
                  </div>
                  <div class="metric">
                    <span class="metric-v green">+₹14,200</span>
                    <span class="metric-l">This Week</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="mockup-float float-1">
              <span class="float-icon">🧠</span>
              <span class="float-text">Pattern detected</span>
            </div>
            <div class="mockup-float float-2">
              <span class="float-icon">📊</span>
              <span class="float-text">Report ready</span>
            </div>
          </div>
        </div>

        <!-- Stats bar -->
        <div class="stats-bar">
          <div class="stats-container">
            <div class="stat">
              <span class="stat-n mono">16+</span>
              <span class="stat-l">Trades Analyzed</span>
            </div>
            <div class="stat-sep"></div>
            <div class="stat">
              <span class="stat-n mono">100%</span>
              <span class="stat-l">Thinking Layer Compliance</span>
            </div>
            <div class="stat-sep"></div>
            <div class="stat">
              <span class="stat-n mono">10+</span>
              <span class="stat-l">Behavioral Patterns Tracked</span>
            </div>
            <div class="stat-sep"></div>
            <div class="stat">
              <span class="stat-n mono">Free</span>
              <span class="stat-l">To Start Today</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── FEATURES ──────────────────────────────────────────────────────── -->
      <section class="section features-section" id="features">
        <div class="section-container">
          <div class="section-header">
            <span class="section-label mono">WHAT MAKES IT DIFFERENT</span>
            <h2 class="section-title">
              Every feature exists to make you<br>
              <span class="title-teal">a better trader</span>
            </h2>
            <p class="section-sub">
              Most journals just store your trades. MarketSaga forces you to think,
              tracks your patterns, and tells you the truth about your trading.
            </p>
          </div>

          <div class="features-grid">
            <div class="feature-card feature-card--highlight" *ngFor="let f of features; let i = index"
                 [style.animation-delay]="(i * 0.08) + 's'">
              <div class="feature-icon-wrap" [style.background]="f.iconBg">
                <span class="feature-icon">{{ f.icon }}</span>
              </div>
              <h3 class="feature-name">{{ f.name }}</h3>
              <p class="feature-desc">{{ f.desc }}</p>
              <div class="feature-tag mono">{{ f.tag }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── THINKING LAYER CALLOUT ────────────────────────────────────────── -->
      <section class="section thinking-section">
        <div class="section-container">
          <div class="thinking-layout">
            <div class="thinking-content">
              <span class="section-label mono">THE CORE INNOVATION</span>
              <h2 class="section-title" style="text-align:left;max-width:none">
                The Mandatory<br>
                <span class="title-teal">Thinking Layer</span>
              </h2>
              <p class="section-sub" style="text-align:left;max-width:none">
                Before MarketSaga accepts your trade entry, you must answer four
                questions. Not optional. Not skippable. Mandatory.
              </p>
              <div class="thinking-questions">
                <div class="tq-item" *ngFor="let q of thinkingQuestions; let i = index">
                  <span class="tq-num mono">0{{ i + 1 }}</span>
                  <div>
                    <div class="tq-q">{{ q.question }}</div>
                    <div class="tq-hint">{{ q.hint }}</div>
                  </div>
                </div>
              </div>
              <div class="thinking-result">
                <span class="result-icon">💡</span>
                <span>After 50 trades, you'll see your real patterns — not the ones you thought you had.</span>
              </div>
            </div>
            <div class="thinking-visual">
              <div class="entry-card">
                <div class="entry-header">
                  <span class="entry-badge strict">🔒 STRICT MODE ON</span>
                  <span class="entry-trade mono">TRD-20260417-0012</span>
                </div>
                <div class="entry-fields">
                  <div class="entry-field">
                    <label>Why I'm taking this trade</label>
                    <div class="entry-text">Price broke above 20-day resistance at 22,400 with 2.5x average volume. Sector momentum aligned with broader market trend...</div>
                    <span class="char-count teal">64 chars ✓</span>
                  </div>
                  <div class="entry-field">
                    <label>My edge / setup logic</label>
                    <div class="entry-text">Historical breakouts above 52-week high with volume confirmation show 68% win rate in backtesting...</div>
                    <span class="char-count teal">56 chars ✓</span>
                  </div>
                  <div class="entry-field" style="display:flex;gap:16px">
                    <div style="flex:1">
                      <label>Emotion</label>
                      <span class="emotion-badge calm" style="display:inline-block;margin-top:6px">CALM</span>
                    </div>
                    <div style="flex:1">
                      <label>Planned R:R</label>
                      <span class="rr-value mono">1 : 2.8</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── HOW IT WORKS ──────────────────────────────────────────────────── -->
      <section class="section hiw-section">
        <div class="section-container">
          <div class="section-header">
            <span class="section-label mono">THE PROCESS</span>
            <h2 class="section-title">
              Three steps to trading<br>
              <span class="title-teal">with data on your side</span>
            </h2>
          </div>
          <div class="hiw-grid">
            <div class="hiw-step" *ngFor="let step of steps; let i = index">
              <div class="step-num mono">{{ String(i + 1).padStart(2, '0') }}</div>
              <div class="step-icon">{{ step.icon }}</div>
              <h3 class="step-title">{{ step.title }}</h3>
              <p class="step-desc">{{ step.desc }}</p>
              <div class="step-connector" *ngIf="i < steps.length - 1"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── PRICING PREVIEW ───────────────────────────────────────────────── -->
      <section class="section pricing-section">
        <div class="section-container">
          <div class="section-header">
            <span class="section-label mono">PRICING</span>
            <h2 class="section-title">
              Start free.<br>
              <span class="title-teal">Scale when you're ready.</span>
            </h2>
          </div>
          <div class="pricing-grid">
            <div class="pricing-card" *ngFor="let plan of plans">
              <div class="plan-badge" *ngIf="plan.badge">{{ plan.badge }}</div>
              <div class="plan-name mono">{{ plan.name }}</div>
              <div class="plan-price">
                <span class="price-val">{{ plan.price }}</span>
                <span class="price-per" *ngIf="plan.per">{{ plan.per }}</span>
              </div>
              <div class="plan-desc">{{ plan.desc }}</div>
              <div class="plan-divider"></div>
              <ul class="plan-features">
                <li *ngFor="let feat of plan.features" class="plan-feat">
                  <span class="feat-check">✓</span> {{ feat }}
                </li>
              </ul>
              <a [routerLink]="plan.cta.link" class="plan-btn" [class.plan-btn--primary]="plan.highlight">
                {{ plan.cta.label }}
              </a>
            </div>
          </div>
          <div class="pricing-footnote">
            <a routerLink="/pricing" class="compare-link">View full feature comparison →</a>
          </div>
        </div>
      </section>

      <!-- ── FINAL CTA ─────────────────────────────────────────────────────── -->
      <section class="section cta-section">
        <div class="section-container">
          <div class="cta-box">
            <div class="cta-glow"></div>
            <span class="section-label mono" style="display:block;margin-bottom:16px">YOUR EDGE IS WAITING</span>
            <h2 class="cta-headline">
              Your trading patterns exist.<br>You just can't see them yet.
            </h2>
            <p class="cta-sub">
              Start journaling with intention today. MarketSaga will surface your
              behavioral patterns in 30 trades or less.
            </p>
            <div class="cta-actions">
              <a routerLink="/auth/register" class="cta-primary cta-large">
                Create Free Account →
              </a>
              <a routerLink="/contact" class="cta-ghost">
                Talk to Us First
              </a>
            </div>
          </div>
        </div>
      </section>

      <app-public-footer />
    </div>
  `,
  styles: [`
    .landing { background: #070b14; color: #e2e8f0; min-height: 100vh; }

    /* ── Hero ──────────────────────────────────────────────────────────────── */
    .hero {
      position: relative; min-height: 100vh; display: flex;
      flex-direction: column; justify-content: center; overflow: hidden; padding-top: 80px;
    }
    .hero-bg { position: absolute; inset: 0; pointer-events: none; }
    .glow {
      position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.6;
    }
    .glow-1 { width: 600px; height: 600px; top: -100px; left: -150px; background: radial-gradient(circle, rgba(13,148,136,0.2) 0%, transparent 70%); }
    .glow-2 { width: 400px; height: 400px; top: 20%; right: -100px; background: radial-gradient(circle, rgba(8,145,178,0.15) 0%, transparent 70%); }
    .glow-3 { width: 300px; height: 300px; bottom: 10%; left: 30%; background: radial-gradient(circle, rgba(94,234,212,0.08) 0%, transparent 70%); }
    .grid-pattern {
      position: absolute; inset: 0;
      background-image: linear-gradient(rgba(30,36,51,0.4) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(30,36,51,0.4) 1px, transparent 1px);
      background-size: 48px 48px;
    }

    .hero-container {
      position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 80px 24px;
      display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
    }

    .hero-badge {
      display: inline-flex; align-items: center; gap: 8px; margin-bottom: 24px;
      background: rgba(13,148,136,0.1); border: 1px solid rgba(13,148,136,0.25);
      padding: 6px 14px; border-radius: 20px;
    }
    .live-dot {
      width: 7px; height: 7px; border-radius: 50%; background: #22c55e;
      animation: pulse 2s infinite; flex-shrink: 0;
    }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
    .badge-mono { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #5EEAD4; letter-spacing: 0.5px; }

    .hero-headline {
      font-family: 'Syne', sans-serif; font-size: clamp(36px, 5vw, 58px);
      font-weight: 800; line-height: 1.1; color: #f8fafc; margin-bottom: 20px;
      letter-spacing: -1.5px;
    }
    .headline-gradient {
      background: linear-gradient(135deg, #5EEAD4 0%, #0D9488 50%, #0891b2 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-sub {
      font-family: 'DM Sans', sans-serif; font-size: 17px; color: #64748b;
      line-height: 1.75; margin-bottom: 36px; max-width: 480px;
    }

    .hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; }
    .cta-primary {
      display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px;
      background: linear-gradient(135deg, #0D9488, #0891b2); color: #fff;
      text-decoration: none; border-radius: 10px; font-family: 'DM Sans', sans-serif;
      font-size: 15px; font-weight: 700; transition: all 0.2s;
      box-shadow: 0 0 30px rgba(13,148,136,0.35);
    }
    .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 40px rgba(13,148,136,0.45); }
    .cta-arrow { font-size: 18px; transition: transform 0.2s; }
    .cta-primary:hover .cta-arrow { transform: translateX(4px); }
    .cta-large { font-size: 16px; padding: 16px 32px; }

    .cta-ghost {
      display: inline-flex; align-items: center; padding: 14px 24px;
      border: 1px solid #1e2433; color: #94a3b8; text-decoration: none;
      border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 15px;
      font-weight: 500; transition: all 0.15s;
    }
    .cta-ghost:hover { border-color: #5EEAD4; color: #5EEAD4; }

    .hero-note { font-size: 12px; color: #334155; font-family: 'JetBrains Mono', monospace; }

    /* Hero mockup */
    .hero-visual { position: relative; }
    .mockup-card {
      background: #0d1117; border: 1px solid #1e2433; border-radius: 16px;
      overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.5);
      animation: float 6s ease-in-out infinite;
    }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }

    .mockup-header {
      display: flex; align-items: center; gap: 10px; padding: 12px 16px;
      background: #111827; border-bottom: 1px solid #1e2433;
    }
    .mockup-dots { display: flex; gap: 5px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot-red { background: #ef4444; }
    .dot-yellow { background: #f59e0b; }
    .dot-green { background: #22c55e; }
    .mockup-title { flex: 1; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #94a3b8; }
    .mockup-live { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #22c55e; animation: blink 2s infinite; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.4} }

    .mockup-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
    .mockup-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .label { font-size: 11px; color: #475569; font-family: 'JetBrains Mono', monospace; white-space: nowrap; }
    .thinking-bar { flex: 1; height: 6px; background: #1e2433; border-radius: 3px; overflow: hidden; }
    .thinking-fill { height: 100%; background: linear-gradient(90deg, #0D9488, #5EEAD4); border-radius: 3px; animation: grow 2s ease forwards; }
    .thinking-fill.tf-2 { background: linear-gradient(90deg, #0891b2, #38bdf8); }
    @keyframes grow { from{width:0} }
    .emotion-badge { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 20px; font-family: 'JetBrains Mono', monospace; }
    .emotion-badge.calm { background: rgba(34,197,94,0.12); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
    .rr-badge { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #5EEAD4; }
    .mockup-divider { height: 1px; background: #1e2433; }
    .mockup-metrics { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
    .metric { display: flex; flex-direction: column; align-items: center; gap: 3px; }
    .metric-v { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; }
    .metric-v.green { color: #22c55e; }
    .metric-v.teal { color: #5EEAD4; }
    .metric-l { font-size: 10px; color: #475569; font-family: 'JetBrains Mono', monospace; }

    .mockup-float {
      position: absolute; background: #0d1117; border: 1px solid #1e2433;
      border-radius: 10px; padding: 8px 14px; display: flex; align-items: center;
      gap: 8px; font-size: 12px; color: #94a3b8; box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      font-family: 'DM Sans', sans-serif;
    }
    .float-1 { top: -16px; right: -16px; animation: float2 4s ease-in-out infinite; }
    .float-2 { bottom: 32px; left: -24px; animation: float2 5s ease-in-out infinite 1s; }
    @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    .float-icon { font-size: 16px; }

    /* Stats bar */
    .stats-bar { position: relative; z-index: 1; border-top: 1px solid #1e2433; background: rgba(13,17,23,0.8); backdrop-filter: blur(8px); }
    .stats-container {
      max-width: 1200px; margin: 0 auto; padding: 24px;
      display: flex; align-items: center; justify-content: center; gap: 0; flex-wrap: wrap;
    }
    .stat { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 0 40px; }
    .stat-n { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #5EEAD4; }
    .stat-l { font-size: 12px; color: #475569; font-family: 'DM Sans', sans-serif; }
    .stat-sep { width: 1px; height: 40px; background: #1e2433; }
    .mono { font-family: 'JetBrains Mono', monospace !important; }

    /* ── Section base ───────────────────────────────────────────────────────── */
    .section { padding: 100px 0; }
    .section-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .section-header { text-align: center; margin-bottom: 64px; }
    .section-label {
      font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700;
      color: #5EEAD4; letter-spacing: 2px; display: block; margin-bottom: 16px;
    }
    .section-title {
      font-family: 'Syne', sans-serif; font-size: clamp(28px, 4vw, 44px);
      font-weight: 800; color: #f8fafc; line-height: 1.15; letter-spacing: -1px;
      margin-bottom: 16px;
    }
    .title-teal { color: #5EEAD4; }
    .section-sub {
      font-family: 'DM Sans', sans-serif; font-size: 16px; color: #64748b;
      max-width: 520px; margin: 0 auto; line-height: 1.7;
    }

    /* ── Features ───────────────────────────────────────────────────────────── */
    .features-section { background: #070b14; }
    .features-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
    }
    .feature-card {
      background: #0d1117; border: 1px solid #1e2433; border-radius: 16px;
      padding: 28px; transition: all 0.25s; cursor: default;
      animation: fadeUp 0.6s ease backwards;
    }
    @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    .feature-card:hover {
      border-color: rgba(13,148,136,0.4); background: rgba(13,148,136,0.04);
      transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.3);
    }
    .feature-icon-wrap {
      width: 48px; height: 48px; border-radius: 12px; display: flex;
      align-items: center; justify-content: center; margin-bottom: 16px;
    }
    .feature-icon { font-size: 22px; }
    .feature-name {
      font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700;
      color: #e2e8f0; margin-bottom: 8px; letter-spacing: -0.3px;
    }
    .feature-desc { font-family: 'DM Sans', sans-serif; font-size: 14px; color: #64748b; line-height: 1.65; margin-bottom: 16px; }
    .feature-tag {
      font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #334155;
      text-transform: uppercase; letter-spacing: 1px;
    }

    /* ── Thinking Layer ─────────────────────────────────────────────────────── */
    .thinking-section { background: #0a0e1a; }
    .thinking-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center; }
    .thinking-questions { display: flex; flex-direction: column; gap: 20px; margin: 32px 0; }
    .tq-item { display: flex; align-items: flex-start; gap: 16px; }
    .tq-num {
      font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #5EEAD4;
      background: rgba(13,148,136,0.1); border: 1px solid rgba(13,148,136,0.2);
      padding: 4px 8px; border-radius: 6px; flex-shrink: 0; margin-top: 2px;
    }
    .tq-q { font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; color: #e2e8f0; margin-bottom: 3px; }
    .tq-hint { font-size: 13px; color: #475569; font-family: 'DM Sans', sans-serif; }
    .thinking-result {
      display: flex; align-items: flex-start; gap: 12px; padding: 16px 18px;
      background: rgba(13,148,136,0.07); border: 1px solid rgba(13,148,136,0.2);
      border-radius: 10px; font-size: 14px; color: #5EEAD4; font-family: 'DM Sans', sans-serif;
      line-height: 1.6;
    }
    .result-icon { font-size: 18px; flex-shrink: 0; }

    /* Entry card mockup */
    .entry-card {
      background: #0d1117; border: 1px solid #1e2433; border-radius: 16px;
      padding: 24px; box-shadow: 0 24px 80px rgba(0,0,0,0.4);
    }
    .entry-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .entry-badge { font-size: 11px; font-family: 'JetBrains Mono', monospace; }
    .entry-badge.strict {
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
      color: #f87171; padding: 4px 10px; border-radius: 6px;
    }
    .entry-trade { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #334155; }
    .entry-fields { display: flex; flex-direction: column; gap: 16px; }
    .entry-field { display: flex; flex-direction: column; gap: 6px; }
    .entry-field label { font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
    .entry-text {
      background: #070b14; border: 1px solid #1e2433; border-radius: 8px;
      padding: 10px 12px; font-size: 13px; color: #94a3b8; line-height: 1.5;
      font-family: 'DM Sans', sans-serif;
    }
    .char-count { font-size: 11px; font-family: 'JetBrains Mono', monospace; text-align: right; }
    .char-count.teal { color: #0D9488; }
    .rr-value { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 700; color: #5EEAD4; margin-top: 6px; display: block; }

    /* ── How It Works ───────────────────────────────────────────────────────── */
    .hiw-section { background: #070b14; }
    .hiw-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 32px; position: relative; }
    .hiw-step {
      background: #0d1117; border: 1px solid #1e2433; border-radius: 16px;
      padding: 32px 28px; position: relative;
    }
    .step-num {
      font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700;
      color: #334155; letter-spacing: 1px; margin-bottom: 16px; display: block;
    }
    .step-icon { font-size: 32px; margin-bottom: 16px; display: block; }
    .step-title {
      font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: #e2e8f0;
      margin-bottom: 10px; letter-spacing: -0.3px;
    }
    .step-desc { font-family: 'DM Sans', sans-serif; font-size: 14px; color: #64748b; line-height: 1.65; }
    .step-connector {
      position: absolute; top: 50%; right: -18px; width: 36px; height: 1px;
      background: linear-gradient(90deg, #1e2433, #5EEAD4); z-index: 1;
    }

    /* ── Pricing preview ────────────────────────────────────────────────────── */
    .pricing-section { background: #0a0e1a; }
    .pricing-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-bottom: 32px; }
    .pricing-card {
      background: #0d1117; border: 1px solid #1e2433; border-radius: 16px;
      padding: 32px; position: relative; transition: all 0.2s;
    }
    .pricing-card:hover { transform: translateY(-4px); }
    .plan-badge {
      position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
      background: linear-gradient(135deg, #0D9488, #0891b2); color: #fff;
      font-size: 11px; font-weight: 700; padding: 4px 14px; border-radius: 20px;
      font-family: 'JetBrains Mono', monospace; letter-spacing: 1px; white-space: nowrap;
    }
    .plan-name { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #5EEAD4; letter-spacing: 2px; margin-bottom: 16px; }
    .plan-price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 8px; }
    .price-val { font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800; color: #f8fafc; }
    .price-per { font-size: 13px; color: #475569; font-family: 'DM Sans', sans-serif; }
    .plan-desc { font-size: 13px; color: #475569; font-family: 'DM Sans', sans-serif; margin-bottom: 20px; line-height: 1.5; }
    .plan-divider { height: 1px; background: #1e2433; margin-bottom: 20px; }
    .plan-features { list-style: none; padding: 0; margin: 0 0 24px; display: flex; flex-direction: column; gap: 10px; }
    .plan-feat { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: #94a3b8; font-family: 'DM Sans', sans-serif; }
    .feat-check { color: #0D9488; font-weight: 700; flex-shrink: 0; }
    .plan-btn {
      display: block; text-align: center; padding: 12px; border-radius: 9px;
      text-decoration: none; font-size: 14px; font-weight: 600;
      border: 1px solid #1e2433; color: #94a3b8; font-family: 'DM Sans', sans-serif;
      transition: all 0.15s;
    }
    .plan-btn:hover { border-color: #475569; color: #e2e8f0; }
    .plan-btn--primary {
      background: linear-gradient(135deg, #0D9488, #0891b2); color: #fff !important;
      border: none !important; box-shadow: 0 4px 20px rgba(13,148,136,0.3);
    }
    .plan-btn--primary:hover { box-shadow: 0 8px 32px rgba(13,148,136,0.4); transform: translateY(-1px); }
    .pricing-footnote { text-align: center; }
    .compare-link { color: #5EEAD4; text-decoration: none; font-size: 14px; font-family: 'DM Sans', sans-serif; border-bottom: 1px solid rgba(94,234,212,0.3); transition: border-color 0.15s; }
    .compare-link:hover { border-color: #5EEAD4; }

    /* ── CTA section ────────────────────────────────────────────────────────── */
    .cta-section { background: #070b14; }
    .cta-box {
      position: relative; background: #0d1117; border: 1px solid #1e2433;
      border-radius: 24px; padding: 80px 48px; text-align: center; overflow: hidden;
    }
    .cta-glow {
      position: absolute; top: -100px; left: 50%; transform: translateX(-50%);
      width: 500px; height: 300px; background: radial-gradient(ellipse, rgba(13,148,136,0.2) 0%, transparent 70%);
      pointer-events: none;
    }
    .cta-headline {
      font-family: 'Syne', sans-serif; font-size: clamp(28px, 4vw, 44px); font-weight: 800;
      color: #f8fafc; line-height: 1.2; letter-spacing: -1px; margin-bottom: 16px;
      position: relative; z-index: 1;
    }
    .cta-sub {
      font-family: 'DM Sans', sans-serif; font-size: 16px; color: #64748b;
      max-width: 480px; margin: 0 auto 36px; line-height: 1.7; position: relative; z-index: 1;
    }
    .cta-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }

    /* ── Responsive ─────────────────────────────────────────────────────────── */
    @media (max-width: 900px) {
      .hero-container { grid-template-columns: 1fr; gap: 48px; }
      .hero-visual { display: none; }
      .features-grid { grid-template-columns: repeat(2,1fr); }
      .thinking-layout { grid-template-columns: 1fr; }
      .hiw-grid, .pricing-grid { grid-template-columns: 1fr; }
      .step-connector { display: none; }
      .stats-container { gap: 20px; }
      .stat { padding: 0 20px; }
      .stat-sep { display: none; }
    }
    @media (max-width: 600px) {
      .features-grid { grid-template-columns: 1fr; }
      .cta-box { padding: 48px 24px; }
      .hero-headline { font-size: 32px; }
    }
  `]
})
export class LandingComponent implements OnInit {
  readonly String = String;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  features = [
    {
      icon: '🧠', name: 'Mandatory Thinking Layer',
      desc: 'Write your thesis before every entry. Why you\'re taking it, your edge, confirmation, and invalidation. No vague entries accepted.',
      tag: '→ FORCES CLARITY BEFORE RISK', iconBg: 'rgba(13,148,136,0.12)'
    },
    {
      icon: '🔍', name: 'Behavioral Pattern Detection',
      desc: 'System automatically identifies your FOMO trades, revenge entries, overconfidence patterns, and SL breaches across all your trades.',
      tag: '→ REVEALS YOUR BLINDSPOTS', iconBg: 'rgba(139,92,246,0.12)'
    },
    {
      icon: '📊', name: 'Deep Performance Analytics',
      desc: 'Win rate, profit factor, expectancy, R:R by setup type, emotion, time-of-day, instrument, and market context — all in one view.',
      tag: '→ DATA NOT FEELINGS', iconBg: 'rgba(59,130,246,0.12)'
    },
    {
      icon: '📄', name: 'Automated Weekly PDF Reports',
      desc: 'Every Saturday, a detailed PDF report lands in your inbox: P&L, discipline grade, patterns, SL breaches, and agent recommendations.',
      tag: '→ ACCOUNTABILITY EVERY WEEK', iconBg: 'rgba(245,158,11,0.12)'
    },
    {
      icon: '💢', name: 'Emotion vs P&L Tracking',
      desc: 'See exactly how CALM vs FOMO vs REVENGE states affect your actual win rate and average profit. The data is always humbling.',
      tag: '→ PSYCHOLOGY MADE QUANTITATIVE', iconBg: 'rgba(239,68,68,0.12)'
    },
    {
      icon: '🔒', name: 'Strict Mode Enforcement',
      desc: 'Lock down your journal. Strict Mode rejects incomplete entries at the system level — minimum character counts, all fields required.',
      tag: '→ DISCIPLINE BY DESIGN', iconBg: 'rgba(34,197,94,0.12)'
    }
  ];

  thinkingQuestions = [
    { question: 'Why am I taking this trade?', hint: 'Minimum 20 characters. "It looks good" is rejected.' },
    { question: 'What is my edge / setup logic?', hint: 'What gives you a statistical advantage here?' },
    { question: 'What confirmation did I use?', hint: 'What triggered the actual entry?' },
    { question: 'What would invalidate this trade?', hint: 'When exactly would you exit if wrong?' }
  ];

  steps = [
    {
      icon: '📝',
      title: 'Log every trade with context',
      desc: 'Entry price, stop loss, target, setup type, emotion, and your mandatory reasoning layer. Every field has a purpose.'
    },
    {
      icon: '🔬',
      title: 'Patterns emerge automatically',
      desc: 'The system detects your behavioral patterns across trades: FOMO clustering, revenge sequences, SL breach patterns, and time-of-day bias.'
    },
    {
      icon: '📈',
      title: 'Improve with weekly data',
      desc: 'Saturday PDF reports, discipline grades (A–F), agent recommendations, and a clear picture of what\'s actually working.'
    }
  ];

  plans = [
    {
      name: 'FREE', price: '₹0', per: '/forever',
      desc: 'Core journaling for traders getting started.',
      features: ['Up to 50 trades/month', 'Basic analytics', 'Thinking layer enforcement', 'Email notifications', 'Google & GitHub login'],
      cta: { label: 'Start Free →', link: '/auth/register' },
      highlight: false, badge: null
    },
    {
      name: 'PRO', price: '₹499', per: '/month',
      desc: 'Full power for serious traders.',
      features: ['Unlimited trades', 'Full analytics suite', 'Pattern detection AI', 'Weekly PDF reports', 'Strict mode', 'Priority support', 'Data export'],
      cta: { label: 'Coming Soon', link: '/pricing' },
      highlight: true, badge: 'MOST POPULAR'
    },
    {
      name: 'ENTERPRISE', price: 'Custom', per: '',
      desc: 'For prop desks and trading teams.',
      features: ['Everything in PRO', 'Team accounts', 'API access', 'Custom integrations', 'Dedicated support', 'White-labeling'],
      cta: { label: 'Contact Us →', link: '/contact' },
      highlight: false, badge: null
    }
  ];
}