import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyService } from '../../shared/api/Company-api/company';
import { ToastService } from '../../shared/services/toast.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-reactivation-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './reactivation-dialog.component.html'
})
export class ReactivationDialogComponent implements OnInit {
  @Input() isOpen = false;
  @Input() employeeId: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() reactivated = new EventEmitter<void>();

  @Output() reactivatedWithSprints = new EventEmitter<any>();

  companyService = inject(CompanyService);
  toastService = inject(ToastService);
  translateService = inject(TranslateService);

  isLoading = signal<boolean>(false);
  isExecuting = signal<boolean>(false);
  
  hasRestorableProjects = signal<boolean>(false);
  restorableProjectNames = signal<string[]>([]);
  restorePreviousProjects = true;

  ngOnInit() {
    if (this.isOpen && this.employeeId) {
      this.analyzeReactivation();
    }
  }

  ngOnChanges() {
    if (this.isOpen && this.employeeId) {
      this.analyzeReactivation();
    }
  }

  async analyzeReactivation() {
    this.isLoading.set(true);
    this.hasRestorableProjects.set(false);
    this.restorableProjectNames.set([]);
    
    try {
      if (!this.employeeId) return;
      const res = await this.companyService.analyzeReactivation(this.employeeId);
      this.hasRestorableProjects.set(res.data?.hasRestorableProjects || false);
      this.restorableProjectNames.set(res.data?.restorableProjectNames || []);
    } catch (e) {
      console.error(e);
      this.toastService.show(this.translateService.instant('EMPLOYEES.ERROR_ANALYSIS'), 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  closeDialog() {
    this.close.emit();
  }

  async confirm() {
    if (!this.employeeId) return;
    this.isExecuting.set(true);
    try {
      const res = await this.companyService.reactivateEmployee(this.employeeId, {
        restorePreviousProjects: this.restorePreviousProjects
      });
      
      this.toastService.show(this.translateService.instant('EMPLOYEES.SUCCESS_REACTIVATE'), 'success');
      
      if (res.data && res.data.hasPlannedSprints) {
        this.reactivatedWithSprints.emit(res.data);
      } else {
        this.reactivated.emit();
      }
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message || this.translateService.instant('EMPLOYEES.ERROR_REACTIVATE');
      this.toastService.show(msg, 'error');
    } finally {
      this.isExecuting.set(false);
    }
  }
}
