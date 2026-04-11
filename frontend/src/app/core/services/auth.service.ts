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

  private readonly TOKEN_KEY = 'tp_token';
  private readonly USER_KEY  = 'tp_user';
  private readonly apiBase   = environment.apiUrl;

  // ─── Signals ────────────────────────────────────────────────────
  currentUser = signal<AuthUser | null>(this.loadStoredUser());

  // isLoggedIn replaces isAuthenticated — used by auth.guard.ts
  isLoggedIn = computed(() => !!this.currentUser());

  // Keep isAuthenticated as alias so any old code still compiles
  isAuthenticated = computed(() => !!this.currentUser());

  token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));

  constructor(private http: HttpClient, private router: Router) {
    // Hydrate avatar + displayName from profile on startup
    if (this.token() && this.currentUser()) {
      this.refreshProfileInBackground();
    }
  }

  // ─── Login ───────────────────────────────────────────────────────
  login(email: string, password: string) {
    return this.http.post<AuthResponse>(
      `${this.apiBase}/auth/login`, { email, password }
    ).pipe(tap(res => {
      this.storeAuth(res);
      this.refreshProfileInBackground();
    }));
  }

  // ─── Register ────────────────────────────────────────────────────
  // Accepts EITHER the old 4-argument style OR the new object style
  // so register.component.ts works without changes
  register(
    emailOrRequest: string | RegisterRequest,
    password?: string,
    firstName?: string,
    lastName?: string
  ) {
    let payload: RegisterRequest;

    if (typeof emailOrRequest === 'object') {
      // New style: register({ email, password, firstName, lastName })
      payload = emailOrRequest;
    } else {
      // Old style: register(firstName, lastName, email, password)
      // register.component.ts calls: register(firstName, lastName, email, password)
      // emailOrRequest = firstName, password = lastName, firstName = email, lastName = password
      payload = {
        firstName:  emailOrRequest,
        lastName:   password   || '',
        email:      firstName  || '',
        password:   lastName   || '',
      };
    }

    return this.http.post<AuthResponse>(
      `${this.apiBase}/auth/register`, payload
    ).pipe(tap(res => this.storeAuth(res)));
  }

  // ─── Logout ──────────────────────────────────────────────────────
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.token.set(null);
    this.router.navigate(['/auth/login']);
  }

  // ─── Update local user (called by ProfileComponent after save) ───
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

  // ─── Private ─────────────────────────────────────────────────────
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