import { Injectable } from '@angular/core';
import { apiClient } from './axios.instance';

export interface PartiallyCompletedStory {
  userStoryId: string;
  titleEn: string;
  titleAr: string;
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  completionPercentage: number;
}

export interface DeveloperMetric {
  employeeId: string;
  fullName: string;
  assignedTasks: number;
  completedTasks: number;
  estimatedHours: number;
  actualHours: number;
  velocityRatio: number;
  completionRate: number;
  completedTaskTypes?: string[];
}

export interface SprintImprovement {
  category: string;
  recommendationEn: string;
  recommendationAr: string;
  priority: 'High' | 'Medium' | 'Low';
  actionType: 'ReduceCapacity' | 'ReassignDeveloper' | 'AddBuffer' | 'ReduceTaskCount' | 'SplitLargeTasks' | 'None';
  targetEmployeeId: string | null;
  suggestedAdjustment: number;
}

export interface SprintUnfinishedTask {
  taskId: string;
  userStoryId?: string;
  titleEn: string;
  estimatedHours: number;
  reason: string;
  assigneeName: string;
}

export interface SprintRetrospectiveData {
  sprintId: string;
  sprintTitleEn?: string;
  sprintTitleAr?: string;
  startDate?: string;
  endDate?: string;
  actualDurationDays?: number;
  plannedDurationDays?: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks?: number;
  notStartedTasks?: number;
  completionRate: number;
  estimationAccuracy?: number;
  totalEstimatedHours?: number;
  totalActualHours?: number;
  velocityRatio?: number;
  whatWentWellEn?: string;
  whatWentWellAr?: string;
  challengesEn?: string;
  challengesAr?: string;
  actionItemsEn?: string;
  actionItemsAr?: string;
  teamSentimentSummaryEn?: string;
  teamSentimentSummaryAr?: string;
  developerBreakdowns?: DeveloperMetric[];
  unfinishedTasks?: SprintUnfinishedTask[];
  partiallyCompletedStories?: PartiallyCompletedStory[];
  improvements?: SprintImprovement[];
}

// Alias for backwards compatibility
export type SprintRetroDto = SprintRetrospectiveData;

export interface SuggestedStory {
  storyId: string;
  titleEn: string;
  titleAr: string;
  estimatedHours: number;
  priorityScore: number;
  reasonEn: string;
  reasonAr: string;
}

export interface SprintSuggestionDto {
  sprintNumber?: number;
  sprintTitleEn?: string;
  sprintTitleAr?: string;
  titleEn: string;
  titleAr: string;
  sprintGoalEn?: string;
  sprintGoalAr?: string;
  goalEn?: string;
  goalAr?: string;
  totalEstimatedHours?: number;
  risks?: string[];
  stories?: SuggestedStory[];
  userStoryIds: string[];
}

export interface ConfirmSprintRequest {
  titleEn: string;
  titleAr: string;
  sprintGoalEn: string;
  sprintGoalAr: string;
  startDate?: string;
  endDate?: string;
  userStoryIds: string[];
}

export interface SprintListItem {
  sprintId: string;
  titleEn: string;
  titleAr: string;
  sprintGoalEn?: string;
  sprintGoalAr?: string;
  startDate: string;
  endDate: string;
  status: 'Planned' | 'Active' | 'Completed' | 'Cancelled';
  userStoriesCount: number;
  tasksCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class SprintPlanningService {
  async getSprintSuggestions(projectId: string): Promise<any> {
    const { data } = await apiClient.post(`/projects/${projectId}/sprint-suggestions`);
    return data;
  }

  async confirmSprints(projectId: string, request: any): Promise<any> {
    const { data } = await apiClient.post(`/projects/${projectId}/sprints/confirm`, request);
    return data;
  }

  async getActiveSprint(projectId: string): Promise<any> {
    const { data } = await apiClient.get(`/projects/${projectId}/sprints/active`);
    return data;
  }

  async getPlannedSprint(projectId: string): Promise<{ sprintId: string; status: string } | null> {
    try {
      const { data } = await apiClient.get(`/projects/${projectId}/sprints/planned`);
      return data?.data || data || null;
    } catch {
      return null;
    }
  }

  async getAssignmentSnapshot(projectId: string, sprintId: string): Promise<any> {
    const { data } = await apiClient.get(`/projects/${projectId}/sprints/${sprintId}/assignment/snapshot`);
    return data;
  }

  async generateRetrospective(sprintId: string, projectId?: string): Promise<any> {
    const { data } = await apiClient.post(`/sprints/${sprintId}/retrospective/generate`);
    return data;
  }

  async getRetrospective(sprintId: string, projectId?: string): Promise<any> {
    const { data } = await apiClient.get(`/sprints/${sprintId}/retrospective`);
    return data;
  }

  async startSprint(projectId: string, sprintId: string): Promise<void> {
    await apiClient.post(
      `/projects/${projectId}/sprints/${sprintId}/start`,
      {}
    );
  }

  async getAllSprints(projectId: string): Promise<SprintListItem[]> {
    try {
      const { data } = await apiClient.get(
        `/projects/${projectId}/sprints`
      );
      return data?.data || [];
    } catch {
      return [];
    }
  }

  async completeSprint(projectId: string, sprintId: string): Promise<void> {
    await apiClient.post(
      `/projects/${projectId}/sprints/${sprintId}/complete`,
      {}
    );
  }

  async getLatestCompletedSprint(projectId: string): Promise<{ sprintId: string } | null> {
    try {
      const { data } = await apiClient.get(
        `/projects/${projectId}/sprints/completed/latest`
      );
      return data?.data || null;
    } catch {
      return null;
    }
  }
}
