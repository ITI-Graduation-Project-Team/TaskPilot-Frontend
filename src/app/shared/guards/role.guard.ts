import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../api/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles: string[] = route.data['roles'];

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const currentRole = authService.getUserRole();

  if (expectedRoles?.includes(currentRole!)) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};