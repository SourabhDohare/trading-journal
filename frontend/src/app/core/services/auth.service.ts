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
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  // All historically used token key names — checked in order
  private readonly TOKEN_KEYS = ['tp_token', 'token', 'access_token', 'jwt_token'];
  private readonly TOKEN_KEY  = 'tp_token';
  private readonly USER_KEY   = 'tp_user';
  private readonly apiBase    = environment.apiUrl;

  currentUser     = signal<AuthUser | null>(this.loadStoredUser());
  isLoggedIn      = computed(() => !!this.currentUser() && !!this.getToken());
  isAuthenticated = computed(() => !!this.currentUser() && !!this.getToken());

  constructor(private http: HttpClient, private router: Router) {
    if (this.getToken() && this.currentUser()) {
      this.refreshProfileInBackground();
    }
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(
      `${this.apiBase}/auth/login`, { email, password }
    ).pipe(tap(res => {
      this.storeAuth(res);
      this.refreshProfileInBackground();
    }));
  }

  // Supports both old 4-arg (firstName, lastName, email, password)
  // and new object style — so register.component.ts works unchanged
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
      payload = {
        firstName: emailOrRequest,
        lastName:  password  || '',
        email:     firstName || '',
        password:  lastName  || '',
      };
    }
    return this.http.post<AuthResponse>(
      `${this.apiBase}/auth/register`, payload
    ).pipe(tap(res => this.storeAuth(res)));
  }

  logout() {
    this.TOKEN_KEYS.forEach(k => localStorage.removeItem(k));
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  // ── Called by auth.interceptor.ts on every request ──────────────
  // Checks ALL known key names so existing sessions survive key renames
  getToken(): string | null {
    for (const key of this.TOKEN_KEYS) {
      const t = localStorage.getItem(key);
      if (t) {
        // Auto-migrate to canonical key
        if (key !== this.TOKEN_KEY) {
          localStorage.setItem(this.TOKEN_KEY, t);
          localStorage.removeItem(key);
        }
        return t;
      }
    }
    return null;
  }

  updateLocalUser(patch: Partial<AuthUser>) {
    const current = this.currentUser();
    if (!current) return;
    const updated = { ...current, ...patch };
    this.currentUser.set(updated);
    localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
  }

  private storeAuth(res: AuthResponse) {
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
      next: (p) => this.updateLocalUser({
        displayName:  p.displayName || p.fullName || p.email,
        fullName:     p.fullName,
        avatarBase64: p.avatarBase64 || undefined,
        planType:     p.planType,
      }),
      error: () => {}
    });
  }
}