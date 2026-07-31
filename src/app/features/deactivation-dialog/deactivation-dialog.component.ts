import { Component, EventEmitter, Input, Output, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyService, AnalysisResultDto, DeactivateEmployeeRequest } from '../../shared/api/Company-api/company';
import { ToastService } from '../../shared/services/toast.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-deactivation-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-[200] flex items-center justify-center animate-fade-in">
      <div class="absolute inset-0 bg-brandNavy/60 backdrop-blur-sm transition-opacity" (click)="close()"></div>

      <div class="relative bg-brandWhite w-full max-w-lg rounded-3xl shadow-2xl p-6 flex flex-col gap-4 transform transition-all">
        
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-brandNavy flex items-center gap-2">
            <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            {{ 'DEACTIVATION.TITLE' | translate }}
          </h3>
          <button (click)="close()" class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div *ngIf="isLoading()" class="py-8 flex flex-col items-center gap-3">
          <svg class="animate-spin h-8 w-8 text-brandPrimary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-sm text-slate-500 font-medium">{{ 'DEACTIVATION.ANALYZING' | translate }}</p>
        </div>

        <div *ngIf="!isLoading() && analysisResult()" class="flex flex-col gap-4">
          <div *ngIf="analysisResult()?.isAllowed" class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <svg class="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 class="text-sm font-bold text-emerald-800">{{ 'DEACTIVATION.READY_TITLE' | translate }}</h4>
              <p class="text-xs text-emerald-600 mt-1">{{ 'DEACTIVATION.READY_DESC' | translate }}</p>
            </div>
          </div>

          <div *ngIf="!analysisResult()?.isAllowed" class="flex flex-col gap-3">
            <div class="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <svg class="w-6 h-6 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 class="text-sm font-bold text-red-800">{{ 'DEACTIVATION.BLOCKED_TITLE' | translate }}</h4>
                <p class="text-xs text-red-600 mt-1">{{ 'DEACTIVATION.BLOCKED_DESC' | translate }}</p>
              </div>
            </div>

            <div class="max-h-[200px] overflow-y-auto pr-2 flex flex-col gap-2">
              <div *ngFor="let block of analysisResult()?.blocks" class="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                
                <div *ngIf="block.$type === 'ActiveTasks'">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" [ngClass]="getSeverityClass(block.severity)">{{block.severity}}</span>
                    <span class="text-sm font-bold text-brandNavy">{{ 'DEACTIVATION.ACTIVE_TASKS' | translate }}</span>
                  </div>
                  <ul class="list-disc list-inside text-xs text-slate-600 ml-1">
                    <li *ngFor="let task of block.tasks">{{ task.title }} ({{ task.status }})</li>
                  </ul>
                  <p class="text-[11px] text-slate-500 mt-2">{{ 'DEACTIVATION.ACTIVE_TASKS_DESC' | translate }}</p>
                </div>

                <div *ngIf="block.$type === 'ProjectManager'">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" [ngClass]="getSeverityClass(block.severity)">{{block.severity}}</span>
                    <span class="text-sm font-bold text-brandNavy">{{ 'DEACTIVATION.PROJECT_MANAGER' | translate }}</span>
                  </div>
                  <ul class="list-disc list-inside text-xs text-slate-600 ml-1">
                    <li *ngFor="let p of block.managedProjects">{{ p.name }}</li>
                  </ul>
                  <p class="text-[11px] text-slate-500 mt-2">{{ 'DEACTIVATION.PROJECT_MANAGER_DESC' | translate }}</p>
                </div>

              </div>
            </div>
          </div>

          <div class="flex flex-col gap-1 mt-2">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">{{ 'DEACTIVATION.REASON_LABEL' | translate }}</label>
            <textarea [(ngModel)]="reason" rows="3" [placeholder]="'DEACTIVATION.REASON_PLACEHOLDER' | translate" 
              class="w-full px-3 py-2 bg-brandLight border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
          <button (click)="close()" class="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm">{{ 'DEACTIVATION.CANCEL' | translate }}</button>
          <button (click)="confirm()" [disabled]="!analysisResult()?.isAllowed || isExecuting()"
            class="px-5 py-2.5 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:hover:bg-red-600">
            <svg *ngIf="isExecuting()" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ 'DEACTIVATION.DEACTIVATE' | translate }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class DeactivationDialogComponent implements OnInit {
  @Input() employeeId!: string;
  @Input() employeeName!: string;
  @Input() isOpen = false;
  
  @Output() closed = new EventEmitter<void>();
  @Output() deactivated = new EventEmitter<void>();

  companyService = inject(CompanyService);
  toastService = inject(ToastService);
  translateService = inject(TranslateService);

  isLoading = signal<boolean>(false);
  isExecuting = signal<boolean>(false);
  analysisResult = signal<any>(null);
  reason = '';

  ngOnInit() {
    if (this.isOpen && this.employeeId) {
      this.loadAnalysis();
    }
  }

  ngOnChanges() {
    if (this.isOpen && this.employeeId && !this.analysisResult()) {
      this.reason = '';
      this.loadAnalysis();
    }
  }

  async loadAnalysis() {
    try {
      this.isLoading.set(true);
      const res = await this.companyService.analyzeDeactivation(this.employeeId);
      const data = (res as any).data || res;
      this.analysisResult.set(data);
    } catch (e: any) {
      console.error(e);
      this.toastService.show(this.translateService.instant('DEACTIVATION.ERROR_ANALYSIS'), 'error');
      this.close();
    } finally {
      this.isLoading.set(false);
    }
  }

  async confirm() {
    if (!this.analysisResult()?.isAllowed) return;

    try {
      this.isExecuting.set(true);
      const req: DeactivateEmployeeRequest = { reason: this.reason.trim() || undefined };
      const res = await this.companyService.deactivateEmployee(this.employeeId, req);
      
      this.toastService.show(this.translateService.instant('DEACTIVATION.SUCCESS'), 'success');
      this.deactivated.emit();
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message || this.translateService.instant('DEACTIVATION.ERROR_DEACTIVATE');
      this.toastService.show(msg, 'error');
    } finally {
      this.isExecuting.set(false);
    }
  }

  close() {
    this.analysisResult.set(null);
    this.closed.emit();
  }

  getSeverityClass(severity: string) {
    if (severity === 'Critical') return 'bg-red-100 text-red-700';
    if (severity === 'High') return 'bg-orange-100 text-orange-700';
    return 'bg-amber-100 text-amber-700';
  }
}
