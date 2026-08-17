import { Injectable } from '@angular/core';
import { apiClient } from './axios.instance';

export interface TaskItemDto {
  id: string;
  userStoryId: string;
  title: string;
  description?: string;
  technicalSummary?: string;
  acceptanceCriteria?: string;
  estimatedHours: number;
  effortSize: string;
  type: string;
  priority: string;
  status: string;
  assigneeId?: string;
  assigneeName?: string;
}

export interface TaskDetailDto {
  id: string;
  userStoryId: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  technicalSummaryEn?: string;
  technicalSummaryAr?: string;
  acceptanceCriteriaEn?: string;
  acceptanceCriteriaAr?: string;
  estimatedHours: number;
  effortSize: string;
  type: string;
  priority: string;
  status: string;
}

export interface UserStoryDto {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  priority: string;
  status: string;
  tasks: TaskItemDto[];
}

export interface UserStoryDetailDto {
  id: string;
  projectId: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  acceptanceCriteriaEn?: string;
  acceptanceCriteriaAr?: string;
  priority: string;
}

export interface PaginatedUserStories {
  items: UserStoryDto[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface BacklogDto {
  projectId: string;
  projectName: string;
  userStories: UserStoryDto[];
}

export interface PaginatedBacklogDto {
  projectId: string;
  projectName: string;
  userStories: PaginatedUserStories;
}

export interface ProjectDto {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  companyId: string;
  techStack?: string[];
  platformTargets?: string[];
  projectType?: string;
}

export interface UserStoryPayload {
  titleEn: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  acceptanceCriteriaEn?: string;
  acceptanceCriteriaAr?: string;
  priority: string;
}

export interface TaskPayload {
  titleEn: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  technicalSummaryEn?: string;
  technicalSummaryAr?: string;
  acceptanceCriteriaEn?: string;
  acceptanceCriteriaAr?: string;
  estimatedHours: number;
  effortSize: string;
  priority: string;
  type: string;
  status?: string;
}

export function mapPriorityToBackend(priority: string): number {
  switch (priority) {
    case 'Low':
    case '0':
      return 0;
    case 'High':
    case '2':
      return 2;
    case 'Critical':
    case '3':
      return 3;
    default:
      return 1;
  }
}

export function mapPriorityToFrontend(priority: number | string): 'Low' | 'Medium' | 'High' {
  const p = String(priority);
  if (p === '0' || p === 'Low') return 'Low';
  if (p === '2' || p === 'High' || p === '3' || p === 'Critical') return 'High';
  return 'Medium';
}

export function mapTypeToBackend(type: string): number {
  if (type === '2' || type === 'NonTechnical' || type === 'Bug') return 2;
  return 1;
}

export function mapTypeToFrontend(type: number | string): 'Feature' | 'Bug' | 'Refactor' {
  const t = String(type);
  if (t === '2' || t === 'NonTechnical' || t === 'Bug') return 'Bug';
  if (t === 'Refactor') return 'Refactor';
  return 'Feature';
}

export function mapStatusToBackend(status: string): number {
  switch (status) {
    case 'todo':
    case 'ToDo':
    case '0':
      return 0;
    case 'inProgress':
    case 'InProgress':
    case '1':
      return 1;
    case 'review':
    case 'Review':
    case '2':
      return 2;
    case 'done':
    case 'Done':
    case '3':
      return 3;
    default:
      return 0;
  }
}

export function mapStatusToFrontend(status: number | string): 'todo' | 'inProgress' | 'review' | 'done' {
  const s = String(status);
  if (s === '1' || s === 'InProgress' || s === 'inProgress') return 'inProgress';
  if (s === '2' || s === 'Review' || s === 'review') return 'review';
  if (s === '3' || s === 'Done' || s === 'done') return 'done';
  return 'todo';
}

export function mapEffortSizeToBackend(effortSize: string): number {
  switch (effortSize) {
    case 'Small':
    case '0':
      return 0;
    case 'Large':
    case '2':
      return 2;
    default:
      return 1;
  }
}

@Injectable({
  providedIn: 'root',
})
export class BacklogService {
  private backlogCache = new Map<string, PaginatedBacklogDto>();
  private inFlightRequests = new Map<string, Promise<PaginatedBacklogDto>>();

  private getCacheKey(projectId: string, page: number, pageSize: number): string {
    // If the Backlog later has search/filter parameters, include those here
    return `${projectId}-page-${page}-pageSize-${pageSize}`;
  }

  private clearProjectCache(projectId?: string): void {
    if (projectId) {
      const prefix = `${projectId}-`;
      for (const key of this.backlogCache.keys()) {
        if (key.startsWith(prefix)) {
          this.backlogCache.delete(key);
        }
      }
    } else {
      this.backlogCache.clear();
    }
  }

  async getBacklog(projectId: string, page: number = 1, pageSize: number = 7): Promise<PaginatedBacklogDto> {
    const key = this.getCacheKey(projectId, page, pageSize);

    if (this.backlogCache.has(key)) {
      return this.backlogCache.get(key)!;
    }

    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key)!;
    }

    const request = apiClient.get<any>(`/projects/${projectId}/backlog?page=${page}&pageSize=${pageSize}`)
      .then(res => {
        this.backlogCache.set(key, res.data.data);
        this.inFlightRequests.delete(key);
        return res.data.data;
      })
      .catch(err => {
        this.inFlightRequests.delete(key);
        throw err;
      });

    this.inFlightRequests.set(key, request);
    return request;
  }

  async createProject(nameEn: string, nameAr: string, descriptionEn: string, companyId: string): Promise<ProjectDto> {
    const { data } = await apiClient.post<any>('/Projects', {
      nameEn,
      nameAr,
      descriptionEn,
      descriptionAr: descriptionEn,
      companyId,
    });
    return data.data;
  }

  async createUserStory(projectId: string, story: UserStoryPayload): Promise<UserStoryDto> {
    const { data } = await apiClient.post<any>(`/projects/${projectId}/userstories`, {
      titleEn: story.titleEn,
      titleAr: story.titleAr || '',
      descriptionEn: story.descriptionEn || '',
      descriptionAr: story.descriptionAr || '',
      acceptanceCriteriaEn: story.acceptanceCriteriaEn || '',
      acceptanceCriteriaAr: story.acceptanceCriteriaAr || '',
      priority: mapPriorityToBackend(story.priority),
    });
    this.clearProjectCache(projectId);
    return data.data;
  }

  async getUserStory(storyId: string): Promise<UserStoryDetailDto> {
    const { data } = await apiClient.get<any>(`/userstories/${storyId}`);
    return data.data;
  }

  async updateUserStory(storyId: string, story: UserStoryPayload): Promise<void> {
    await apiClient.put(`/userstories/${storyId}`, {
      titleEn: story.titleEn,
      titleAr: story.titleAr || '',
      descriptionEn: story.descriptionEn || '',
      descriptionAr: story.descriptionAr || '',
      acceptanceCriteriaEn: story.acceptanceCriteriaEn || '',
      acceptanceCriteriaAr: story.acceptanceCriteriaAr || '',
      priority: mapPriorityToBackend(story.priority),
    });
    this.clearProjectCache();
  }

  async deleteUserStory(storyId: string): Promise<void> {
    await apiClient.delete(`/userstories/${storyId}`);
    this.clearProjectCache();
  }

  async createTask(storyId: string, task: TaskPayload): Promise<TaskItemDto> {
    const { data } = await apiClient.post<any>(`/userstories/${storyId}/tasks`, {
      titleEn: task.titleEn,
      titleAr: task.titleAr || '',
      descriptionEn: task.descriptionEn || '',
      descriptionAr: task.descriptionAr || '',
      technicalSummaryEn: task.technicalSummaryEn || '',
      technicalSummaryAr: task.technicalSummaryAr || '',
      acceptanceCriteriaEn: task.acceptanceCriteriaEn || '',
      acceptanceCriteriaAr: task.acceptanceCriteriaAr || '',
      estimatedHours: task.estimatedHours,
      effortSize: mapEffortSizeToBackend(task.effortSize),
      type: mapTypeToBackend(task.type),
      priority: mapPriorityToBackend(task.priority),
    });
    this.clearProjectCache();
    return data.data;
  }

  async getTask(taskId: string): Promise<TaskDetailDto> {
    const { data } = await apiClient.get<any>(`/tasks/${taskId}`);
    return data.data;
  }

  async updateTask(taskId: string, task: TaskPayload): Promise<void> {
    await apiClient.put(`/tasks/${taskId}`, {
      titleEn: task.titleEn,
      titleAr: task.titleAr || '',
      descriptionEn: task.descriptionEn || '',
      descriptionAr: task.descriptionAr || '',
      technicalSummaryEn: task.technicalSummaryEn || '',
      technicalSummaryAr: task.technicalSummaryAr || '',
      acceptanceCriteriaEn: task.acceptanceCriteriaEn || '',
      acceptanceCriteriaAr: task.acceptanceCriteriaAr || '',
      estimatedHours: task.estimatedHours,
      effortSize: mapEffortSizeToBackend(task.effortSize),
      type: mapTypeToBackend(task.type),
      priority: mapPriorityToBackend(task.priority),
      status: mapStatusToBackend(task.status || 'ToDo'),
    });
    this.clearProjectCache();
  }

  async deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}`);
    this.clearProjectCache();
  }
}