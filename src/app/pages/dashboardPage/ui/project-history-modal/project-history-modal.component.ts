import { Component, ChangeDetectionStrategy, signal, input, output, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-project-history-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]">
      <div class="bg-surface border border-border rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-[scaleUp_0.25s_ease_both] overflow-hidden relative">
        
        <!-- Header background gradient -->
        <div class="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary/20 to-indigo-500/20 pointer-events-none"></div>

        <!-- Header -->
        <div class="p-6 pb-4 flex items-start justify-between relative z-10">
          <div>
            <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider mb-2">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {{ 'MODALS.PROJECT_STATUS' | translate }}
            </div>
            <h3 class="text-2xl font-extrabold text-text-primary font-display tracking-tight">{{ projectName() }}</h3>
          </div>
          <button (click)="close.emit()" class="p-1.5 text-text-secondary hover:bg-black/5 hover:text-text-primary rounded-full transition-colors focus:outline-none">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto custom-scrollbar relative z-10 flex-1">
          <h4 class="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
            {{ 'MODALS.STATUS_TIMELINE' | translate }}
          </h4>
          
          @if (isLoading()) {
            <div class="space-y-4 animate-pulse">
              <div class="flex gap-4 items-start">
                <div class="w-2.5 h-2.5 rounded-full bg-border mt-1"></div>
                <div class="h-4 bg-border rounded w-32"></div>
              </div>
              <div class="flex gap-4 items-start">
                <div class="w-2.5 h-2.5 rounded-full bg-border mt-1"></div>
                <div class="h-4 bg-border rounded w-48"></div>
              </div>
            </div>
          } @else if (history().length > 0) {
            <div class="relative border-l-2 border-border/60 ml-1.5 pb-2">
              @for (entry of history(); track $index) {
                <div class="mb-6 ml-6 relative group">
                  <!-- Node -->
                  <div class="absolute -left-[31px] top-0.5 w-3.5 h-3.5 bg-background border-2 border-primary rounded-full group-hover:scale-125 transition-transform duration-300"></div>
                  
                  <div class="flex flex-col">
                    <span class="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                      {{ 'MODALS.STATUS_CHANGE' | translate }}
                    </span>
                    <div class="flex items-center gap-2 text-sm font-semibold text-text-primary">
                      <span class="px-2 py-0.5 rounded-md bg-sidebar border border-border text-text-secondary">{{ entry.fromStatus || ('MODALS.CREATED' | translate) }}</span>
                      <svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                      <span class="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">{{ entry.toStatus }}</span>
                    </div>
                  </div>
                </div>
              }
              
              <!-- Current State Node -->
              <div class="ml-6 relative group">
                <div class="absolute -left-[31px] top-0.5 w-3.5 h-3.5 bg-primary border-2 border-primary rounded-full shadow-[0_0_10px_rgba(var(--color-primary),0.5)] animate-pulse"></div>
                <div class="flex flex-col">
                  <span class="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                    {{ 'MODALS.CURRENT_STATUS' | translate }}
                  </span>
                  <div class="inline-flex items-center text-sm font-semibold text-text-primary w-fit">
                    <span class="px-3 py-1 rounded-md bg-surface border border-primary text-primary shadow-sm">{{ currentStatus() }}</span>
                  </div>
                </div>
              </div>
            </div>
          } @else {
            <div class="text-center py-6">
              <p class="text-sm text-text-secondary">{{ 'MODALS.NO_STATUS_TRANSITIONS' | translate }}</p>
              <div class="mt-4 ml-6 relative text-left">
                 <div class="absolute -left-[31px] top-0.5 w-3.5 h-3.5 bg-primary border-2 border-primary rounded-full shadow-[0_0_10px_rgba(var(--color-primary),0.5)]"></div>
                 <span class="text-xs font-bold text-primary uppercase tracking-wider mb-1 block">{{ 'MODALS.CURRENT_STATUS' | translate }}</span>
                 <span class="px-3 py-1 rounded-md bg-surface border border-primary text-primary shadow-sm text-sm font-semibold">{{ currentStatus() }}</span>
              </div>
            </div>
          }
        </div>

        <!-- Footer Actions -->
        <div class="p-6 pt-4 border-t border-border/50 bg-sidebar/30 flex justify-between items-center z-10 rounded-b-3xl">
          <button (click)="close.emit()" class="px-4 py-2 border border-border hover:bg-background text-text-secondary font-bold text-sm rounded-xl transition-colors">
            {{ 'MODALS.CANCEL' | translate }}
          </button>
          
          <div class="flex items-center gap-3">
            @if (currentStatus() !== 'Draft' && currentStatus() !== 'Archived') {
              <button (click)="onRevertClick()" 
                      [disabled]="isActionLoading()"
                      class="px-5 py-2.5 font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 group border border-border bg-surface hover:bg-background text-text-secondary disabled:opacity-50">
                <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {{ revertText() | translate }}
              </button>
            }

            <button (click)="onActionClick()" 
                  [disabled]="isActionLoading()"
                  class="px-5 py-2.5 font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 group disabled:opacity-50"
                  [ngClass]="currentStatus() === 'Completed' ? 'bg-slate-600 hover:bg-slate-700 text-white' : (currentStatus() === 'Archived' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white')">
            @if (isActionLoading()) {
              <svg class="animate-spin ltr:-ml-1 rtl:-mr-1 ltr:mr-2 rtl:ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ 'MODALS.PROCESSING' | translate }}
            } @else {
              @if (currentStatus() === 'Completed') {
                <svg class="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                {{ 'MODALS.ARCHIVE_PROJECT' | translate }}
              } @else if (currentStatus() === 'Archived') {
                <svg class="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {{ 'MODALS.RESTORE_TO_ACTIVE' | translate }}
              } @else if (currentStatus() === 'Draft') {
                <svg class="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ 'MODALS.ACTIVATE_PROJECT' | translate }}
              } @else {
                <svg class="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                {{ 'MODALS.COMPLETE_PROJECT' | translate }}
              }
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProjectHistoryModalComponent implements OnInit {
  projectId = input.required<string>();
  projectName = input.required<string>();
  currentStatus = input.required<string>();

  close = output<void>();
  actionCompleted = output<void>();

  projectState = inject(ProjectStateService);
  toastService = inject(ToastService);

  history = signal<any[]>([]);
  isLoading = signal(true);
  isActionLoading = signal(false);

  revertText = computed(() => {
    switch (this.currentStatus()) {
      case 'Active': return 'MODALS.REVERT_TO_DRAFT';
      case 'Completed': return 'MODALS.REVERT_TO_ACTIVE';
      default: return 'MODALS.REVERT';
    }
  });

  async ngOnInit() {
    this.isLoading.set(true);
    const data = await this.projectState.getProjectStatusHistory(this.projectId());
    // The backend returns history newest-first. Reverse it so it displays oldest-first.
    this.history.set([...data].reverse());
    this.isLoading.set(false);
  }

  async onActionClick() {
    this.isActionLoading.set(true);

    let targetStatus = 'Completed';
    if (this.currentStatus() === 'Completed') {
      targetStatus = 'Archived';
    } else if (this.currentStatus() === 'Archived') {
      targetStatus = 'Active';
    } else if (this.currentStatus() === 'Draft') {
      targetStatus = 'Active';
    }

    // First, try to transition directly to the target status.
    let result = await this.projectState.changeProjectStatus(this.projectId(), targetStatus);

    // If we tried to go to "Completed" and the backend says "Invalid Status Transition"
    // it probably needs to be "Active" first.
    if (!result.success && targetStatus === 'Completed' && result.error?.includes('InvalidStatusTransition')) {
      const activeResult = await this.projectState.changeProjectStatus(this.projectId(), 'Active');
      if (activeResult.success) {
        // Now that it's Active, try completing it again
        result = await this.projectState.changeProjectStatus(this.projectId(), 'Completed');
      } else {
        result = activeResult; // pass along the error from the active attempt
      }
    }

    // If it STILL failed (or it was an AlreadyCompleted error), handle it.
    if (!result.success) {
      // If the backend says it's already completed but the frontend didn't know,
      // we can force a local refresh or just silently accept it.
      if (result.error?.includes('AlreadyCompleted') && targetStatus === 'Completed') {
        result = { success: true };
      }
    }

    this.isActionLoading.set(false);

    if (result.success) {
      this.actionCompleted.emit();
    } else {
      this.toastService.show(result.error || 'Failed to update project status', 'error');
    }
  }

  async onRevertClick() {
    this.isActionLoading.set(true);

    let targetStatus = 'Draft';
    if (this.currentStatus() === 'Completed') {
      targetStatus = 'Active';
    } else if (this.currentStatus() === 'Active') {
      targetStatus = 'Draft';
    }

    const result = await this.projectState.changeProjectStatus(this.projectId(), targetStatus);

    this.isActionLoading.set(false);

    if (result.success) {
      this.actionCompleted.emit();
    } else {
      this.toastService.show(result.error || 'Failed to revert project status', 'error');
    }
  }
}
