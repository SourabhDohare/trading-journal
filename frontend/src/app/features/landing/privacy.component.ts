import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicNavbarComponent } from './public-navbar.component';
import { PublicFooterComponent } from './public-footer.component';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicNavbarComponent, PublicFooterComponent],
  template: `
    <div class="page-wrap">
      <app-public-navbar />
      <main class="main">
        <div class="doc-container">
          <div class="doc-header">
            <span class="section-label mono">LEGAL</span>
            <h1 class="doc-title">Privacy Policy</h1>
            <p class="doc-meta mono">Last updated: April 17, 2026 · Effective immediately</p>
          </div>
          <div class="doc-body">
            <div class="doc-section" *ngFor="let section of sections">
              <h2 class="doc-h2">{{ section.title }}</h2>
              <div class="doc-content" [innerHTML]="section.content"></div>
            </div>
            <div class="doc-contact">
              <h2 class="doc-h2">Contact Us</h2>
              <p>For privacy-related questions, contact us at <a href="mailto:support@marketsaga.site" class="doc-link">support&#64;marketsaga.site</a>.</p>
            </div>
          </div>
        </div>
      </main>
      <app-public-footer />
    </div>
  `,
  styles: [`
    .page-wrap { background: #070b14; min-height: 100vh; }
    .main { padding-top: 80px; padding-bottom: 100px; }
    .doc-container { max-width: 760px; margin: 0 auto; padding: 64px 24px; }
    .mono { font-family: 'JetBrains Mono', monospace !important; }
    .section-label { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: #5EEAD4; letter-spacing: 2px; display: block; margin-bottom: 16px; }
    .doc-title { font-family: 'Syne', sans-serif; font-size: 44px; font-weight: 800; color: #f8fafc; letter-spacing: -1px; margin-bottom: 12px; }
    .doc-meta { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #334155; margin-bottom: 48px; display: block; }
    .doc-body { display: flex; flex-direction: column; gap: 40px; }
    .doc-section {}
    .doc-h2 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #e2e8f0; margin-bottom: 14px; border-left: 3px solid #0D9488; padding-left: 14px; }
    .doc-content { font-family: 'DM Sans', sans-serif; font-size: 15px; color: #64748b; line-height: 1.8; }
    .doc-content p { margin-bottom: 12px; }
    .doc-content ul { padding-left: 20px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 6px; }
    .doc-contact { border-top: 1px solid #1e2433; padding-top: 32px; font-family: 'DM Sans', sans-serif; font-size: 15px; color: #64748b; line-height: 1.8; }
    .doc-link { color: #5EEAD4; text-decoration: none; }
    .doc-link:hover { text-decoration: underline; }
  `]
})
export class PrivacyComponent {
  sections = [
    {
      title: '1. Information We Collect',
      content: `<p>When you use Market Saga, we collect the following categories of information:</p>
        <ul>
          <li><strong style="color:#94a3b8">Account information:</strong> Email address, name, and password (BCrypt hashed — never stored in plain text).</li>
          <li><strong style="color:#94a3b8">OAuth information:</strong> If you sign in with Google or GitHub, we receive your email, name, and profile picture from those providers.</li>
          <li><strong style="color:#94a3b8">Trade data:</strong> All trade entries, reflections, chart images, and journaling content you submit.</li>
          <li><strong style="color:#94a3b8">Usage data:</strong> Session information, browser type, and general usage patterns for improving the product.</li>
          <li><strong style="color:#94a3b8">OTP security data:</strong> IP address and user agent at OTP request time (stored as SHA-256 hash alongside OTP — deleted within 24 hours of verification).</li>
        </ul>`
    },
    {
      title: '2. How We Use Your Information',
      content: `<p>We use your information solely to provide and improve the Market Saga service:</p>
        <ul>
          <li>To authenticate you and secure your account.</li>
          <li>To store and display your trade journal, analytics, and reports.</li>
          <li>To send you weekly PDF performance reports (if enabled).</li>
          <li>To send OTP verification and password reset emails.</li>
          <li>To detect and prevent fraudulent or abusive activity.</li>
          <li>To improve the product based on anonymized usage patterns.</li>
        </ul>
        <p>We will never sell, rent, or share your personal information with third parties for marketing purposes.</p>`
    },
    {
      title: '3. Data Storage and Security',
      content: `<p>Your data is stored in MongoDB Atlas (AWS AP-South-1 region — Mumbai) with encryption at rest.</p>
        <ul>
          <li>Passwords are BCrypt hashed with a minimum cost factor of 10.</li>
          <li>OTP codes are SHA-256 hashed before storage — raw codes never touch the database.</li>
          <li>All communication between your browser and our servers is encrypted via HTTPS/TLS.</li>
          <li>JWT tokens expire after 24 hours. Refresh tokens expire after 7 days.</li>
          <li>Unverified accounts are automatically deleted after 24 hours.</li>
          <li>Expired OTPs are deleted within 10–30 minutes of expiry via TTL index.</li>
        </ul>`
    },
    {
      title: '4. Third-Party Services',
      content: `<p>Market Saga uses the following third-party services to operate:</p>
        <ul>
          <li><strong style="color:#94a3b8">MongoDB Atlas:</strong> Database storage (AWS Mumbai region).</li>
          <li><strong style="color:#94a3b8">Render.com:</strong> Backend hosting.</li>
          <li><strong style="color:#94a3b8">Vercel:</strong> Frontend hosting.</li>
          <li><strong style="color:#94a3b8">Resend:</strong> Transactional email delivery (OTPs, trade notifications, weekly reports).</li>
          <li><strong style="color:#94a3b8">Google OAuth:</strong> Optional sign-in integration.</li>
          <li><strong style="color:#94a3b8">GitHub OAuth:</strong> Optional sign-in integration.</li>
        </ul>
        <p>Each of these providers has their own privacy policy. We only share the minimum data necessary for each service to function.</p>`
    },
    {
      title: '5. Data Retention',
      content: `<p>We retain your data for as long as your account is active. You may request deletion of your account and all associated data at any time by contacting us at support@marketsaga.site.</p>
        <p>Upon account deletion, all personal data, trade entries, reflections, and chart images will be permanently deleted within 7 business days.</p>
        <p>Anonymized, aggregated analytics (no personal identifiers) may be retained for product improvement purposes.</p>`
    },
    {
      title: '6. Your Rights',
      content: `<p>You have the following rights regarding your data:</p>
        <ul>
          <li><strong style="color:#94a3b8">Access:</strong> Request a copy of all data we hold about you.</li>
          <li><strong style="color:#94a3b8">Correction:</strong> Update or correct inaccurate personal information via your profile settings.</li>
          <li><strong style="color:#94a3b8">Deletion:</strong> Request permanent deletion of your account and all data.</li>
          <li><strong style="color:#94a3b8">Portability:</strong> Request your trade data in a machine-readable format (available on PRO plan).</li>
          <li><strong style="color:#94a3b8">Opt-out:</strong> Disable email notifications and weekly reports at any time from your profile settings.</li>
        </ul>`
    },
    {
      title: '7. Cookies',
      content: `<p>Market Saga does not use tracking cookies. We use browser localStorage to store your JWT authentication token and cached user preferences only. This data stays in your browser and is cleared on logout.</p>`
    },
    {
      title: '8. Changes to This Policy',
      content: `<p>We may update this Privacy Policy from time to time. When we make significant changes, we will notify you by email or by displaying a prominent notice in the application. Continued use of Market Saga after changes constitutes acceptance of the updated policy.</p>`
    }
  ];
}