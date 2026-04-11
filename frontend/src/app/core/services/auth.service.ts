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

// Exact structure your backend returns — confirmed from console:
// { accessToken, refreshToken, tokenType, expiresIn, user }
interface AuthResponse {
  accessToken:   string;
  refreshToken?: string;
  tokenType?:    string;   // "Bearer"
  expiresIn?:    number;   // 86400000
  user:          AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY = 'tp_token';
  private readonly USER_KEY  = 'tp_user';
  private readonly apiBase   = environment.apiUrl;

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
    ).pipe(tap(res => this.storeAuth(res)));
  }

  // Supports old 4-arg: register(firstName, lastName, email, password)
  // AND new object style
  register(
    emailOrRequest: string | RegisterRequest,
    password?: string,
    firstName?: string,
    lastName?: string
  ) {
    const payload: RegisterRequest = typeof emailOrRequest === 'object'
      ? emailOrRequest
      : { firstName: emailOrRequest, lastName: password || '', email: firstName || '', password: lastName || '' };

    return this.http.post<AuthResponse>(
      `${this.apiBase}/auth/register`, payload
    ).pipe(tap(res => this.storeAuth(res)));
  }

  logout() {
    ['tp_token', 'token', 'access_token', 'jwt_token'].forEach(k => localStorage.removeItem(k));
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  // Called by auth.interceptor.ts — validates token starts with 'eyJ' (all JWTs do)
  getToken(): string | null {
    const t = localStorage.getItem(this.TOKEN_KEY);
    return (t && t !== 'undefined' && t !== 'null' && t.startsWith('eyJ')) ? t : null;
  }

  updateLocalUser(patch: Partial<AuthUser>) {
    const current = this.currentUser();
    if (!current) return;
    const updated = { ...current, ...patch };
    this.currentUser.set(updated);
    localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
  }

  private storeAuth(res: AuthResponse) {
    // Backend confirmed to return: accessToken (not token)
    const token = res.accessToken;
    if (!token || !token.startsWith('eyJ')) {
      console.error('Invalid JWT from backend:', res);
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

    this.refreshProfileInBackground();
  }

  private loadStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
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