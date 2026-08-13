import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { ProjectSetupApi } from '../api/project-setup.api';
import { ProjectStateService } from '../services/project-state.service';

export const projectSetupGuard: CanActivateFn = () => {
  const projects = inject(ProjectStateService);
  const setupApi = inject(ProjectSetupApi);
  const router = inject(Router);
  const projectId = projects.selectedProjectId();

  if (!projectId) return router.createUrlTree(['/dashboard', 'projects']);

  return setupApi.get(projectId).pipe(
    map(response => response.data.wbs.status === 'Succeeded'
      ? true
      : router.createUrlTree(['/dashboard', 'projects', projectId, 'setup'])),
    catchError(() => of(router.createUrlTree(['/dashboard', 'projects', projectId, 'setup'])))
  );
};
