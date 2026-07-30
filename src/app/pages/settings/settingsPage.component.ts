import { Component, OnInit, inject, signal, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { GoogleCalendarService } from '../../shared/api/googleCalendar.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="flex h-screen bg-[#F6F6F6] text-[#121338]" [dir]="direction()">
      <!-- Sidebar Placeholder -->
      <aside class="hidden md:flex flex-col w-64 bg-[#FAFAFA] border-r border-gray-200" [class.border-l]="direction() === 'rtl'" [class.border-r-0]="direction() === 'rtl'">
        <!-- Sidebar content goes here -->
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Header -->
        <header class="bg-[#FAFAFA] shadow-sm z-10 flex items-center justify-between px-6 py-4">
          <div class="flex items-center">
            <!-- Mobile Nav Placeholder -->
            <div class="md:hidden me-4">
              <!-- Mobile nav goes here -->
            </div>
            <h1 class="text-2xl font-semibold">Settings</h1>
          </div>
          
          <!-- Language Toggle -->
          <button 
            (click)="toggleLanguage()" 
            class="px-4 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-100 transition-colors">
            {{ currentLang() === 'en' ? 'العربية' : 'English' }}
          </button>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto p-6 md:p-8">
          
          <!-- Google Calendar Connect Section -->
          <section class="bg-[#FAFAFA] rounded-lg shadow-sm p-6 mb-8 max-w-2xl border border-gray-100">
            <h2 class="text-xl font-medium mb-2">Integrations</h2>
            <p class="text-gray-600 mb-6">Connect your external accounts to sync data seamlessly.</p>
            
            <div class="flex items-center justify-between border-t border-gray-200 pt-4">
              <div>
                <h3 class="font-medium text-[#121338]">Google Calendar</h3>
                <p class="text-sm text-gray-500">Sync your tasks and deadlines with Google Calendar.</p>
              </div>
              
              <button 
                (click)="connectGoogleCalendar()" 
                [disabled]="isConnectingCalendar()"
                class="flex items-center justify-center px-4 py-2 bg-[#D51C39] text-white rounded hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                
                @if (isConnectingCalendar()) {
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                } @else {
                  Connect Calendar
                }
              </button>
            </div>
          </section>

          <!-- Nested Settings Routes -->
          <router-outlet></router-outlet>
          
        </main>
      </div>
    </div>
  `
})
export class SettingsPageComponent implements OnInit {
  private googleCalendarService = inject(GoogleCalendarService);
  private document = inject(DOCUMENT);

  currentLang = signal<'en' | 'ar'>('en');
  direction = signal<'ltr' | 'rtl'>('ltr');
  isConnectingCalendar = signal(false);

  ngOnInit() {
    // Initialize language from local storage or default
    const savedLang = localStorage.getItem('app_lang') as 'en' | 'ar' || 'en';
    this.setLanguage(savedLang);
  }

  toggleLanguage() {
    const newLang = this.currentLang() === 'en' ? 'ar' : 'en';
    this.setLanguage(newLang);
  }

  private setLanguage(lang: 'en' | 'ar') {
    this.currentLang.set(lang);
    this.direction.set(lang === 'ar' ? 'rtl' : 'ltr');
    this.document.documentElement.lang = lang;
    this.document.documentElement.dir = this.direction();
    localStorage.setItem('app_lang', lang);
  }

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
