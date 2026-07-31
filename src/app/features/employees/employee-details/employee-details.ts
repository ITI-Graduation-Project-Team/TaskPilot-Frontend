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

  // Load employee details by fetching the paginated list filtered by email/name or just taking all and finding.
  // For V1, since we don't have a dedicated GET /employees/{id} endpoint yet, 
  // we can fetch the first page and search, or since this is PM context, just get everything and find.
  async loadEmployeeDetails(id: string) {
    this.isLoading.set(true);
    try {
      // Fetch large page since we don't have a single-employee endpoint yet
      const res = await this.companyService.getCompanyEmployees(1, 1000);
      if (res.succeeded && res.data) {
        const found = res.data.items.find(e => e.employeeId === id);
        if (found) {
          this.employee.set(found);
        } else {
          this.toastService.show('Employee not found', 'error');
          this.router.navigate(['/employees']);
        }
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
}
