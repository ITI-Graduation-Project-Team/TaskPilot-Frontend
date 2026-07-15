import { Component, OnInit, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SprintPlanningService, SprintListItem } from '../../shared/api/sprint-planning.service';
import { ProjectStateService } from '../../shared/services/project-state.service';

@Component({
  selector: 'app-sprint-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sprint-list.component.html'
})
export class SprintListComponent implements OnInit {
  @Input() projectId: string = '';
  @Output() viewBoard = new EventEmitter<{ sprintId: string; sprintStatus: string }>();

  sprintService = inject(SprintPlanningService);
  projectState = inject(ProjectStateService);

  sprints = signal<SprintListItem[]>([]);
  isLoading = signal<boolean>(true);
  filterStatus = signal<string>('All');
  filterDateFrom = signal<string>('');
  filterDateTo = signal<string>('');

  filteredSprints = computed(() => {
    let result = this.sprints();
    
    if (this.filterStatus() !== 'All') {
      result = result.filter(s => s.status === this.filterStatus());
    }
    
    if (this.filterDateFrom()) {
      const fromDate = new Date(this.filterDateFrom());
      result = result.filter(s => new Date(s.startDate) >= fromDate);
    }
    
    if (this.filterDateTo()) {
      const toDate = new Date(this.filterDateTo());
      result = result.filter(s => new Date(s.endDate) <= toDate);
    }
    
    return result;
  });

  async ngOnInit() {
    if (this.projectId) {
      this.isLoading.set(true);
      const data = await this.sprintService.getAllSprints(this.projectId);
      this.sprints.set(data);
      this.isLoading.set(false);
    }
  }

  onViewBoard(event: Event, sprint: SprintListItem) {
    event.stopPropagation();
    this.viewBoard.emit({ sprintId: sprint.sprintId, sprintStatus: sprint.status });
  }
}
