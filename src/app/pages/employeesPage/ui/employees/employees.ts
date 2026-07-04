import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CompanyService, EmployeeModel, InvitationModel } from '../../../../shared/api/Company-api/company';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './employees.html',
  styleUrls: ['./employees.scss']
})
export class EmployeesComponent implements OnInit {
  companyService = inject(CompanyService);

  activeTab = signal<'active' | 'invitations'>('active');
  
  // Active Employees State
  activeEmployees = signal<InvitationModel[]>([]);
  localSearchQuery = signal<string>(''); // For filtering the table locally
  isLoadingEmployees = signal<boolean>(false);
  activeEmployeesPage = signal<number>(1);
  totalActiveEmployees = signal<number>(0);

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
  searchResults = signal<EmployeeModel[]>([]);
  isSearchingSystem = signal<boolean>(false);
  isInviting = signal<boolean>(false);
  companyEmployees = signal<EmployeeModel[]>([]);


  ngOnInit() {
    this.loadEmployees();
    this.loadInvitations();
  }

  async loadEmployees() {
    try {
      this.isLoadingEmployees.set(true);
      // Fetch accepted invitations
      const res = await this.companyService.getInvitations('accepted', this.activeEmployeesPage(), this.pageSize());
      if (res.succeeded && res.data) {
        this.activeEmployees.set(res.data.items);
        this.totalActiveEmployees.set(res.data.totalCount);
      } else {
        this.activeEmployees.set([]);
        this.totalActiveEmployees.set(0);
      }
    } catch (e) {
      console.error(e);
      this.activeEmployees.set([]);
    } finally {
      this.isLoadingEmployees.set(false);
    }
  }

  get filteredEmployees() {
    const q = this.localSearchQuery().toLowerCase().trim();
    if (!q) return this.activeEmployees();
    return this.activeEmployees().filter(e => e.email?.toLowerCase().includes(q));
  }

  async loadInvitations() {
    try {
      this.isLoadingInvitations.set(true);
      const res = await this.companyService.getInvitations(
        this.invitationStatus() || undefined,
        this.currentPage(),
        this.pageSize()
      );
      if (res.succeeded && res.data) {
        this.invitations.set(res.data.items);
        this.totalInvitations.set(res.data.totalCount);
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
      this.loadEmployees();
    }
  }

  nextActivePage() {
    const maxPage = Math.ceil(this.totalActiveEmployees() / this.pageSize());
    if (this.activeEmployeesPage() < maxPage) {
      this.activeEmployeesPage.set(this.activeEmployeesPage() + 1);
      this.loadEmployees();
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
    this.isInviteModalOpen.set(true);

    try {
      // Use 50 instead of 9999 in case the backend rejects large page sizes
      const res = await this.companyService.getInvitations('accepted', 1, 50);
      if (res.succeeded && res.data) {
        this.companyEmployees.set(res.data.items as any[]);
      }
    } catch (e) {
      console.error('Failed to load company employees', e);
    }
  }

  closeInviteModal() {
    this.isInviteModalOpen.set(false);
  }

  // Timer for debounce
  private searchTimeout: any;

  onSystemSearchChange() {
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
    }, 400); // 400ms debounce
  }

  async inviteEmail(email: string) {
    if (!email.trim()) return;

    try {
      this.isInviting.set(true);
      const res = await this.companyService.inviteEmployees([email.trim()]);
      if (res.succeeded) {
        // Optionally show success toast
        this.loadInvitations();
        this.closeInviteModal();
      } else {
        alert(res.message || 'Failed to invite.');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred while inviting.');
    } finally {
      this.isInviting.set(false);
    }
  }

  isUserInCompany(email: string): boolean {
    if (!email) return false;
    const cleanEmail = email.toLowerCase().trim();
    return this.companyEmployees().some(e => e.email?.toLowerCase().trim() === cleanEmail);
  }
}

