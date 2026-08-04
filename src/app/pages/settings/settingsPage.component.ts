import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { GoogleCalendarService } from '../../shared/api/googleCalendar.service';
import { finalize } from 'rxjs/operators';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TranslatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white min-h-[calc(100vh-4rem)] rounded-tl-3xl relative">
      
      <!-- Page Content -->
      <main class="p-4 sm:p-6 md:p-8 animate-fade-in relative z-0">
        <!-- Background decorative element for the main area -->
        <div class="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/10 dark:to-transparent pointer-events-none -z-10"></div>
        
        <div class="max-w-5xl mx-auto space-y-8">
          <!-- Google Calendar Connect Section -->
          <section class="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 group">
            <div class="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl flex items-center justify-between">
              <h2 class="font-bold text-slate-800 dark:text-white text-xl flex items-center gap-3">
                <span class="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </span>
                {{ 'SETTINGS_VIEW.CONNECTED_ACCOUNTS' | translate }}
              </h2>
              <span class="text-xs font-semibold px-3 py-1 bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 rounded-full uppercase tracking-wider">{{ 'EMPLOYEES.ACTIVE' | translate }}</span>
            </div>
            
            <div class="p-8">
              <!-- Google Calendar Card -->
              <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-all duration-300">
                <!-- Subtle gradient border on hover -->
                <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none -z-10"></div>
                
                <div class="flex items-start gap-5">
                  <div class="w-16 h-16 rounded-2xl bg-white shadow-md shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 transform group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300">
                    <svg class="w-9 h-9 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5.25 4.5h13.5c.41 0 .75.34.75.75v13.5c0 .41-.34.75-.75.75H5.25a.75.75 0 01-.75-.75V5.25c0-.41.34-.75.75-.75zm13.5-1.5H5.25C3.59 3 2.25 4.34 2.25 6v13.5c0 1.66 1.34 3 3 3h13.5c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3z"/>
                      <path d="M12 17.25c-2.9 0-5.25-2.35-5.25-5.25S9.1 6.75 12 6.75s5.25 2.35 5.25 5.25-2.35 5.25-5.25 5.25zm0-9c-2.07 0-3.75 1.68-3.75 3.75s1.68 3.75 3.75 3.75 3.75-1.68 3.75-3.75-1.68-3.75-3.75-3.75z"/>
                      <path d="M12 10.5v3"/>
                      <path d="M10.5 12h3"/>
                    </svg>
                  </div>
                  <div class="text-left rtl:text-right">
                    <h3 class="font-bold text-slate-900 dark:text-white text-lg tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                      {{ 'SETTINGS_VIEW.GOOGLE_CALENDAR_TITLE' | translate }}
                    </h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed max-w-xl">
                      {{ 'SETTINGS_VIEW.GOOGLE_CALENDAR_DESC' | translate }}
                    </p>
                  </div>
                </div>
                
                <button 
                  (click)="connectGoogleCalendar()" 
                  [disabled]="isConnectingCalendar()"
                  class="shrink-0 relative overflow-hidden inline-flex items-center justify-center px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-500 text-sm font-bold rounded-xl shadow-lg shadow-slate-900/20 dark:shadow-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none focus:outline-none focus:ring-4 focus:ring-blue-500/30">
                  
                  <span class="absolute inset-0 bg-white/20 dark:bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                  
                  @if (isConnectingCalendar()) {
                    <svg class="animate-spin -ml-1 mr-3 rtl:ml-3 rtl:-mr-1 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{{ 'SETTINGS_VIEW.CONNECTING' | translate }}</span>
                  } @else {
                    <span class="relative flex items-center gap-2">
                      {{ 'SETTINGS_VIEW.CONNECT_ACCOUNT' | translate }}
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  }
                </button>
              </div>
            </div>
          </section>

          <!-- Nested Settings Routes -->
          <div class="relative z-10">
            <router-outlet></router-outlet>
          </div>
        </div>
        
      </main>
    </div>
  `
})
export class SettingsPageComponent {
  private googleCalendarService = inject(GoogleCalendarService);

  isConnectingCalendar = signal(false);

  connectGoogleCalendar() {
    this.isConnectingCalendar.set(true);

    this.googleCalendarService.getConnectUrl()
      .pipe(
        finalize(() => this.isConnectingCalendar.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response?.url) {
            window.location.href = response.url;
          }
        },
        error: (err) => {
          console.error('Failed to get Google Calendar connect URL:', err);
          // Handle error gracefully
        }
      });
  }
}
