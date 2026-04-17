import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="footer">
      <div class="footer-container">

        <div class="footer-top">
          <!-- Brand -->
          <div class="footer-brand">
            <a routerLink="/" class="footer-logo">
              <svg width="28" height="34" viewBox="0 0 100 120" fill="none">
                <path d="M50 15L15 30V65C15 85 50 105 50 105C50 105 85 85 85 65V30L50 15Z" fill="#0D9488"/>
                <path d="M35 68L48 50L58 60L75 35" stroke="#5EEAD4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="75" cy="35" r="7" fill="white"/>
              </svg>
              <span class="footer-logo-text">Market<span class="teal">Saga</span></span>
            </a>
            <p class="footer-tagline">
              Trade with Clarity.<br>Journal with Discipline.
            </p>
            <div class="footer-badge">
              <span class="badge-dot"></span>
              Built for Indian retail traders
            </div>
          </div>

          <!-- Links -->
          <div class="footer-links-grid">
            <div class="footer-col">
              <h4 class="footer-col-title">Product</h4>
              <a routerLink="/#features" class="footer-link">Features</a>
              <a routerLink="/pricing"   class="footer-link">Pricing</a>
              <a routerLink="/auth/register" class="footer-link">Sign Up Free</a>
              <a routerLink="/auth/login"    class="footer-link">Sign In</a>
            </div>
            <div class="footer-col">
              <h4 class="footer-col-title">Company</h4>
              <a routerLink="/contact"  class="footer-link">Contact Us</a>
              <a routerLink="/feedback" class="footer-link">Give Feedback</a>
            </div>
            <div class="footer-col">
              <h4 class="footer-col-title">Legal</h4>
              <a routerLink="/privacy" class="footer-link">Privacy Policy</a>
              <a routerLink="/terms"   class="footer-link">Terms of Service</a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <span class="footer-copy">
            © {{ year }} Market Saga. All rights reserved.
          </span>
          <span class="footer-made">
            Made with precision for traders who take their craft seriously.
          </span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: #0d1117; border-top: 1px solid #1e2433;
      padding: 64px 0 32px;
    }
    .footer-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

    .footer-top {
      display: grid; grid-template-columns: 1fr 2fr; gap: 64px; margin-bottom: 48px;
    }

    .footer-logo {
      display: flex; align-items: center; gap: 10px; text-decoration: none; margin-bottom: 16px;
    }
    .footer-logo-text {
      font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #fff;
    }
    .teal { color: #5EEAD4; font-weight: 600; }
    .footer-tagline {
      font-family: 'DM Sans', sans-serif; font-size: 14px; color: #475569;
      line-height: 1.7; margin-bottom: 16px;
    }
    .footer-badge {
      display: inline-flex; align-items: center; gap: 7px; font-size: 12px;
      color: #5EEAD4; background: rgba(13,148,136,0.1); padding: 5px 12px;
      border-radius: 20px; border: 1px solid rgba(13,148,136,0.2);
      font-family: 'JetBrains Mono', monospace;
    }
    .badge-dot {
      width: 6px; height: 6px; border-radius: 50%; background: #22c55e;
      animation: blink 2s infinite;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

    .footer-links-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px;
    }
    .footer-col { display: flex; flex-direction: column; gap: 10px; }
    .footer-col-title {
      font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
      color: #e2e8f0; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;
    }
    .footer-link {
      color: #475569; text-decoration: none; font-size: 14px;
      font-family: 'DM Sans', sans-serif; transition: color 0.15s;
    }
    .footer-link:hover { color: #5EEAD4; }

    .footer-bottom {
      display: flex; justify-content: space-between; align-items: center;
      padding-top: 32px; border-top: 1px solid #111827; flex-wrap: wrap; gap: 12px;
    }
    .footer-copy { font-size: 13px; color: #334155; font-family: 'DM Sans', sans-serif; }
    .footer-made { font-size: 12px; color: #1e2433; font-family: 'JetBrains Mono', monospace; }

    @media (max-width: 768px) {
      .footer-top { grid-template-columns: 1fr; gap: 40px; }
      .footer-links-grid { grid-template-columns: repeat(2, 1fr); }
      .footer-bottom { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class PublicFooterComponent {
  year = new Date().getFullYear();
}