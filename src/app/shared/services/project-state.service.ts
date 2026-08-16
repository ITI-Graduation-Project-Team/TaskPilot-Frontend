import { Injectable, signal, computed } from '@angular/core';
import { apiClient } from '../api/axios.instance';
import { getUserIdFromToken, getRoleFromToken } from '../lib/auth/cookie.helper';

export interface ProjectInfo {
  id: string;
  name: string;
  nameEn: string;
  nameAr: string;
  description: string;
  descriptionEn?: string;
  descriptionAr?: string;
  companyId: string;
  managerId: string;
  techStack?: string[];
  platformTargets?: string[];
  projectType?: string;
  status?: string;
  teamSize?: number;
  totalUserStories?: number;
  completedSprintsCount?: number;
  activeSprintsCount?: number;
  setupStatus?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectStateService {
  private _projects = signal<ProjectInfo[]>([]);
  private _selectedProjectId = signal<string | null>(null);
  private _isProjectManager = signal<boolean>(false);
  private _userCompanyId = signal<string | null>(null);
  private _companyName = signal<string>('');
  private _userId = signal<string | null>(null);
  private _loading = signal<boolean>(false);
  private _localCompletedIds = signal<string[]>([]);
  private _projectEmployeeCount = signal<number>(0);

  readonly projects = this._projects.asReadonly();
  readonly selectedProjectId = this._selectedProjectId.asReadonly();
  readonly isProjectManager = this._isProjectManager.asReadonly();
  readonly userCompanyId = this._userCompanyId.asReadonly();
  readonly companyName = this._companyName.asReadonly();
  readonly userId = this._userId.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly projectEmployeeCount = this._projectEmployeeCount.asReadonly();

  private pagedProjectsCache = new Map<string, Promise<{ projects: ProjectInfo[], totalCount: number }>>();

  clearPagedCache() {
    this.pagedProjectsCache.clear();
  }

  readonly selectedProject = computed(() => {
    const id = this._selectedProjectId();
    if (!id) return null;
    return this._projects().find(p => String(p.id).toLowerCase() === String(id).toLowerCase()) || null;
  });

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('localCompletedIds');
      if (stored) {
        try { this._localCompletedIds.set(JSON.parse(stored)); } catch (e) { }
      }
      const savedProjectId = localStorage.getItem('selectedProjectId');
      if (savedProjectId) {
        this._selectedProjectId.set(savedProjectId);
      }
    }
    this.initializeState();
  }

  private profilePromise: Promise<any> | null = null;

  async getProfile(forceRefresh = false): Promise<any> {
    if (forceRefresh) {
      this.profilePromise = null;
    }
    if (!this.profilePromise) {
      this.profilePromise = apiClient.get<any>('/employees/profile')
        .then(res => {
          const profile = res.data?.data || res.data;
          // Update signals synchronously
          const companyId = profile?.companyId || profile?.CompanyId || null;
          this._userCompanyId.set(companyId);
          return profile;
        })
        .catch(err => {
          this.profilePromise = null;
          throw err;
        });
    }
    return this.profilePromise;
  }

  async loadProjectById(projectId: string) {
    try {
      const { data } = await apiClient.get<any>('/Projects/' + projectId);
      const p = data.data || data;
      if (p) {
        const projectInfo: ProjectInfo = {
          id: p.id,
          name: p.name || p.nameEn || '',
          nameEn: p.nameEn || p.name || '',
          nameAr: p.nameAr || p.name || '',
          description: p.description || p.descriptionEn || '',
          descriptionEn: p.descriptionEn || p.description || '',
          descriptionAr: p.descriptionAr || p.description || '',
          companyId: p.companyId,
          managerId: p.managerId,
          techStack: p.techStack || [],
          platformTargets: p.platformTargets || [],
          projectType: p.projectType || '',
          status: p.status || 'Active',
          teamSize: p.teamSize || 0,
          totalUserStories: p.totalUserStories || 0,
          completedSprintsCount: p.completedSprintsCount || 0,
          activeSprintsCount: p.activeSprintsCount || 0,
          setupStatus: p.setupStatus || 'NeedsTechStack'
        };
        
        this._projects.update(projects => {
          if (projects.find(x => String(x.id).toLowerCase() === String(projectInfo.id).toLowerCase())) return projects;
          return [...projects, projectInfo];
        });
      }
    } catch (e) {
      console.warn('Failed to load single project:', e);
    }
  }

  async initializeState() {
    this._loading.set(true);
    try {
      const currentUserId = getUserIdFromToken();
      if (!currentUserId) return;
      this._userId.set(currentUserId);

      const role = getRoleFromToken();
      const isPM = role === 'ProjectManager';

      const profile = await this.getProfile();
      if (profile) {
        this._isProjectManager.set(isPM || !profile.isEmployee);
        const companyId = profile.companyId || profile.CompanyId || null;
        this._userCompanyId.set(companyId);

        const companyName = profile.companyName || profile.CompanyName || '';
        this._companyName.set(companyName);

        // Always load the complete accessible list. loadProjects() restores the
        // saved selection after fetching, so a saved project must not short-circuit
        // the dropdown to a single item.
        await this.loadProjects();
      }
    } catch (e) {
      console.warn('Failed to initialize ProjectStateService:', e);
    } finally {
      this._loading.set(false);
    }
  }

  async loadProjects() {
    try {
      const isPM = this._isProjectManager();
      const userId = this._userId();
      const companyId = this._userCompanyId();
      if (!userId) return;

      // Fetch the list of projects for PM (company projects) or Employee
      const endpoint = (isPM && companyId) 
        ? `/Projects/company/${companyId}` 
        : `/employees/${userId}/projects`;
        
      const { data } = await apiClient.get<any>(endpoint);
      const projects: any[] = data.data || [];
      
      // The API enforces project access. Avoid filtering GUIDs again in the client,
      // where casing differences could incorrectly hide valid PM projects.
      const filtered: ProjectInfo[] = projects.map(p => ({
        id: p.id,
        name: p.name || p.nameEn || '',
        nameEn: p.nameEn || p.name || '',
        nameAr: p.nameAr || p.name || '',
        description: p.description || p.descriptionEn || '',
        descriptionEn: p.descriptionEn || p.description || '',
        descriptionAr: p.descriptionAr || p.description || '',
        companyId: p.companyId,
        managerId: p.managerId,
        techStack: p.techStack || [],
        platformTargets: p.platformTargets || [],
        projectType: p.projectType || '',
        status: p.status || 'Active',
        teamSize: p.teamSize || 0,
        totalUserStories: p.totalUserStories || 0,
        completedSprintsCount: p.completedSprintsCount || 0,
        activeSprintsCount: p.activeSprintsCount || 0,
        setupStatus: p.setupStatus || 'NeedsTechStack'
      }));

      this._projects.set(filtered);

      if (typeof localStorage !== 'undefined') {
        const savedId = localStorage.getItem('selectedProjectId');
        if (savedId) {
          const matchingProject = filtered.find(p => String(p.id).toLowerCase() === String(savedId).toLowerCase());
          if (matchingProject) {
            this.setSelectedProject(matchingProject.id);
            return;
          }
        }
      }

      if (filtered.length > 0) {
        this.setSelectedProject(filtered[0].id);
      } else {
        this.setSelectedProject(null);
      }
    } catch (e) {
      console.error('Failed to load projects in state service:', e);
    }
  }

  loadProjectsPaged(page: number, pageSize: number, statusFilter: string = '', searchQuery: string = ''): Promise<{ projects: ProjectInfo[], totalCount: number }> {
    const isPM = this._isProjectManager();
    const userId = this._userId();
    const companyId = this._userCompanyId();
    if (!userId) return Promise.resolve({ projects: [], totalCount: 0 });

    const cacheKey = `${companyId || 'no-comp'}-${userId}-page-${page}-size-${pageSize}-tab-${statusFilter}-search-${searchQuery}`;

    if (this.pagedProjectsCache.has(cacheKey)) {
      return this.pagedProjectsCache.get(cacheKey)!;
    }

    const request = (async () => {
      try {
        const isProjectManagerRequest = isPM && !!companyId;
        const endpointBase = isProjectManagerRequest
          ? `/Projects/company/${companyId}/paged`
          : `/employees/${userId}/projects/paged`;

        let endpoint = `${endpointBase}?page=${page}&pageSize=${pageSize}`;
        if (statusFilter) {
          endpoint += `&statusFilter=${encodeURIComponent(statusFilter)}`;
        }
        if (searchQuery) {
          endpoint += `&searchQuery=${encodeURIComponent(searchQuery)}`;
        }

        const { data } = await apiClient.get<any>(endpoint);
        const items: any[] = data.data?.items || [];
        const totalCount = data.data?.totalItems || 0;
        
        const filtered: ProjectInfo[] = items.map(p => ({
          id: p.id,
          name: p.name || p.nameEn || '',
          nameEn: p.nameEn || p.name || '',
          nameAr: p.nameAr || p.name || '',
          description: p.description || p.descriptionEn || '',
          descriptionEn: p.descriptionEn || p.description || '',
          descriptionAr: p.descriptionAr || p.description || '',
          companyId: p.companyId,
          managerId: p.managerId,
          techStack: p.techStack || [],
          platformTargets: p.platformTargets || [],
          projectType: p.projectType || '',
          status: p.status || 'Active',
          teamSize: p.teamSize || 0,
          totalUserStories: p.totalUserStories || 0,
          completedSprintsCount: p.completedSprintsCount || 0,
          activeSprintsCount: p.activeSprintsCount || 0,
          setupStatus: p.setupStatus || 'NeedsTechStack'
        }));
        
        return { projects: filtered, totalCount };
      } catch (e) {
        console.warn('Failed to load paginated projects:', e);
        this.pagedProjectsCache.delete(cacheKey);
        return { projects: [], totalCount: 0 };
      }
    })();

    this.pagedProjectsCache.set(cacheKey, request);
    return request;
  }



  setSelectedProject(projectId: string | null, force: boolean = false) {
    if (!force && String(this._selectedProjectId()).toLowerCase() === String(projectId).toLowerCase()) {
      return;
    }
    this._selectedProjectId.set(projectId);
    if (projectId) {
      localStorage.setItem('selectedProjectId', projectId);
    } else {
      localStorage.removeItem('selectedProjectId');
      this._projectEmployeeCount.set(0);
    }
  }

  async loadProjectEmployeeCount(projectId: string): Promise<number> {
    try {
      const { data } = await apiClient.get<any>(`/projects/${projectId}/employees/count`);
      const count = typeof data.data === 'number' ? data.data : (typeof data === 'number' ? data : 0);
      this._projectEmployeeCount.set(count);
      return count;
    } catch (e) {
      console.warn('Failed to load project employee count:', e);
      return this._projectEmployeeCount();
    }
  }

  setProjectEmployeeCount(count: number): void {
    this._projectEmployeeCount.set(count);
  }

  async createNewProject(nameEn: string, nameAr: string, descriptionEn: string, descriptionAr?: string): Promise<boolean> {
    const companyId = this._userCompanyId();
    if (!companyId) return false;

    const descAr = descriptionAr || descriptionEn;
    try {
      this._loading.set(true);
      const existingIds = this._projects().map(p => p.id);
      
      await apiClient.post('/Projects', {
        nameEn,
        nameAr,
        descriptionEn,
        descriptionAr: descAr,
        companyId: companyId
      });
      await this.loadProjects();

      const newProject = this._projects().find(p => !existingIds.includes(p.id));
      if (newProject) {
        this.setSelectedProject(newProject.id);
      }
      this.clearPagedCache();
      return true;
    } catch (e) {
      console.error('Failed to create project:', e);
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  async updateProject(projectId: string, nameEn: string, nameAr: string, descriptionEn: string, descriptionAr: string): Promise<boolean> {
    try {
      this._loading.set(true);
      await apiClient.put('/Projects', {
        id: projectId,
        nameEn,
        nameAr,
        descriptionEn,
        descriptionAr
      });
      await this.loadProjects();
      this.clearPagedCache();
      return true;
    } catch (e) {
      console.error('Failed to update project:', e);
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  async deleteProject(projectId: string): Promise<boolean> {
    try {
      this._loading.set(true);
      await apiClient.delete('/Projects/' + projectId);
      await this.loadProjects();
      if (this._selectedProjectId() === projectId) {
        if (this._projects().length > 0) {
          this.setSelectedProject(this._projects()[0].id);
        } else {
          this.setSelectedProject(null);
        }
      }
      this.clearPagedCache();
      return true;
    } catch (e) {
      console.error('Failed to delete project:', e);
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  async changeProjectStatus(projectId: string, status: string): Promise<{ success: boolean, error?: string }> {
    try {
      this._loading.set(true);
      await apiClient.put('/Projects/' + projectId + '/status', { status });
      await this.loadProjects();
      this.clearPagedCache();
      return { success: true };
    } catch (e: any) {
      console.error('Failed to change project status:', e);
      let errorMsg = 'Failed to update project status.';
      if (e.response?.data?.message) {
        errorMsg = e.response.data.message;
      }
      return { success: false, error: errorMsg };
    } finally {
      this._loading.set(false);
    }
  }

  async getProjectStatusHistory(projectId: string): Promise<any[]> {
    try {
      const response = await apiClient.get<any>('/Projects/' + projectId + '/status/transitions');
      return response.data?.data || response.data || [];
    } catch (e) {
      console.error('Failed to load project status history:', e);
      return [];
    }
  }
}
