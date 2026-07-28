import { Component, OnInit, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SprintPlanningService, SprintListItem } from '../../shared/api/sprint-planning.service';
import { ProjectStateService } from '../../shared/services/project-state.service';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-sprint-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './sprint-list.component.html'
})
export class SprintListComponent implements OnInit {
  @Input() projectId: string = '';
  @Input() set sprints(value: SprintListItem[]) {
    this._sprints.set(value);
  }
  @Input() set isLoading(value: boolean) {
    this._isLoading.set(value);
  }
  @Output() viewBoard = new EventEmitter<{ sprintId: string; sprintStatus: string }>();

  sprintService = inject(SprintPlanningService);
  projectState = inject(ProjectStateService);

  private _sprints = signal<SprintListItem[]>([]);
  _isLoading = signal<boolean>(true);
  
  filterStatus = signal<string>('All');
  filterDateFrom = signal<string>('');
  filterDateTo = signal<string>('');

  filteredSprints = computed(() => {
    let result = this._sprints();
    
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

  ngOnInit() {
    // No longer fetching internally. Handled by DashboardComponent.
  }

  onViewBoard(event: Event, sprint: SprintListItem) {
    event.stopPropagation();
    this.viewBoard.emit({ sprintId: sprint.sprintId, sprintStatus: sprint.status });
  }
}
