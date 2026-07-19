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

  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  if (expectedRoles.includes(currentRole!)) {
    return true;
  }

  console.warn(`Access Denied: User role '${currentRole}' is not authorized.`);
  if (currentRole === 'Employee') {
    return router.createUrlTree(['/employee-dashboard']);
  }
  return router.createUrlTree(['/dashboard']);
};