import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskListComponent } from './task-list/task-list.component';
import { EmployeeSelectorComponent } from './employee-selector/employee-selector.component';
import { AssignmentService } from '../../../../shared/api/assignment.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
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
  private translateService = inject(TranslateService);

  get currentLang(): string {
    return this.translateService.currentLang() || 'en';
  }

  // State Signals
  readonly suggestions = signal<AssignmentSuggestion[]>([]);
  readonly selectedTaskId = signal<string | null>(null);
  readonly localAssignments = signal<{ [taskId: string]: string }>({});
  
  readonly isLoadingPage = signal<boolean>(true);
  readonly isConfirming = signal<boolean>(false);
  sprintId: string = '';

  // Derived Metrics & State
  readonly totalTasksCount = computed(() => this.suggestions().length);
  readonly assignedCount = computed(() => Object.keys(this.localAssignments()).length);
  readonly unassignedCount = computed(() => Math.max(0, this.totalTasksCount() - this.assignedCount()));
  readonly completionPercentage = computed(() => {
    const total = this.totalTasksCount();
    return total > 0 ? Math.round((this.assignedCount() / total) * 100) : 0;
  });

  readonly canConfirm = computed(() => {
    return this.assignedCount() > 0 && !this.isConfirming();
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

      // Auto-select first task if available
      if (suggestionsData.length > 0) {
        this.selectedTaskId.set(suggestionsData[0].taskId);
      }

      // Initialize local assignments with existing assignments
      const initialAssignments: { [taskId: string]: string } = {};
      suggestionsData.forEach(task => {
        if (task.assigneeId) {
          initialAssignments[task.taskId] = task.assigneeId;
        }
      });
      this.localAssignments.set(initialAssignments);

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

  autoAssignTopMatches() {
    const newAssignments = { ...this.localAssignments() };
    let countAdded = 0;

    for (const task of this.suggestions()) {
      if (!newAssignments[task.taskId] && task.rankedDevelopers && task.rankedDevelopers.length > 0) {
        const topDev = task.rankedDevelopers.find(d => d.rank === 1) || task.rankedDevelopers[0];
        if (topDev) {
          newAssignments[task.taskId] = topDev.employeeId;
          countAdded++;
        }
      }
    }

    this.localAssignments.set(newAssignments);
    if (countAdded > 0) {
      this.toastService.show(`Auto-assigned ${countAdded} task(s) to top AI matched candidates!`, 'success');
    } else {
      this.toastService.show('All tasks are already assigned.', 'info');
    }
  }

  goBackToDashboard() {
    this.router.navigate(['/dashboard/sprint'], {
      queryParams: {
        sprintId: this.sprintId,
        sprintStatus: 'Planned'
      }
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
      
      this.toastService.show('Assignments confirmed successfully!', 'success');
      
      this.goBackToDashboard();
      
    } catch (error: any) {
      this.toastService.show(error.message || 'Failed to confirm assignments', 'error');
      this.isConfirming.set(false);
    }
  }
}
