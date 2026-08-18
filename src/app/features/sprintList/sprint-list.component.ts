import { Component, OnInit, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SprintPlanningService, SprintListItem } from '../../shared/api/sprint-planning.service';
import { ProjectStateService } from '../../shared/services/project-state.service';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PaginationComponent } from '../../shared/ui/pagination/pagination.component';

@Component({
  selector: 'app-sprint-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, PaginationComponent],
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
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 10;
  @Input() totalItems: number = 0;
  
  @Output() viewBoard = new EventEmitter<{ sprintId: string; sprintStatus: string }>();
  @Output() filtersChange = new EventEmitter<{ status: string; dateFrom: string; dateTo: string }>();
  @Output() pageChange = new EventEmitter<number>();

  sprintService = inject(SprintPlanningService);
  projectState = inject(ProjectStateService);
  translate = inject(TranslateService);

  _sprints = signal<SprintListItem[]>([]);
  _isLoading = signal<boolean>(true);
  
  get currentLang() {
    return this.translate.currentLang() || 'en';
  }

  getSprintTitle(sprint: SprintListItem): string {
    if (this.currentLang === 'ar') {
      const title = sprint.titleAr || sprint.titleEn || '';
      return title.replace(/Sprint/g, 'السبرينت');
    }
    return sprint.titleEn || '';
  }

  getSprintGoal(sprint: SprintListItem): string | undefined {
    return this.currentLang === 'ar' ? (sprint.sprintGoalAr || sprint.sprintGoalEn) : sprint.sprintGoalEn;
  }
  private _filterStatus = 'All';
  private _filterDateFrom = '';
  private _filterDateTo = '';

  get filterStatus() { return this._filterStatus; }
  set filterStatus(val: string) { 
    this._filterStatus = val; 
    this.emitFilters(); 
  }

  get filterDateFrom() { return this._filterDateFrom; }
  set filterDateFrom(val: string) { 
    this._filterDateFrom = val; 
    this.emitFilters(); 
  }

  get filterDateTo() { return this._filterDateTo; }
  set filterDateTo(val: string) { 
    this._filterDateTo = val; 
    this.emitFilters(); 
  }

  private emitFilters() {
    this.filtersChange.emit({
      status: this._filterStatus,
      dateFrom: this._filterDateFrom,
      dateTo: this._filterDateTo
    });
  }

  onPageChange(newPage: number) {
    this.pageChange.emit(newPage);
  }

  ngOnInit() {
    // Handled by SprintViewComponent
  }

  onViewBoard(event: Event, sprint: SprintListItem) {
    event.stopPropagation();
    this.viewBoard.emit({ sprintId: sprint.sprintId, sprintStatus: sprint.status });
  }
}
