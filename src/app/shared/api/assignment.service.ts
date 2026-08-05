import { Injectable, inject } from '@angular/core';
import { apiClient } from './axios.instance';
import { ProjectStateService } from '../services/project-state.service';
import {
  AssignmentSuggestion,
  ExplainedAssignmentDto,
  ConfirmAssignmentsRequest
} from '../../entities/assignment.entity';

@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private projectState = inject(ProjectStateService);

  private get activeProjectId(): string {
    const projectId = this.projectState.selectedProjectId();
    if (!projectId) throw new Error('No active project selected.');
    return projectId;
  }

  async getSuggestions(sprintId: string): Promise<AssignmentSuggestion[]> {
    const projectId = this.activeProjectId;
    const { data } = await apiClient.get<any>(`/projects/${projectId}/sprints/${sprintId}/assignment/suggestions`);
    const rawDto: ExplainedAssignmentDto = data.data || data;

    if (!rawDto || !rawDto.taskScores) {
      return [];
    }

    return rawDto.taskScores.map(taskScore => ({
      taskId: taskScore.task.taskId,
      taskTitleEn: taskScore.task.titleEn,
      taskTitleAr: taskScore.task.titleAr,
      estimatedHours: taskScore.task.estimatedHours,
      priority: taskScore.task.priority,
      type: taskScore.task.type,
      assigneeId: taskScore.task.assigneeId,
      requiredSkills: (taskScore.task.requiredSkills || []).map(s => ({
        skillId: s.skillId,
        skillNameEn: s.skillNameEn,
        skillNameAr: s.skillNameAr,
      })),
      rankedDevelopers: (taskScore.rankedDevelopers || []).slice(0, 3).map((dev, index) => ({
        employeeId: dev.employeeId,
        employeeName: dev.fullName || '', // Enriched from backend if available, or handled in component
        score: Math.round(dev.finalScore),
        reasonEn: dev.reasonEn,
        reasonAr: dev.reasonAr,
        rank: index + 1,
      })),
    }));
  }

  async confirm(sprintId: string, payload: ConfirmAssignmentsRequest): Promise<void> {
    const projectId = this.activeProjectId;
    await apiClient.post<any>(`/projects/${projectId}/sprints/${sprintId}/assignment/confirm`, payload);
  }

}
