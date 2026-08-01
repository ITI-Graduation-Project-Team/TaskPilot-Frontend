import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { SprintPlanningService, SprintListItem } from '../../../../shared/api/sprint-planning.service';
import { SprintListComponent } from '../../../../features/sprintList/sprint-list.component';
import { BoardComponent } from '../../../../widgets/taskBoard/ui/board/board.component';

@Component({
  selector: 'app-sprint-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SprintListComponent, BoardComponent],
  template: `
    @if (selectedSprintId()) {
      <app-board 
        [overrideSprintId]="selectedSprintId()"
        [overrideSprintStatus]="selectedSprintStatus()"
        (backToSprints)="onBackToSprints()"
        (sprintStatusChanged)="onSprintStatusChanged()">
      </app-board>
    } @else {
      @if (projectState.selectedProjectId()) {
        <app-sprint-list
          [projectId]="projectState.selectedProjectId()!"
          [sprints]="cachedSprints()"
          [isLoading]="isSprintsLoading()"
          (viewBoard)="onViewBoard($event)">
        </app-sprint-list>
      } @else {
        <div class="flex items-center justify-center h-full text-text-secondary font-medium">
          Please select a project to view sprints.
        </div>
      }
    }
  `
})
export class SprintViewComponent {
  public projectState = inject(ProjectStateService);
  private sprintService = inject(SprintPlanningService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  selectedSprintId = signal<string | null>(null);
  selectedSprintStatus = signal<string | null>(null);
  cachedSprints = signal<SprintListItem[]>([]);
  isSprintsLoading = signal(true);

  constructor() {
    effect(() => {
      const projectId = this.projectState.selectedProjectId();
      if (projectId) {
        this.loadSprints();
      } else {
        this.cachedSprints.set([]);
        this.isSprintsLoading.set(false);
      }
    });

    const querySprintId = this.route.snapshot.queryParamMap.get('sprintId');
    const querySprintStatus = this.route.snapshot.queryParamMap.get('sprintStatus');
    if (querySprintId && querySprintStatus) {
      this.selectedSprintId.set(querySprintId);
      this.selectedSprintStatus.set(querySprintStatus);
    }
  }

  async loadSprints(): Promise<void> {
    const projectId = this.projectState.selectedProjectId();
    if (!projectId) return;
    this.isSprintsLoading.set(true);
    try {
      const sprints = await this.sprintService.getAllSprints(projectId);
      this.cachedSprints.set(sprints);
    } catch (e) {
      console.warn('Failed to load sprints', e);
      this.cachedSprints.set([]);
    } finally {
      this.isSprintsLoading.set(false);
    }
  }

  onViewBoard(event: { sprintId: string; sprintStatus: string }): void {
    this.selectedSprintId.set(event.sprintId);
    this.selectedSprintStatus.set(event.sprintStatus);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sprintId: event.sprintId, sprintStatus: event.sprintStatus },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  onBackToSprints(): void {
    this.selectedSprintId.set(null);
    this.selectedSprintStatus.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sprintId: null, sprintStatus: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    this.loadSprints();
  }

  async onSprintStatusChanged(): Promise<void> {
    await this.loadSprints();
    const currentId = this.selectedSprintId();
    if (currentId) {
      const updated = this.cachedSprints().find(s => s.sprintId === currentId);
      if (updated) {
        this.selectedSprintStatus.set(updated.status);
      }
    }
  }

}
