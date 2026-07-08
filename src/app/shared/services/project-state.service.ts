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
}

@Injectable({
  providedIn: 'root'
})
export class ProjectStateService {
  private _projects = signal<ProjectInfo[]>([]);
  private _selectedProjectId = signal<string | null>(null);
  private _isProjectManager = signal<boolean>(false);
  private _userCompanyId = signal<string | null>(null);
  private _userId = signal<string | null>(null);
  private _loading = signal<boolean>(false);

  readonly projects = this._projects.asReadonly();
  readonly selectedProjectId = this._selectedProjectId.asReadonly();
  readonly isProjectManager = this._isProjectManager.asReadonly();
  readonly userCompanyId = this._userCompanyId.asReadonly();
  readonly userId = this._userId.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly selectedProject = computed(() => {
    const id = this._selectedProjectId();
    return this._projects().find(p => p.id === id) || null;
  });

  constructor() {
    this.initializeState();
  }

  async initializeState() {
    this._loading.set(true);
    try {
      const currentUserId = getUserIdFromToken();
      if (!currentUserId) return;
      this._userId.set(currentUserId);

      const role = getRoleFromToken();
      const isPM = role === 'ProjectManager';

      // Fetch user profile to detect role and company ID
      const { data } = await apiClient.get<any>('/employees/profile');
      const profile = data.data || data;
      if (profile) {
        this._isProjectManager.set(isPM || !profile.isEmployee);
        const companyId = profile.companyId || profile.CompanyId || null;
        this._userCompanyId.set(companyId);

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
      if (!userId) return;

      const { data } = await apiClient.get<any>('/Projects');
      const allProjects: any[] = data.data || [];

      let filtered: ProjectInfo[] = [];

      if (isPM) {
        // PM sees projects they manage
        filtered = allProjects
          .filter(p => p.managerId === userId)
          .map(p => ({
            id: p.id,
            name: p.name || p.nameEn || '',
            nameEn: p.nameEn || p.name || '',
            nameAr: p.nameAr || p.name || '',
            description: p.description || p.descriptionEn || '',
            descriptionEn: p.descriptionEn || p.description || '',
            descriptionAr: p.descriptionAr || p.description || '',
            companyId: p.companyId,
            managerId: p.managerId
          }));
      } else {
        // Employee sees projects they are assigned to
        for (const p of allProjects) {
          try {
            const teamResponse = await apiClient.get<any>(`/Projects/${p.id}/employees`);
            const employeesList = teamResponse.data?.data || [];
            if (employeesList.some((e: any) => e.employeeId === userId)) {
              filtered.push({
                id: p.id,
                name: p.name || p.nameEn || '',
                nameEn: p.nameEn || p.name || '',
                nameAr: p.nameAr || p.name || '',
                description: p.description || p.descriptionEn || '',
                descriptionEn: p.descriptionEn || p.description || '',
                descriptionAr: p.descriptionAr || p.description || '',
                companyId: p.companyId,
                managerId: p.managerId
              });
            }
          } catch (err) {
            // Ignore individual project fetch errors
          }
        }
      }

      this._projects.set(filtered);

      // Restore last selected project from localStorage if it exists in filtered projects
      if (typeof localStorage !== 'undefined') {
        const savedId = localStorage.getItem('selectedProjectId');
        if (savedId && filtered.some(p => p.id === savedId)) {
          this._selectedProjectId.set(savedId);
          return;
        }
      }

      // Default to first project
      if (filtered.length > 0) {
        this.setSelectedProject(filtered[0].id);
      } else {
        this._selectedProjectId.set(null);
      }
    } catch (e) {
      console.error('Failed to load projects in state service:', e);
    }
  }

  setSelectedProject(projectId: string | null) {
    this._selectedProjectId.set(projectId);
    if (projectId) {
      localStorage.setItem('selectedProjectId', projectId);
    } else {
      localStorage.removeItem('selectedProjectId');
    }
  }

  async createNewProject(nameEn: string, nameAr: string, descriptionEn: string, descriptionAr?: string): Promise<boolean> {
    const pmId = this._userId();
    const companyId = this._userCompanyId();
    if (!pmId || !companyId) return false;

    const descAr = descriptionAr || descriptionEn;
    try {
      this._loading.set(true);
      await apiClient.post('/Projects', {
        nameEn,
        nameAr,
        descriptionEn,
        descriptionAr: descAr,
        managerId: pmId,
        companyId: companyId
      });
      await this.loadProjects();
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
      await apiClient.delete(`/Projects/${projectId}`);
      await this.loadProjects();
      // If we deleted the currently selected project, reset it
      if (this._selectedProjectId() === projectId) {
        if (this._projects().length > 0) {
          this.setSelectedProject(this._projects()[0].id);
        } else {
          this.setSelectedProject(null);
        }
      }
      return true;
    } catch (e) {
      console.error('Failed to delete project:', e);
      return false;
    } finally {
      this._loading.set(false);
    }
  }
}
