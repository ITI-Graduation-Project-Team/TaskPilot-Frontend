import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { isProfileCompleted, getRoleFromToken } from '../lib/auth/cookie.helper';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const role = getRoleFromToken();

  if (!role) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  // If user is Employee and hasn't uploaded their CV, force them to complete profile
  if (role === 'Employee' && !isProfileCompleted()) {
    if (!state.url.includes('/complete-profile')) {
      return router.createUrlTree(['/complete-profile']);
    }
  }

  // If user has completed their profile (or is a PM) and tries to go to complete-profile, redirect them
  if (state.url.includes('/complete-profile') && (role !== 'Employee' || isProfileCompleted())) {
    return router.createUrlTree([role === 'Employee' ? '/employee-dashboard' : '/dashboard']);
  }

  return true;
};
