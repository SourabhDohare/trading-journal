import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PublicNavbarComponent } from './public-navbar.component';
import { PublicFooterComponent } from './public-footer.component';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicNavbarComponent, PublicFooterComponent],
  template: `
    <div class="page-wrap">
      <app-public-navbar />

      <main class="main">
        <!-- Hero -->
        <section class="pricing-hero">
          <div class="hero-glow"></div>
          <div class="container">
            <span class="section-label mono">PRICING</span>
            <h1 class="hero-title">
              Simple, honest pricing.<br>
              <span class="teal">No surprises.</span>
            </h1>
            <p class="hero-sub">
              Start free and journal without limits on thinking quality.
              Upgrade when you want unlimited trades and weekly reports.
            </p>
          </div>
        </section>

        <!-- Plans -->
        <section class="plans-section">
          <div class="container">
            <div class="plans-grid">
              <div class="plan-card" *ngFor="let plan of plans" [class.plan-card--featured]="plan.featured">
                <div class="plan-badge" *ngIf="plan.badge">{{ plan.badge }}</div>
                <div class="plan-header">
                  <div class="plan-name mono">{{ plan.name }}</div>
                  <div class="plan-price-wrap">
                    <span class="plan-price">{{ plan.price }}</span>
                    <span class="plan-cycle">{{ plan.cycle }}</span>
                  </div>
                  <p class="plan-desc">{{ plan.desc }}</p>
                </div>
                <a [routerLink]="plan.ctaLink" class="plan-cta" [class.plan-cta--primary]="plan.featured">
                  {{ plan.ctaLabel }}
                </a>
                <div class="plan-divider"></div>
                <div class="plan-features-list">
                  <div class="pf-group" *ngFor="let group of plan.featureGroups">
                    <div class="pf-group-title">{{ group.title }}</div>
                    <div class="pf-item" *ngFor="let feat of group.features"
                         [class.pf-item--na]="!feat.available">
                      <span class="pf-icon">{{ feat.available ? '✓' : '—' }}</span>
                      <span>{{ feat.name }}</span>
                      <span class="pf-badge" *ngIf="feat.badge">{{ feat.badge }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- FAQ -->
        <section class="faq-section">
          <div class="container">
            <div class="section-header">
              <span class="section-label mono">FAQ</span>
              <h2 class="section-title">Common questions</h2>
            </div>
            <div class="faq-grid">
              <div class="faq-item" *ngFor="let faq of faqs" (click)="toggleFaq(faq)"
                   [class.faq-open]="faq.open">
                <div class="faq-q">
                  <span>{{ faq.q }}</span>
                  <span class="faq-icon">{{ faq.open ? '−' : '+' }}</span>
                </div>
                <div class="faq-a" *ngIf="faq.open">{{ faq.a }}</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Bottom CTA -->
        <section class="bottom-cta">
          <div class="container">
            <div class="bottom-cta-box">
              <h2 class="bottom-cta-title">Start for free. No credit card.</h2>
              <p class="bottom-cta-sub">Your first 50 trades are free — with full thinking layer, analytics, and discipline tracking.</p>
              <a routerLink="/auth/register" class="cta-btn">Create Free Account →</a>
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

    .pricing-hero {
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
      font-weight: 800; color: #f8fafc; line-height: 1.15; letter-spacing: -1px;
      margin-bottom: 16px; position: relative;
    }
    .hero-sub {
      font-family: 'DM Sans', sans-serif; font-size: 16px; color: #64748b;
      max-width: 480px; margin: 0 auto; line-height: 1.7;
    }

    .plans-section { padding: 48px 0 80px; }
    .plans-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
    .plan-card {
      background: #0d1117; border: 1px solid #1e2433; border-radius: 18px;
      padding: 32px; position: relative; transition: transform 0.2s;
    }
    .plan-card:hover { transform: translateY(-4px); }
    .plan-card--featured {
      border-color: rgba(13,148,136,0.5);
      box-shadow: 0 0 40px rgba(13,148,136,0.12), inset 0 0 40px rgba(13,148,136,0.03);
    }
    .plan-badge {
      position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
      background: linear-gradient(135deg, #0D9488, #0891b2); color: #fff;
      font-size: 10px; font-weight: 700; padding: 4px 14px; border-radius: 20px;
      font-family: 'JetBrains Mono', monospace; letter-spacing: 1.5px; white-space: nowrap;
    }
    .plan-header { margin-bottom: 24px; }
    .plan-name { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #5EEAD4; letter-spacing: 2px; margin-bottom: 12px; }
    .plan-price-wrap { display: flex; align-items: baseline; gap: 4px; margin-bottom: 8px; }
    .plan-price { font-family: 'Syne', sans-serif; font-size: 38px; font-weight: 800; color: #f8fafc; }
    .plan-cycle { font-size: 13px; color: #475569; font-family: 'DM Sans', sans-serif; }
    .plan-desc { font-size: 13px; color: #64748b; font-family: 'DM Sans', sans-serif; line-height: 1.5; }
    .plan-cta {
      display: block; text-align: center; padding: 12px 20px; border-radius: 10px;
      text-decoration: none; font-size: 14px; font-weight: 600; margin-bottom: 24px;
      border: 1px solid #1e2433; color: #94a3b8; font-family: 'DM Sans', sans-serif;
      transition: all 0.15s;
    }
    .plan-cta:hover { border-color: #475569; color: #e2e8f0; }
    .plan-cta--primary {
      background: linear-gradient(135deg, #0D9488, #0891b2); color: #fff !important;
      border: none !important; box-shadow: 0 4px 24px rgba(13,148,136,0.3);
    }
    .plan-cta--primary:hover { box-shadow: 0 8px 32px rgba(13,148,136,0.45); transform: translateY(-1px); }
    .plan-divider { height: 1px; background: #1e2433; margin-bottom: 24px; }

    .plan-features-list { display: flex; flex-direction: column; gap: 20px; }
    .pf-group-title {
      font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #334155;
      text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;
    }
    .pf-item {
      display: flex; align-items: center; gap: 10px;
      font-size: 13px; color: #94a3b8; font-family: 'DM Sans', sans-serif;
      padding: 3px 0;
    }
    .pf-item--na { opacity: 0.35; }
    .pf-icon { color: #0D9488; font-weight: 700; font-size: 14px; flex-shrink: 0; width: 14px; }
    .pf-item--na .pf-icon { color: #334155; }
    .pf-badge {
      margin-left: auto; font-size: 10px; padding: 2px 7px; border-radius: 10px;
      background: rgba(13,148,136,0.1); color: #5EEAD4; border: 1px solid rgba(13,148,136,0.2);
      font-family: 'JetBrains Mono', monospace; white-space: nowrap;
    }

    .faq-section { padding: 80px 0; background: #0a0e1a; }
    .section-header { text-align: center; margin-bottom: 48px; }
    .section-title {
      font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800;
      color: #f8fafc; letter-spacing: -0.5px;
    }
    .faq-grid { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 8px; }
    .faq-item {
      background: #0d1117; border: 1px solid #1e2433; border-radius: 12px;
      overflow: hidden; cursor: pointer; transition: border-color 0.15s;
    }
    .faq-item:hover { border-color: #2d3748; }
    .faq-item.faq-open { border-color: rgba(13,148,136,0.35); }
    .faq-q {
      display: flex; justify-content: space-between; align-items: center;
      padding: 18px 20px; font-family: 'DM Sans', sans-serif; font-size: 15px;
      font-weight: 600; color: #e2e8f0;
    }
    .faq-icon { font-size: 20px; color: #5EEAD4; font-weight: 300; flex-shrink: 0; margin-left: 16px; }
    .faq-a {
      padding: 0 20px 18px; font-family: 'DM Sans', sans-serif; font-size: 14px;
      color: #64748b; line-height: 1.7; border-top: 1px solid #111827;
      padding-top: 14px;
    }

    .bottom-cta { padding: 80px 0; }
    .bottom-cta-box {
      background: #0d1117; border: 1px solid #1e2433; border-radius: 20px;
      padding: 64px 48px; text-align: center;
      background-image: radial-gradient(ellipse at top, rgba(13,148,136,0.08) 0%, transparent 60%);
    }
    .bottom-cta-title {
      font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800;
      color: #f8fafc; margin-bottom: 12px; letter-spacing: -0.5px;
    }
    .bottom-cta-sub { font-size: 15px; color: #64748b; font-family: 'DM Sans', sans-serif; margin-bottom: 28px; line-height: 1.6; }
    .cta-btn {
      display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0D9488, #0891b2);
      color: #fff; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 700;
      font-family: 'DM Sans', sans-serif; box-shadow: 0 4px 24px rgba(13,148,136,0.3);
      transition: all 0.2s;
    }
    .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 40px rgba(13,148,136,0.4); }

    @media (max-width: 900px) { .plans-grid { grid-template-columns: 1fr; } }
  `]
})
export class PricingComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    if (this.authService.isLoggedIn()) this.router.navigate(['/dashboard']);
  }

  plans = [
    {
      name: 'FREE', price: '₹0', cycle: '/ forever',
      desc: 'Core journaling for traders getting started. No credit card, no expiry.',
      ctaLabel: 'Start Free →', ctaLink: '/auth/register',
      featured: false, badge: null,
      featureGroups: [
        {
          title: 'Journaling',
          features: [
            { name: 'Up to 50 trades / month', available: true },
            { name: 'Mandatory thinking layer', available: true },
            { name: 'Emotion & setup tracking', available: true },
            { name: 'Chart image uploads (5 per trade)', available: true },
            { name: 'Post-trade reflection', available: true },
          ]
        },
        {
          title: 'Analytics',
          features: [
            { name: 'Basic win/loss analytics', available: true },
            { name: 'Full pattern detection', available: false },
            { name: 'Emotion vs P&L breakdown', available: false },
            { name: 'Time-of-day performance', available: false },
          ]
        },
        {
          title: 'Reports',
          features: [
            { name: 'Weekly PDF reports', available: false },
            { name: 'PDF download on demand', available: false },
            { name: 'Email trade notifications', available: true },
          ]
        }
      ]
    },
    {
      name: 'PRO', price: '₹499', cycle: '/ month',
      desc: 'Everything a serious trader needs. Unlimited trades, full analytics, weekly reports.',
      ctaLabel: 'Coming Soon', ctaLink: '/contact',
      featured: true, badge: 'MOST POPULAR',
      featureGroups: [
        {
          title: 'Journaling',
          features: [
            { name: 'Unlimited trades', available: true, badge: 'UNLIMITED' },
            { name: 'Mandatory thinking layer', available: true },
            { name: 'Strict Mode enforcement', available: true },
            { name: 'Chart image uploads (5 per trade)', available: true },
            { name: 'Post-trade reflection', available: true },
          ]
        },
        {
          title: 'Analytics',
          features: [
            { name: 'Full analytics suite', available: true },
            { name: 'AI pattern detection', available: true },
            { name: 'Emotion vs P&L breakdown', available: true },
            { name: 'Time-of-day performance', available: true },
          ]
        },
        {
          title: 'Reports',
          features: [
            { name: 'Weekly PDF reports (auto)', available: true },
            { name: 'PDF download on demand', available: true },
            { name: 'Email trade notifications', available: true },
          ]
        }
      ]
    },
    {
      name: 'ENTERPRISE', price: 'Custom', cycle: '',
      desc: 'For proprietary trading desks, trading firms, and teams.',
      ctaLabel: 'Contact Sales →', ctaLink: '/contact',
      featured: false, badge: null,
      featureGroups: [
        {
          title: 'Everything in PRO',
          features: [
            { name: 'Unlimited team members', available: true },
            { name: 'Centralized team analytics', available: true },
            { name: 'API access', available: true },
            { name: 'Custom integrations', available: true },
          ]
        },
        {
          title: 'Support',
          features: [
            { name: 'Dedicated account manager', available: true },
            { name: 'Priority support (< 2h)', available: true },
            { name: 'Custom onboarding', available: true },
            { name: 'White-labeling', available: true },
          ]
        }
      ]
    }
  ];

  faqs = [
    { q: 'Is the free plan really free forever?', a: 'Yes. The FREE plan does not expire. You can journal up to 50 trades per month with full thinking layer, reflection, and basic analytics — free, permanently. No credit card required to start.', open: false },
    { q: 'What happens if I exceed 50 trades on the free plan?', a: 'You\'ll be notified when approaching the limit. You can continue viewing your existing trades and analytics, but won\'t be able to add new entries until the next month or until you upgrade to PRO.', open: false },
    { q: 'When is PRO launching?', a: 'PRO is currently in development. We\'re focused on getting the core journaling experience right first. Join the waitlist by contacting us and you\'ll be among the first to access it, with a founder discount.', open: false },
    { q: 'Is my trading data secure?', a: 'All data is stored in MongoDB Atlas with encryption at rest. Passwords are BCrypt hashed. OTPs are SHA-256 hashed before storage — raw codes never touch the database. We take your financial data seriously.', open: false },
    { q: 'Can I export my trade history?', a: 'On the FREE plan you can download individual reports. Full data export (CSV, JSON) will be available on PRO. Your data is always yours and will never be sold or shared.', open: false },
    { q: 'Is there an app for mobile?', a: 'MarketSaga is a fully responsive Progressive Web App. It works on all mobile browsers without any app store download. A native app is on the roadmap for after PRO launch.', open: false },
  ];

  toggleFaq(faq: any) { faq.open = !faq.open; }
}