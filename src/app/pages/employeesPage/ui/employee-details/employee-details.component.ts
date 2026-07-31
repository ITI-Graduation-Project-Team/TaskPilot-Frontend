import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CompanyService, CompanyEmployeeModel } from '../../../../shared/api/Company-api/company';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-employee-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-full flex flex-col gap-8 animate-fade-in relative">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <button (click)="goBack()" class="p-2 text-slate-400 hover:text-brandPrimary hover:bg-blue-50 rounded-lg transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 class="text-3xl font-extrabold text-brandNavy tracking-tight mb-1">Employee Details</h1>
          <p class="text-slate-500 text-sm">View comprehensive information about this team member.</p>
        </div>
      </div>

      <div *ngIf="isLoading()" class="flex flex-col items-center justify-center py-20">
        <svg class="animate-spin h-10 w-10 text-brandPrimary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="mt-4 text-slate-500 font-medium">Loading employee information...</span>
      </div>

      <div *ngIf="!isLoading() && employee()" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Profile Column -->
        <div class="lg:col-span-1 flex flex-col gap-6">
          <div class="bg-brandWhite rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-brandPrimary to-brandAccent opacity-10"></div>
            
            <div [ngClass]="employee()!.isDeactivated ? 'from-slate-400 to-slate-500 opacity-60' : 'from-brandTeal to-brandBlue'"
                 class="w-24 h-24 rounded-full bg-gradient-to-tr flex items-center justify-center text-white text-3xl font-bold shadow-lg mt-4 mb-4 z-10 border-4 border-white">
              {{ employee()!.email ? employee()!.email[0].toUpperCase() : 'U' }}
            </div>
            
            <h2 class="text-xl font-bold text-brandNavy" [ngClass]="employee()!.isDeactivated ? 'text-slate-500' : ''">
              {{ employee()!.fullName || 'TaskPilot Member' }}
            </h2>
            <p class="text-sm text-slate-500 mb-4">{{ employee()!.email }}</p>
            
            <div class="flex gap-2 justify-center w-full mb-2">
              <span *ngIf="!employee()!.isDeactivated" class="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Active
              </span>
              <span *ngIf="employee()!.isDeactivated" class="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                <span class="w-2 h-2 rounded-full bg-slate-400"></span> Deactivated
              </span>
              
              <span *ngIf="!employee()!.isDeactivated && employee()!.availabilityStatus" 
                    class="inline-flex items-center gap-1 py-1 px-3 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">
                {{ employee()!.availabilityStatus }}
              </span>
            </div>
          </div>

          <!-- Skills Card -->
          <div class="bg-brandWhite rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 class="text-lg font-bold text-brandNavy mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-brandPrimary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Skills & Expertise
            </h3>
            
            <div class="flex flex-wrap gap-2" *ngIf="employee()!.skills.length; else noSkills">
              <span *ngFor="let skill of employee()!.skills" class="px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg border border-slate-200 hover:border-brandPrimary/30 hover:bg-blue-50 transition-colors">
                {{ skill }}
              </span>
            </div>
            <ng-template #noSkills>
              <p class="text-sm text-slate-500 italic">No skills listed.</p>
            </ng-template>
          </div>
        </div>

        <!-- Details Column -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          
          <!-- Professional Information -->
          <div class="bg-brandWhite rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 class="text-lg font-bold text-brandNavy mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-brandPrimary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Professional Information
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-1">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Job Title</span>
                <span class="text-sm font-semibold text-brandNavy">{{ employee()!.jobTitle || 'Not specified' }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Seniority Level</span>
                <span class="text-sm font-semibold text-brandNavy">{{ employee()!.seniorityLevel || 'Not specified' }}</span>
              </div>
            </div>
          </div>

          <!-- Workload & Projects -->
          <div class="bg-brandWhite rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 class="text-lg font-bold text-brandNavy mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-brandPrimary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Current Workload
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-brandPrimary">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <div>
                  <div class="text-2xl font-extrabold text-brandNavy">{{ employee()!.activeProjectsCount }}</div>
                  <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Projects</div>
                </div>
              </div>
              
              <div class="p-4 bg-purple-50 border border-purple-100 rounded-xl flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                </div>
                <div>
                  <div class="text-2xl font-extrabold text-brandNavy">{{ employee()!.currentAssignedTasksCount }}</div>
                  <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Tasks</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Deactivation Information (If Deactivated) -->
          <div *ngIf="employee()!.isDeactivated" class="bg-red-50 rounded-3xl p-6 shadow-sm border border-red-100">
            <h3 class="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Deactivation Information
            </h3>
            
            <div class="flex flex-col gap-4">
              <div>
                <span class="text-xs font-bold text-red-400 uppercase tracking-wider block mb-1">Deactivated On</span>
                <span class="text-sm font-semibold text-red-900">{{ employee()!.deactivatedAt | date:'medium' }}</span>
              </div>
              <div *ngIf="employee()!.deactivationReason">
                <span class="text-xs font-bold text-red-400 uppercase tracking-wider block mb-1">Reason</span>
                <p class="text-sm text-red-900 italic border-l-2 border-red-300 pl-3 py-1 bg-red-100/50 rounded-r-lg">
                  "{{ employee()!.deactivationReason }}"
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
      <div *ngIf="!isLoading() && !employee()" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-brandNavy mb-1">Employee Not Found</h3>
        <p class="text-slate-500 mb-6 text-sm">The employee you are looking for does not exist or you don't have access.</p>
        <button (click)="goBack()" class="px-5 py-2.5 rounded-xl font-bold bg-brandPrimary text-white hover:bg-blue-700 transition-colors">
          Return to Directory
        </button>
      </div>
    </div>
  `
})
export class EmployeeDetailsComponent implements OnInit {
  route = inject(ActivatedRoute);
  location = inject(Location);
  companyService = inject(CompanyService);
  toastService = inject(ToastService);

  employee = signal<CompanyEmployeeModel | null>(null);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadEmployee(id);
      } else {
        this.isLoading.set(false);
      }
    });
  }

  async loadEmployee(id: string) {
    try {
      this.isLoading.set(true);
      const res = await this.companyService.getCompanyEmployeeById(id);
      if (res.succeeded && res.data) {
        this.employee.set(res.data);
      } else {
        this.toastService.show('Employee not found.', 'error');
      }
    } catch (e) {
      console.error(e);
      this.toastService.show('Failed to load employee details.', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack() {
    this.location.back();
  }
}
