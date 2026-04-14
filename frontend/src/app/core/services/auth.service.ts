// src/app/core/services/auth.service.ts
// COMPLETE FILE — fixes storeOAuthToken + removes any payload access

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id:                  string;
  email:               string;
  role:                string;
  firstName?:          string;
  lastName?:           string;
  fullName?:           string;
  displayName?:        string;
  avatarBase64?:       string;
  avatarUrl?:          string;
  strictMode?:         boolean;
  emailNotifications?: boolean;
  weeklyReportEmail?:  boolean;
  planType?:           string;
  provider?:           string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY = 'tp_token';
  private readonly USER_KEY  = 'tp_user';

  currentUser = signal<AuthUser | null>(this.loadUser());
  isLoggedIn  = computed(() => !!this.currentUser() && !!this.getToken());

  constructor(private http: HttpClient, private router: Router) {}

  // ── Email / Password ──────────────────────────────────────────────────
  register(firstName: string, lastName: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, {
      firstName, lastName, email, password
    }).pipe(tap(res => this.store(res)));
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, {
      email, password
    }).pipe(tap(res => this.store(res)));
  }

  // ── OAuth2 callback ───────────────────────────────────────────────────
  // Called by OAuthCallbackComponent after Spring redirects with ?token=xxx
  storeOAuthToken(token: string, email: string, name: string): void {
    if (!token || !token.startsWith('eyJ')) {
      console.error('[AuthService] Invalid token in OAuth callback:', token);
      return;
    }

    localStorage.setItem(this.TOKEN_KEY, token);

    const safeName  = this.decode(name);
    const safeEmail = this.decode(email).toLowerCase().trim();

    const user: AuthUser = {
      id:          '',           // populated by refreshProfile below
      email:       safeEmail,
      role:        'TRADER',
      displayName: safeName,
      fullName:    safeName,
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);

    // Fetch full profile from backend in background
    // Populates id, strictMode, avatar, planType etc.
    this.refreshProfile();
  }

  // ── Logout ────────────────────────────────────────────────────────────
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  // ── Token ─────────────────────────────────────────────────────────────
  getToken(): string | null {
    const t = localStorage.getItem(this.TOKEN_KEY);
    if (!t || t === 'undefined' || t === 'null' || !t.startsWith('eyJ')) return null;
    return t;
  }

  // ── Partial update (ProfileComponent calls this after save) ───────────
  updateLocalUser(partial: Partial<AuthUser>): void {
    const cur = this.currentUser();
    if (!cur) return;
    const updated = { ...cur, ...partial };
    localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
    this.currentUser.set(updated);
  }

  // ── Called by layout / any component that needs fresh profile ─────────
  refreshProfile(): void {
    this.http.get<any>(`${environment.apiUrl}/profile`).subscribe({
      next: (p) => {
        const updated: AuthUser = {
          id:                  p.id            || '',
          email:               p.email         || '',
          role:                p.role          || 'TRADER',
          fullName:            p.fullName       || '',
          displayName:         p.displayName    || p.fullName || p.email || '',
          avatarBase64:        p.avatarBase64   || undefined,
          avatarUrl:           p.avatarUrl      || undefined,
          strictMode:          p.strictMode     === true,
          emailNotifications:  p.emailNotifications === true,
          weeklyReportEmail:   p.weeklyReportEmail  === true,
          planType:            p.planType       || 'FREE',
          provider:            p.provider       || undefined,
        };
        localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
        this.currentUser.set(updated);
      },
      error: (err) => {
        // 401 means token expired — handled by error interceptor
        console.warn('[AuthService] Profile refresh failed:', err?.status);
      }
    });
  }

  // ── Private ───────────────────────────────────────────────────────────

  private store(res: any): void {
    const token = res?.accessToken;
    if (!token || !token.startsWith('eyJ')) {
      console.error('[AuthService] Invalid accessToken in response:', res);
      return;
    }
    localStorage.setItem(this.TOKEN_KEY, token);

    const u = res.user || {};
    const user: AuthUser = {
      id:          u.id          || '',
      email:       u.email       || '',
      role:        u.role        || 'TRADER',
      firstName:   u.firstName   || '',
      lastName:    u.lastName    || '',
      fullName:    `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      displayName: u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      strictMode:  u.strictMode  === true,
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  // Safe URL-decode that never throws
  private decode(s: string): string {
    if (!s) return '';
    try { return decodeURIComponent(s); }
    catch { return s; }
  }
}