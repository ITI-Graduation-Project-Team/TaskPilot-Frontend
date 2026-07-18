import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

type TabType = 'projects' | 'sprint' | 'backlog' | 'sprint-planning' | 'team' | 'organization' | 'profile' | 'create-project';

@Component({
  selector: 'app-mobile-nav-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Mobile Bottom Navigation Bar -->
    <div class="fixed bottom-4 left-4 right-4 z-40 bg-surface/75 backdrop-blur-xl border border-border flex items-center justify-around py-2.5 md:hidden rounded-2xl shadow-xl transition-all duration-300">
      
      <!-- Projects Hub Tab (Mobile PM) -->
      @if (isProjectManager) {
        <button (click)="onTabChange('projects')" 
                class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
                [class.text-primary]="currentTab === 'projects'"
                [class.scale-105]="currentTab === 'projects'"
                [class.text-text-secondary]="currentTab !== 'projects'">
          <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          <span class="text-[9px] font-bold">Projects</span>
        </button>
      }

      <!-- Sprint Tab -->
      <button (click)="onTabChange('sprint')" 
              class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
              [class.text-primary]="currentTab === 'sprint'"
              [class.scale-105]="currentTab === 'sprint'"
              [class.text-text-secondary]="currentTab !== 'sprint'">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
        <span class="text-[9px] font-bold">Sprint</span>
      </button>

      <!-- Sprint Planning Tab (Mobile PM) -->
      @if (isProjectManager) {
        <button (click)="onTabChange('sprint-planning')"
                class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
                [class.text-primary]="currentTab === 'sprint-planning'"
                [class.scale-105]="currentTab === 'sprint-planning'"
                [class.text-text-secondary]="currentTab !== 'sprint-planning'">
          <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <span class="text-[9px] font-bold">Planning</span>
        </button>
      }

      <!-- Backlog Tab -->
      <button (click)="onTabChange('backlog')" 
              class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
              [class.text-primary]="currentTab === 'backlog'"
              [class.scale-105]="currentTab === 'backlog'"
              [class.text-text-secondary]="currentTab !== 'backlog'">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span class="text-[9px] font-bold">Backlog</span>
      </button>

      <!-- Mobile Team Tab -->
      @if (isProjectManager) {
        <button (click)="onTabChange('team')" 
                class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
                [class.text-primary]="currentTab === 'team'"
                [class.scale-105]="currentTab === 'team'"
                [class.text-text-secondary]="currentTab !== 'team'">
          <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          <span class="text-[9px] font-bold">Team</span>
        </button>
      }

      <!-- Profile Tab -->
      <button (click)="onTabChange('profile')" 
              class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
              [class.text-primary]="currentTab === 'profile'"
              [class.scale-105]="currentTab === 'profile'"
              [class.text-text-secondary]="currentTab !== 'profile'">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span class="text-[9px] font-bold">Profile</span>
      </button>
    </div>
  `
})
export class MobileNavWidgetComponent {
  @Input({ required: true }) currentTab!: TabType;
  @Input({ required: true }) isProjectManager!: boolean;

  @Output() tabChange = new EventEmitter<TabType>();

  onTabChange(tab: TabType) {
    this.tabChange.emit(tab);
  }
}
