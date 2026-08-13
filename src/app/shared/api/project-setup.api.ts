import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SKIP_GLOBAL_LOADING } from './interceptors/loading-interceptor';

export type TechStackSetupStatus = 'NotStarted' | 'Suggested' | 'Confirmed' | 'Failed';
export type BackgroundSetupStatus = 'NotStarted' | 'Queued' | 'Running' | 'Succeeded' | 'PartiallySucceeded' | 'Failed';
export type ProjectSetupOverallStatus =
  | 'NeedsTechStack' | 'ReadyForWbs' | 'WbsQueued' | 'WbsGenerating'
  | 'WbsReady' | 'EnrichingSkills' | 'Ready' | 'ReadyWithWarnings' | 'Failed';

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

export interface SetupJobDto {
  status: BackgroundSetupStatus;
  jobId?: string;
  attemptCount: number;
  itemsCreated: number;
  secondaryItemsCreated: number;
  itemsSkipped: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface ProjectSetupDto {
  projectId: string;
  projectName: string;
  overallStatus: ProjectSetupOverallStatus;
  techStack: {
    status: TechStackSetupStatus;
    suggestion?: TechStackSuggestionDto;
    confirmedStack: string[];
    platforms: string[];
    projectType: string;
    error?: string;
  };
  wbs: SetupJobDto;
  skills: SetupJobDto;
}

export interface ConfirmTechStackRequest {
  techStack: string[];
  platformTargets: string[];
  projectType: string;
}

interface ApiResponse<T> { data: T; succeeded: boolean; message?: string; }

@Injectable({ providedIn: 'root' })
export class ProjectSetupApi {
  private http = inject(HttpClient);
  private readonly quietContext = new HttpContext().set(SKIP_GLOBAL_LOADING, true);

  get(projectId: string) {
    return this.http.get<ApiResponse<ProjectSetupDto>>(`${environment.apiUrl}/projects/${projectId}/setup`, { context: this.quietContext });
  }

  suggest(projectId: string, regenerate = false) {
    const suffix = regenerate ? '/regenerate' : '';
    return this.http.post<ApiResponse<ProjectSetupDto>>(
      `${environment.apiUrl}/projects/${projectId}/tech-stack/suggestion${suffix}`,
      {},
      { context: this.quietContext }
    );
  }

  confirm(projectId: string, request: ConfirmTechStackRequest) {
    return this.http.post<ApiResponse<ProjectSetupDto>>(
      `${environment.apiUrl}/projects/${projectId}/tech-stack/confirm`, request, { context: this.quietContext });
  }

  queueWbs(projectId: string) {
    return this.http.post<ApiResponse<ProjectSetupDto>>(
      `${environment.apiUrl}/projects/${projectId}/wbs/generation`, {}, { context: this.quietContext });
  }

  retrySkills(projectId: string) {
    return this.http.post<ApiResponse<ProjectSetupDto>>(
      `${environment.apiUrl}/projects/${projectId}/wbs/skills-enrichment`, {}, { context: this.quietContext });
  }
}
