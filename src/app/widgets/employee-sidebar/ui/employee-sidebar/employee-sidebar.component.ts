import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ProjectStateService, ProjectInfo } from '../../../../shared/services/project-state.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import { AuthService } from '../../../../shared/api/auth.service';

type EmployeeTab = 'sprint' | 'current-projects' | 'project-history' | 'profile' | 'calendar';

@Component({
  selector: 'app-employee-sidebar-widget',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="w-64 hidden md:flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto
                  glass-sidebar transition-all duration-300 pb-4">

      <!-- Logo Block -->
      <div class="p-5 pb-3">
        <div class="flex flex-col gap-2 p-4 rounded-2xl border transition-all duration-200 hover:shadow-md"
             style="background: var(--surface); border-color: var(--border);">
          <img
            [src]="isDark() ? '/TaskPilotDarkMode.svg' : '/TaskPilotLogo.svg'"
            alt="TaskPilot"
            class="h-8 mx-auto transition-transform hover:scale-105"
          />

          <!-- Company Badge -->
          @if (projectState.companyName()) {
            <div class="text-center">
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                           text-[10px] font-extrabold tracking-wide max-w-full truncate
                           border border-primary/20"
                    style="background: rgba(59,91,219,0.1); color: var(--primary);"
                    [title]="projectState.companyName()">
                <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                {{ projectState.companyName() }}
              </span>
            </div>
          }

          <!-- Active project chip -->
          @if (projectState.selectedProject(); as sp) {
            <div class="pt-2 border-t flex items-center gap-2" style="border-color: var(--border);">
              <svg class="w-3 h-3 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                   style="color: var(--text-secondary);">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
              </svg>
              <span class="text-[10px] font-bold truncate"
                    style="color: var(--text-secondary);"
                    [title]="sp.nameEn">
                {{ sp.nameEn }}
              </span>
            </div>
          }
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 px-3 space-y-0.5">

        @if (projectState.selectedProject()?.status !== 'Completed' && projectState.selectedProject()?.status !== 'Archived') {
          <!-- Active Sprint -->
          <button
            (click)="onTabChange('sprint')"
            class="group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm"
            [class.nav-item-active]="currentTab === 'sprint'"
            [style.color]="currentTab !== 'sprint' ? 'var(--text-secondary)' : ''"
          >
            <svg class="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"/>
            </svg>
            <span class="flex-1 text-start">{{ 'employee.nav.sprintBoard' | translate }}</span>
            <!-- Live pulse when sprint is active -->
            @if (currentTab === 'sprint' && hasActiveSprint) {
              <span class="w-2 h-2 rounded-full bg-success animate-pulse-dot shrink-0"
                    style="background: var(--success);"></span>
            }
          </button>
        }

        <!-- Current Projects -->
        <button
          (click)="onTabChange('current-projects')"
          class="group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm"
          [class.nav-item-active]="currentTab === 'current-projects'"
          [style.color]="currentTab !== 'current-projects' ? 'var(--text-secondary)' : ''"
        >
          <svg class="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
               fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
          </svg>
          <span class="text-start">{{ 'employee.nav.currentProjects' | translate }}</span>
        </button>

        <!-- Project History -->
        <button
          (click)="onTabChange('project-history')"
          class="group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm"
          [class.nav-item-active]="currentTab === 'project-history'"
          [style.color]="currentTab !== 'project-history' ? 'var(--text-secondary)' : ''"
        >
          <svg class="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
               fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-start">{{ 'employee.nav.projectHistory' | translate }}</span>
        </button>

        <!-- Calendar -->
        <button
          (click)="onTabChange('calendar')"
          class="group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm"
          [class.nav-item-active]="currentTab === 'calendar'"
          [style.color]="currentTab !== 'calendar' ? 'var(--text-secondary)' : ''"
        >
          <svg class="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
               fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span class="text-start">{{ 'calendar.title' | translate }}</span>
        </button>

        <!-- My Profile -->
        <button
          (click)="onTabChange('profile')"
          class="group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm"
          [class.nav-item-active]="currentTab === 'profile'"
          [style.color]="currentTab !== 'profile' ? 'var(--text-secondary)' : ''"
        >
          <svg class="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
               fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <span class="text-start">{{ 'employee.nav.myProfile' | translate }}</span>
        </button>

        <!-- Project Switcher (if multiple projects) -->
        @if (projectState.projects().length > 1) {
          <div class="pt-3 mt-2 border-t" style="border-color: var(--border);">
            <p class="px-4 mb-2 text-[10px] font-extrabold uppercase tracking-widest"
               style="color: var(--text-secondary);">
              {{ 'employee.nav.myProjects' | translate }}
            </p>
            @for (p of projectState.projects(); track p.id) {
              <button
                (click)="onSelectProject(p.id)"
                class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm"
                [class.bg-primary/10]="p.id === projectState.selectedProjectId()"
                [style.color]="p.id === projectState.selectedProjectId() ? 'var(--primary)' : 'var(--text-secondary)'"
              >
                <div class="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white text-[10px] font-extrabold"
                     [style.background]="getProjectColor(p.id)">
                  {{ (p.nameEn || '?')[0].toUpperCase() }}
                </div>
                <span class="text-start truncate flex-1 text-xs font-semibold">{{ p.nameEn }}</span>
                @if (p.id === projectState.selectedProjectId()) {
                  <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                }
              </button>
            }
          </div>
        }
      </nav>

      <!-- Sidebar Footer — User Card & Actions -->
      <div class="px-3 pt-3 border-t mt-3 space-y-2" style="border-color: var(--border);">
        <button
          (click)="onTabChange('profile')"
          class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 group"
          style="background: var(--surface); border-color: var(--border);"
        >
          <!-- Gradient avatar -->
          <div class="w-9 h-9 rounded-full flex items-center justify-center font-extrabold
                      text-sm text-white shrink-0 shadow-sm"
               [style.background]="avatarGradient()">
            {{ userInitial() }}
          </div>
          <div class="min-w-0 flex-1 text-start">
            <p class="text-xs font-extrabold truncate transition-colors duration-200"
               style="color: var(--text-primary);">{{ userName() }}</p>
            <p class="text-[10px] truncate mt-0.5" style="color: var(--text-secondary);">
              {{ userJobTitle() ? ('roles.' + userJobTitle() | translate) : ('employee.sidebar.employee' | translate) }}
            </p>
          </div>
          <!-- Online indicator -->
          <div class="w-2 h-2 rounded-full shrink-0" style="background: var(--success);"></div>
        </button>
        
        <button
          (click)="logout()"
          class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 group hover:bg-error/10"
          style="background: transparent; border-color: var(--border); color: var(--error);"
        >
          <div class="w-9 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </div>
          <span class="text-xs font-extrabold flex-1 text-start">{{ 'employee.header.logout' | translate }}</span>
        </button>
      </div>
    </aside>
  `
})
export class EmployeeSidebarWidgetComponent {
  public projectState = inject(ProjectStateService);
  private theme = inject(ThemeService);
  private auth = inject(AuthService);

  @Input({ required: true }) currentTab!: EmployeeTab;
  @Input({ required: true }) hasActiveSprint!: boolean;
  @Input({ required: true }) userName!: () => string;
  @Input({ required: true }) userJobTitle!: () => string;
  @Input({ required: true }) userInitial!: () => string;
  @Input({ required: true }) avatarGradient!: () => string;

  @Output() tabChange = new EventEmitter<EmployeeTab>();
  @Output() selectProject = new EventEmitter<string>();

  isDark = this.theme.isDark;

  onTabChange(tab: EmployeeTab) {
    this.tabChange.emit(tab);
  }

  onSelectProject(projectId: string) {
    this.selectProject.emit(projectId);
  }

  logout() {
    this.auth.logout();
  }

  getProjectColor(id: string): string {
    const colors = ['#3B5BDB', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
    return colors[hash % colors.length];
  }
}
