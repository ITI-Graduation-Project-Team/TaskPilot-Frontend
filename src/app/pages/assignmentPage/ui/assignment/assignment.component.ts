import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskListComponent } from './task-list/task-list.component';
import { EmployeeSelectorComponent } from './employee-selector/employee-selector.component';
import { AssignmentService } from '../../../../shared/api/assignment.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { AssignmentSuggestion } from '../../../../entities/assignment.entity';

@Component({
  selector: 'app-assignment',
  standalone: true,
  imports: [
    CommonModule, 
    TaskListComponent, 
    EmployeeSelectorComponent
  ],
  templateUrl: './assignment.component.html',
  styleUrls: ['./assignment.component.scss']
})
export class AssignmentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private assignmentService = inject(AssignmentService);
  private toastService = inject(ToastService);

  // State Signals
  readonly suggestions = signal<AssignmentSuggestion[]>([]);
  readonly selectedTaskId = signal<string | null>(null);
  readonly localAssignments = signal<{ [taskId: string]: string }>({});
  
  readonly isLoadingPage = signal<boolean>(true);
  readonly isConfirming = signal<boolean>(false);
  sprintId: string = '';

  // Derived State
  readonly canConfirm = computed(() => {
    return Object.keys(this.localAssignments()).length > 0 && !this.isConfirming();
  });

  readonly selectedTask = computed(() => {
    const taskId = this.selectedTaskId();
    if (!taskId) return null;
    return this.suggestions().find(t => t.taskId === taskId) || null;
  });

  readonly currentAssigneeId = computed(() => {
    const taskId = this.selectedTaskId();
    if (!taskId) return null;
    return this.localAssignments()[taskId] || null;
  });

  async ngOnInit() {
    this.sprintId = this.route.snapshot.paramMap.get('sprintId') || '';
    if (!this.sprintId) {
      this.toastService.show('Invalid Sprint ID', 'error');
      this.router.navigate(['/dashboard']);
      return;
    }

    try {
      this.isLoadingPage.set(true);

      // Load suggestions
      const suggestionsData = await this.assignmentService.getSuggestions(this.sprintId);
      this.suggestions.set(suggestionsData);

      // Suggestions are display-only. We do not auto-populate localAssignments.
      // The user must manually select assignments.
      this.localAssignments.set({});

    } catch (error: any) {
      this.toastService.show(error.message || 'Failed to load assignment data', 'error');
    } finally {
      this.isLoadingPage.set(false);
    }
  }

  onTaskSelected(taskId: string) {
    this.selectedTaskId.set(taskId);
  }

  onAssignEmployee(event: { taskId: string, employeeId: string }) {
    // Update local state ONLY
    this.localAssignments.update(current => {
      const updated = { ...current };
      if (event.employeeId) {
        updated[event.taskId] = event.employeeId;
      } else {
        delete updated[event.taskId];
      }
      return updated;
    });
  }

  async confirmAssignments() {
    if (!this.canConfirm()) return;

    try {
      this.isConfirming.set(true);
      
      const assignmentsPayload = Object.entries(this.localAssignments()).map(
        ([taskId, employeeId]) => ({ taskId, employeeId })
      );

      await this.assignmentService.confirm(this.sprintId, {
        assignments: assignmentsPayload
      });
      
      this.toastService.show('Assignments confirmed. Tasks are ready to be started.', 'success');
      
      // Navigate back to sprint board
      this.router.navigate(['/dashboard'], {
        queryParams: {
          sprintId: this.sprintId,
          sprintStatus: 'Planned'
        }
      });
      
    } catch (error: any) {
      this.toastService.show(error.message || 'Failed to confirm assignments', 'error');
      this.isConfirming.set(false);
    }
  }
}
