import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyService, UpdateWorkingConfigDto } from '../../shared/api/Company-api/company';
import { ProjectStateService } from '../../shared/services/project-state.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-company-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <section class="bg-[#FAFAFA] rounded-lg shadow-sm p-6 mb-8 max-w-2xl border border-gray-100 dark:bg-surface dark:border-border transition-colors">
      <h2 class="text-xl font-medium mb-2 text-text-primary">{{ 'COMPANY_CAPACITY.TITLE' | translate }}</h2>
      <p class="text-text-secondary mb-6">{{ 'COMPANY_CAPACITY.DESC' | translate }}</p>
      
      <form (ngSubmit)="saveConfig()" class="space-y-6">
        
        <!-- Working Hours Per Day -->
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1">{{ 'COMPANY_CAPACITY.WORKING_HOURS' | translate }}</label>
          <input 
            type="number" 
            [(ngModel)]="workingHoursPerDay" 
            name="workingHours" 
            min="1" 
            max="24"
            step="0.5"
            class="w-full px-3 py-2 bg-background text-text-primary border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
          />
        </div>

        <!-- Working Days (Mask) -->
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1">{{ 'COMPANY_CAPACITY.WORKING_DAYS' | translate }}</label>
          <div class="flex flex-wrap gap-3 mt-2">
            @for (day of daysOfWeek; track day.value) {
              <label class="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  [checked]="isDaySelected(day.value)"
                  (change)="toggleDay(day.value)"
                  class="rounded border-border text-primary focus:ring-primary"
                />
                <span class="text-sm text-text-primary">{{ 'COMPANY_CAPACITY.' + day.name | uppercase | translate }}</span>
              </label>
            }
          </div>
        </div>

        <!-- Default Capacity Buffer Percentage -->
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1">{{ 'COMPANY_CAPACITY.DEFAULT_BUFFER' | translate }}</label>
          <input 
            type="number" 
            [(ngModel)]="defaultCapacityBufferPercentage" 
            name="bufferPercentage" 
            min="0" 
            max="1"
            step="0.05"
            class="w-full px-3 py-2 bg-background text-text-primary border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
          />
        </div>

        <!-- Save Button -->
        <div class="pt-4 border-t border-border">
          <button 
            type="submit" 
            [disabled]="isSaving()"
            class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]">
            @if (isSaving()) {
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ 'COMPANY_CAPACITY.SAVING' | translate }}
            } @else {
              {{ 'COMPANY_CAPACITY.SAVE' | translate }}
            }
          </button>

          @if (successMessage()) {
            <p class="mt-3 text-sm text-green-600">{{ successMessage() }}</p>
          }
          @if (errorMessage()) {
            <p class="mt-3 text-sm text-red-600">{{ errorMessage() }}</p>
          }
        </div>
      </form>
    </section>
  `
})
export class CompanySettingsComponent implements OnInit {
  private companyService = inject(CompanyService);
  private projectState = inject(ProjectStateService);
  public translate = inject(TranslateService);

  workingHoursPerDay = signal(8.0);
  workingDaysMask = signal(62); // Default to Mon-Fri (2+4+8+16+32)
  defaultCapacityBufferPercentage = signal(0.8);

  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  daysOfWeek = [
    { name: 'Sun', value: 1 },
    { name: 'Mon', value: 2 },
    { name: 'Tue', value: 4 },
    { name: 'Wed', value: 8 },
    { name: 'Thu', value: 16 },
    { name: 'Fri', value: 32 },
    { name: 'Sat', value: 64 },
  ];

  async ngOnInit() {
    const companyId = this.projectState.userCompanyId();
    if (companyId) {
      try {
        const res = await this.companyService.getWorkingConfig(companyId);
        if (res.succeeded && res.data) {
          this.workingHoursPerDay.set(res.data.workingHoursPerDay);
          this.workingDaysMask.set(res.data.workingDaysMask);
          this.defaultCapacityBufferPercentage.set(res.data.defaultCapacityBufferPercentage);
        }
      } catch (err) {
        console.warn('Failed to fetch existing sprint capacity config', err);
      }
    }
  }

  isDaySelected(dayValue: number): boolean {
    return (this.workingDaysMask() & dayValue) !== 0;
  }

  toggleDay(dayValue: number) {
    const currentMask = this.workingDaysMask();
    if ((currentMask & dayValue) !== 0) {
      // Day is selected, unselect it
      this.workingDaysMask.set(currentMask & ~dayValue);
    } else {
      // Day is unselected, select it
      this.workingDaysMask.set(currentMask | dayValue);
    }
  }

  async saveConfig() {
    this.successMessage.set('');
    this.errorMessage.set('');

    const companyId = this.projectState.userCompanyId();
    if (!companyId) {
      this.errorMessage.set('Could not identify company from your session.');
      return;
    }

    this.isSaving.set(true);

    try {
      const res = await this.companyService.updateWorkingConfig(companyId, {
        workingHoursPerDay: this.workingHoursPerDay(),
        workingDaysMask: this.workingDaysMask(),
        defaultCapacityBufferPercentage: this.defaultCapacityBufferPercentage()
      });

      if (res.succeeded) {
        this.successMessage.set(this.translate.instant('COMPANY_CAPACITY.SUCCESS'));
      } else {
        this.errorMessage.set(res.message || this.translate.instant('COMPANY_CAPACITY.ERROR'));
      }
    } catch (err: any) {
      this.errorMessage.set(err.message || this.translate.instant('COMPANY_CAPACITY.ERROR'));
    } finally {
      this.isSaving.set(false);
    }
  }
}
