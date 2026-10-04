import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const roles = route.data['roles'] as string[] | undefined;
  if (roles?.length && !roles.includes(auth.currentUser()?.role ?? '')) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
