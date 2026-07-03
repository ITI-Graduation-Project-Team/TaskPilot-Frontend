import { Injectable } from '@angular/core';
import { apiClient } from './axios.instance';

export interface TaskItemDto {
  id: string;
  userStoryId: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  estimatedHours: number;
  effortSize: string;
  type: string;
  priority: string;
  status: string;
}

export interface UserStoryDto {
  id: string;
  projectId: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  priority: string;
  status: string;
  tasks: TaskItemDto[];
}

export interface BacklogDto {
  projectId: string;
  projectNameEn: string;
  projectNameAr: string;
  userStories: UserStoryDto[];
}

export interface ProjectDto {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  companyId: string;
}

export function mapPriorityToBackend(priority: string): number {
  switch (priority) {
    case 'Low': return 0;
    case 'Medium': return 1;
    case 'High': return 2;
    case 'Critical': return 3;
    default: return 1;
  }
}

export function mapPriorityToFrontend(priority: number | string): 'Low' | 'Medium' | 'High' {
  const p = String(priority);
  if (p === '0' || p === 'Low') return 'Low';
  if (p === '2' || p === 'High' || p === '3' || p === 'Critical') return 'High';
  return 'Medium';
}

export function mapTypeToBackend(type: string): number {
  if (type === 'Bug') return 2; // NonTechnical
  return 1; // Technical (Feature, Refactor)
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
      return 0;
    case 'inProgress':
    case 'InProgress':
      return 1;
    case 'review':
    case 'Review':
      return 2;
    case 'done':
    case 'Done':
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

@Injectable({
  providedIn: 'root',
})
export class BacklogService {
  
  async getProjects(): Promise<ProjectDto[]> {
    const { data } = await apiClient.get<any>('/Projects');
    return data.data || [];
  }

  async getBacklog(projectId: string): Promise<BacklogDto> {
    const { data } = await apiClient.get<any>(`/projects/${projectId}/backlog`);
    return data.data;
  }

  async createProject(nameEn: string, nameAr: string, descriptionEn: string, companyId: string, managerId: string): Promise<ProjectDto> {
    const { data } = await apiClient.post<any>('/Projects', {
      nameEn,
      nameAr,
      descriptionEn,
      descriptionAr: descriptionEn,
      companyId,
      managerId,
    });
    return data.data;
  }

  async createUserStory(projectId: string, titleEn: string, descriptionEn: string, priority: string = 'High'): Promise<UserStoryDto> {
    const { data } = await apiClient.post<any>(`/projects/${projectId}/userstories`, {
      titleEn,
      titleAr: titleEn,
      descriptionEn,
      descriptionAr: descriptionEn,
      acceptanceCriteriaEn: 'Fully implemented and verified.',
      acceptanceCriteriaAr: 'Fully implemented and verified.',
      priority: mapPriorityToBackend(priority),
    });
    return data.data;
  }

  async createTask(storyId: string, task: {
    titleEn: string;
    descriptionEn: string;
    estimatedHours: number;
    priority: string;
    type: string;
    status: string;
  }): Promise<TaskItemDto> {
    const { data } = await apiClient.post<any>(`/userstories/${storyId}/tasks`, {
      titleEn: task.titleEn,
      titleAr: task.titleEn,
      descriptionEn: task.descriptionEn,
      descriptionAr: task.descriptionEn,
      estimatedHours: task.estimatedHours,
      effortSize: 1, // Medium
      type: mapTypeToBackend(task.type),
      priority: mapPriorityToBackend(task.priority),
      status: mapStatusToBackend(task.status),
    });
    return data.data;
  }

  async updateTask(taskId: string, task: {
    titleEn: string;
    descriptionEn: string;
    estimatedHours: number;
    priority: string;
    type: string;
    status: string;
  }): Promise<void> {
    await apiClient.put(`/tasks/${taskId}`, {
      titleEn: task.titleEn,
      titleAr: task.titleEn,
      descriptionEn: task.descriptionEn,
      descriptionAr: task.descriptionEn,
      estimatedHours: task.estimatedHours,
      effortSize: 1, // Medium
      type: mapTypeToBackend(task.type),
      priority: mapPriorityToBackend(task.priority),
      status: mapStatusToBackend(task.status),
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}`);
  }
}
