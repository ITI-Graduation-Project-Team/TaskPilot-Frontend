import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssignmentSuggestion } from '../../../../../entities/assignment.entity';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListComponent {
  @Input() tasks: AssignmentSuggestion[] = [];
  @Input() selectedTaskId: string | null = null;
  @Input() localAssignments: { [taskId: string]: string } = {};

  @Output() taskSelected = new EventEmitter<string>();

  selectTask(taskId: string) {
    this.taskSelected.emit(taskId);
  }

  getAssigneeName(task: AssignmentSuggestion): string {
    const empId = this.localAssignments[task.taskId];
    if (!empId) return 'Unassigned';
    
    // Look up developer name in the rankedDevelopers list
    const dev = task.rankedDevelopers.find(d => d.employeeId === empId);
    return dev?.employeeName || empId; // Fallback to ID if somehow not in top 3
  }
}
