// src/app/core/services/auth.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  // Profile fields — populated after login + profile fetch
  displayName?: string;
  fullName?: string;
  avatarBase64?: string;
  planType?: string;
}

interface LoginRequest  { email: string; password: string; }
interface RegisterRequest { email: string; password: string; firstName: string; lastName: string; }
interface AuthResponse  { token: string; refreshToken?: string; user: AuthUser; }

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY   = 'tp_token';
  private readonly USER_KEY    = 'tp_user';
  private readonly apiBase     = environment.apiUrl;

  // ─── Signals ───────────────────────────────────────────────────
  currentUser  = signal<AuthUser | null>(this.loadStoredUser());
  isLoggedIn   = computed(() => !!this.currentUser());
  token        = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));

  constructor(private http: HttpClient, private router: Router) {
    // On startup, if we have a token but no avatar yet, fetch the full profile
    if (this.token() && this.currentUser()) {
      this.refreshProfileInBackground();
    }
  }

  // ─── Login ──────────────────────────────────────────────────────
  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiBase}/auth/login`, { email, password })
      .pipe(tap(res => {
        this.storeAuth(res);
        // Fetch full profile after login to get avatar, displayName etc.
        this.refreshProfileInBackground();
      }));
  }

  // ─── Register ───────────────────────────────────────────────────
  register(data: RegisterRequest) {
    return this.http.post<AuthResponse>(`${this.apiBase}/auth/register`, data)
      .pipe(tap(res => this.storeAuth(res)));
  }

  // ─── Logout ─────────────────────────────────────────────────────
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.token.set(null);
    this.router.navigate(['/auth/login']);
  }

  // ─── Called by ProfileComponent after saving profile ────────────
  // Updates the in-memory + localStorage user so sidebar reflects changes immediately
  updateLocalUser(patch: Partial<AuthUser>) {
    const current = this.currentUser();
    if (!current) return;
    const updated = { ...current, ...patch };
    this.currentUser.set(updated);
    localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // ─── Private helpers ────────────────────────────────────────────
  private storeAuth(res: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    const user: AuthUser = {
      id:    res.user.id,
      email: res.user.email,
      role:  res.user.role,
      displayName: res.user.displayName || res.user.fullName || res.user.email,
      fullName:    res.user.fullName,
      avatarBase64: res.user.avatarBase64,
      planType:    res.user.planType,
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    this.token.set(res.token);
  }

  private loadStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // Fetches /profile in the background and patches currentUser with avatar + displayName
  private refreshProfileInBackground() {
    this.http.get<any>(`${this.apiBase}/profile`).subscribe({
      next: (profile) => {
        this.updateLocalUser({
          displayName:  profile.displayName || profile.fullName || profile.email,
          fullName:     profile.fullName,
          avatarBase64: profile.avatarBase64 || undefined,
          planType:     profile.planType,
        });
      },
      error: () => {} // silently ignore — user is still logged in
    });
  }
}
