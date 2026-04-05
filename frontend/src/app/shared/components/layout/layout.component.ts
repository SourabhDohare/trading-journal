// src/app/shared/components/layout/layout.component.ts
import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="shell">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <div class="logo">
            <span class="logo-icon">◈</span>
            <span class="logo-text" *ngIf="!sidebarCollapsed()">TradePulse</span>
          </div>
          <button class="collapse-btn" (click)="toggleSidebar()">
            {{ sidebarCollapsed() ? '»' : '«' }}
          </button>
        </div>

        <nav class="sidebar-nav">
          <a *ngFor="let item of navItems"
             [routerLink]="item.route"
             routerLinkActive="active"
             class="nav-item"
             [title]="sidebarCollapsed() ? item.label : ''">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">{{ item.label }}</span>
          </a>
        </nav>

        <div class="sidebar-footer" *ngIf="!sidebarCollapsed()">
          <div class="user-info">
            <div class="user-avatar">{{ userInitials() }}</div>
            <div class="user-meta">
              <span class="user-name">{{ userName() }}</span>
              <span class="user-role">{{ currentUser()?.role }}</span>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()">⎋ Logout</button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .shell {
      display: flex;
      height: 100vh;
      background: #0a0e1a;
      color: #e2e8f0;
      font-family: 'Inter', -apple-system, sans-serif;
    }

    .sidebar {
      width: 240px;
      min-height: 100vh;
      background: #0d1117;
      border-right: 1px solid #1e2433;
      display: flex;
      flex-direction: column;
      transition: width 0.2s ease;
      flex-shrink: 0;
    }

    .sidebar.collapsed { width: 64px; }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 16px;
      border-bottom: 1px solid #1e2433;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-icon {
      font-size: 22px;
      color: #3b82f6;
    }

    .logo-text {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.5px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .collapse-btn {
      background: none;
      border: 1px solid #1e2433;
      color: #64748b;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      &:hover { border-color: #3b82f6; color: #3b82f6; }
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      text-decoration: none;
      color: #64748b;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.15s;
      white-space: nowrap;

      &:hover {
        background: #1e2433;
        color: #94a3b8;
      }

      &.active {
        background: rgba(59,130,246,0.12);
        color: #3b82f6;
        border-left: 2px solid #3b82f6;
      }
    }

    .nav-icon { font-size: 18px; flex-shrink: 0; }
    .nav-label { overflow: hidden; }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid #1e2433;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }

    .user-meta { display: flex; flex-direction: column; min-width: 0; }
    .user-name { font-size: 13px; font-weight: 600; color: #e2e8f0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .user-role { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }

    .logout-btn {
      width: 100%;
      background: none;
      border: 1px solid #1e2433;
      color: #64748b;
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.15s;
      &:hover { border-color: #ef4444; color: #ef4444; background: rgba(239,68,68,0.05); }
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      background: #0a0e1a;
    }
  `]
})
export class LayoutComponent {
  sidebarCollapsed = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard',  icon: '⬡', route: '/dashboard' },
    { label: 'Trades',     icon: '◎', route: '/trades' },
    { label: 'Analytics',  icon: '◈', route: '/analytics' },
    { label: 'Journal',    icon: '☰', route: '/journal' },
    { label: 'Reports',    icon: '▦', route: '/reports' },
  ];

  constructor(private authService: AuthService) {}

  currentUser = this.authService.currentUser;

  userName() {
    const u = this.currentUser();
    return u ? `${u.firstName} ${u.lastName}` : '';
  }

  userInitials() {
    const u = this.currentUser();
    return u ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase() : '?';
  }

  toggleSidebar() { this.sidebarCollapsed.update(v => !v); }

  logout() { this.authService.logout(); }
}
