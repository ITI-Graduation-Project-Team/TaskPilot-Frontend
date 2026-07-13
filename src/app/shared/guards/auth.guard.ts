import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../api/auth.service';
import { isProfileCompleted } from '../lib/auth/cookie.helper';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const role = authService.getUserRole();
  const completed = isProfileCompleted();
  const isCompleteProfilePage = state.url.includes('/complete-profile');

  if (role === 'Employee') {
    if (!completed) {
      if (!isCompleteProfilePage) {
        return router.createUrlTree(['/complete-profile']);
      }
    } else {
      if (isCompleteProfilePage) {
        return router.createUrlTree(['/dashboard']);
      }
    }
  }

  return true;
};
