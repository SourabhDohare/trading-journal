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

// Backend may return token under any of these field names
interface AuthResponse {
  token?: string;
  accessToken?: string;
  access_token?: string;
  jwt?: string;
  jwtToken?: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

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
      // Old 4-arg style: register(firstName, lastName, email, password)
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

  // ── Called by auth.interceptor.ts on EVERY request ─────────────────────
  getToken(): string | null {
    for (const key of this.TOKEN_KEYS) {
      const t = localStorage.getItem(key);
      // Reject null, empty string, and the literal string "undefined" or "null"
      // (caused by localStorage.setItem(key, undefined) being called previously)
      if (t && t !== 'undefined' && t !== 'null' && t.length > 10) {
        // Migrate to canonical key
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

  // ── Extract JWT from backend response — tries all common field names ───
  private extractToken(res: AuthResponse): string | null {
    // Backend might return token as: token, accessToken, access_token, jwt, jwtToken
    const raw = res.token
             || res.accessToken
             || res.access_token
             || res.jwt
             || res.jwtToken
             || null;

    // Guard: reject undefined/null/short strings
    if (!raw || raw === 'undefined' || raw === 'null' || raw.length < 10) {
      console.error('Auth response did not contain a valid JWT. Response keys:', Object.keys(res));
      return null;
    }
    return raw;
  }

  private storeAuth(res: AuthResponse) {
    const token = this.extractToken(res);

    if (!token) {
      // Log the full response so we can see exactly what the backend returned
      console.error('Login response missing token field. Full response:', JSON.stringify(res));
      return;
    }

    localStorage.setItem(this.TOKEN_KEY, token);

    const user: AuthUser = {
      id:           res.user?.id,
      email:        res.user?.email,
      role:         res.user?.role,
      displayName:  res.user?.displayName || res.user?.fullName || res.user?.email,
      fullName:     res.user?.fullName,
      avatarBase64: res.user?.avatarBase64,
      planType:     res.user?.planType,
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