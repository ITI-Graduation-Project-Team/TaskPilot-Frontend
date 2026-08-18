import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectSetupApi } from '../api/project-setup.api';
import { ProjectStateService } from '../services/project-state.service';
import { projectSetupGuard } from './project-setup.guard';

describe('projectSetupGuard', () => {
  const selectedProjectId = vi.fn<() => string | null>();
  const selectedProject = vi.fn<() => null>();
  const getStatus = vi.fn();
  let router: Router;

  beforeEach(() => {
    selectedProjectId.mockReset();
    selectedProject.mockReset();
    selectedProject.mockReturnValue(null);
    getStatus.mockReset();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ProjectStateService, useValue: { selectedProjectId, selectedProject } },
        { provide: ProjectSetupApi, useValue: { getStatus } },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('allows navigation when setup is ready', async () => {
    selectedProjectId.mockReturnValue('project-1');
    getStatus.mockReturnValue(of({
      succeeded: true,
      data: { projectId: 'project-1', wbsStatus: 'Succeeded', isReady: true },
    }));

    expect(await resolveGuard()).toBe(true);
    expect(getStatus).toHaveBeenCalledWith('project-1');
  });

  it('redirects to setup when setup is not ready', async () => {
    selectedProjectId.mockReturnValue('project-1');
    getStatus.mockReturnValue(of({
      succeeded: true,
      data: { projectId: 'project-1', wbsStatus: 'Running', isReady: false },
    }));

    expect(router.serializeUrl(await resolveUrlTree())).toBe('/dashboard/projects/project-1/setup');
  });

  it('redirects to setup when the status request fails', async () => {
    selectedProjectId.mockReturnValue('project-1');
    getStatus.mockReturnValue(throwError(() => new Error('Request failed')));

    expect(router.serializeUrl(await resolveUrlTree())).toBe('/dashboard/projects/project-1/setup');
  });

  it('redirects to projects when no project is selected', async () => {
    selectedProjectId.mockReturnValue(null);

    expect(router.serializeUrl(await resolveUrlTree())).toBe('/dashboard/projects');
    expect(getStatus).not.toHaveBeenCalled();
  });

  function runGuard(): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    return TestBed.runInInjectionContext(() => projectSetupGuard(
      {} as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot
    )) as boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree>;
  }

  async function resolveGuard(): Promise<boolean | UrlTree> {
    const result = runGuard();
    if (result instanceof Observable) return firstValueFrom(result);
    return Promise.resolve(result);
  }

  async function resolveUrlTree(): Promise<UrlTree> {
    return await resolveGuard() as UrlTree;
  }
});
