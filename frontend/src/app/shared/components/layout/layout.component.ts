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
        <!-- ── HEADER / LOGO ────────────────────────────────────────── -->
        <div class="sidebar-header">
          <!-- Expanded: full logo with wordmark -->
          <a
            routerLink="/dashboard"
            class="logo-link"
            *ngIf="!sidebarCollapsed()"
          >
            <svg
              width="186"
              height="44"
              viewBox="0 0 186 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <!-- Shield icon -->
              <g transform="translate(0, 2) scale(0.35)">
                <path
                  d="M50 15L15 30V65C15 85 50 105 50 105C50 105 85 85 85 65V30L50 15Z"
                  fill="#0D9488"
                />
                <path
                  d="M35 68L48 50L58 60L75 35"
                  stroke="#5EEAD4"
                  stroke-width="6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <circle cx="75" cy="35" r="7" fill="white" />
              </g>
              <!-- Wordmark -->
              <text
                x="40"
                y="25"
                fill="white"
                style="font-family:Arial,sans-serif;font-weight:700;font-size:19px;letter-spacing:-0.5px"
              >
                Market
                <tspan fill="#5EEAD4" font-weight="400">Saga</tspan>
              </text>
              <!-- Tagline -->
              <text
                x="41"
                y="38"
                fill="#475569"
                style="font-family:Arial,sans-serif;font-weight:700;font-size:6.5px;letter-spacing:2px"
              >
                TRADE WITH CLARITY
              </text>
            </svg>
          </a>

          <!-- Collapsed: shield icon only -->
          <a
            routerLink="/dashboard"
            class="logo-link logo-icon-only"
            *ngIf="sidebarCollapsed()"
          >
            <svg
              width="32"
              height="38"
              viewBox="0 0 100 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M50 15L15 30V65C15 85 50 105 50 105C50 105 85 85 85 65V30L50 15Z"
                fill="#0D9488"
              />
              <path
                d="M35 68L48 50L58 60L75 35"
                stroke="#5EEAD4"
                stroke-width="6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle cx="75" cy="35" r="7" fill="white" />
            </svg>
          </a>

          <button
            class="collapse-btn"
            (click)="toggleSidebar()"
            [title]="sidebarCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
          >
            {{ sidebarCollapsed() ? "»" : "«" }}
          </button>
        </div>

        <!-- ── STRICT MODE BADGE ────────────────────────────────────── -->
        <div class="strict-badge" *ngIf="strictMode() && !sidebarCollapsed()">
          🔒 <span>STRICT MODE</span>
        </div>
        <div
          class="strict-badge-icon"
          *ngIf="strictMode() && sidebarCollapsed()"
          title="Strict Mode ON"
        >
          🔒
        </div>

        <!-- ── NAV ─────────────────────────────────────────────────── -->
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

        <!-- ── FOOTER / USER ───────────────────────────────────────── -->
        <div class="sidebar-footer">
          <a
            routerLink="/profile"
            class="user-row"
            [title]="sidebarCollapsed() ? userName() : ''"
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
            <span class="profile-caret" *ngIf="!sidebarCollapsed()">›</span>
          </a>
          <button
            class="logout-btn"
            (click)="logout()"
            *ngIf="!sidebarCollapsed()"
          >
            ⎋ Sign out
          </button>
          <button
            class="logout-btn icon-only"
            (click)="logout()"
            *ngIf="sidebarCollapsed()"
            title="Sign out"
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

      /* ── Sidebar ─────────────────────────────────────────────────────── */
      .sidebar {
        width: 232px;
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

      /* ── Header ──────────────────────────────────────────────────────── */
      .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 14px;
        border-bottom: 1px solid #1e2433;
        min-height: 64px;
      }
      .logo-link {
        display: flex;
        align-items: center;
        text-decoration: none;
      }
      .logo-icon-only {
        justify-content: center;
        flex: 1;
      }
      .collapse-btn {
        background: none;
        border: 1px solid #1e2433;
        color: #475569;
        width: 22px;
        height: 22px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.15s;
      }
      .collapse-btn:hover {
        border-color: #0d9488;
        color: #0d9488;
      }

      /* ── Strict Mode ─────────────────────────────────────────────────── */
      .strict-badge {
        margin: 8px 10px 0;
        padding: 6px 10px;
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 6px;
        font-size: 10px;
        font-weight: 800;
        color: #f87171;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .strict-badge-icon {
        text-align: center;
        font-size: 16px;
        padding: 6px 0;
      }

      /* ── Nav ─────────────────────────────────────────────────────────── */
      .sidebar-nav {
        flex: 1;
        padding: 12px 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow-y: auto;
      }
      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        text-decoration: none;
        color: #64748b;
        font-size: 13.5px;
        font-weight: 500;
        transition: all 0.15s;
        white-space: nowrap;
        border-left: 2px solid transparent;
      }
      .nav-item:hover {
        background: #1a2235;
        color: #94a3b8;
      }
      .nav-item.active {
        background: rgba(13, 148, 136, 0.1);
        color: #5eead4;
        border-left-color: #0d9488;
      }
      .nav-icon {
        font-size: 17px;
        flex-shrink: 0;
      }

      /* ── Footer ──────────────────────────────────────────────────────── */
      .sidebar-footer {
        padding: 12px 8px;
        border-top: 1px solid #1e2433;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .user-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 10px;
        border-radius: 10px;
        text-decoration: none;
        transition: background 0.15s;
        cursor: pointer;
      }
      .user-row:hover {
        background: rgba(13, 148, 136, 0.08);
      }
      .user-avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        flex-shrink: 0;
        background: linear-gradient(135deg, #0d9488, #0891b2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        color: #fff;
        overflow: hidden;
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
        font-size: 10px;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .profile-caret {
        font-size: 16px;
        color: #334155;
      }

      .logout-btn {
        width: 100%;
        background: none;
        border: 1px solid #1e2433;
        color: #475569;
        padding: 7px;
        border-radius: 7px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.15s;
      }
      .logout-btn:hover {
        border-color: #ef4444;
        color: #ef4444;
        background: rgba(239, 68, 68, 0.05);
      }
      .logout-btn.icon-only {
        font-size: 15px;
        padding: 7px 4px;
      }

      /* ── Main ────────────────────────────────────────────────────────── */
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

  userName = computed(
    () =>
      this.authService.currentUser()?.displayName ||
      (this.authService.currentUser() as any)?.fullName ||
      this.authService.currentUser()?.email ||
      "Trader",
  );
  userRole = computed(
    () => (this.authService.currentUser() as any)?.role || "TRADER",
  );
  userAvatar = computed(
    () => (this.authService.currentUser() as any)?.avatarBase64 || null,
  );
  strictMode = computed(
    () => (this.authService.currentUser() as any)?.strictMode === true,
  );

  userInitials(): string {
    return this.userName()
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
}
