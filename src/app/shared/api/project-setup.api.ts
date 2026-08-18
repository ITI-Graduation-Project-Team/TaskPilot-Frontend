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

export type SkillGapType = 'MissingSkill' | 'ProficiencyGap' | 'CapacityGap' | 'Unclassified';
export type SkillGapSeverity = 'Low' | 'Medium' | 'High';

export interface SkillGapDto {
  skill: string;
  technology: string;
  gapType: SkillGapType;
  severity: SkillGapSeverity;
  requiredLevel?: string;
  availableLevel?: string;
  requiredCount?: number;
  availableCount: number;
  availableFte: number;
  summary: string;
  recommendation: string;
}

export interface TechStackSuggestionDto {
  primaryStack: RecommendedStackDto;
  idealStack: RecommendedStackDto;
  gapAnalysis: SkillGapDto[];
  platformTargets: string[];
  projectType: string;
}

export interface SetupJobDto {
  status: BackgroundSetupStatus;
  jobId?: string;
  attemptCount: number;
  itemsProcessed: number;
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
  teamContext: {
    activeMemberCount: number;
    membersWithSkillsCount: number;
    teamStackAvailable: boolean;
  };
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
}

interface ApiResponse<T> { data: T; succeeded: boolean; message?: string; }

const value = (source: any, camelCase: string, pascalCase: string): any =>
  source?.[camelCase] ?? source?.[pascalCase];

const stringList = (source: unknown): string[] =>
  Array.isArray(source)
    ? source.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

function normalizeRecommendedStack(source: any): RecommendedStackDto | undefined {
  if (!source || typeof source !== 'object') return undefined;
  const techStack = value(source, 'techStack', 'TechStack');
  return {
    description: value(source, 'description', 'Description') ?? '',
    techStack: stringList(techStack),
    reasoning: value(source, 'reasoning', 'Reasoning') ?? '',
  };
}

function normalizeGap(source: unknown): SkillGapDto | undefined {
  if (typeof source === 'string' && source.trim()) {
    return {
      skill: '', technology: '', gapType: 'Unclassified', severity: 'Medium',
      availableCount: 0, availableFte: 0, summary: source.trim(), recommendation: source.trim(),
    };
  }
  if (!source || typeof source !== 'object') return undefined;
  const gap = source as any;
  const summary = value(gap, 'summary', 'Summary');
  if (typeof summary !== 'string' || !summary.trim()) return undefined;
  return {
    skill: value(gap, 'skill', 'Skill') ?? '',
    technology: value(gap, 'technology', 'Technology') ?? '',
    gapType: value(gap, 'gapType', 'GapType') ?? 'Unclassified',
    severity: value(gap, 'severity', 'Severity') ?? 'Medium',
    requiredLevel: value(gap, 'requiredLevel', 'RequiredLevel') ?? undefined,
    availableLevel: value(gap, 'availableLevel', 'AvailableLevel') ?? undefined,
    requiredCount: value(gap, 'requiredCount', 'RequiredCount') ?? undefined,
    availableCount: value(gap, 'availableCount', 'AvailableCount') ?? 0,
    availableFte: value(gap, 'availableFte', 'AvailableFte') ?? 0,
    summary: summary.trim(),
    recommendation: value(gap, 'recommendation', 'Recommendation') ?? summary.trim(),
  };
}

/** Supports both current camelCase responses and legacy suggestions stored as PascalCase JsonElement. */
export function normalizeProjectSetup(source: any): ProjectSetupDto {
  const techStackSource = value(source, 'techStack', 'TechStack') ?? {};
  const suggestionSource = value(techStackSource, 'suggestion', 'Suggestion');
  const primaryStack = normalizeRecommendedStack(value(suggestionSource, 'primaryStack', 'PrimaryStack'));
  const idealStack = normalizeRecommendedStack(value(suggestionSource, 'idealStack', 'IdealStack'));
  const confirmedStack = value(techStackSource, 'confirmedStack', 'ConfirmedStack');
  const platforms = value(techStackSource, 'platforms', 'Platforms');
  const teamContextSource = value(source, 'teamContext', 'TeamContext') ?? {};
  const activeMemberCount = value(teamContextSource, 'activeMemberCount', 'ActiveMemberCount') ?? 0;
  const membersWithSkillsCount = value(teamContextSource, 'membersWithSkillsCount', 'MembersWithSkillsCount') ?? 0;
  const rawGaps = value(suggestionSource, 'gapAnalysis', 'GapAnalysis');

  const suggestion = primaryStack && idealStack ? {
    primaryStack,
    idealStack,
    gapAnalysis: Array.isArray(rawGaps) ? rawGaps.map(normalizeGap).filter((gap): gap is SkillGapDto => !!gap) : [],
    platformTargets: stringList(value(suggestionSource, 'platformTargets', 'PlatformTargets')),
    projectType: value(suggestionSource, 'projectType', 'ProjectType') ?? 'Other',
  } : undefined;

  const normalizeJob = (jobSource: any): SetupJobDto => ({
    status: value(jobSource, 'status', 'Status') ?? 'NotStarted',
    jobId: value(jobSource, 'jobId', 'JobId'),
    attemptCount: value(jobSource, 'attemptCount', 'AttemptCount') ?? 0,
    itemsProcessed: value(jobSource, 'itemsProcessed', 'ItemsProcessed') ?? 0,
    itemsCreated: value(jobSource, 'itemsCreated', 'ItemsCreated') ?? 0,
    secondaryItemsCreated: value(jobSource, 'secondaryItemsCreated', 'SecondaryItemsCreated') ?? 0,
    itemsSkipped: value(jobSource, 'itemsSkipped', 'ItemsSkipped') ?? 0,
    startedAt: value(jobSource, 'startedAt', 'StartedAt'),
    completedAt: value(jobSource, 'completedAt', 'CompletedAt'),
    error: value(jobSource, 'error', 'Error'),
  });

  return {
    projectId: value(source, 'projectId', 'ProjectId') ?? '',
    projectName: value(source, 'projectName', 'ProjectName') ?? '',
    overallStatus: value(source, 'overallStatus', 'OverallStatus') ?? 'NeedsTechStack',
    teamContext: {
      activeMemberCount,
      membersWithSkillsCount,
      teamStackAvailable: value(teamContextSource, 'teamStackAvailable', 'TeamStackAvailable') ?? (activeMemberCount > 0 && membersWithSkillsCount > 0),
    },
    techStack: {
      status: value(techStackSource, 'status', 'Status') ?? 'NotStarted',
      suggestion,
      confirmedStack: stringList(confirmedStack),
      platforms: stringList(platforms),
      projectType: value(techStackSource, 'projectType', 'ProjectType') ?? '',
      error: value(techStackSource, 'error', 'Error'),
    },
    wbs: normalizeJob(value(source, 'wbs', 'Wbs')),
    skills: normalizeJob(value(source, 'skills', 'Skills')),
  };
}

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
