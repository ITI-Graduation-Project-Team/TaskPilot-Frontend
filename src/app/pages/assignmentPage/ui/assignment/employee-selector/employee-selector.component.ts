import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AssignmentSuggestion, DeveloperSuggestion } from '../../../../../entities/assignment.entity';

@Component({
  selector: 'app-employee-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-selector.component.html',
  styleUrls: ['./employee-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeSelectorComponent {
  @Input() selectedTask: AssignmentSuggestion | null = null;
  @Input() currentAssigneeId: string | null = null;

  @Output() assignEmployee = new EventEmitter<{taskId: string, employeeId: string}>();

  get lang(): string {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('app_lang')) || 'en';
  }

  isAssigned(dev: DeveloperSuggestion): boolean {
    return this.currentAssigneeId === dev.employeeId;
  }

  onAssign(dev: DeveloperSuggestion) {
    if (this.selectedTask && !this.isAssigned(dev)) {
      this.assignEmployee.emit({
        taskId: this.selectedTask.taskId,
        employeeId: dev.employeeId
      });
    }
  }

  getScoreColorClass(score: number): string {
    if (score >= 80) return 'text-success-base';
    if (score >= 60) return 'text-warning-base';
    return 'text-error-base';
  }
}
