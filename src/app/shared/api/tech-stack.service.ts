import { Injectable } from '@angular/core';
import { apiClient } from './axios.instance';

export interface RecommendedStackDto {
  description: string;
  techStack: string[];
  reasoning: string;
}

export interface TechStackSuggestionDto {
  primaryStack: RecommendedStackDto;
  idealStack: RecommendedStackDto;
  gapAnalysis: string[];
  platformTargets: string[];
  projectType: string;
}

export interface ConfirmTechStackRequest {
  techStack: string[];
  platformTargets: string[];
  projectType: string;
}

@Injectable({
  providedIn: 'root',
})
export class TechStackService {
  async suggest(projectId: string): Promise<TechStackSuggestionDto> {
    const { data } = await apiClient.get<any>(`/projects/${projectId}/tech-stack/suggest`);
    return data.data || data;
  }

  async confirm(projectId: string, request: ConfirmTechStackRequest): Promise<void> {
    await apiClient.post(`/projects/${projectId}/tech-stack/confirm`, request);
  }
}