import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AssignmentSuggestion } from '../../../../../entities/assignment.entity';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListComponent {
  @Input() tasks: AssignmentSuggestion[] = [];
  @Input() selectedTaskId: string | null = null;
  @Input() localAssignments: { [taskId: string]: string } = {};

  @Output() taskSelected = new EventEmitter<string>();

  get currentLang(): string {
    return (this as any).translateService?.currentLang() || (typeof localStorage !== 'undefined' && localStorage.getItem('app_lang')) || 'en';
  }

  constructor(private translateService: TranslateService) {}

  searchQuery = signal('');
  filterTab = signal<'all' | 'unassigned' | 'assigned'>('all');
  currentPage = signal(1);
  pageSize = 5;

  filteredTasks(): AssignmentSuggestion[] {
    const q = this.searchQuery().trim().toLowerCase();
    const tab = this.filterTab();

    return this.tasks.filter(task => {
      const matchesSearch = !q || (task.taskTitleEn || task.taskTitleAr || '').toLowerCase().includes(q) ||
        (task.type || '').toLowerCase().includes(q) ||
        (task.priority || '').toLowerCase().includes(q);

      const isAssigned = !!this.localAssignments[task.taskId];
      const matchesTab = tab === 'all' || (tab === 'assigned' && isAssigned) || (tab === 'unassigned' && !isAssigned);

      return matchesSearch && matchesTab;
    });
  }

  paginatedTasks(): AssignmentSuggestion[] {
    const allFiltered = this.filteredTasks();
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return allFiltered.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredTasks().length / this.pageSize);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  onFilterChange(tab: 'all' | 'unassigned' | 'assigned') {
    this.filterTab.set(tab);
    this.currentPage.set(1);
  }

  onSearchChange(q: string) {
    this.searchQuery.set(q);
    this.currentPage.set(1);
  }

  selectTask(taskId: string) {
    this.taskSelected.emit(taskId);
  }

  getAssigneeName(task: AssignmentSuggestion): string {
    const empId = this.localAssignments[task.taskId];
    if (!empId) return 'Unassigned';
    
    const dev = task.rankedDevelopers?.find(d => d.employeeId === empId);
    return dev?.employeeName || 'Assigned';
  }

  getAssigneeInitials(task: AssignmentSuggestion): string {
    const name = this.getAssigneeName(task);
    if (!name || name === 'Unassigned') return '?';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }
}
