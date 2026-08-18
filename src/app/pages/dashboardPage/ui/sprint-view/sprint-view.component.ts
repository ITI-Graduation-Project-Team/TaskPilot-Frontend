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
          [currentPage]="currentPage()"
          [pageSize]="pageSize()"
          [totalItems]="totalItems()"
          (viewBoard)="onViewBoard($event)"
          (pageChange)="onPageChange($event)"
          (filtersChange)="onFiltersChange($event)">
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

  currentPage = signal(1);
  pageSize = signal(5);
  totalItems = signal(0);
  currentFilters = signal<{ status: string; dateFrom: string; dateTo: string }>({ status: 'All', dateFrom: '', dateTo: '' });

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

    this.route.queryParams.subscribe(params => {
      const querySprintId = params['sprintId'];
      const querySprintStatus = params['sprintStatus'];
      
      this.selectedSprintId.set(querySprintId || null);
      this.selectedSprintStatus.set(querySprintStatus || null);
    });
  }

  async loadSprints(): Promise<void> {
    const projectId = this.projectState.selectedProjectId();
    if (!projectId) return;
    this.isSprintsLoading.set(true);
    try {
      const filters = this.currentFilters();
      const pagedResult = await this.sprintService.getAllSprints(
        projectId, 
        this.currentPage(), 
        this.pageSize(),
        filters.status,
        filters.dateFrom,
        filters.dateTo
      );
      this.cachedSprints.set(pagedResult.items);
      this.totalItems.set(pagedResult.totalItems);
    } catch (e) {
      console.warn('Failed to load sprints', e);
      this.cachedSprints.set([]);
      this.totalItems.set(0);
    } finally {
      this.isSprintsLoading.set(false);
    }
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadSprints();
  }

  onFiltersChange(filters: { status: string; dateFrom: string; dateTo: string }): void {
    this.currentFilters.set(filters);
    this.currentPage.set(1);
    this.loadSprints();
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
