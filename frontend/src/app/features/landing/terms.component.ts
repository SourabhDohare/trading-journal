import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicNavbarComponent } from './public-navbar.component';
import { PublicFooterComponent } from './public-footer.component';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicNavbarComponent, PublicFooterComponent],
  template: `
    <div class="page-wrap">
      <app-public-navbar />
      <main class="main">
        <div class="doc-container">
          <div class="doc-header">
            <span class="section-label mono">LEGAL</span>
            <h1 class="doc-title">Terms of Service</h1>
            <p class="doc-meta mono">Last updated: April 17, 2026 · Effective immediately</p>
          </div>
          <div class="doc-body">
            <div class="doc-section" *ngFor="let section of sections">
              <h2 class="doc-h2">{{ section.title }}</h2>
              <div class="doc-content" [innerHTML]="section.content"></div>
            </div>
            <div class="doc-contact">
              <h2 class="doc-h2">Contact</h2>
              <p>Questions about these terms? Email <a href="mailto:support@marketsaga.site" class="doc-link">support&#64;marketsaga.site</a>.</p>
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
    .doc-h2 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #e2e8f0; margin-bottom: 14px; border-left: 3px solid #0D9488; padding-left: 14px; }
    .doc-content { font-family: 'DM Sans', sans-serif; font-size: 15px; color: #64748b; line-height: 1.8; }
    .doc-content p { margin-bottom: 12px; }
    .doc-content ul { padding-left: 20px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 6px; }
    .doc-contact { border-top: 1px solid #1e2433; padding-top: 32px; font-family: 'DM Sans', sans-serif; font-size: 15px; color: #64748b; line-height: 1.8; }
    .doc-link { color: #5EEAD4; text-decoration: none; }
    .doc-link:hover { text-decoration: underline; }
  `]
})
export class TermsComponent {
  sections = [
    {
      title: '1. Acceptance of Terms',
      content: `<p>By accessing or using Market Saga ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
        <p>We reserve the right to modify these terms at any time. Continued use after changes constitutes acceptance.</p>`
    },
    {
      title: '2. Description of Service',
      content: `<p>Market Saga is a personal trading journal and analytics platform designed to help individual retail traders track, analyze, and improve their trading performance.</p>
        <p>The Service is provided "as is" and is not a financial advisory service. Nothing on Market Saga constitutes financial, investment, or trading advice. All trade entries are your own decisions and responsibility.</p>`
    },
    {
      title: '3. User Accounts',
      content: `<p>To use Market Saga, you must:</p>
        <ul>
          <li>Be at least 18 years of age.</li>
          <li>Provide accurate and complete registration information.</li>
          <li>Maintain the security of your account credentials.</li>
          <li>Notify us immediately of any unauthorized account access.</li>
          <li>Verify your email address before accessing the platform.</li>
        </ul>
        <p>You are responsible for all activity that occurs under your account. Market Saga is not liable for any loss arising from unauthorized use of your account.</p>`
    },
    {
      title: '4. Acceptable Use',
      content: `<p>You agree not to:</p>
        <ul>
          <li>Use the Service for any illegal or unauthorized purpose.</li>
          <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure.</li>
          <li>Upload malicious code, viruses, or any harmful content.</li>
          <li>Reverse-engineer, decompile, or attempt to extract source code.</li>
          <li>Use automated scripts or bots to scrape or interact with the Service.</li>
          <li>Impersonate another user or person.</li>
          <li>Upload content that infringes on any third party's intellectual property.</li>
        </ul>`
    },
    {
      title: '5. Your Content',
      content: `<p>You retain ownership of all trade entries, reflections, and content you submit to Market Saga. By submitting content, you grant Market Saga a limited, non-exclusive license to store and display your content for the purpose of providing the Service to you.</p>
        <p>You are solely responsible for the accuracy and legality of your content. Market Saga does not verify, endorse, or take responsibility for user-submitted content.</p>`
    },
    {
      title: '6. Privacy',
      content: `<p>Your use of the Service is governed by our <a href="/privacy" style="color:#5EEAD4;text-decoration:none">Privacy Policy</a>, which is incorporated into these Terms by reference. By using Market Saga, you consent to the data practices described in our Privacy Policy.</p>`
    },
    {
      title: '7. Free Plan Limitations',
      content: `<p>The FREE plan allows up to 50 trade entries per calendar month. Exceeding this limit will prevent new entries until the next month cycle or until you upgrade to a paid plan.</p>
        <p>Market Saga reserves the right to modify free plan limits with reasonable notice to users.</p>`
    },
    {
      title: '8. Disclaimers',
      content: `<p><strong style="color:#94a3b8">No Financial Advice:</strong> Market Saga is a journaling and analytics tool. Nothing in the Service constitutes financial, investment, or trading advice. Past performance data shown in analytics does not guarantee future results.</p>
        <p><strong style="color:#94a3b8">No Uptime Guarantee:</strong> We aim for high availability but do not guarantee uninterrupted access. We will not be liable for losses arising from Service downtime.</p>
        <p><strong style="color:#94a3b8">Data Accuracy:</strong> Analytics and calculations are based on the data you input. We are not responsible for errors resulting from incorrect data entry.</p>`
    },
    {
      title: '9. Limitation of Liability',
      content: `<p>To the maximum extent permitted by applicable law, Market Saga shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, trading losses, or data, arising from your use of the Service.</p>
        <p>Our total liability to you for any claims arising from your use of Market Saga shall not exceed the amount you paid us in the 3 months preceding the claim.</p>`
    },
    {
      title: '10. Termination',
      content: `<p>We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or abuse the Service.</p>
        <p>You may delete your account at any time by contacting support@marketsaga.site. Upon deletion, all your data will be permanently removed within 7 business days.</p>`
    },
    {
      title: '11. Governing Law',
      content: `<p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Pune, Maharashtra, India.</p>`
    }
  ];
}