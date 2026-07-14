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

@Injectable({
  providedIn: 'root'
})
export class TasksService {

  async getMyTasks(projectId: string): Promise<MyTasksResponseDto> {
    const { data } = await apiClient.get<any>(`/projects/${projectId}/tasks/my-tasks`);
    return data.data || data;
  }

  async updateTaskStatus(taskId: string, status: TaskItemStatus, actualHours?: number): Promise<any> {
    const { data } = await apiClient.patch<any>(`/tasks/${taskId}/status`, {
      status,
      actualHours
    });
    return data.data || data;
  }

  async logActualHours(taskId: string, actualHours: number): Promise<any> {
    const { data } = await apiClient.patch<any>(`/tasks/${taskId}/actual-hours`, {
      actualHours
    });
    return data.data || data;
  }
}
