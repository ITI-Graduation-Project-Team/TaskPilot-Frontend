import { Component, ChangeDetectionStrategy, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardComponent } from '../../../../widgets/taskBoard';
import { BacklogViewComponent } from '../backlog-view/backlog-view.component';
import { ProfileViewComponent } from '../profile-view/profile-view.component';
import { apiClient } from '../../../../shared/api/axios.instance';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BoardComponent, BacklogViewComponent, ProfileViewComponent],
  template: `
    <div class="min-h-screen bg-background text-text-primary flex transition-colors duration-200 pb-16 md:pb-0">
      
      <!-- Desktop Sidebar Navigation -->
      <aside class="w-64 bg-sidebar border-r border-border hidden md:flex flex-col p-6 transition-colors duration-200 shrink-0">
        <!-- Logo -->
        <div class="flex items-center gap-2.5 mb-8">
          <div class="flex items-center justify-center w-9 h-9 bg-primary rounded-xl text-white shadow-md shadow-primary/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 11l3 3L22 4" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <span class="text-xl font-bold tracking-tight text-text-primary">TaskPilot</span>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 space-y-1.5">
          <a (click)="currentTab.set('sprint')"
             [ngClass]="currentTab() === 'sprint' ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-primary/5 font-medium'"
             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            Active Sprint
          </a>
          <a (click)="currentTab.set('backlog')"
             [ngClass]="currentTab() === 'backlog' ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-primary/5 font-medium'"
             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Backlog
          </a>
          <a (click)="currentTab.set('profile')"
             [ngClass]="currentTab() === 'profile' ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-primary/5 font-medium'"
             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            My Profile
          </a>
        </nav>

        <!-- Footer / Profile Quick view & Dark mode -->
        <div class="border-t border-border pt-6 mt-6 space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-text-secondary uppercase">Theme</span>
            <button (click)="toggleDarkMode()" 
                    class="w-10 h-6 bg-border dark:bg-primary rounded-full relative flex items-center p-1 transition-all duration-300">
              <div class="w-4 h-4 bg-white rounded-full shadow transition-all duration-300 transform"
                   [ngClass]="isDark() ? 'translate-x-4' : 'translate-x-0'"></div>
            </button>
          </div>

          <div (click)="currentTab.set('profile')" class="cursor-pointer flex items-center gap-3 bg-surface border border-border p-3.5 rounded-xl transition-all duration-250 hover:border-primary/40 hover:shadow-sm">
            <div class="w-9 h-9 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0">
              {{ userInitial() }}
            </div>
            <div class="min-w-0">
              <h4 class="text-xs font-extrabold text-text-primary truncate">{{ userName() }}</h4>
              <p class="text-[10px] text-text-secondary truncate">{{ userJobTitle() }}</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Dashboard Panel -->
      <div class="flex-1 flex flex-col min-w-0">
        
        <!-- Header -->
        <header class="h-16 border-b border-border bg-surface flex items-center justify-between px-6 md:px-8 transition-colors duration-200 shrink-0">
          <div class="flex items-center gap-3">
            <h1 class="text-lg font-extrabold text-text-primary">
              @if (currentTab() === 'sprint') { Active Sprint }
              @else if (currentTab() === 'backlog') { Product Backlog }
              @else { My Profile }
            </h1>
            @if (currentTab() === 'sprint') {
              <span class="px-2.5 py-0.5 text-xs font-semibold bg-success/15 text-success rounded-full">
                Sprint 2 Active
              </span>
            }
          </div>

          <div class="flex items-center gap-4">
            <!-- Dark mode toggle -->
            <button (click)="toggleDarkMode()" class="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-border transition-colors">
              @if (isDark()) {
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

        <!-- Main Content Area -->
        <main class="flex-1 overflow-y-auto p-6 md:p-8">
          @if (currentTab() === 'sprint') {
            <app-board></app-board>
          } @else if (currentTab() === 'backlog') {
            <app-backlog-view></app-backlog-view>
          } @else if (currentTab() === 'profile') {
            <app-profile-view></app-profile-view>
          }
        </main>
      </div>

      <!-- Mobile Bottom Navigation Bar (Floating blurring pill layout) -->
      <div class="fixed bottom-4 left-4 right-4 z-40 bg-surface/75 backdrop-blur-xl border border-border flex items-center justify-around py-2.5 md:hidden rounded-2xl shadow-xl transition-all duration-300">
        
        <!-- Sprint Tab -->
        <button (click)="currentTab.set('sprint')" 
                class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
                [ngClass]="currentTab() === 'sprint' ? 'text-primary scale-105' : 'text-text-secondary'">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
          </svg>
          <span class="text-[9px] font-bold">Sprint</span>
        </button>

        <!-- Backlog Tab -->
        <button (click)="currentTab.set('backlog')" 
                class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
                [ngClass]="currentTab() === 'backlog' ? 'text-primary scale-105' : 'text-text-secondary'">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span class="text-[9px] font-bold">Backlog</span>
        </button>

        <!-- Profile Tab -->
        <button (click)="currentTab.set('profile')" 
                class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
                [ngClass]="currentTab() === 'profile' ? 'text-primary scale-105' : 'text-text-secondary'">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span class="text-[9px] font-bold">Profile</span>
        </button>
      </div>

    </div>
  `
})
export class DashboardComponent implements OnInit {
  isDark = signal(false);
  currentDate = '';
  userName = signal('Guest User');
  userJobTitle = signal('Team Member');
  userInitial = computed(() => this.userName().trim().charAt(0).toUpperCase() || 'U');

  // Active navigation tab signal
  currentTab = signal<'sprint' | 'backlog' | 'profile'>('sprint');

  ngOnInit() {
    this.currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('selectedTheme');
      if (savedTheme) {
        const isDarkTheme = savedTheme === 'dark';
        this.isDark.set(isDarkTheme);
        if (isDarkTheme) {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light-mode');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light-mode');
        }
      } else {
        const isDarkSet = document.documentElement.classList.contains('dark') || 
                         (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        this.isDark.set(isDarkSet);
        if (isDarkSet) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.add('light-mode');
        }
      }

      const storedName = localStorage.getItem('userFullName');
      if (storedName) {
        this.userName.set(storedName);
      }
    }

    this.loadUserProfile();
  }

  async loadUserProfile() {
    try {
      const { data } = await apiClient.get<any>('/employees/profile');
      const profileData = data.data || data;
      if (profileData) {
        this.userName.set(`${profileData.firstName} ${profileData.lastName}`);
        this.userJobTitle.set(profileData.jobTitle || 'Team Member');
      }
    } catch (e) {
      console.warn('Failed to load profile details for sidebar:', e);
    }
  }

  toggleDarkMode() {
    this.isDark.update(v => !v);
    if (this.isDark()) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('selectedTheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('selectedTheme', 'light');
    }
  }
}