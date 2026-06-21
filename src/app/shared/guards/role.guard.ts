import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../api/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles: string[] = route.data['roles'];

  const currentRole = authService.getUserRole();

  if (!authService.isLoggedIn()) {
    console.warn('Access Denied: User is not logged in.');
    return false;
  }

  if (expectedRoles && currentRole && expectedRoles.includes(currentRole)) {
    return true; 
  } else {
    console.warn(`Access Denied: User role '${currentRole}' is not authorized.`);
    return false; 
  }
};