import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SprintPlanningService } from '../../shared/api/sprint-planning.service';
import { ToastService } from '../../shared/services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-planned-sprint-assignment-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './planned-sprint-assignment-dialog.html'
})
export class PlannedSprintAssignmentDialogComponent {
  @Input() isOpen = false;
  @Input() projectId: string | null = null;
  @Input() sprintNames: string[] = [];
  @Input() sprintIds: string[] = [];
  @Input() sprintProjectIds: string[] = [];
  @Input() mode: 'assign' | 'remove' | 'reactivate' = 'assign';
  @Input() employeeName: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() actionCompleted = new EventEmitter<void>();

  private sprintPlanningService = inject(SprintPlanningService);
  private toastService = inject(ToastService);
  private translateService = inject(TranslateService);
  private router = inject(Router);

  selectedAction: 'cancelAndReplan' | 'cancelOnly' | 'ignore' = 'cancelAndReplan';
  isExecuting = signal<boolean>(false);

  closeDialog() {
    this.close.emit();
  }

  async confirm() {
    // If we are just ignoring, we don't need project IDs
    if (this.selectedAction === 'ignore') {
      this.closeDialog();
      return;
    }

    if (!this.projectId && (!this.sprintProjectIds || this.sprintProjectIds.length === 0)) {
      console.warn("No projectId or sprintProjectIds provided, cannot cancel sprints.");
      return;
    }

    try {
      this.isExecuting.set(true);

      // Handle "Cancel" cases
      if (this.selectedAction === 'cancelAndReplan' || this.selectedAction === 'cancelOnly') {
        const cancelPromises = this.sprintIds.map((sprintId, i) => {
          const targetProjectId = this.projectId || (this.sprintProjectIds && this.sprintProjectIds[i]);
          if (!targetProjectId) return Promise.resolve();
          
          return this.sprintPlanningService.cancelSprint(targetProjectId, sprintId).catch(err => {
            console.error('Failed to cancel sprint', sprintId, err);
          });
        });

        await Promise.all(cancelPromises);
        
        if (this.selectedAction === 'cancelAndReplan') {
          this.toastService.show(this.translateService.instant('DEACTIVATION.SUCCESS_REPLAN'), 'success');
          this.actionCompleted.emit();
          // If we have a single project, navigate to it. Otherwise, just navigate to the general planning route or dashboard
          if (this.projectId) {
             this.router.navigate([`/dashboard/sprint-planning`], { queryParams: { autoReplan: true } });
          } else {
             // For Reactivation (multiple projects), they can visit sprint planning on their own
             this.router.navigate([`/dashboard/sprint-planning`]);
          }
          return;
        } else {
          this.toastService.show(this.mode === 'assign' ? this.translateService.instant('TEAM.MEMBER_ADDED_SUCCESS') : (this.mode === 'reactivate' ? this.translateService.instant('EMPLOYEES.SUCCESS_REACTIVATE') : this.translateService.instant('TEAM.REMOVED_SUCCESS')), 'success');
        }
      } else {
        // Ignore (just close)
        this.toastService.show(this.mode === 'assign' ? this.translateService.instant('TEAM.MEMBER_ADDED_SUCCESS') : this.translateService.instant('TEAM.REMOVED_SUCCESS'), 'success');
      }

      this.actionCompleted.emit();
      this.closeDialog();
    } catch (e: any) {
      console.error(e);
      this.toastService.show(this.translateService.instant('COMMON.ERROR'), 'error');
    } finally {
      this.isExecuting.set(false);
    }
  }
}
