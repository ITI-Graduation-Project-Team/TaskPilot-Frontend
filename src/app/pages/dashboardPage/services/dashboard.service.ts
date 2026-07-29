import { Injectable, signal, inject } from '@angular/core';
import { ProjectStateService } from '../../../shared/services/project-state.service';
import { apiClient } from '../../../shared/api/axios.instance';
import { ProjectStats } from '../ui/project-card/project-card.component';
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  isAiChatOpen = signal(false);
  isEditProjectModalOpen = signal(false);
  selectedEditProjectId = signal<string | null>(null);

  isHistoryModalOpen = signal(false);
  selectedHistoryProject = signal<{ id: string, nameEn: string, nameAr?: string, status: string } | null>(null);

  isTechStackAdvisorOpen = signal(false);
  advisorProjectId = signal<string | null>(null);
  
  isDraftReviewOpen = signal(false);

  projectStatsMap = signal<Map<string, ProjectStats>>(new Map());

  private projectState = inject(ProjectStateService);

  async loadAllProjectStats() {
    const projects = this.projectState.projects();
    const currentMap = new Map(this.projectStatsMap());

    let updated = false;
    for (const p of projects) {
      if (!currentMap.has(p.id)) {
        currentMap.set(p.id, { activeSprint: 'Loading...', memberCount: 0, taskCount: 0, loading: true });
        updated = true;
      }
    }
    if (updated) {
      this.projectStatsMap.set(currentMap);
    }

    const promises = projects.map(async (p) => {
      const stats: ProjectStats = { activeSprint: 'No Active Sprint', memberCount: 0, taskCount: 0, loading: false };
      try {
        const [sprintRes, employeesRes, backlogRes] = await Promise.allSettled([
          apiClient.get<any>(`/projects/${p.id}/sprints/active`),
          apiClient.get<any>(`/projects/${p.id}/employees`),
          apiClient.get<any>(`/projects/${p.id}/backlog`)
        ]);

        if (sprintRes.status === 'fulfilled' && sprintRes.value.data?.data) {
          const sprintData = sprintRes.value.data.data;
          stats.activeSprint = `${sprintData.titleEn || sprintData.title || ''} Active`;
        }
        if (employeesRes.status === 'fulfilled' && employeesRes.value.data?.data) {
          stats.memberCount = employeesRes.value.data.data.length || 0;
        }
        if (backlogRes.status === 'fulfilled' && backlogRes.value.data?.data) {
          const stories = backlogRes.value.data.data.userStories || [];
          let totalTasks = 0;
          for (const story of stories) {
            totalTasks += (story.tasks || []).length;
          }
          stats.taskCount = totalTasks;
        }
      } catch (err) {
        console.warn('Failed to load stats for project:', p.id, err);
      }
      return { id: p.id, stats };
    });

    const results = await Promise.all(promises);
    const newMap = new Map(this.projectStatsMap());
    for (const res of results) {
      newMap.set(res.id, res.stats);
    }
    this.projectStatsMap.set(newMap);
  }

  openAiProjectFlow() {
    this.isAiChatOpen.set(true);
  }

  openEditProjectModal(projectId: string) {
    this.selectedEditProjectId.set(projectId);
    this.isEditProjectModalOpen.set(true);
  }

  openProjectHistoryModal(project: { id: string, nameEn: string, nameAr?: string, status: string }) {
    this.selectedHistoryProject.set(project);
    this.isHistoryModalOpen.set(true);
  }
}
