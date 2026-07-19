import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { NotificationBellComponent } from '../../../../shared/ui/notification-bell/notification-bell';

@Component({
  selector: 'app-employee-header-widget',
  standalone: true,
  imports: [CommonModule, TranslatePipe, NotificationBellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="h-16 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-30
                   backdrop-blur-xl border-b transition-colors duration-200"
            style="background: color-mix(in srgb, var(--surface) 80%, transparent);
                   border-color: var(--border);">
      
      <div class="flex items-center gap-3">
        <h1 class="text-base md:text-xl font-extrabold font-display hidden sm:block truncate"
            style="color: var(--text-primary);">
          {{ pageTitle }}
        </h1>
      </div>

      <div class="flex items-center gap-2">
        <!-- Language toggle -->
        <button
          (click)="setLanguage.emit(currentLang === 'en' ? 'ar' : 'en')"
          class="px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 border"
          style="background: var(--surface); border-color: var(--border); color: var(--text-primary);"
        >
          {{ currentLang === 'en' ? 'عربي' : 'EN' }}
        </button>

        <app-notification-bell></app-notification-bell>

        <!-- Theme toggle -->
        <button
          (click)="toggleTheme.emit()"
          class="p-2 rounded-xl transition-all duration-200"
          style="color: var(--text-secondary);"
        >
          @if (isDark) {
            <!-- Sun icon -->
            <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.364l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          } @else {
            <!-- Moon icon -->
            <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
          }
        </button>

        <!-- Logout -->
        <button
          (click)="logout.emit()"
          class="p-2 rounded-xl transition-all duration-200"
          style="color: var(--error);"
          [title]="'employee.header.logout' | translate"
        >
          <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </button>
      </div>
    </header>
  `
})
export class EmployeeHeaderWidgetComponent {
  @Input({ required: true }) pageTitle!: string;
  @Input({ required: true }) currentLang!: 'en' | 'ar';
  @Input({ required: true }) isDark!: boolean;

  @Output() setLanguage = new EventEmitter<'en' | 'ar'>();
  @Output() toggleTheme = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
}
