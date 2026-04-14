// src/app/core/services/auth.service.ts
// COMPLETE FILE — replaces your existing auth.service.ts
// Key addition: storeOAuthToken() for OAuth2 callback

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id:              string;
  email:           string;
  role:            string;
  firstName?:      string;
  lastName?:       string;
  fullName?:       string;
  displayName?:    string;
  avatarBase64?:   string;
  avatarUrl?:      string;        // OAuth avatar URL (Google/GitHub)
  strictMode?:     boolean;
  emailNotifications?: boolean;
  weeklyReportEmail?:  boolean;
  planType?:       string;
  provider?:       string;        // "google" | "github" | null
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY = 'tp_token';
  private readonly USER_KEY  = 'tp_user';
  private readonly API       = environment.apiUrl;

  // ── Reactive state ──────────────────────────────────────────────────────
  currentUser = signal<AuthUser | null>(this.loadUserFromStorage());
  isLoggedIn  = computed(() => !!this.currentUser() && !!this.getToken());

  constructor(private http: HttpClient, private router: Router) {}

  // ── EMAIL / PASSWORD register ───────────────────────────────────────────
  register(firstName: string, lastName: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.API}/auth/register`, {
      firstName, lastName, email, password
    }).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  // ── EMAIL / PASSWORD login ──────────────────────────────────────────────
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.API}/auth/login`, { email, password }).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  // ── OAUTH2 callback — called by OAuthCallbackComponent ─────────────────
  // After Spring redirects to /auth/callback?token=xxx&email=xxx&name=xxx
  storeOAuthToken(token: string, email: string, name: string): void {
    if (!token || !token.startsWith('eyJ')) {
      console.error('Invalid OAuth2 token received');
      return;
    }

    // Store JWT
    localStorage.setItem(this.TOKEN_KEY, token);

    // Build a minimal user object — refreshProfileInBackground() hydrates the rest
    const user: AuthUser = {
      id:          '',
      email:       decodeURIComponent(email || '').toLowerCase().trim(),
      role:        'TRADER',
      displayName: decodeURIComponent(name || ''),
      fullName:    decodeURIComponent(name || ''),
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);

    // Fetch full profile in background to populate id, strictMode, avatar, etc.
    this.refreshProfileInBackground();
  }

  // ── Logout ──────────────────────────────────────────────────────────────
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  // ── Token access ────────────────────────────────────────────────────────
  getToken(): string | null {
    const t = localStorage.getItem(this.TOKEN_KEY);
    // Reject obviously invalid stored values
    if (!t || t === 'undefined' || t === 'null' || !t.startsWith('eyJ')) return null;
    return t;
  }

  // ── Partial local user update (used by ProfileComponent) ───────────────
  updateLocalUser(partial: Partial<AuthUser>): void {
    const current = this.currentUser();
    if (!current) return;
    const updated = { ...current, ...partial };
    localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
    this.currentUser.set(updated);
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private handleAuthResponse(res: any): void {
    const token = res.accessToken;
    if (!token) { console.error('No accessToken in response', res); return; }

    localStorage.setItem(this.TOKEN_KEY, token);

    const u = res.user;
    const user: AuthUser = {
      id:          u?.id          || '',
      email:       u?.email       || '',
      role:        u?.role        || 'TRADER',
      firstName:   u?.firstName   || '',
      lastName:    u?.lastName    || '',
      displayName: u?.displayName || `${u?.firstName || ''} ${u?.lastName || ''}`.trim(),
      fullName:    `${u?.firstName || ''} ${u?.lastName || ''}`.trim(),
      strictMode:  u?.strictMode  === true,
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  // Called after OAuth2 login to fetch the full profile (id, avatar, settings)
  refreshProfileInBackground(): void {
    this.http.get<any>(`${this.API}/profile`).subscribe({
      next: (p) => {
        const updated: AuthUser = {
          id:                  p.id          || '',
          email:               p.email       || '',
          role:                p.role        || 'TRADER',
          firstName:           p.fullName?.split(' ')[0] || '',
          lastName:            p.fullName?.split(' ').slice(1).join(' ') || '',
          fullName:            p.fullName    || '',
          displayName:         p.displayName || p.fullName || p.email || '',
          avatarBase64:        p.avatarBase64 || undefined,
          avatarUrl:           p.avatarUrl   || undefined,
          strictMode:          p.strictMode  === true,
          emailNotifications:  p.emailNotifications === true,
          weeklyReportEmail:   p.weeklyReportEmail  === true,
          planType:            p.planType    || 'FREE',
          provider:            p.provider   || undefined,
        };
        localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
        this.currentUser.set(updated);
      },
      error: (err) => console.warn('Profile refresh failed', err)
    });
  }

  private loadUserFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
