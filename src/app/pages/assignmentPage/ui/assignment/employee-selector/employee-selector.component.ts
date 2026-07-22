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
    if (this.selectedTask) {
      if (this.isAssigned(dev)) {
        // Unassign candidate if already assigned
        this.assignEmployee.emit({
          taskId: this.selectedTask.taskId,
          employeeId: ''
        });
      } else {
        // Assign candidate
        this.assignEmployee.emit({
          taskId: this.selectedTask.taskId,
          employeeId: dev.employeeId
        });
      }
    }
  }

  getDevInitials(name: string): string {
    if (!name) return 'DEV';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  getScoreColorClass(score: number): string {
    if (score >= 80) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  }
}
