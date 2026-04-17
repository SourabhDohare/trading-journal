import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-public-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar" [class.scrolled]="scrolled()">
      <div class="nav-container">

        <!-- Logo -->
        <a routerLink="/" class="nav-logo">
          <svg width="32" height="38" viewBox="0 0 100 120" fill="none">
            <path d="M50 15L15 30V65C15 85 50 105 50 105C50 105 85 85 85 65V30L50 15Z" fill="#0D9488"/>
            <path d="M35 68L48 50L58 60L75 35" stroke="#5EEAD4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="75" cy="35" r="7" fill="white"/>
          </svg>
          <span class="logo-text">Market<span class="logo-accent">Saga</span></span>
        </a>

        <!-- Desktop Nav -->
        <div class="nav-links">
          <a href="/#features" class="nav-link">Features</a>
          <a routerLink="/pricing" class="nav-link" routerLinkActive="active">Pricing</a>
          <a routerLink="/contact" class="nav-link" routerLinkActive="active">Contact</a>
          <a routerLink="/feedback" class="nav-link" routerLinkActive="active">Feedback</a>
        </div>

        <!-- Desktop Auth -->
        <div class="nav-auth">
          <ng-container *ngIf="!isLoggedIn()">
            <a routerLink="/auth/login" class="btn-ghost-nav">Sign In</a>
            <a routerLink="/auth/register" class="btn-primary-nav">Get Started →</a>
          </ng-container>
          <ng-container *ngIf="isLoggedIn()">
            <a routerLink="/dashboard" class="btn-primary-nav">Dashboard →</a>
          </ng-container>
        </div>

        <!-- Mobile hamburger -->
        <button class="hamburger" (click)="toggleMenu()" [class.open]="menuOpen()">
          <span></span><span></span><span></span>
        </button>
      </div>

      <!-- Mobile Menu -->
      <div class="mobile-menu" [class.open]="menuOpen()">
        <a href="/#features"  class="mobile-link" (click)="closeMenu()">Features</a>
        <a routerLink="/pricing"  class="mobile-link" (click)="closeMenu()">Pricing</a>
        <a routerLink="/contact"  class="mobile-link" (click)="closeMenu()">Contact</a>
        <a routerLink="/feedback" class="mobile-link" (click)="closeMenu()">Feedback</a>
        <div class="mobile-divider"></div>
        <ng-container *ngIf="!isLoggedIn()">
          <a routerLink="/auth/login"    class="mobile-link" (click)="closeMenu()">Sign In</a>
          <a routerLink="/auth/register" class="mobile-cta"  (click)="closeMenu()">Get Started →</a>
        </ng-container>
        <ng-container *ngIf="isLoggedIn()">
          <a routerLink="/dashboard" class="mobile-cta" (click)="closeMenu()">Dashboard →</a>
        </ng-container>
      </div>
    </nav>
  `,
  styles: [`
    :host { display: block; }

    .navbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
      padding: 16px 0;
      transition: all 0.3s ease;
      background: transparent;
    }
    .navbar.scrolled {
      background: rgba(7, 11, 20, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid #1e2433;
      padding: 12px 0;
    }

    .nav-container {
      max-width: 1200px; margin: 0 auto; padding: 0 24px;
      display: flex; align-items: center; justify-content: space-between; gap: 32px;
    }

    .nav-logo {
      display: flex; align-items: center; gap: 10px; text-decoration: none;
      flex-shrink: 0;
    }
    .logo-text {
      font-family: 'Syne', sans-serif;
      font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.5px;
    }
    .logo-accent { color: #5EEAD4; font-weight: 600; }

    .nav-links {
      display: flex; align-items: center; gap: 4px; flex: 1; justify-content: center;
    }
    .nav-link {
      color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 500;
      padding: 8px 14px; border-radius: 8px; transition: all 0.15s;
      font-family: 'DM Sans', sans-serif;
    }
    .nav-link:hover, .nav-link.active { color: #e2e8f0; background: rgba(255,255,255,0.05); }

    .nav-auth { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

    .btn-ghost-nav {
      color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 500;
      padding: 8px 16px; border-radius: 8px; border: 1px solid #1e2433;
      transition: all 0.15s; font-family: 'DM Sans', sans-serif;
    }
    .btn-ghost-nav:hover { color: #e2e8f0; border-color: #475569; }

    .btn-primary-nav {
      color: #fff; text-decoration: none; font-size: 14px; font-weight: 600;
      padding: 9px 20px; border-radius: 8px;
      background: linear-gradient(135deg, #0D9488, #0891b2);
      transition: all 0.15s; font-family: 'DM Sans', sans-serif;
      box-shadow: 0 0 20px rgba(13,148,136,0.3);
    }
    .btn-primary-nav:hover { transform: translateY(-1px); box-shadow: 0 4px 24px rgba(13,148,136,0.4); }

    .hamburger {
      display: none; flex-direction: column; gap: 5px; background: none; border: none;
      cursor: pointer; padding: 6px; width: 36px;
    }
    .hamburger span {
      display: block; height: 2px; background: #94a3b8; border-radius: 2px;
      transition: all 0.25s ease; transform-origin: center;
    }
    .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    .mobile-menu {
      display: none; flex-direction: column; gap: 4px; padding: 16px 24px 20px;
      background: rgba(7,11,20,0.98); backdrop-filter: blur(12px);
      border-top: 1px solid #1e2433; overflow: hidden;
      max-height: 0; transition: max-height 0.3s ease, padding 0.3s ease;
      padding: 0 24px;
    }
    .mobile-menu.open { max-height: 400px; padding: 16px 24px 24px; }

    .mobile-link {
      color: #94a3b8; text-decoration: none; font-size: 15px; font-weight: 500;
      padding: 10px 0; border-bottom: 1px solid #111827;
      font-family: 'DM Sans', sans-serif; transition: color 0.15s;
    }
    .mobile-link:hover { color: #e2e8f0; }
    .mobile-divider { height: 1px; background: #1e2433; margin: 8px 0; }
    .mobile-cta {
      display: inline-block; margin-top: 8px; padding: 12px 20px; text-align: center;
      background: linear-gradient(135deg, #0D9488, #0891b2); color: #fff;
      border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600;
      font-family: 'DM Sans', sans-serif;
    }

    @media (max-width: 768px) {
      .nav-links, .nav-auth { display: none; }
      .hamburger { display: flex; }
      .mobile-menu { display: flex; }
    }
  `]
})
export class PublicNavbarComponent {
  scrolled = signal(false);
  menuOpen = signal(false);

  constructor(private authService: AuthService) {}

  isLoggedIn(): boolean { return this.authService.isLoggedIn(); }

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 40); }

  toggleMenu() { this.menuOpen.update(v => !v); }
  closeMenu()  { this.menuOpen.set(false); }
}