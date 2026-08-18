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

  it('loads the requested page from the ownership-filtered PM endpoint', async () => {
    const projects = Array.from({ length: 12 }, (_, index) => ({
      id: `project-${index + 1}`,
      name: `Project ${index + 1}`,
      companyId,
      managerId
    }));
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { data: { items: projects.slice(5, 10), totalItems: projects.length } }
    } as any);

    const service = new ProjectStateService();
    (service as any)._userId.set(managerId);
    (service as any)._userCompanyId.set(companyId);
    (service as any)._isProjectManager.set(true);

    const result = await service.loadProjectsPaged(2, 5);

    expect(result.totalCount).toBe(12);
    expect(result.projects.map(project => project.id)).toEqual([
      'project-6', 'project-7', 'project-8', 'project-9', 'project-10'
    ]);
    expect(getSpy).toHaveBeenCalledWith(`/Projects/company/${companyId}/paged?page=2&pageSize=5`);
  });
});
