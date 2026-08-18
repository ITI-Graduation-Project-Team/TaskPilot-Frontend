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
  @Input() devCapacities: { [empId: string]: { name: string, assigned: number, capacity: number, remaining: number } } = {};

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

  getFitTextClass(score: number): string {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  }

  getFitLabel(score: number): string {
    if (this.lang === 'ar') {
      if (score >= 80) return 'ملاءمة قوية';
      if (score >= 60) return 'ملاءمة جيدة';
      return 'ملاءمة محدودة';
    }
    if (score >= 80) return 'Strong fit';
    if (score >= 60) return 'Good fit';
    return 'Limited fit';
  }

  getCapacityPercent(dev: DeveloperSuggestion): number {
    if (!dev.maxSprintHours || dev.maxSprintHours <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((dev.assignedAfter / dev.maxSprintHours) * 100)));
  }

  getCapacityBarClass(dev: DeveloperSuggestion): string {
    if (dev.remainingAfter < 0) return 'bg-rose-500';
    const percent = this.getCapacityPercent(dev);
    if (percent >= 90) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  getTaskAddedHours(dev: DeveloperSuggestion): number {
    return Math.round((dev.assignedAfter - dev.assignedBefore) * 10) / 10;
  }

  getCloseMatchText(dev: DeveloperSuggestion): string | null {
    if (!this.selectedTask || !this.selectedTask.rankedDevelopers || this.selectedTask.rankedDevelopers.length === 0) {
      return null;
    }
    
    // Ranked list is ordered by score descending. So index 0 is rank #1
    const topDev = this.selectedTask.rankedDevelopers[0];
    
    // Don't show this badge for the #1 developer themselves
    if (dev.employeeId === topDev.employeeId) {
      return null;
    }
    
    const scoreDiff = Math.abs(topDev.score - dev.score);
    if (scoreDiff <= 2.0) {
      return this.lang === 'ar' 
        ? `تطابق متقارب (يتعادل مع ${topDev.employeeName})`
        : `Close Match (tied with ${topDev.employeeName})`;
    }
    
    return null;
  }
}
