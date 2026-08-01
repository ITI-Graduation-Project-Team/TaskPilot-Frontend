import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../api/auth.service';
import { apiClient } from '../api/axios.instance';
import { ProjectStateService } from '../services/project-state.service';

export const companySetupGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const projectState = inject(ProjectStateService);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const role = authService.getUserRole();
  if (role !== 'ProjectManager') {
    return true;
  }

  // Ensure the state has loaded or fetch directly to avoid race conditions
  let companyId = projectState.userCompanyId();
  if (!companyId) {
    try {
      const profile = await projectState.getProfile();
      companyId = profile?.companyId || profile?.CompanyId || null;
    } catch (e) {
      console.error('CompanySetupGuard profile check failed:', e);
    }
  }

  const hasCompany = !!companyId;
  const isSetupPage = state.url.includes('/company-setup');

  if (isSetupPage) {
    if (hasCompany) {
      return router.createUrlTree(['/dashboard']);
    }
    return true;
  }

  if (!hasCompany) {
    return router.createUrlTree(['/company-setup']);
  }

  return true;
};
