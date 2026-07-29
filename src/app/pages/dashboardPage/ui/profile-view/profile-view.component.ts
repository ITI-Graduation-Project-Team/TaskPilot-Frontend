import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiClient } from '../../../../shared/api/axios.instance';
import { 
  mapSeniorityLevelToBackend, 
  mapSeniorityLevelToFrontend,
  mapSkillLevelToBackend
} from '../../../../shared/api/profile.service';

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
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="space-y-6 max-w-3xl mx-auto">
      
      @if (isLoading()) {
        <div class="flex items-center justify-center p-12 bg-surface border border-border rounded-2xl shadow-sm">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            <span class="text-sm font-semibold text-text-secondary">{{ 'PROFILE.LOADING' | translate }}</span>
          </div>
        </div>
      } @else {
        
        <!-- Profile Header Card -->
        <div class="bg-surface border border-border rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-6 transition-colors duration-200">
          <div class="flex flex-col sm:flex-row items-center gap-6">
            <div class="w-20 h-20 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center text-3xl font-bold shadow-sm">
              {{ userInitial() }}
            </div>
            <div class="text-center sm:text-left space-y-1">
              <h2 class="text-2xl font-extrabold text-text-primary">{{ profile()?.firstName }} {{ profile()?.lastName }}</h2>
              <p class="text-text-secondary text-sm font-medium">{{ profile()?.jobTitle || ('PROFILE.TEAM_MEMBER' | translate) }}</p>
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
          
          @if (profile()?.isEmployee) {
            <button (click)="openEditModal()" 
                    class="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl
                           shadow-md shadow-primary/20 transition-all duration-200 hover:-translate-y-px active:translate-y-0 text-sm">
              {{ 'PROFILE.EDIT_PROFILE' | translate }}
            </button>
          }
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Core Info -->
          <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm space-y-4 transition-colors duration-200">
            <h3 class="font-bold text-text-primary text-base pb-2 border-b border-border">{{ 'PROFILE.JOB_EXPERIENCE' | translate }}</h3>
            
            <div class="flex justify-between items-center text-sm">
              <span class="text-text-secondary font-medium">{{ 'PROFILE.JOB_TITLE' | translate }}</span>
              <span class="text-text-primary font-semibold">{{ profile()?.jobTitle || ('PROFILE.NA' | translate) }}</span>
            </div>

            <div class="flex justify-between items-center text-sm">
              <span class="text-text-secondary font-medium">{{ 'PROFILE.SENIORITY' | translate }}</span>
              <span class="text-text-primary font-semibold">{{ profile()?.seniorityLevel || ('PROFILE.NA' | translate) }}</span>
            </div>

            @if (profile()?.isEmployee) {
              <div class="flex justify-between items-center text-sm">
                <span class="text-text-secondary font-medium">{{ 'PROFILE.EXPERIENCE_YEARS' | translate }}</span>
                <span class="text-text-primary font-semibold">{{ profile()?.totalYearsOfExperience || 0 }} {{ 'PROFILE.YEARS' | translate }}</span>
              </div>
            }
          </div>

          <!-- Skills Card -->
          @if (profile()?.isEmployee) {
            <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm space-y-4 transition-colors duration-200">
              <h3 class="font-bold text-text-primary text-base pb-2 border-b border-border">{{ 'PROFILE.SKILLS' | translate }}</h3>
              
              <div class="flex flex-wrap gap-2 pt-1">
                @for (skill of profile()?.skills; track skill) {
                  <span class="px-3 py-1 text-xs font-bold bg-primary/10 text-primary border border-primary/20 rounded-xl">
                    {{ skill }}
                  </span>
                } @empty {
                  <span class="text-xs text-text-secondary">{{ 'PROFILE.NO_SKILLS' | translate }}</span>
                }
              </div>
            </div>
          }

        </div>
      }
    </div>

    <!-- Edit Profile Modal Overlay -->
    @if (showModal()) {
      <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-surface border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-border">
            <h3 class="text-lg font-bold text-text-primary">{{ 'PROFILE.UPDATE_SETTINGS' | translate }}</h3>
            <button (click)="closeModal()" class="text-text-secondary hover:text-text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">{{ 'PROFILE.JOB_TITLE' | translate }}</label>
              <input type="text" [(ngModel)]="editForm().jobTitle" 
                     class="w-full px-3.5 py-2 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary transition-all duration-200" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">{{ 'PROFILE.SENIORITY' | translate }}</label>
                <select [(ngModel)]="editForm().seniorityLevel" 
                        class="w-full px-3.5 py-2 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary transition-all duration-200">
                  <option value="Junior">{{ 'PROFILE.LEVELS.JUNIOR' | translate }}</option>
                  <option value="MidLevel">{{ 'PROFILE.LEVELS.MID' | translate }}</option>
                  <option value="Senior">{{ 'PROFILE.LEVELS.SENIOR' | translate }}</option>
                  <option value="Lead">{{ 'PROFILE.LEVELS.LEAD' | translate }}</option>
                </select>
              </div>

              @if (profile()?.isEmployee) {
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">{{ 'PROFILE.YEARS_EXP' | translate }}</label>
                  <input type="number" [(ngModel)]="editForm().totalYearsOfExperience" 
                         class="w-full px-3.5 py-2 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary transition-all duration-200" />
                </div>
              }
            </div>

            <!-- Skills Editor -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">{{ 'PROFILE.SKILLS_COMMA' | translate }}</label>
              <textarea [(ngModel)]="skillsInput" rows="3" [placeholder]="'PROFILE.SKILLS_PLACEHOLDER' | translate"
                        class="w-full px-3.5 py-2 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary transition-all duration-200"></textarea>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <button (click)="closeModal()" class="px-4 py-2 border border-border text-text-secondary hover:text-text-primary rounded-xl">
              {{ 'MODALS.CANCEL' | translate }}
            </button>
            <button (click)="saveProfile()" class="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-md shadow-primary/10">
              {{ 'MODALS.SAVE_CHANGES' | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ProfileViewComponent implements OnInit {
  isLoading = signal(true);
  profile = signal<EmployeeProfile | null>(null);
  userInitial = signal('U');
  private toastService = inject(ToastService);

  // Modal Signals
  showModal = signal(false);
  editForm = signal({
    jobTitle: '',
    seniorityLevel: 'MidLevel',
    totalYearsOfExperience: 0
  });
  skillsInput = '';

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

  openEditModal() {
    const p = this.profile();
    if (p) {
      this.editForm.set({
        jobTitle: p.jobTitle || '',
        seniorityLevel: mapSeniorityLevelToFrontend(p.seniorityLevel),
        totalYearsOfExperience: p.totalYearsOfExperience || 0
      });
      this.skillsInput = (p.skills || []).join(', ');
      this.showModal.set(true);
    }
  }

  closeModal() {
    this.showModal.set(false);
  }

  async saveProfile() {
    const form = this.editForm();
    if (!form.jobTitle.trim()) {
      this.toastService.show('Job title is required.', 'error');
      return;
    }

    // Split and parse skills input
    const skillNames = this.skillsInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (skillNames.length === 0) {
      this.toastService.show('Please enter at least one skill.', 'error');
      return;
    }

    // Build ConfirmCvRequest payload matching backend expectations
    const payload = {
      jobTitle: form.jobTitle,
      seniorityLevel: mapSeniorityLevelToBackend(form.seniorityLevel),
      totalYearsOfExperience: form.totalYearsOfExperience,
      // Marking the first skill as primary by default to satisfy validation
      skills: skillNames.map((name, index) => ({
        name,
        level: mapSkillLevelToBackend('Intermediate'),
        yearsOfExperience: 1,
        isPrimary: index === 0
      }))
    };

    try {
      this.isLoading.set(true);
      await apiClient.post('/employees/cv/confirm', payload);
      this.closeModal();
      await this.loadProfile();
      this.toastService.show('🎉 Profile updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update profile settings:', err);
      this.toastService.show('Failed to update profile details.', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }
}
