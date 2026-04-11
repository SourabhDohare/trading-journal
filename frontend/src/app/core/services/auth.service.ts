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
  displayName?: string;
  fullName?: string;
  avatarBase64?: string;
  planType?: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  // Try all historically used key names so existing sessions aren't broken
  private readonly TOKEN_KEYS = ['tp_token', 'token', 'access_token', 'jwt_token'];
  private readonly TOKEN_KEY  = 'tp_token';  // canonical key going forward
  private readonly USER_KEY   = 'tp_user';
  private readonly apiBase    = environment.apiUrl;

  currentUser  = signal<AuthUser | null>(this.loadStoredUser());
  isLoggedIn   = computed(() => !!this.currentUser() && !!this.getToken());
  isAuthenticated = computed(() => !!this.currentUser() && !!this.getToken()); // alias

  constructor(private http: HttpClient, private router: Router) {
    // Hydrate avatar + displayName silently on startup
    if (this.getToken() && this.currentUser()) {
      this.refreshProfileInBackground();
    }
  }

  // ─── Login ────────────────────────────────────────────────────────
  login(email: string, password: string) {
    return this.http.post<AuthResponse>(
      `${this.apiBase}/auth/login`, { email, password }
    ).pipe(tap(res => {
      this.storeAuth(res);
      this.refreshProfileInBackground();
    }));
  }

  // ─── Register (supports both old 4-arg and new object style) ─────
  register(
    emailOrRequest: string | RegisterRequest,
    password?: string,
    firstName?: string,
    lastName?: string
  ) {
    let payload: RegisterRequest;
    if (typeof emailOrRequest === 'object') {
      payload = emailOrRequest;
    } else {
      // Old call: register(firstName, lastName, email, password)
      payload = {
        firstName: emailOrRequest,
        lastName:  password   || '',
        email:     firstName  || '',
        password:  lastName   || '',
      };
    }
    return this.http.post<AuthResponse>(
      `${this.apiBase}/auth/register`, payload
    ).pipe(tap(res => this.storeAuth(res)));
  }

  // ─── Logout ───────────────────────────────────────────────────────
  logout() {
    // Remove all known token keys
    this.TOKEN_KEYS.forEach(k => localStorage.removeItem(k));
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  // ─── getToken — checks ALL historical key names ───────────────────
  // This is what the auth interceptor calls.
  // If the user has an older token stored under 'token' or 'access_token',
  // it will still work without forcing them to log in again.
  getToken(): string | null {
    for (const key of this.TOKEN_KEYS) {
      const t = localStorage.getItem(key);
      if (t) {
        // Migrate to canonical key if found under old key
        if (key !== this.TOKEN_KEY) {
          localStorage.setItem(this.TOKEN_KEY, t);
          localStorage.removeItem(key);
        }
        return t;
      }
    }
    return null;
  }

  // ─── Update local user after profile save ─────────────────────────
  updateLocalUser(patch: Partial<AuthUser>) {
    const current = this.currentUser();
    if (!current) return;
    const updated = { ...current, ...patch };
    this.currentUser.set(updated);
    localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
  }

  // ─── Private ─────────────────────────────────────────────────────
  private storeAuth(res: AuthResponse) {
    // Store under canonical key
    localStorage.setItem(this.TOKEN_KEY, res.token);

    const user: AuthUser = {
      id:           res.user.id,
      email:        res.user.email,
      role:         res.user.role,
      displayName:  res.user.displayName || res.user.fullName || res.user.email,
      fullName:     res.user.fullName,
      avatarBase64: res.user.avatarBase64,
      planType:     res.user.planType,
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private loadStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

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
      error: () => {}
    });
  }
}