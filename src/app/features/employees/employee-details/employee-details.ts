import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CompanyService, CompanyEmployeeModel } from '../../../shared/api/Company-api/company';
import { ToastService } from '../../../shared/services/toast.service';
import { DeactivationDialogComponent } from '../../deactivation-dialog/deactivation-dialog.component';

@Component({
  selector: 'app-employee-details',
  standalone: true,
  imports: [CommonModule, TranslatePipe, DeactivationDialogComponent],
  templateUrl: './employee-details.html'
})
export class EmployeeDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private companyService = inject(CompanyService);
  private toastService = inject(ToastService);

  employeeId = signal<string>('');
  employee = signal<CompanyEmployeeModel | null>(null);
  isLoading = signal(true);

  // Deactivation Dialog State
  isDeactivateModalOpen = signal(false);
  
  // Termination Modal State
  isTerminateModalOpen = signal(false);
  isTerminating = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('employeeId');
      if (id) {
        this.employeeId.set(id);
        this.loadEmployeeDetails(id);
      } else {
        this.router.navigate(['/employees']);
      }
    });
  }

  async loadEmployeeDetails(id: string) {
    this.isLoading.set(true);
    try {
      const res = await this.companyService.getCompanyEmployeeById(id);
      if (res.succeeded && res.data) {
        this.employee.set(res.data);
      } else {
        this.toastService.show('Employee not found', 'error');
        this.router.navigate(['/employees']);
      }
    } catch (e) {
      console.error('Failed to load employee details', e);
      this.toastService.show('Failed to load details', 'error');
      this.router.navigate(['/employees']);
    } finally {
      this.isLoading.set(false);
    }
  }

  get initials(): string {
    const emp = this.employee();
    if (!emp || !emp.fullName) return '?';
    const parts = emp.fullName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  get workloadStatus(): 'Available' | 'Moderate' | 'Busy' {
    const emp = this.employee();
    if (!emp) return 'Available';
    if (emp.activeProjectsCount === 0) return 'Available';
    if (emp.currentAssignedTasksCount > 10) return 'Busy';
    return 'Moderate';
  }

  goBack() {
    this.router.navigate(['/employees']);
  }

  openDeactivateModal() {
    this.isDeactivateModalOpen.set(true);
  }

  closeDeactivateModal() {
    this.isDeactivateModalOpen.set(false);
  }

  onDeactivated() {
    this.closeDeactivateModal();
    this.loadEmployeeDetails(this.employeeId()); // Reload to show deactivated status
  }

  openTerminateModal() {
    this.isTerminateModalOpen.set(true);
  }

  closeTerminateModal() {
    this.isTerminateModalOpen.set(false);
  }

  async confirmTermination() {
    this.isTerminating.set(true);
    try {
      await this.companyService.terminateEmployee(this.employeeId(), { reason: 'Terminated by admin' });
      this.toastService.show('Employee terminated successfully.', 'success');
      this.closeTerminateModal();
      this.router.navigate(['/employees']);
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message || 'Failed to terminate employee.';
      this.toastService.show(msg, 'error');
    } finally {
      this.isTerminating.set(false);
    }
  }
}
