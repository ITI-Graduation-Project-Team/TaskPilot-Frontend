import { Component, ChangeDetectionStrategy, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardComponent } from '../../../../widgets/taskBoard';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BoardComponent],
  template: `
    <div class="min-h-screen bg-background text-text-primary flex transition-colors duration-200">
      
      <!-- Sidebar Navigation -->
      <aside class="w-64 bg-sidebar border-r border-border hidden md:flex flex-col p-6 transition-colors duration-200">
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
        <nav class="flex-1 space-y-1">
          <a class="cursor-pointer flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary font-semibold rounded-xl transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            Active Sprint
          </a>
          <a class="cursor-pointer flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-primary/5 font-medium rounded-xl transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Backlog
          </a>
          <a class="cursor-pointer flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-primary/5 font-medium rounded-xl transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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

          <div class="flex items-center gap-3 bg-surface border border-border p-3.5 rounded-xl transition-colors duration-200">
            <div class="w-9 h-9 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">
              {{ userInitial() }}
            </div>
            <div class="min-w-0">
              <h4 class="text-xs font-bold text-text-primary truncate">{{ userName() }}</h4>
              <p class="text-[10px] text-text-secondary truncate">Full Stack Developer</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Dashboard Panel -->
      <div class="flex-1 flex flex-col min-w-0">
        
        <!-- Header -->
        <header class="h-16 border-b border-border bg-surface flex items-center justify-between px-6 md:px-8 transition-colors duration-200">
          <div class="flex items-center gap-3">
            <h1 class="text-lg font-bold text-text-primary">Dashboard</h1>
            <span class="px-2.5 py-0.5 text-xs font-medium bg-success/10 text-success rounded-full">
              Sprint 2 Active
            </span>
          </div>

          <div class="flex items-center gap-4">
            <!-- Mobile Dark mode toggle -->
            <button (click)="toggleDarkMode()" class="p-2 text-text-secondary hover:text-text-primary md:hidden">
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
          <app-board></app-board>
        </main>
      </div>

    </div>
  `
})
export class DashboardComponent implements OnInit {
  isDark = signal(false);
  currentDate = '';
  userName = signal('Guest User');
  userInitial = computed(() => this.userName().trim().charAt(0).toUpperCase() || 'U');

  ngOnInit() {
    this.currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    // Auto-detect system preference or previous setting
    if (typeof document !== 'undefined') {
      const isDarkSet = document.documentElement.classList.contains('dark') || 
                       (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      this.isDark.set(isDarkSet);
      if (isDarkSet) {
        document.documentElement.classList.add('dark');
      }
    }

    // Load actual user name from login response saved in localStorage
    if (typeof localStorage !== 'undefined') {
      const storedName = localStorage.getItem('userFullName');
      if (storedName) {
        this.userName.set(storedName);
      }
    }
  }

  toggleDarkMode() {
    this.isDark.update(v => !v);
    if (this.isDark()) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light-mode');
    }
  }
}