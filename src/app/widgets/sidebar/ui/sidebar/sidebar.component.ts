import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar-widget',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      <!-- Desktop Sidebar Navigation -->
      <aside class="w-64 bg-sidebar border-r border-border hidden md:flex flex-col p-6 transition-colors duration-200 shrink-0">
        <!-- Logo -->
        <div class="flex flex-col gap-2 mb-8 bg-white dark:bg-[#020114] p-4 rounded-2xl border border-border/40 shadow-sm transition-all duration-200">
          <img [src]="isDark ? '/TaskPilotDarkMode.svg' : '/TaskPilotLogo.svg'" alt="TaskPilot Logo" class="h-8 transition-transform hover:scale-105 mx-auto" />
          
          <!-- Company Name Badge -->
          @if (companyName) {
            <div class="text-center mt-0.5">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/15 tracking-wide max-w-full truncate" [title]="companyName">
                🏢 {{ companyName }}
              </span>
            </div>
          }

          <!-- Selected Project Sidebar Header Context -->
          @if (selectedProject; as sp) {
            @if (currentTab !== 'projects') {
              <div class="mt-2 pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider truncate" [title]="sp.nameEn">
                  📁 {{ sp.nameEn }}
                </span>
                <button (click)="onTabChange('projects')" class="text-[10px] text-primary font-bold hover:underline shrink-0">
                  <!-- Optional: Switch -->
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                </button>
              </div>
            }
          }
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 space-y-1.5">
          <!-- All Projects Tab (PM only) -->
          @if (isProjectManager) {
            <a (click)="onTabChange('projects')"
               [class.bg-primary/10]="currentTab === 'projects'"
               [class.text-primary]="currentTab === 'projects'"
               [class.font-bold]="currentTab === 'projects'"
               [class.shadow-sm]="currentTab === 'projects'"
               [class.text-text-secondary]="currentTab !== 'projects'"
               [class.hover:text-text-primary]="currentTab !== 'projects'"
               [class.hover:bg-primary/5]="currentTab !== 'projects'"
               [class.font-medium]="currentTab !== 'projects'"
               class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5 rtl:hover:-translate-x-0.5">
              <svg class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              {{ 'dashboard.header.allProjects' | translate }}
            </a>
          }

          <a (click)="onTabChange('sprint')"
             [class.bg-primary/10]="currentTab === 'sprint'"
             [class.text-primary]="currentTab === 'sprint'"
             [class.font-bold]="currentTab === 'sprint'"
             [class.shadow-sm]="currentTab === 'sprint'"
             [class.text-text-secondary]="currentTab !== 'sprint'"
             [class.hover:text-text-primary]="currentTab !== 'sprint'"
             [class.hover:bg-primary/5]="currentTab !== 'sprint'"
             [class.font-medium]="currentTab !== 'sprint'"
             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            {{ 'dashboard.sidebar.sprints' | translate }}
          </a>
          <a (click)="onTabChange('backlog')"
             [class.bg-primary/10]="currentTab === 'backlog'"
             [class.text-primary]="currentTab === 'backlog'"
             [class.font-bold]="currentTab === 'backlog'"
             [class.shadow-sm]="currentTab === 'backlog'"
             [class.text-text-secondary]="currentTab !== 'backlog'"
             [class.hover:text-text-primary]="currentTab !== 'backlog'"
             [class.hover:bg-primary/5]="currentTab !== 'backlog'"
             [class.font-medium]="currentTab !== 'backlog'"
             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {{ 'dashboard.sidebar.backlog' | translate }}
          </a>
          @if (isProjectManager) {
            <!-- Sprint Planning tab (PM only) -->
            <a (click)="onTabChange('sprint-planning')"
               [class.bg-primary/10]="currentTab === 'sprint-planning'"
               [class.text-primary]="currentTab === 'sprint-planning'"
               [class.font-bold]="currentTab === 'sprint-planning'"
               [class.shadow-sm]="currentTab === 'sprint-planning'"
               [class.text-text-secondary]="currentTab !== 'sprint-planning'"
               [class.hover:text-text-primary]="currentTab !== 'sprint-planning'"
               [class.hover:bg-primary/5]="currentTab !== 'sprint-planning'"
               [class.font-medium]="currentTab !== 'sprint-planning'"
               class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
              <svg class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              {{ 'dashboard.sidebar.sprintPlanning' | translate }}
              <span class="ms-auto text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">{{ 'dashboard.sidebar.ai' | translate }}</span>
            </a>
          }

          @if (isProjectManager) {
            <a (click)="onTabChange('team')"
               [class.bg-primary/10]="currentTab === 'team'"
               [class.text-primary]="currentTab === 'team'"
               [class.font-bold]="currentTab === 'team'"
               [class.shadow-sm]="currentTab === 'team'"
               [class.text-text-secondary]="currentTab !== 'team'"
               [class.hover:text-text-primary]="currentTab !== 'team'"
               [class.hover:bg-primary/5]="currentTab !== 'team'"
               [class.font-medium]="currentTab !== 'team'"
               class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5 rtl:hover:-translate-x-0.5">
              <svg class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              {{ 'dashboard.sidebar.team' | translate }}
            </a>
          }
          
          <!-- Organization Hub / Company Policies Tab -->
          <a (click)="onTabChange('organization')"
             [class.bg-primary/10]="currentTab === 'organization'"
             [class.text-primary]="currentTab === 'organization'"
             [class.font-bold]="currentTab === 'organization'"
             [class.shadow-sm]="currentTab === 'organization'"
             [class.text-text-secondary]="currentTab !== 'organization'"
             [class.hover:text-text-primary]="currentTab !== 'organization'"
             [class.hover:bg-primary/5]="currentTab !== 'organization'"
             [class.font-medium]="currentTab !== 'organization'"
             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5 rtl:hover:-translate-x-0.5">
            <svg class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            @if (isProjectManager) {
              {{ 'dashboard.header.organizationHub' | translate }}
            } @else {
              {{ 'dashboard.header.companyPolicies' | translate }}
            }
          </a>

          <a (click)="onTabChange('profile')"
             [class.bg-primary/10]="currentTab === 'profile'"
             [class.text-primary]="currentTab === 'profile'"
             [class.font-bold]="currentTab === 'profile'"
             [class.shadow-sm]="currentTab === 'profile'"
             [class.text-text-secondary]="currentTab !== 'profile'"
             [class.hover:text-text-primary]="currentTab !== 'profile'"
             [class.hover:bg-primary/5]="currentTab !== 'profile'"
             [class.font-medium]="currentTab !== 'profile'"
             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5 rtl:hover:-translate-x-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {{ 'dashboard.header.myProfile' | translate }}
          </a>
        </nav>

        <!-- Footer / Profile Quick view & Dark mode -->
        <div class="border-t border-border pt-6 mt-6 space-y-4">
          <div (click)="onTabChange('profile')" class="cursor-pointer flex items-center gap-3 bg-surface border border-border p-3.5 rounded-xl transition-all duration-250 hover:border-primary/40 hover:shadow-sm">
            <div class="w-9 h-9 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0">
              {{ userInitial }}
            </div>
            <div class="min-w-0">
              <h4 class="text-xs font-extrabold text-text-primary truncate">{{ userName }}</h4>
              <p class="text-[10px] text-text-secondary truncate">{{ userJobTitle ? ('roles.' + userJobTitle | translate) : '' }}</p>
            </div>
          </div>
        </div>
      </aside>
  `
})
export class SidebarWidgetComponent {
  @Input({ required: true }) isDark!: boolean;
  @Input() companyName?: string | null;
  @Input() selectedProject?: any | null;
  @Input({ required: true }) currentTab!: 'projects' | 'sprint' | 'backlog' | 'sprint-planning' | 'team' | 'organization' | 'profile' | 'create-project';
  @Input({ required: true }) isProjectManager!: boolean;
  @Input({ required: true }) userInitial!: string;
  @Input({ required: true }) userName!: string;
  @Input({ required: true }) userJobTitle!: string;

  @Output() tabChange = new EventEmitter<'projects' | 'sprint' | 'backlog' | 'sprint-planning' | 'team' | 'organization' | 'profile' | 'create-project'>();

  onTabChange(tab: 'projects' | 'sprint' | 'backlog' | 'sprint-planning' | 'team' | 'organization' | 'profile' | 'create-project') {
    this.tabChange.emit(tab);
  }
}
