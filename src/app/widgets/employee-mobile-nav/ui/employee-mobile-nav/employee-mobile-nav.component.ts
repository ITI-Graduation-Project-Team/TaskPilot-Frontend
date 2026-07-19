import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

type EmployeeTab = 'sprint' | 'current-projects' | 'project-history' | 'profile' | 'calendar';

@Component({
  selector: 'app-employee-mobile-nav-widget',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed bottom-3 start-3 end-3 z-40 md:hidden">
      <div class="border rounded-2xl shadow-2xl flex items-center justify-around py-2 px-1
                  backdrop-blur-xl"
           style="background: color-mix(in srgb, var(--surface) 80%, transparent);
                  border-color: var(--border);">

        <!-- Sprint Board -->
        <button
          (click)="onTabChange('sprint')"
          class="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 relative"
          [class.mobile-tab-active]="currentTab === 'sprint'"
          [style.color]="currentTab !== 'sprint' ? 'var(--text-secondary)' : ''"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"/>
          </svg>
          <span class="text-[9px] font-bold">{{ 'employee.nav.sprint' | translate }}</span>
        </button>

        <!-- Current Projects -->
        <button
          (click)="onTabChange('current-projects')"
          class="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 relative"
          [class.mobile-tab-active]="currentTab === 'current-projects'"
          [style.color]="currentTab !== 'current-projects' ? 'var(--text-secondary)' : ''"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
          </svg>
          <span class="text-[9px] font-bold">{{ 'employee.nav.current' | translate }}</span>
        </button>

        <!-- Project History -->
        <button
          (click)="onTabChange('project-history')"
          class="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 relative"
          [class.mobile-tab-active]="currentTab === 'project-history'"
          [style.color]="currentTab !== 'project-history' ? 'var(--text-secondary)' : ''"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
             <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-[9px] font-bold">{{ 'employee.nav.history' | translate }}</span>
        </button>

        <!-- Calendar -->
        <button
          (click)="onTabChange('calendar')"
          class="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 relative"
          [class.mobile-tab-active]="currentTab === 'calendar'"
          [style.color]="currentTab !== 'calendar' ? 'var(--text-secondary)' : ''"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span class="text-[9px] font-bold">{{ 'calendar.title' | translate }}</span>
        </button>

        <!-- My Profile -->
        <button
          (click)="onTabChange('profile')"
          class="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 relative"
          [class.mobile-tab-active]="currentTab === 'profile'"
          [style.color]="currentTab !== 'profile' ? 'var(--text-secondary)' : ''"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <span class="text-[9px] font-bold">{{ 'employee.nav.profile' | translate }}</span>
        </button>
      </div>
    </div>
  `
})
export class EmployeeMobileNavWidgetComponent {
  @Input({ required: true }) currentTab!: EmployeeTab;
  @Output() tabChange = new EventEmitter<EmployeeTab>();

  onTabChange(tab: EmployeeTab) {
    this.tabChange.emit(tab);
  }
}
