import { Injectable } from '@angular/core';
import { apiClient } from './axios.instance';

export interface SprintSuggestionDto {
  titleEn: string;
  titleAr: string;
  goalEn: string;
  goalAr: string;
  userStoryIds: string[];
}

export interface SprintRetroDto {
  id: string;
  sprintId: string;
  whatWentWellEn: string;
  whatWentWellAr: string;
  challengesEn: string;
  challengesAr: string;
  actionItemsEn: string;
  actionItemsAr: string;
  completionRate: number;
  estimationAccuracy: number;
  teamSentimentSummaryEn: string;
  teamSentimentSummaryAr: string;
}

@Injectable({
  providedIn: 'root'
})
export class SprintPlanningService {
  async getSprintSuggestions(projectId: string): Promise<any> {
    const { data } = await apiClient.post(`/projects/${projectId}/sprint-suggestions`);
    return data;
  }

  async confirmSprints(projectId: string, sprints: SprintSuggestionDto[]): Promise<any> {
    const { data } = await apiClient.post(`/projects/${projectId}/sprints/confirm`, sprints);
    return data;
  }

  async getActiveSprint(projectId: string): Promise<any> {
    const { data } = await apiClient.get(`/projects/${projectId}/sprints/active`);
    return data;
  }

  async getAssignmentSnapshot(projectId: string, sprintId: string): Promise<any> {
    const { data } = await apiClient.get(`/projects/${projectId}/sprints/${sprintId}/assignment/snapshot`);
    return data;
  }

  async generateRetrospective(sprintId: string): Promise<any> {
    const { data } = await apiClient.post(`/sprints/${sprintId}/retrospective/generate`);
    return data;
  }

  async getRetrospective(sprintId: string): Promise<any> {
    const { data } = await apiClient.get(`/sprints/${sprintId}/retrospective`);
    return data;
  }
}
