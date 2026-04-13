// src/app/shared/components/layout/layout.component.ts
import { Component, signal, computed } from "@angular/core";
import { RouterOutlet, RouterLink, RouterLinkActive } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../../core/services/auth.service";

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: "app-layout",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="shell">
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <div class="logo">
            <span class="logo-icon">◈</span>
            <span class="logo-text" *ngIf="!sidebarCollapsed()"
              >TradePulse</span
            >
          </div>
          <button class="collapse-btn" (click)="toggleSidebar()">
            {{ sidebarCollapsed() ? "»" : "«" }}
          </button>
        </div>

        <!-- ── STRICT MODE BADGE ─────────────────────────────────────────── -->
        <div
          class="strict-indicator"
          *ngIf="strictMode() && !sidebarCollapsed()"
          title="Strict Mode ON — all thinking-layer fields required when logging trades"
        >
          🔒 <span>STRICT MODE</span>
        </div>
        <div
          class="strict-indicator-collapsed"
          *ngIf="strictMode() && sidebarCollapsed()"
          title="Strict Mode is ON"
        >
          🔒
        </div>
        <!-- ───────────────────────────────────────────────────────────────── -->

        <nav class="sidebar-nav">
          <a
            *ngFor="let item of navItems"
            [routerLink]="item.route"
            routerLinkActive="active"
            class="nav-item"
            [title]="sidebarCollapsed() ? item.label : ''"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">{{
              item.label
            }}</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <a
            routerLink="/profile"
            class="user-profile-link"
            title="View Profile"
          >
            <div class="user-avatar">
              <img
                *ngIf="userAvatar()"
                [src]="userAvatar()!"
                class="avatar-img"
                alt="Profile"
              />
              <span *ngIf="!userAvatar()">{{ userInitials() }}</span>
            </div>
            <div class="user-text" *ngIf="!sidebarCollapsed()">
              <span class="user-name">{{ userName() }}</span>
              <span class="user-role">{{ userRole() }}</span>
            </div>
            <span class="profile-arrow" *ngIf="!sidebarCollapsed()">›</span>
          </a>

          <button
            class="logout-btn"
            (click)="logout()"
            *ngIf="!sidebarCollapsed()"
          >
            ⎋ Logout
          </button>
          <button
            class="logout-btn logout-icon-only"
            (click)="logout()"
            *ngIf="sidebarCollapsed()"
            title="Logout"
          >
            ⎋
          </button>
        </div>
      </aside>

      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
      }

      .shell {
        display: flex;
        height: 100vh;
        background: #0a0e1a;
        color: #e2e8f0;
        font-family:
          "Inter",
          -apple-system,
          sans-serif;
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
      .sidebar.collapsed {
        width: 64px;
      }

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
      }
      .collapse-btn:hover {
        border-color: #3b82f6;
        color: #3b82f6;
      }

      /* ── Strict Mode Badge ─────────────────────────────── */
      .strict-indicator {
        margin: 8px 8px 0;
        padding: 6px 10px;
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        color: #f87171;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: help;
      }
      .strict-indicator-collapsed {
        text-align: center;
        font-size: 16px;
        padding: 6px 0;
        cursor: help;
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
      }
      .nav-item:hover {
        background: #1e2433;
        color: #94a3b8;
      }
      .nav-item.active {
        background: rgba(59, 130, 246, 0.12);
        color: #3b82f6;
        border-left: 2px solid #3b82f6;
      }
      .nav-icon {
        font-size: 18px;
        flex-shrink: 0;
      }
      .nav-label {
        overflow: hidden;
      }

      .sidebar-footer {
        padding: 12px;
        border-top: 1px solid #1e2433;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .user-profile-link {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        text-decoration: none;
        transition: background 0.15s;
        cursor: pointer;
      }
      .user-profile-link:hover {
        background: rgba(59, 130, 246, 0.08);
      }
      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        color: #fff;
        overflow: hidden;
        flex-shrink: 0;
      }
      .avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .user-text {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
      }
      .user-name {
        font-size: 13px;
        font-weight: 600;
        color: #e2e8f0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .user-role {
        font-size: 11px;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .profile-arrow {
        font-size: 16px;
        color: #475569;
      }
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
      }
      .logout-btn:hover {
        border-color: #ef4444;
        color: #ef4444;
        background: rgba(239, 68, 68, 0.05);
      }
      .logout-icon-only {
        padding: 8px 4px;
        font-size: 16px;
      }
      .main-content {
        flex: 1;
        overflow-y: auto;
        background: #0a0e1a;
      }
    `,
  ],
})
export class LayoutComponent {
  sidebarCollapsed = signal(false);

  navItems: NavItem[] = [
    { label: "Dashboard", icon: "⬡", route: "/dashboard" },
    { label: "Trades", icon: "◎", route: "/trades" },
    { label: "Analytics", icon: "◈", route: "/analytics" },
    { label: "Journal", icon: "☰", route: "/journal" },
    { label: "Reports", icon: "▦", route: "/reports" },
  ];

  constructor(private authService: AuthService) {}

  toggleSidebar() {
    this.sidebarCollapsed.update((v) => !v);
  }
  logout() {
    this.authService.logout();
  }

  userName = computed(() => {
    const user = this.authService.currentUser();
    return (
      (user as any)?.displayName ||
      (user as any)?.fullName ||
      user?.email ||
      "Trader"
    );
  });
  userRole = computed(() => {
    const user = this.authService.currentUser();
    return (user as any)?.role || "TRADER";
  });
  userAvatar = computed(() => {
    const user = this.authService.currentUser();
    return (user as any)?.avatarBase64 || null;
  });
  // Reads strictMode from the cached AuthService user — updated by profile toggles instantly
  strictMode = computed(() => {
    const user = this.authService.currentUser();
    return (user as any)?.strictMode === true;
  });

  userInitials(): string {
    return this.userName()
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
}
