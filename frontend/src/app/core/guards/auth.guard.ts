// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // isLoggedIn is a computed() signal — call it as a function
  if (auth.isLoggedIn()) return true;

  router.navigate(['/auth/login']);
  return false;
};