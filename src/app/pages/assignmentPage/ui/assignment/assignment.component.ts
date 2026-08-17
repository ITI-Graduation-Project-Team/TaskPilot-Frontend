import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskListComponent } from './task-list/task-list.component';
import { EmployeeSelectorComponent } from './employee-selector/employee-selector.component';
import { AssignmentService } from '../../../../shared/api/assignment.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { AssignmentSuggestion, DeveloperSuggestion, ScoringWeights } from '../../../../entities/assignment.entity';

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
  readonly weights = signal<ScoringWeights>({
    skillWeight: 40,
    availabilityWeight: 30,
    velocityWeight: 20,
    experienceWeight: 10
  });
  readonly selectedTaskId = signal<string | null>(null);
  readonly localAssignments = signal<{ [taskId: string]: string }>({});

  readonly dynamicSuggestions = computed(() =>
    this.calculateDynamicSuggestions(this.localAssignments())
  );
  
  readonly isLoadingPage = signal<boolean>(true);
  readonly isConfirming = signal<boolean>(false);
  sprintId: string = '';

  // Confirm Modal state
  showOverCapacityModal = signal<boolean>(false);
  overCapacityDevsForModal = signal<{ name: string, assigned: number, capacity: number }[]>([]);

  // Derived Metrics & State
  readonly totalTasksCount = computed(() => this.suggestions().length);
  readonly assignedCount = computed(() => Object.keys(this.localAssignments()).length);
  readonly unassignedCount = computed(() => Math.max(0, this.totalTasksCount() - this.assignedCount()));
  readonly completionPercentage = computed(() => {
    const total = this.totalTasksCount();
    return total > 0 ? Math.round((this.assignedCount() / total) * 100) : 0;
  });

  readonly canConfirm = computed(() => {
    return this.changedAssignments().length > 0 && !this.isConfirming();
  });

  readonly changedAssignments = computed(() => this.suggestions()
    .filter(task => (task.assigneeId || null) !== (this.localAssignments()[task.taskId] || null))
    .map(task => ({
      taskId: task.taskId,
      employeeId: this.localAssignments()[task.taskId] || null
    }))
  );

  readonly selectedTask = computed(() => {
    const taskId = this.selectedTaskId();
    if (!taskId) return null;
    return this.dynamicSuggestions().find(t => t.taskId === taskId) || null;
  });

  readonly currentAssigneeId = computed(() => {
    const taskId = this.selectedTaskId();
    if (!taskId) return null;
    return this.localAssignments()[taskId] || null;
  });

  // Track each developer's starting capacity from the suggestions
  readonly developerInitialCapacities = computed(() => {
    const capacities: { [empId: string]: { name: string, capacity: number, baseAssigned: number } } = {};
    for (const task of this.dynamicSuggestions()) {
      for (const dev of task.rankedDevelopers) {
        if (!capacities[dev.employeeId]) {
          capacities[dev.employeeId] = { 
            name: dev.employeeName, 
            capacity: dev.maxSprintHours,
            baseAssigned: dev.nonEditableHours
          };
        }
      }
    }
    return capacities;
  });

  // Calculate live assigned hours per developer based on localAssignments
  readonly developerAssignedHours = computed(() => {
    const assigned: { [empId: string]: number } = {};
    const assignments = this.localAssignments();
    for (const task of this.suggestions()) {
      const empId = assignments[task.taskId];
      if (empId) {
        assigned[empId] = (assigned[empId] || 0) + task.estimatedHours;
      }
    }
    return assigned;
  });

  // Combine initial capacity with live assigned hours
  readonly developerRemainingHours = computed(() => {
    const initial = this.developerInitialCapacities();
    const assigned = this.developerAssignedHours();
    const remaining: { [empId: string]: { name: string, assigned: number, capacity: number, remaining: number } } = {};
    
    for (const empId in initial) {
      const cap = initial[empId].capacity;
      const baseAssigned = initial[empId].baseAssigned;
      const localAss = assigned[empId] || 0;
      const totalAssigned = baseAssigned + localAss;
      
      remaining[empId] = {
        name: initial[empId].name,
        assigned: totalAssigned,
        capacity: cap,
        remaining: cap - totalAssigned
      };
    }
    return remaining;
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
      const context = await this.assignmentService.getSuggestions(this.sprintId);
      const suggestionsData = context.suggestions;
      this.weights.set(context.weights);
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
      if (!newAssignments[task.taskId]) {
        const dynamicTask = this.calculateDynamicSuggestions(newAssignments)
          .find(candidateTask => candidateTask.taskId === task.taskId);
        const topDev = dynamicTask?.rankedDevelopers.find(d => d.hasSufficientCapacity)
          || dynamicTask?.rankedDevelopers[0];
        if (topDev) {
          newAssignments[task.taskId] = topDev.employeeId;
          countAdded++;
        }
      }
    }

    this.localAssignments.set(newAssignments);
    if (countAdded > 0) {
      this.toastService.show(`Auto-assigned ${countAdded} task(s) using the current scores and capacity.`, 'success');
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

  onConfirmClick() {
    if (!this.canConfirm()) return;

    // Check for over-capacity developers
    const remaining = this.developerRemainingHours();
    const overCapacity = Object.values(remaining).filter(d => d.remaining < 0);

    if (overCapacity.length > 0) {
      this.overCapacityDevsForModal.set(overCapacity.map(d => ({ name: d.name, assigned: d.assigned, capacity: d.capacity })));
      this.showOverCapacityModal.set(true);
    } else {
      this.confirmAssignments(false);
    }
  }

  cancelOverCapacityModal() {
    this.showOverCapacityModal.set(false);
  }

  proceedWithOverCapacity() {
    this.showOverCapacityModal.set(false);
    this.confirmAssignments(true);
  }

  async confirmAssignments(allowOverCapacity = false) {
    if (!this.canConfirm()) return;

    try {
      this.isConfirming.set(true);
      
      const assignmentsPayload = this.changedAssignments();

      const warnings = await this.assignmentService.confirm(this.sprintId, {
        assignments: assignmentsPayload,
        allowOverCapacity
      });
      
      if (warnings && warnings.length > 0) {
        warnings.forEach((w: string) => this.toastService.show(w, 'warning'));
        this.toastService.show(this.currentLang === 'ar' ? 'تم الحفظ، لكن مع وجود تحذيرات سعة استيعابية بسبب تحديثات متزامنة.' : 'Assignments saved, but with capacity warnings (likely due to concurrent updates).', 'warning');
      } else {
        this.toastService.show(this.currentLang === 'ar' ? 'تم تأكيد التعيينات بنجاح!' : 'Assignments confirmed successfully!', 'success');
      }
      
      this.goBackToDashboard();
      
    } catch (error: any) {
      this.toastService.show(error.message || 'Failed to confirm assignments', 'error');
      this.isConfirming.set(false);
    }
  }

  private calculateDynamicSuggestions(assignments: { [taskId: string]: string }): AssignmentSuggestion[] {
    const baseSuggestions = this.suggestions();
    const weights = this.weights();
    const developerInfo = new Map<string, DeveloperSuggestion>();

    for (const task of baseSuggestions) {
      for (const developer of task.rankedDevelopers) {
        if (!developerInfo.has(developer.employeeId)) {
          developerInfo.set(developer.employeeId, developer);
        }
      }
    }

    const assignedHours = new Map<string, number>();
    for (const developer of developerInfo.values()) {
      assignedHours.set(developer.employeeId, developer.nonEditableHours);
    }
    for (const task of baseSuggestions) {
      const employeeId = assignments[task.taskId];
      if (employeeId) {
        assignedHours.set(employeeId, (assignedHours.get(employeeId) || 0) + task.estimatedHours);
      }
    }

    return baseSuggestions.map(task => {
      const rankedDevelopers = task.rankedDevelopers.map(developer => {
        const taskAlreadyAssignedToDeveloper = assignments[task.taskId] === developer.employeeId;
        const assignedBefore = Math.max(
          developer.nonEditableHours,
          (assignedHours.get(developer.employeeId) || 0) - (taskAlreadyAssignedToDeveloper ? task.estimatedHours : 0)
        );
        const assignedAfter = assignedBefore + task.estimatedHours;
        const remainingAfter = developer.maxSprintHours - assignedAfter;
        const availabilityScore = developer.maxSprintHours > 0
          ? Math.max(0, Math.min(100, (remainingAfter / developer.maxSprintHours) * 100))
          : 0;
        const score = (
          developer.skillScore * weights.skillWeight +
          availabilityScore * weights.availabilityWeight +
          developer.velocityScore * weights.velocityWeight +
          developer.experienceScore * weights.experienceWeight
        ) / 100;

        return {
          ...developer,
          score: Number(score.toFixed(1)),
          availabilityScore: Number(availabilityScore.toFixed(1)),
          assignedBefore,
          assignedAfter,
          remainingAfter,
          hasSufficientCapacity: remainingAfter >= 0
        };
      })
        .sort((a, b) => b.score - a.score || b.remainingAfter - a.remainingAfter)
        .map((developer, index) => ({ ...developer, rank: index + 1 }));

      return {
        ...task,
        rankedDevelopers,
        isUnassignable: rankedDevelopers.length === 0
      };
    });
  }
}
