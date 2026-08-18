import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AssignmentTeamMember, AssignTaskResult } from '../../entities/assignment.entity';
import { AssignmentService } from '../../shared/api/assignment.service';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
import { ToastService } from '../../shared/services/toast.service';

export interface TaskAssignmentChangedEvent {
  employeeId?: string;
  employeeName?: string;
}

@Component({
  selector: 'app-task-assignee-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  host: {
    class: 'block min-w-0 max-w-full'
  },
  template: `
    <div class="relative min-w-0 max-w-full" (click)="$event.stopPropagation()">
      <button #triggerButton type="button" (click)="toggle()" [disabled]="saving()"
        class="flex min-w-0 max-w-full items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-wait disabled:opacity-60"
        [attr.aria-expanded]="open()" aria-haspopup="dialog"
        [title]="assigneeName || (isArabic ? 'تعيين أو تغيير الموظف' : 'Assign or change assignee')">
        @if (saving()) {
          <span class="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-primary/25 border-t-primary"></span>
        } @else {
          <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" /><path stroke-linecap="round" d="M19 8v6M22 11h-6" />
          </svg>
        }
        <span class="min-w-0 flex-1 truncate text-start">{{ assigneeName || (isArabic ? 'تعيين' : 'Assign') }}</span>
        <svg class="h-3 w-3 shrink-0 transition-transform" [class.rotate-180]="open()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      @if (open()) {
        <button type="button" class="fixed inset-0 z-40 cursor-default" (click)="close()" aria-label="Close"></button>
        <section role="dialog" [attr.aria-label]="isArabic ? 'اختيار الموظف' : 'Choose assignee'"
          class="fixed z-50 overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
          [ngStyle]="panelStyle()">
          <header class="flex items-center justify-between border-b border-border px-4 py-3">
            <h4 class="text-sm font-bold text-text-primary">{{ isArabic ? 'اختيار الموظف' : 'Choose assignee' }}</h4>
            <button type="button" (click)="close()" class="rounded p-1 text-text-secondary hover:bg-background hover:text-text-primary" [title]="isArabic ? 'إغلاق' : 'Close'">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m18 6-12 12M6 6l12 12" /></svg>
            </button>
          </header>

          @if (loading()) {
            <div class="flex items-center justify-center gap-2 px-4 py-8 text-xs text-text-secondary">
              <span class="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary"></span>
              {{ isArabic ? 'جاري تحميل الفريق...' : 'Loading team...' }}
            </div>
          } @else if (errorMessage()) {
            <div class="px-4 py-6 text-center">
              <p class="text-xs font-semibold text-error">{{ errorMessage() }}</p>
              <button type="button" (click)="loadTeam()" class="mt-3 text-xs font-bold text-primary hover:underline">{{ isArabic ? 'إعادة المحاولة' : 'Try again' }}</button>
            </div>
          } @else {
            @if (team().length > 5) {
              <div class="border-b border-border px-3 py-2">
                <label class="relative block">
                  <svg class="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  <input [(ngModel)]="search" type="search" [placeholder]="isArabic ? 'ابحث عن موظف' : 'Search employees'" class="w-full rounded-md border border-border bg-background py-2 ps-8 pe-3 text-xs text-text-primary outline-none focus:border-primary" />
                </label>
              </div>
            }

            <div class="max-h-72 overflow-y-auto p-2">
              @if (assigneeId) {
                <button type="button" (click)="unassign()" class="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-start text-xs font-semibold text-error hover:bg-error/5">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-7 4v7m6-7v7M5 6l1 15h12l1-15"/></svg>
                  {{ isArabic ? 'إلغاء التعيين' : 'Unassign task' }}
                </button>
              }

              @for (member of filteredTeam; track member.employeeId) {
                <button type="button" (click)="select(member)" [disabled]="member.employeeId === assigneeId || saving()"
                  class="mb-1 flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-start transition-colors disabled:cursor-default"
                  [ngClass]="member.employeeId === assigneeId ? 'border-primary/30 bg-primary/5' : 'border-transparent hover:border-border hover:bg-background'">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-xs font-bold text-text-primary">{{ member.fullName }}</p>
                    @if (member.jobTitle) { <p class="mt-0.5 truncate text-[10px] text-text-secondary">{{ member.jobTitle }}</p> }
                  </div>
                  @if (member.employeeId === assigneeId) {
                    <span class="shrink-0 text-[9px] font-bold text-primary">{{ isArabic ? 'الحالي' : 'Current' }}</span>
                  }
                </button>
              } @empty {
                <p class="px-3 py-8 text-center text-xs text-text-secondary">{{ isArabic ? 'لا يوجد موظفون مطابقون للبحث.' : 'No employees match your search.' }}</p>
              }
            </div>
          }
        </section>
      }
    </div>
  `
})
export class TaskAssigneePickerComponent {
  @ViewChild('triggerButton') triggerButton?: ElementRef<HTMLButtonElement>;

  @Input({ required: true }) sprintId!: string;
  @Input({ required: true }) taskId!: string;
  @Input() assigneeId?: string;
  @Input() assigneeName?: string;
  @Input() language = 'en';
  @Input() panelPlacement: 'above' | 'below' = 'below';
  @Output() assignmentChanged = new EventEmitter<TaskAssignmentChangedEvent>();

  private assignmentService = inject(AssignmentService);
  private confirmDialog = inject(ConfirmDialogService);
  private toastService = inject(ToastService);

  open = signal(false);
  loading = signal(false);
  saving = signal(false);
  errorMessage = signal('');
  team = signal<AssignmentTeamMember[]>([]);
  panelStyle = signal<Record<string, string>>({});
  search = '';

  get isArabic(): boolean { return this.language === 'ar'; }

  get filteredTeam(): AssignmentTeamMember[] {
    const query = this.search.trim().toLowerCase();
    if (!query) return this.team();
    return this.team().filter(member => `${member.fullName} ${member.jobTitle || ''}`.toLowerCase().includes(query));
  }

  async toggle(): Promise<void> {
    if (this.open()) { this.close(); return; }
    this.open.set(true);
    this.search = '';
    this.updatePanelPosition();
    await this.loadTeam();
    this.updatePanelPosition();
  }

  close(): void {
    if (!this.saving()) this.open.set(false);
  }

  async loadTeam(): Promise<void> {
    if (this.team().length > 0) return;
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      this.team.set(await this.assignmentService.getAssignmentTeam(this.sprintId));
    } catch (error: any) {
      this.errorMessage.set(this.getErrorMessage(error, this.isArabic ? 'تعذر تحميل الفريق.' : 'Could not load the team.'));
    } finally {
      this.loading.set(false);
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.open()) this.updatePanelPosition();
  }

  private updatePanelPosition(): void {
    const trigger = this.triggerButton?.nativeElement;
    if (!trigger || typeof window === 'undefined') return;

    const rect = trigger.getBoundingClientRect();
    const gap = 8;
    const viewportPadding = 8;
    const width = Math.min(320, window.innerWidth - viewportPadding * 2);
    const left = Math.min(
      Math.max(viewportPadding, rect.right - width),
      Math.max(viewportPadding, window.innerWidth - width - viewportPadding)
    );

    const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
    const spaceAbove = rect.top - gap - viewportPadding;
    const openAbove = this.panelPlacement === 'above' || (spaceBelow < 260 && spaceAbove > spaceBelow);
    const availableHeight = Math.max(180, Math.min(360, openAbove ? spaceAbove : spaceBelow));

    this.panelStyle.set({
      width: `${width}px`,
      left: `${left}px`,
      top: openAbove ? 'auto' : `${rect.bottom + gap}px`,
      bottom: openAbove ? `${window.innerHeight - rect.top + gap}px` : 'auto',
      maxHeight: `${availableHeight}px`
    });
  }

  async select(member: AssignmentTeamMember): Promise<void> {
    if (member.employeeId === this.assigneeId) return;
    this.saving.set(true);
    try {
      let result: AssignTaskResult;
      try {
        result = await this.assignmentService.assignTask(this.sprintId, this.taskId, member.employeeId, false);
      } catch (error: any) {
        if (!this.isCapacityConflict(error)) throw error;
        const confirmed = await this.confirmDialog.confirm({
          title: this.isArabic ? 'تجاوز سعة الموظف' : 'Employee over capacity',
          message: this.isArabic
            ? 'هذا التعيين سيتجاوز السعة المتاحة للموظف في السبرنت. هل تريد الاستمرار؟'
            : 'This assignment exceeds the employee’s available sprint capacity. Continue?',
          confirmLabel: this.isArabic ? 'تعيين رغم ذلك' : 'Assign anyway',
          cancelLabel: this.isArabic ? 'إلغاء' : 'Cancel',
          type: 'warning'
        });
        if (!confirmed) return;
        result = await this.assignmentService.assignTask(this.sprintId, this.taskId, member.employeeId, true);
      }
      this.applySuccess(member.employeeId, member.fullName, result);
    } catch (error: any) {
      this.showSaveError(error);
    } finally {
      this.saving.set(false);
    }
  }

  async unassign(): Promise<void> {
    this.saving.set(true);
    try {
      const result = await this.assignmentService.assignTask(this.sprintId, this.taskId, null, false);
      this.applySuccess(undefined, undefined, result);
    } catch (error: any) {
      this.showSaveError(error);
    } finally {
      this.saving.set(false);
    }
  }

  private applySuccess(employeeId: string | undefined, employeeName: string | undefined, result: AssignTaskResult): void {
    this.assignmentChanged.emit({ employeeId, employeeName });
    this.assigneeId = employeeId;
    this.assigneeName = employeeName;
    this.open.set(false);
    this.toastService.show(
      employeeId ? (this.isArabic ? 'تم تحديث تعيين المهمة.' : 'Task assignment updated.') : (this.isArabic ? 'تم إلغاء تعيين المهمة.' : 'Task unassigned.'),
      result.warnings.length ? 'warning' : 'success'
    );
  }

  private isCapacityConflict(error: any): boolean {
    const code = error?.response?.data?.error?.code || error?.response?.data?.code;
    return error?.response?.status === 409 && (!code || code === 'ASSIGNMENT_CAPACITY_EXCEEDED');
  }

  private showSaveError(error: any): void {
    this.toastService.show(this.getErrorMessage(error, this.isArabic ? 'تعذر تحديث تعيين المهمة.' : 'Could not update task assignment.'), 'error');
  }

  private getErrorMessage(error: any, fallback: string): string {
    return error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || fallback;
  }
}
