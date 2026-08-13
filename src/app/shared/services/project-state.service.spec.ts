import { apiClient } from '../api/axios.instance';
import { ProjectStateService } from './project-state.service';

describe('ProjectStateService', () => {
  const managerId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const companyId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const savedProjectId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('loads every accessible project before restoring the saved selection', async () => {
    localStorage.setItem('selectedProjectId', savedProjectId);

    const getSpy = vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === `/Projects/company/${companyId}`) {
        return {
          data: {
            data: [
              { id: savedProjectId, name: 'Saved project', companyId, managerId },
              { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', name: 'Another project', companyId, managerId },
              { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', name: 'Third project', companyId, managerId }
            ]
          }
        } as any;
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const service = new ProjectStateService();
    (service as any)._userId.set(managerId);
    (service as any)._userCompanyId.set(companyId);
    (service as any)._isProjectManager.set(true);

    await service.loadProjects();

    expect(service.projects()).toHaveLength(3);
    expect(service.selectedProjectId()).toBe(savedProjectId);
    expect(getSpy).toHaveBeenCalledWith(`/Projects/company/${companyId}`);
    expect(getSpy).not.toHaveBeenCalledWith(`/Projects/${savedProjectId}`);
  });
});
