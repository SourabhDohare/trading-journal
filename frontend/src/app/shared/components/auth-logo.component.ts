// src/app/shared/components/auth-logo/auth-logo.component.ts
// Reusable Market Saga logo for all auth pages (verify-email, forgot-password etc.)

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="logo-wrap">
      <svg width="220" height="68" viewBox="0 0 220 68" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Shield -->
        <g transform="translate(10, 5) scale(0.48)">
          <path d="M50 15L15 30V65C15 85 50 105 50 105C50 105 85 85 85 65V30L50 15Z" fill="#0D9488"/>
          <path d="M35 68L48 50L58 60L75 35" stroke="#5EEAD4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="75" cy="35" r="7" fill="white"/>
        </g>
        <!-- Wordmark -->
        <text x="68" y="36" fill="white"
          style="font-family:Arial,sans-serif;font-weight:700;font-size:26px;letter-spacing:-0.5px">
          Market<tspan fill="#5EEAD4" font-weight="400">Saga</tspan>
        </text>
        <!-- Tagline -->
        <text x="69" y="54" fill="#475569"
          style="font-family:Arial,sans-serif;font-weight:800;font-size:7.5px;letter-spacing:2.8px">
          TRADE WITH CLARITY
        </text>
      </svg>
    </div>
  `,
  styles: [`
    .logo-wrap { display:flex; justify-content:center; margin-bottom:24px; }
  `]
})
export class AuthLogoComponent {}
