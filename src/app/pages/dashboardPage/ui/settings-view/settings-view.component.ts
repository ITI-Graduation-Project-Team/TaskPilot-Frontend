import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleCalendarService } from '../../../../shared/api/googleCalendar.service';
import { finalize } from 'rxjs/operators';
import { TranslatePipe } from '@ngx-translate/core';
import { AiTelemetryComponent } from '../../../settings/ui/ai-telemetry/ai-telemetry.component';

@Component({
  selector: 'app-settings-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe, AiTelemetryComponent],
  template: `
    <div class="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      
      <div class="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row md:items-center justify-between p-6 gap-6 transition-all duration-300 hover:shadow-md">
        <div>
          <h2 class="text-2xl font-extrabold text-text-primary">Settings & Integrations</h2>
          <p class="text-text-secondary text-sm font-medium">Manage your external accounts and application preferences.</p>
        </div>
      </div>

      <!-- Integrations Section -->
      <div class="bg-surface border border-border rounded-2xl shadow-sm p-6 space-y-4 transition-colors duration-200">
        <h3 class="font-bold text-text-primary text-lg pb-2 border-b border-border">Connected Accounts</h3>
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h4 class="font-bold text-text-primary text-base flex items-center gap-2">
              <svg class="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.25 4.5h13.5c.41 0 .75.34.75.75v13.5c0 .41-.34.75-.75.75H5.25a.75.75 0 01-.75-.75V5.25c0-.41.34-.75.75-.75zm13.5-1.5H5.25C3.59 3 2.25 4.34 2.25 6v13.5c0 1.66 1.34 3 3 3h13.5c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3z"/>
                <path d="M12 17.25c-2.9 0-5.25-2.35-5.25-5.25S9.1 6.75 12 6.75s5.25 2.35 5.25 5.25-2.35 5.25-5.25 5.25zm0-9c-2.07 0-3.75 1.68-3.75 3.75s1.68 3.75 3.75 3.75 3.75-1.68 3.75-3.75-1.68-3.75-3.75-3.75z"/>
                <path d="M12 10.5v3"/>
                <path d="M10.5 12h3"/>
              </svg>
              Google Calendar
            </h4>
            <p class="text-sm text-text-secondary mt-1">
              Sync your project tasks and deadlines directly to your Google Calendar.
            </p>
          </div>
          
          <button 
            (click)="connectGoogleCalendar()" 
            [disabled]="isConnectingCalendar()"
            class="flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed">
            
            @if (isConnectingCalendar()) {
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            } @else {
              Connect Account
            }
          </button>
        </div>
      </div>
      
      <!-- AI Telemetry Section -->
      <div class="relative z-10 animate-fade-in" style="animation-delay: 100ms;">
        <app-ai-telemetry></app-ai-telemetry>
      </div>
    </div>
  `
})
export class SettingsViewComponent {
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
        }
      });
  }
}
