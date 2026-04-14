// src/app/features/auth/auth.routes.ts
// COMPLETE FILE — callback route MUST be here or OAuth2 redirect has nowhere to land

import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./register.component').then(m => m.RegisterComponent)
  },
  {
    // Spring redirects here after Google/GitHub login:
    // https://trading-journal-plum-gamma.vercel.app/auth/callback?token=xxx&email=xxx&name=xxx
    path: 'callback',
    loadComponent: () =>
      import('./oauth-callback.component').then(m => m.OAuthCallbackComponent)
  }
];