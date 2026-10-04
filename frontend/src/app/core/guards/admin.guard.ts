import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated() && auth.userRole() === 'ADMIN') return true;
  router.navigate([auth.isAuthenticated() ? '/home' : '/auth/login']);
  return false;
};
