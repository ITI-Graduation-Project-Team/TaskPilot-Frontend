import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationBellComponent } from '../../../../../shared/ui/notification-bell/notification-bell';

type TabType = 'projects' | 'sprint' | 'backlog' | 'sprint-planning' | 'team' | 'organization' | 'profile' | 'create-project';

@Component({
  selector: 'app-header-widget',
  standalone: true,
  imports: [CommonModule, RouterLink, NotificationBellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Header -->
    <header class="h-16 border-b border-border bg-surface flex items-center justify-between px-6 md:px-8 transition-colors duration-200 shrink-0">
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-extrabold text-text-primary font-display flex items-center gap-1.5">
          @if (currentTab === 'projects') {
            Projects Hub
          } @else if (currentTab === 'create-project') {
            Create Project
          } @else if (currentTab === 'profile') {
            My Profile
          } @else if (currentTab === 'sprint-planning') {
            @if (isProjectManager) {
              <span class="text-text-secondary hover:text-text-primary cursor-pointer transition-colors" (click)="onTabChange('projects')">All Projects</span>
              <span class="text-text-secondary font-light">/</span>
            }
            <span class="truncate max-w-[200px]">{{ selectedProject?.nameEn || 'Workspace' }}</span>
            <span class="text-text-secondary font-light">/</span>
            Sprint Planning
          } @else if (currentTab === 'organization') {
            @if (isProjectManager) { Organization Hub } @else { Company Policies }
          } @else {
            <!-- Breadcrumbs inside project tabs -->
            @if (isProjectManager) {
              <span class="text-text-secondary hover:text-text-primary cursor-pointer transition-colors" (click)="onTabChange('projects')">All Projects</span>
              <span class="text-text-secondary font-light">/</span>
            }
            <span class="truncate max-w-[200px]">{{ selectedProject?.nameEn || 'Workspace' }}</span>
          }
        </h1>
        
        @if (selectedProject?.status === 'Completed') {
          <span class="px-2.5 py-0.5 text-xs font-semibold bg-blue-500/15 text-blue-600 rounded-full font-mono uppercase tracking-wider">
            Completed
          </span>
        } @else if (selectedProject?.status === 'Archived') {
          <span class="px-2.5 py-0.5 text-xs font-semibold bg-slate-500/15 text-slate-600 rounded-full font-mono uppercase tracking-wider">
            Archived
          </span>
        } @else if (currentTab === 'sprint') {
          <span class="px-2.5 py-0.5 text-xs font-semibold bg-success/15 text-success rounded-full font-mono">
            {{ activeSprintName }}
          </span>
        }
      </div>

      <div class="flex items-center gap-4">
        <!-- Project selector context dropdown (only shown inside project tabs) -->
        @if (currentTab !== 'projects' && currentTab !== 'profile' && currentTab !== 'organization' && projects && projects.length > 0) {
          <div class="flex items-center gap-2">
            <!-- Custom Project Dropdown -->
            <div class="relative">
              <button (click)="isProjectDropdownOpen.update(v => !v)"
                      class="flex items-center gap-2 px-3 py-1.5 bg-background border border-border hover:border-primary/40 rounded-xl text-xs font-bold text-text-primary transition-all duration-200 hover:bg-sidebar focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px] group">
                <svg class="w-3.5 h-3.5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                </svg>
                <span class="truncate max-w-[100px]">
                  {{ selectedProject?.nameEn || 'Select Project' }}
                </span>
                <svg class="w-3 h-3 ml-auto text-text-secondary transition-transform duration-200 shrink-0"
                     [class.rotate-180]="isProjectDropdownOpen()"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              @if (isProjectDropdownOpen()) {
                <!-- Backdrop -->
                <div class="fixed inset-0 z-40" (click)="isProjectDropdownOpen.set(false)"></div>
                <!-- Dropdown Panel -->
                <div class="absolute right-0 top-full mt-2 z-50 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden min-w-[200px] animate-[fadeDown_0.15s_ease_both]">
                  <div class="px-3 py-2 border-b border-border">
                    <p class="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Your Projects</p>
                  </div>
                  <div class="py-1 max-h-60 overflow-y-auto">
                    @for (p of projects; track p.id) {
                      <button (click)="onSelectProject(p.id)"
                              class="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-sidebar transition-colors"
                              [class.bg-primary/8]="p.id === selectedProject?.id">
                        <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
                             [style.background]="getProjectColor(p.id)">
                          {{ (p.nameEn || p.name || '?')[0].toUpperCase() }}
                        </div>
                        <span class="font-medium text-text-primary truncate">{{ p.nameEn || p.name }}</span>
                        @if (p.id === selectedProject?.id) {
                          <svg class="w-4 h-4 text-primary ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                          </svg>
                        }
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Create project manual CTA (Header Projects Hub only) -->
        @if (currentTab === 'projects') {
          <button (click)="onCreateProject.emit()"
                  class="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            Create Project
          </button>
        }

        <!-- Notification Bell -->
        <app-notification-bell />

        <!-- Subscription button -->
        <a routerLink="/subscription"
           class="px-4 py-2 bg-surface hover:bg-primary/10 border border-border text-text-primary text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
          Subscription
        </a>

        <!-- Logout button -->
        <button (click)="onLogout.emit()"
                class="px-4 py-2 bg-surface hover:bg-error/10 border border-border text-error text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          Logout
        </button>

        <!-- Dark mode toggle -->
        <button (click)="onToggleDarkMode.emit()" class="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-border transition-colors">
          @if (isDark) {
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.364l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          }
        </button>

        <span class="text-sm font-semibold text-text-secondary hidden sm:inline">{{ currentDate }}</span>
      </div>
    </header>
  `
})
export class HeaderWidgetComponent {
  @Input({ required: true }) currentTab!: TabType;
  @Input({ required: true }) isProjectManager!: boolean;
  @Input() selectedProject?: any | null;
  @Input() activeSprintName?: string | null;
  @Input() projects!: any[];
  @Input({ required: true }) isDark!: boolean;
  @Input({ required: true }) currentDate!: string;

  @Output() tabChange = new EventEmitter<TabType>();
  @Output() selectProject = new EventEmitter<string>();
  @Output() onCreateProject = new EventEmitter<void>();
  @Output() onLogout = new EventEmitter<void>();
  @Output() onToggleDarkMode = new EventEmitter<void>();

  isProjectDropdownOpen = signal(false);

  onTabChange(tab: TabType) {
    this.tabChange.emit(tab);
  }

  onSelectProject(id: string) {
    this.selectProject.emit(id);
    this.isProjectDropdownOpen.set(false);
  }

  getProjectColor(id: string): string {
    const colors = [
      'linear-gradient(135deg,#6366f1,#8b5cf6)',
      'linear-gradient(135deg,#3b82f6,#06b6d4)',
      'linear-gradient(135deg,#10b981,#059669)',
      'linear-gradient(135deg,#f59e0b,#ef4444)',
      'linear-gradient(135deg,#ec4899,#8b5cf6)',
    ];
    let hash = 0;
    for (let i = 0; i < (id || '').length; i++) hash += id.charCodeAt(i);
    return colors[hash % colors.length];
  }
}
