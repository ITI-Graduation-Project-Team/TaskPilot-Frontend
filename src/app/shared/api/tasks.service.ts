import { Injectable } from '@angular/core';
import { apiClient } from './axios.instance';

export enum TaskItemStatus {
  ToDo = 0,
  InProgress = 1,
  Review = 2,
  Done = 3
}

export const TaskItemStatusLabels: Record<TaskItemStatus, string> = {
  [TaskItemStatus.ToDo]: 'To Do',
  [TaskItemStatus.InProgress]: 'In Progress',
  [TaskItemStatus.Review]: 'In Review',
  [TaskItemStatus.Done]: 'Done'
};

export interface MyTaskDto {
  taskId: string;
  titleEn: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  acceptanceCriteriaEn?: string;
  acceptanceCriteriaAr?: string;
  status: TaskItemStatus;
  priority: number;
  effortSize: number;
  type: number;
  estimatedHours: number;
  actualHours: number;
  userStoryTitleEn: string;
  userStoryTitleAr?: string;
  requiredSkills?: string[];
}

export interface MyTasksResponseDto {
  sprintId: string;
  sprintTitleEn: string;
  daysRemaining: number;
  totalTasks: number;
  toDoCount: number;
  inProgressCount: number;
  doneCount: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  completionPercentage: number;
  tasks: MyTaskDto[];
}

export interface SprintTaskDto {
  id?: string;
  taskId?: string;
  userStoryId?: string;
  titleEn: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  technicalSummaryEn?: string | null;
  technicalSummaryAr?: string | null;
  acceptanceCriteriaEn?: string;
  acceptanceCriteriaAr?: string;
  estimatedHours: number;
  actualHours?: number;
  effortSize: string;
  type: string;
  priority: string;
  status: string;
  userStoryTitleEn?: string;
  userStoryTitleAr?: string;
  requiredSkills?: string[];
  assigneeId?: string;
  assigneeName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TasksService {

  async getSprintTasks(projectId: string, sprintId: string): Promise<SprintTaskDto[]> {
    const { data } = await apiClient.get<any>(
      `/projects/${projectId}/sprints/${sprintId}/tasks`
    );
    return this.extractSprintTasks(data);
  }

  async getMySprintTasks(projectId: string, sprintId: string): Promise<SprintTaskDto[]> {
    const { data } = await apiClient.get<any>(
      `/projects/${projectId}/sprints/${sprintId}/tasks/my-tasks`
    );
    return this.extractSprintTasks(data);
  }

  private extractSprintTasks(responseBody: any): SprintTaskDto[] {
    const payload = responseBody?.data ?? responseBody;
    if (Array.isArray(payload)) return payload;
    return Array.isArray(payload?.tasks) ? payload.tasks : [];
  }

  async getMyTasks(projectId: string): Promise<MyTasksResponseDto> {
    const { data } = await apiClient.get<any>(`/projects/${projectId}/tasks/my-tasks`);
    return data.data || data;
  }

  async updateTaskStatus(taskId: string, status: TaskItemStatus): Promise<any> {
    const { data } = await apiClient.patch<any>(`/tasks/${taskId}/status`, {
      status
    });
    return data.data || data;
  }

  async logActualHours(taskId: string, actualHours: number): Promise<any> {
    const { data } = await apiClient.patch<any>(`/tasks/${taskId}/actual-hours`, {
      actualHours
    });
    return data.data || data;
  }

  async getComments(taskId: string): Promise<TaskCommentDto[]> {
    const { data } = await apiClient.get<any>(`/tasks/${taskId}/comments`);
    return data.data || data;
  }

  async addComment(taskId: string, content: string): Promise<TaskCommentDto> {
    const { data } = await apiClient.post<any>(`/tasks/${taskId}/comments`, { content });
    return data.data || data;
  }

  async getAttachments(taskId: string): Promise<TaskAttachmentDto[]> {
    const { data } = await apiClient.get<any>(`/tasks/${taskId}/attachments`);
    return data.data || data;
  }

    async addAttachment(taskId: string, file: File, lang: string = 'en'): Promise<TaskAttachmentDto> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<any>(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'lang': lang
      }
    });
    return data.data || data;
  }

  async pmRejectReview(taskId: string, reasonEn: string, reasonAr?: string): Promise<any> {
    const { data } = await apiClient.post<any>(`/tasks/${taskId}/reject-review`, {
      reasonEn,
      reasonAr
    });
    return data.data || data;
  }

  async pmReopenTask(taskId: string, reasonEn: string, reasonAr?: string): Promise<any> {
    const { data } = await apiClient.post<any>(`/tasks/${taskId}/reopen`, {
      reasonEn,
      reasonAr
    });
    return data.data || data;
  }
}

export interface TaskCommentDto {
  id: string;
  content: string;
  authorId: string;
  authorNameEn: string;
  authorNameAr: string;
  authorRole: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskAttachmentDto {
  id: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
  uploaderId: string;
  uploaderNameEn: string;
  uploaderNameAr: string;
  uploaderRole: string;
}
