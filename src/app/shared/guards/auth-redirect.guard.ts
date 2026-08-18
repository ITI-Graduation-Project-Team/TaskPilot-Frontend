import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../api/auth.service';
import { isProfileCompleted } from '../lib/auth/cookie.helper';
import { getRedirectForRole } from '../lib/auth/role-redirect';

export const authRedirectGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return router.parseUrl(getRedirectForRole(authService.getUserRole(), isProfileCompleted()));
  }
  
  return true;
};
