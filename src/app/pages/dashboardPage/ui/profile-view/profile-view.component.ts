import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { apiClient } from '../../../../shared/api/axios.instance';

interface EmployeeProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  seniorityLevel: string;
  totalYearsOfExperience: number;
  isEmployee: boolean;
  skills: string[];
}

@Component({
  selector: 'app-profile-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 max-w-3xl mx-auto">
      
      @if (isLoading()) {
        <div class="flex items-center justify-center p-12 bg-surface border border-border rounded-2xl shadow-sm">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            <span class="text-sm font-semibold text-text-secondary">Loading Profile Details...</span>
          </div>
        </div>
      } @else {
        
        <!-- Profile Header Card -->
        <div class="bg-surface border border-border rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6 transition-colors duration-200">
          <div class="w-20 h-20 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center text-3xl font-bold shadow-sm">
            {{ userInitial() }}
          </div>
          <div class="text-center sm:text-left space-y-1">
            <h2 class="text-2xl font-extrabold text-text-primary">{{ profile()?.firstName }} {{ profile()?.lastName }}</h2>
            <p class="text-text-secondary text-sm font-medium">{{ profile()?.jobTitle || 'Team Member' }}</p>
            <div class="flex items-center gap-2 justify-center sm:justify-start pt-1.5 flex-wrap">
              <span class="px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full">
                {{ profile()?.seniorityLevel }}
              </span>
              <span class="px-2.5 py-0.5 text-xs font-semibold bg-gray-200 dark:bg-border text-text-secondary rounded-full">
                {{ profile()?.email }}
              </span>
            </div>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Core Info -->
          <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm space-y-4 transition-colors duration-200">
            <h3 class="font-bold text-text-primary text-base pb-2 border-b border-border">Job Experience</h3>
            
            <div class="flex justify-between items-center text-sm">
              <span class="text-text-secondary font-medium">Job Title</span>
              <span class="text-text-primary font-semibold">{{ profile()?.jobTitle || 'N/A' }}</span>
            </div>

            <div class="flex justify-between items-center text-sm">
              <span class="text-text-secondary font-medium">Seniority Level</span>
              <span class="text-text-primary font-semibold">{{ profile()?.seniorityLevel || 'N/A' }}</span>
            </div>

            <div class="flex justify-between items-center text-sm">
              <span class="text-text-secondary font-medium">Experience (Years)</span>
              <span class="text-text-primary font-semibold">{{ profile()?.totalYearsOfExperience || 0 }} Years</span>
            </div>
          </div>

          <!-- Skills Card -->
          <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm space-y-4 transition-colors duration-200">
            <h3 class="font-bold text-text-primary text-base pb-2 border-b border-border">Skills & Technologies</h3>
            
            <div class="flex flex-wrap gap-2 pt-1">
              @for (skill of profile()?.skills; track skill) {
                <span class="px-3 py-1 text-xs font-bold bg-primary/10 text-primary border border-primary/20 rounded-xl">
                  {{ skill }}
                </span>
              } @empty {
                <span class="text-xs text-text-secondary">No skills listed in profile.</span>
              }
            </div>
          </div>

        </div>
      }
    </div>
  `
})
export class ProfileViewComponent implements OnInit {
  isLoading = signal(true);
  profile = signal<EmployeeProfile | null>(null);
  userInitial = signal('U');

  async ngOnInit() {
    try {
      this.isLoading.set(true);
      await this.loadProfile();
    } catch (e) {
      console.error('Error loading employee profile page:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadProfile() {
    const { data } = await apiClient.get<any>('/employees/profile');
    if (data.succeeded && data.data) {
      this.profile.set(data.data);
      const name = `${data.data.firstName} ${data.data.lastName}`;
      this.userInitial.set(name.trim().charAt(0).toUpperCase() || 'U');
    } else {
      this.profile.set(data);
      const name = `${data.firstName} ${data.lastName}`;
      this.userInitial.set(name.trim().charAt(0).toUpperCase() || 'U');
    }
  }
}
