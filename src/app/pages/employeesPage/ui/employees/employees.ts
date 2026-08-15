import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CompanyService, CompanyEmployeeModel, EmployeeSuggestionModel, InvitationModel } from '../../../../shared/api/Company-api/company';
import { ToastService } from '../../../../shared/services/toast.service';
import { DeactivationDialogComponent } from '../../../../features/deactivation-dialog/deactivation-dialog.component';
import { ReactivationDialogComponent } from '../../../../features/reactivation-dialog/reactivation-dialog.component';
import { TranslatePipe } from '@ngx-translate/core';
import { PlannedSprintAssignmentDialogComponent } from '../../../../features/planned-sprint-assignment-dialog/planned-sprint-assignment-dialog';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DeactivationDialogComponent, ReactivationDialogComponent, TranslatePipe, PlannedSprintAssignmentDialogComponent],
  templateUrl: './employees.html',
  styleUrls: ['./employees.scss']
})
export class EmployeesComponent implements OnInit {
  companyService = inject(CompanyService);
  toastService = inject(ToastService);

  activeTab = signal<'active' | 'deactivated' | 'invitations'>('active');
  
  // Active Employees State
  activeEmployees = signal<CompanyEmployeeModel[]>([]);
  activeEmployeesPage = signal<number>(1);
  totalActiveEmployees = signal<number>(0);

  // Deactivated Employees State
  deactivatedEmployees = signal<CompanyEmployeeModel[]>([]);
  deactivatedEmployeesPage = signal<number>(1);
  totalDeactivatedEmployees = signal<number>(0);

  // Statistics State
  totalEmployeesStat = signal<number>(0);
  activeEmployeesStat = signal<number>(0);
  deactivatedEmployeesStat = signal<number>(0);
  availableEmployeesStat = signal<number>(0);
  employeesInProjectsStat = signal<number>(0);

  localSearchQuery = signal<string>('');
  isLoadingActive = signal<boolean>(false);
  isLoadingDeactivated = signal<boolean>(false);

  activeEmployeesCache = new Map<number, { items: CompanyEmployeeModel[], total: number }>();
  deactivatedEmployeesCache = new Map<number, { items: CompanyEmployeeModel[], total: number }>();
  invitationsCache = new Map<string, { items: InvitationModel[], total: number }>();

  paginatedActiveEmployees = computed(() => {
    const q = this.localSearchQuery().toLowerCase().trim();
    if (!q) return this.activeEmployees();
    return this.activeEmployees().filter(e => e.fullName?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q));
  });

  paginatedDeactivatedEmployees = computed(() => {
    const q = this.localSearchQuery().toLowerCase().trim();
    if (!q) return this.deactivatedEmployees();
    return this.deactivatedEmployees().filter(e => e.fullName?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q));
  });

  // Invitations State
  invitations = signal<InvitationModel[]>([]);
  invitationStatus = signal<'pending' | 'expired' | ''>('pending');
  currentPage = signal<number>(1);
  pageSize = signal<number>(20);
  totalInvitations = signal<number>(0);
  isLoadingInvitations = signal<boolean>(false);

  // Invite Modal State
  isInviteModalOpen = signal<boolean>(false);
  systemSearchQuery = signal<string>('');
  searchResults = signal<EmployeeSuggestionModel[]>([]);
  isSearchingSystem = signal<boolean>(false);
  isInviting = signal<boolean>(false);
  inviteEmailError = signal<string | null>(null);
  inviteEmailFailedAddress = signal<string | null>(null);

  // Deactivation/Reactivation Modal State
  isDeactivateModalOpen = signal<boolean>(false);
  isReactivateModalOpen = signal<boolean>(false);
  selectedEmployeeId = signal<string | null>(null);
  selectedEmployeeName = signal<string>('');

  // Capacity Alert State
  showSprintAdditionDialog = signal(false);
  detectedSprintNames = signal<string[]>([]);
  detectedSprintIds = signal<string[]>([]);
  detectedSprintProjectIds = signal<string[]>([]);

  // Summary Cards Data
  activeCount = computed(() => this.activeEmployeesStat());
  deactivatedCount = computed(() => this.deactivatedEmployeesStat());
  totalCount = computed(() => this.totalEmployeesStat());
  
  availableCount = computed(() => this.availableEmployeesStat());
  assignedCount = computed(() => this.employeesInProjectsStat());

  ngOnInit() {
    this.loadStatistics();
    this.switchTab('active');
  }

  async loadStatistics() {
    try {
      const res = await this.companyService.getEmployeeStatistics();
      if (res.succeeded && res.data) {
        this.totalEmployeesStat.set(res.data.totalEmployees);
        this.activeEmployeesStat.set(res.data.activeEmployees);
        this.deactivatedEmployeesStat.set(res.data.deactivatedEmployees);
        this.availableEmployeesStat.set(res.data.availableEmployees);
        this.employeesInProjectsStat.set(res.data.employeesInProjects);
      }
    } catch (e) {
      console.error('Failed to load employee statistics:', e);
    }
  }

  switchTab(tab: 'active' | 'deactivated' | 'invitations') {
    this.activeTab.set(tab);
    if (tab === 'active') {
      this.loadActiveEmployees();
    } else if (tab === 'deactivated') {
      this.loadDeactivatedEmployees();
    } else if (tab === 'invitations') {
      this.loadInvitations();
    }
  }

  async loadActiveEmployees() {
    const page = this.activeEmployeesPage();
    if (this.activeEmployeesCache.has(page)) {
      const cached = this.activeEmployeesCache.get(page)!;
      this.activeEmployees.set(cached.items);
      this.totalActiveEmployees.set(cached.total);
      return;
    }
    
    try {
      this.isLoadingActive.set(true);
      const res = await this.companyService.getCompanyEmployees(page, this.pageSize(), false);
      if (res.succeeded && res.data) {
        this.activeEmployees.set(res.data.items);
        this.totalActiveEmployees.set(res.data.totalItems);
        this.activeEmployeesCache.set(page, { items: res.data.items, total: res.data.totalItems });
      } else {
        this.activeEmployees.set([]);
        this.totalActiveEmployees.set(0);
      }
    } catch (e) {
      console.error(e);
      this.activeEmployees.set([]);
      this.totalActiveEmployees.set(0);
    } finally {
      this.isLoadingActive.set(false);
    }
  }

  async loadDeactivatedEmployees() {
    const page = this.deactivatedEmployeesPage();
    if (this.deactivatedEmployeesCache.has(page)) {
      const cached = this.deactivatedEmployeesCache.get(page)!;
      this.deactivatedEmployees.set(cached.items);
      this.totalDeactivatedEmployees.set(cached.total);
      return;
    }
    
    try {
      this.isLoadingDeactivated.set(true);
      const res = await this.companyService.getCompanyEmployees(page, this.pageSize(), true);
      if (res.succeeded && res.data) {
        this.deactivatedEmployees.set(res.data.items);
        this.totalDeactivatedEmployees.set(res.data.totalItems);
        this.deactivatedEmployeesCache.set(page, { items: res.data.items, total: res.data.totalItems });
      } else {
        this.deactivatedEmployees.set([]);
        this.totalDeactivatedEmployees.set(0);
      }
    } catch (e) {
      console.error(e);
      this.deactivatedEmployees.set([]);
      this.totalDeactivatedEmployees.set(0);
    } finally {
      this.isLoadingDeactivated.set(false);
    }
  }

  async loadInvitations() {
    const page = this.currentPage();
    const status = this.invitationStatus();
    const cacheKey = `${status}_${page}`;
    
    if (this.invitationsCache.has(cacheKey)) {
      const cached = this.invitationsCache.get(cacheKey)!;
      this.invitations.set(cached.items);
      this.totalInvitations.set(cached.total);
      return;
    }

    try {
      this.isLoadingInvitations.set(true);
      const res = await this.companyService.getInvitations(
        status || undefined,
        page,
        this.pageSize()
      );
      if (res.succeeded && res.data) {
        this.invitations.set(res.data.items);
        this.totalInvitations.set(res.data.totalCount);
        this.invitationsCache.set(cacheKey, { items: res.data.items, total: res.data.totalCount });
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoadingInvitations.set(false);
    }
  }

  onFilterStatus(status: 'pending' | 'expired' | '') {
    this.invitationStatus.set(status);
    this.currentPage.set(1);
    this.loadInvitations();
  }

  prevActivePage() {
    if (this.activeEmployeesPage() > 1) {
      this.activeEmployeesPage.set(this.activeEmployeesPage() - 1);
      this.loadActiveEmployees();
    }
  }

  nextActivePage() {
    const maxPage = Math.ceil(this.totalActiveEmployees() / this.pageSize());
    if (this.activeEmployeesPage() < maxPage) {
      this.activeEmployeesPage.set(this.activeEmployeesPage() + 1);
      this.loadActiveEmployees();
    }
  }

  prevDeactivatedPage() {
    if (this.deactivatedEmployeesPage() > 1) {
      this.deactivatedEmployeesPage.set(this.deactivatedEmployeesPage() - 1);
      this.loadDeactivatedEmployees();
    }
  }

  nextDeactivatedPage() {
    const maxPage = Math.ceil(this.totalDeactivatedEmployees() / this.pageSize());
    if (this.deactivatedEmployeesPage() < maxPage) {
      this.deactivatedEmployeesPage.set(this.deactivatedEmployeesPage() + 1);
      this.loadDeactivatedEmployees();
    }
  }

  getInvitationStatus(inv: InvitationModel): 'accepted' | 'expired' | 'pending' {
    if (inv.accepted) return 'accepted';
    const expiresAt = new Date(inv.expiresAt).getTime();
    const now = new Date().getTime();
    if (expiresAt < now) return 'expired';
    return 'pending';
  }

  async resendInvitation(id: string) {
    try {
      const res = await this.companyService.resendInvitation(id);
      if (res.succeeded) {
        this.toastService.show('Invitation resent successfully!', 'success');
        this.invitationsCache.clear();
        this.loadInvitations();
      } else {
        this.toastService.show(res.message || 'Failed to resend invitation', 'error');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Error resending invitation';
      this.toastService.show(msg, 'error');
    }
  }

  async deleteInvitation(id: string) {
    try {
      const res = await this.companyService.cancelInvitation(id);
      if (res.succeeded) {
        this.toastService.show('Invitation deleted successfully!', 'success');
        this.invitationsCache.clear();
        this.loadInvitations();
      } else {
        this.toastService.show(res.message || 'Failed to delete invitation', 'error');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Error deleting invitation';
      this.toastService.show(msg, 'error');
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadInvitations();
    }
  }

  nextPage() {
    const maxPage = Math.ceil(this.totalInvitations() / this.pageSize());
    if (this.currentPage() < maxPage) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadInvitations();
    }
  }

  async openInviteModal() {
    this.systemSearchQuery.set('');
    this.searchResults.set([]);
    this.inviteEmailError.set(null);
    this.inviteEmailFailedAddress.set(null);
    this.isInviteModalOpen.set(true);
  }

  closeInviteModal() {
    this.inviteEmailError.set(null);
    this.inviteEmailFailedAddress.set(null);
    this.isInviteModalOpen.set(false);
  }

  private searchTimeout: any;

  onSystemSearchChange() {
    this.inviteEmailError.set(null);
    this.inviteEmailFailedAddress.set(null);

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    const query = this.systemSearchQuery().trim();
    if (!query) {
      this.searchResults.set([]);
      return;
    }

    this.searchTimeout = setTimeout(async () => {
      try {
        this.isSearchingSystem.set(true);
        const res = await this.companyService.searchEmployees(query);
        if (res.succeeded && res.data) {
          this.searchResults.set(res.data);
        } else {
          this.searchResults.set([]);
        }
      } catch (e) {
        console.error(e);
        this.searchResults.set([]);
      } finally {
        this.isSearchingSystem.set(false);
      }
    }, 400);
  }

  async inviteEmail(email: string) {
    if (!email.trim()) return;

    this.inviteEmailError.set(null);
    this.inviteEmailFailedAddress.set(null);

    try {
      this.isInviting.set(true);
      const res = await this.companyService.inviteEmployees([email.trim()]);
      if (res.succeeded && (!res.data?.skippedEmployees || res.data.skippedEmployees.length === 0)) {
        this.toastService.show('🎉 Invitation sent successfully!', 'success');
        this.invitationsCache.clear();
        this.loadInvitations();
        this.closeInviteModal();
      } else {
        this.handleInviteError(res, email);
      }
    } catch (e: any) {
      console.error(e);
      const errResponse = e?.response?.data || e;
      this.handleInviteError(errResponse, email);
    } finally {
      this.isInviting.set(false);
    }
  }

  handleInviteError(errResponse: any, email: string) {
    const data = errResponse?.data;
    const skipped = data?.skippedEmployees || errResponse?.skippedEmployees || [];
    const errors = errResponse?.errors || [];
    const code = errResponse?.code;

    const hasSkippedBelongs = skipped.some((s: any) => s.reason === 'USER_ALREADY_BELONGS_TO_COMPANY');
    const isAlreadyBelongsError = hasSkippedBelongs || (code === 'USER_ALREADY_BELONGS_TO_COMPANY') ||
      errors.some((err: any) => err.code === 'USER_ALREADY_BELONGS_TO_COMPANY');

    if (isAlreadyBelongsError) {
      this.inviteEmailError.set('This user is already registered under another company.');
      this.inviteEmailFailedAddress.set(email);
      this.toastService.show('This user is already registered under another company.', 'error');
    } else {
      const errorMsg = errResponse?.message || 'An error occurred while inviting.';
      this.toastService.show(errorMsg, 'error');
    }
  }

  isUserInCompany(email: string): boolean {
    if (!email) return false;
    const cleanEmail = email.toLowerCase().trim();
    return this.activeEmployees().some(e => e.email?.toLowerCase().trim() === cleanEmail) || 
           this.deactivatedEmployees().some(e => e.email?.toLowerCase().trim() === cleanEmail);
  }

  openDeactivateModal(emp: CompanyEmployeeModel) {
    this.selectedEmployeeId.set(emp.employeeId);
    this.selectedEmployeeName.set(emp.fullName || emp.email);
    this.isDeactivateModalOpen.set(true);
  }

  closeDeactivateModal() {
    this.isDeactivateModalOpen.set(false);
    this.selectedEmployeeId.set(null);
  }

  onDeactivated() {
    this.closeDeactivateModal();
    this.activeEmployeesCache.clear();
    this.deactivatedEmployeesCache.clear();
    this.loadStatistics();
    if (this.activeTab() === 'active') this.loadActiveEmployees();
    if (this.activeTab() === 'deactivated') this.loadDeactivatedEmployees();
  }

  openReactivateModal(emp: CompanyEmployeeModel) {
    this.selectedEmployeeId.set(emp.employeeId);
    this.isReactivateModalOpen.set(true);
  }

  closeReactivateModal() {
    this.isReactivateModalOpen.set(false);
    this.selectedEmployeeId.set(null);
  }

  onReactivated() {
    this.closeReactivateModal();
    this.activeEmployeesCache.clear();
    this.deactivatedEmployeesCache.clear();
    this.loadStatistics();
    if (this.activeTab() === 'active') this.loadActiveEmployees();
    if (this.activeTab() === 'deactivated') this.loadDeactivatedEmployees();
  }

  onReactivatedWithSprints(data: any) {
    this.closeReactivateModal();
    this.detectedSprintNames.set(data.plannedSprintNames || []);
    this.detectedSprintIds.set(data.plannedSprintIds || []);
    this.detectedSprintProjectIds.set(data.sprintProjectIds || []);
    this.showSprintAdditionDialog.set(true);
  }

  onSprintAdditionResolved() {
    this.showSprintAdditionDialog.set(false);
    this.detectedSprintNames.set([]);
    this.detectedSprintIds.set([]);
    this.detectedSprintProjectIds.set([]);
    this.activeEmployeesCache.clear();
    this.deactivatedEmployeesCache.clear();
    this.loadStatistics();
    if (this.activeTab() === 'active') this.loadActiveEmployees();
    if (this.activeTab() === 'deactivated') this.loadDeactivatedEmployees();
  }
}
