import { Injectable, inject } from '@angular/core';
import { apiClient } from './axios.instance';
import { ProjectStateService } from '../services/project-state.service';
import {
  AssignmentContext,
  AssignmentSuggestion,
  AssignmentTeamMember,
  AssignTaskResult,
  ConfirmAssignmentsRequest,
  DeveloperSuggestion,
  ScoringWeights
} from '../../entities/assignment.entity';

@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private projectState = inject(ProjectStateService);
  private teamRequests = new Map<string, Promise<AssignmentTeamMember[]>>();

  private get activeProjectId(): string {
    const projectId = this.projectState.selectedProjectId();
    if (!projectId) throw new Error('No active project selected.');
    return projectId;
  }

  async getSuggestions(sprintId: string): Promise<AssignmentContext> {
    const { data } = await apiClient.get<any>(
      `/projects/${this.activeProjectId}/sprints/${sprintId}/assignment/suggestions`,
      { headers: { 'X-Skip-Loader': 'true' } }
    );
    return this.mapContext(data.data || data);
  }

  getAssignmentTeam(sprintId: string): Promise<AssignmentTeamMember[]> {
    const projectId = this.activeProjectId;
    const cacheKey = `${projectId}:${sprintId}`;
    const cached = this.teamRequests.get(cacheKey);
    if (cached) return cached;

    const request = apiClient
      .get<any>(
        `/projects/${projectId}/sprints/${sprintId}/assignment/team`,
        { headers: { 'X-Skip-Loader': 'true' } }
      )
      .then(({ data }) => (data.data || data || []).map((member: any) => ({
        employeeId: member.employeeId,
        fullName: member.fullName || '',
        jobTitle: member.jobTitle || ''
      })))
      .catch(error => {
        this.teamRequests.delete(cacheKey);
        throw error;
      });

    this.teamRequests.set(cacheKey, request);
    return request;
  }

  async assignTask(
    sprintId: string,
    taskId: string,
    employeeId: string | null,
    allowOverCapacity = false
  ): Promise<AssignTaskResult> {
    const { data } = await apiClient.patch<any>(
      `/projects/${this.activeProjectId}/sprints/${sprintId}/assignment/tasks/${taskId}`,
      { employeeId, allowOverCapacity }
    );
    const result = data.data || data;
    return { ...result, warnings: result.warnings || [] };
  }

  async confirm(sprintId: string, payload: ConfirmAssignmentsRequest): Promise<string[]> {
    const { data } = await apiClient.post<any>(
      `/projects/${this.activeProjectId}/sprints/${sprintId}/assignment/confirm`,
      payload
    );
    const result = data.data || data;
    return result.warnings || [];
  }

  private mapContext(rawDto: any): AssignmentContext {
    const weights: ScoringWeights = rawDto?.weights || {
      skillWeight: 40,
      availabilityWeight: 30,
      velocityWeight: 20,
      experienceWeight: 10
    };

    const suggestions: AssignmentSuggestion[] = (rawDto?.taskScores || []).map((taskScore: any) => ({
      taskId: taskScore.task.taskId,
      taskTitleEn: taskScore.task.titleEn,
      taskTitleAr: taskScore.task.titleAr,
      estimatedHours: Number(taskScore.task.estimatedHours || 0),
      priority: taskScore.task.priority,
      type: taskScore.task.type,
      assigneeId: taskScore.task.assigneeId || undefined,
      requiredSkills: (taskScore.task.requiredSkills || []).map((skill: any) => ({
        skillId: skill.skillId,
        skillName: skill.skillName
      })),
      isUnassignable: taskScore.isUnassignable,
      rankedDevelopers: (taskScore.rankedDevelopers || []).map((dev: any, index: number) =>
        this.mapDeveloper(dev, index)
      )
    }));

    return { suggestions, weights };
  }

  private mapDeveloper(dev: any, index: number): DeveloperSuggestion {
    const maxSprintHours = Number(dev.maxSprintHours || 0);
    const currentAssignedHours = Number(dev.currentAssignedHours || 0);
    const remainingAfter = Number(dev.remainingHours || 0);

    return {
      employeeId: dev.employeeId,
      employeeName: dev.fullName || '',
      jobTitle: dev.jobTitle,
      score: Number(Number(dev.finalScore || 0).toFixed(1)),
      rank: index + 1,
      skillScore: Number(dev.skillScore || 0),
      availabilityScore: Number(dev.availabilityScore || 0),
      velocityScore: Number(dev.velocityScore || 0),
      hasHistoricalData: Boolean(dev.hasHistoricalData),
      experienceScore: Number(dev.experienceScore || 0),
      matchedSkillsCount: Number(dev.matchedSkillsCount || 0),
      requiredSkillsCount: Number(dev.requiredSkillsCount || 0),
      skillGaps: dev.skillGaps || [],
      maxSprintHours,
      currentAssignedHours,
      nonEditableHours: Number(dev.nonEditableHours || 0),
      assignedBefore: currentAssignedHours,
      assignedAfter: Math.max(0, maxSprintHours - remainingAfter),
      remainingAfter,
      hasSufficientCapacity: Boolean(dev.hasSufficientCapacity)
    };
  }
}
