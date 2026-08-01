import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CompanyService, CompanyEmployeeModel } from '../../../shared/api/Company-api/company';
import { ToastService } from '../../../shared/services/toast.service';
import { EmployeeCardComponent } from '../employee-card/employee-card';
import { EmployeeFiltersComponent } from '../employee-filters/employee-filters';
import { DeactivationDialogComponent } from '../../deactivation-dialog/deactivation-dialog.component';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, EmployeeCardComponent, EmployeeFiltersComponent, DeactivationDialogComponent],
  templateUrl: './employees-list.html'
})
export class EmployeesListComponent implements OnInit {
  private companyService = inject(CompanyService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  Math = Math;

  // Pagination & Data Signals
  employees = signal<CompanyEmployeeModel[]>([]);
  isLoading = signal(false);
  
  totalItems = signal(0);
  totalPages = signal(0);
  currentPage = signal(1);
  pageSize = signal(12);
  
  searchQuery = signal('');
  statusFilter = signal<'active' | 'deactivated' | ''>('');
  sortBy = signal('fullName');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Summary Metrics Signals
  totalEmployees = signal(0);
  activeCount = signal(0);
  deactivatedCount = signal(0);
  inProjectsCount = signal(0);
  availableCount = signal(0);
  isMetricsLoaded = signal(false);

  // Deactivation Dialog State
  isDeactivateModalOpen = signal(false);
  selectedEmployeeId = signal<string | null>(null);
  selectedEmployeeName = signal('');

  ngOnInit(): void {
    this.loadEmployees();
    this.loadSummaryMetrics();
  }

  async loadEmployees(page: number = 1) {
    this.isLoading.set(true);
    this.currentPage.set(page);
    try {
      const res = await this.companyService.getEmployeesPaged({
        page: this.currentPage(),
        pageSize: this.pageSize(),
        search: this.searchQuery(),
        status: this.statusFilter(),
        sortBy: this.sortBy(),
        sortDirection: this.sortDirection()
      });

      if (res.succeeded && res.data) {
        this.employees.set(res.data.items || []);
        this.totalItems.set(res.data.totalItems || 0);
        this.totalPages.set(res.data.totalPages || 0);
      }
    } catch (e) {
      console.error('Failed to load employees', e);
      this.toastService.show('Failed to load employees', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadSummaryMetrics() {
    try {
      const res = await this.companyService.getEmployeesPaged({
        page: 1,
        pageSize: 1000 // Get all for metrics
      });
      if (res.succeeded && res.data && res.data.items) {
        const items = res.data.items;
        this.totalEmployees.set(items.length);
        this.activeCount.set(items.filter((e: CompanyEmployeeModel) => !e.isDeactivated).length);
        this.deactivatedCount.set(items.filter((e: CompanyEmployeeModel) => e.isDeactivated).length);
        this.inProjectsCount.set(items.filter((e: CompanyEmployeeModel) => e.activeProjectsCount > 0).length);
        this.availableCount.set(items.filter((e: CompanyEmployeeModel) => e.activeProjectsCount === 0 && !e.isDeactivated).length);
        this.isMetricsLoaded.set(true);
      }
    } catch (e) {
      console.error('Failed to load metrics', e);
    }
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.loadEmployees(1);
  }

  onStatusChange(status: 'active' | 'deactivated' | '') {
    this.statusFilter.set(status);
    this.loadEmployees(1);
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.loadEmployees(page);
  }

  onViewDetails(employeeId: string) {
    this.router.navigate(['/employees', employeeId]);
  }

  openDeactivateModal(employee: CompanyEmployeeModel) {
    this.selectedEmployeeId.set(employee.employeeId);
    this.selectedEmployeeName.set(employee.fullName || employee.email);
    this.isDeactivateModalOpen.set(true);
  }

  closeDeactivateModal() {
    this.isDeactivateModalOpen.set(false);
    this.selectedEmployeeId.set(null);
    this.selectedEmployeeName.set('');
  }

  onDeactivated() {
    this.closeDeactivateModal();
    this.loadEmployees(this.currentPage());
    this.loadSummaryMetrics();
  }
}
