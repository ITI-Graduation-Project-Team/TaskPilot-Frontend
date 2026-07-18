const fs = require('fs');

const hubFile = 'src/app/pages/dashboardPage/ui/project-hub/project-hub.component.ts';
let lines = fs.readFileSync(hubFile, 'utf8').split('\n');

// 1. Update imports
const importIdx = lines.findIndex(l => l.includes('import { Component'));
if (importIdx !== -1) {
    lines[importIdx] = "import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';";
    lines.splice(importIdx + 1, 0, "import { Router } from '@angular/router';");
    lines.splice(importIdx + 2, 0, "import { ProjectStateService } from '../../../../shared/services/project-state.service';");
    lines.splice(importIdx + 3, 0, "import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';");
    lines.splice(importIdx + 4, 0, "import { ToastService } from '../../../../shared/services/toast.service';");
    lines.splice(importIdx + 5, 0, "import { apiClient } from '../../../../shared/api/axios.instance';");
}

// 2. Remove inputs/outputs and inject services
const classIdx = lines.findIndex(l => l.includes('export class ProjectHubComponent'));
const toRemove = ['projects = input.required', 'projectStatsMap = input.required', 'createProject = output', 'createProjectWithAi = output', 'selectSprint = output', 'selectBacklog = output', 'editProject = output', 'deleteProject = output', 'toggleProjectStatus = output'];

for (let i = classIdx; i < lines.length; i++) {
    for (const token of toRemove) {
        if (lines[i].includes(token)) {
            lines[i] = '';
        }
    }
}

// 3. Inject services
if (classIdx !== -1) {
    lines.splice(classIdx + 1, 0, `  public projectState = inject(ProjectStateService);
  private router = inject(Router);
  private confirmDialog = inject(ConfirmDialogService);
  private toastService = inject(ToastService);

  projectStatsMap = signal<Map<string, ProjectStats>>(new Map());
  
  constructor() {
    this.loadAllProjectStats();
  }`);
}

// 4. Update filteredProjects to use this.projectState.projects()
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('let result = this.projects();')) {
        lines[i] = lines[i].replace('this.projects()', 'this.projectState.projects()');
    }
}

// 5. Add methods
const closeBraceIdx = lines.findLastIndex(l => l.trim() === '}');
if (closeBraceIdx !== -1) {
    lines.splice(closeBraceIdx, 0, `
  onCreateProject() {
    this.router.navigate(['/dashboard', 'create-project']);
  }

  onCreateProjectWithAi() {
    // Navigate and pass query param to open AI modal
    this.router.navigate(['/dashboard', 'create-project'], { queryParams: { ai: 'true' } });
  }

  onSelectSprint(projectId: string) {
    this.projectState.setSelectedProject(projectId);
    this.router.navigate(['/dashboard', 'sprint']);
  }

  onSelectBacklog(projectId: string) {
    this.projectState.setSelectedProject(projectId);
    this.router.navigate(['/dashboard', 'backlog']);
  }

  onEditProject(projectId: string) {
    // The edit modal should ideally be moved here, but for now we emit or handle it.
    // Dashboard component currently handles it. If Dashboard doesn't get this event, it won't open.
    // For now we will implement it directly here if needed, or navigate to a dedicated route.
    console.warn('Edit Project not fully migrated to ProjectHubComponent yet');
  }

  async onDeleteProject(projectId: string) {
    const proj = this.projectState.projects().find(p => p.id === projectId);
    if (proj) {
      const confirmed = await this.confirmDialog.confirm({
        title: 'Delete Project',
        message: \`Are you sure you want to delete "\${proj.nameEn}"? This action cannot be undone.\`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        type: 'danger'
      });
      if (confirmed) {
        const success = await this.projectState.deleteProject(projectId);
        if (success) {
          this.toastService.show('Project deleted successfully', 'success');
          this.loadAllProjectStats();
        } else {
          this.toastService.show('Failed to delete project. Please try again.', 'error');
        }
      }
    }
  }

  onToggleProjectStatus(projectId: string) {
    console.warn('Toggle Project Status not fully migrated to ProjectHubComponent yet');
  }

  async loadAllProjectStats() {
    const projects = this.projectState.projects();
    if (!projects || projects.length === 0) return;

    const promises = projects.map(async (p) => {
      const stats: ProjectStats = {
        memberCount: 0,
        activeSprint: 'No Active Sprint',
        taskCount: 0
      };

      try {
        const [sprintRes, employeesRes, backlogRes] = await Promise.allSettled([
          apiClient.get(\`/api/SprintPlanning/\${p.id}/active\`),
          apiClient.get(\`/api/Project/\${p.id}/employees\`),
          apiClient.get(\`/api/Project/\${p.id}/backlog\`)
        ]);

        if (sprintRes.status === 'fulfilled' && sprintRes.value.data?.data) {
          const sprintData = sprintRes.value.data.data;
          stats.activeSprint = \`\${sprintData.titleEn || sprintData.title || ''} Active\`;
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
`);
}

// 6. Update template
for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].replace(/projects\(\)/g, 'projectState.projects()');
    lines[i] = lines[i].replace('createProject.emit()', 'onCreateProject()');
    lines[i] = lines[i].replace('createProjectWithAi.emit()', 'onCreateProjectWithAi()');
    lines[i] = lines[i].replace('selectSprint.emit($event)', 'onSelectSprint($event)');
    lines[i] = lines[i].replace('selectBacklog.emit($event)', 'onSelectBacklog($event)');
    lines[i] = lines[i].replace('editProject.emit($event)', 'onEditProject($event)');
    lines[i] = lines[i].replace('deleteProject.emit($event)', 'onDeleteProject($event)');
    lines[i] = lines[i].replace('toggleProjectStatus.emit($event)', 'onToggleProjectStatus($event)');
}

fs.writeFileSync(hubFile, lines.filter(l => l !== null).join('\n'));
