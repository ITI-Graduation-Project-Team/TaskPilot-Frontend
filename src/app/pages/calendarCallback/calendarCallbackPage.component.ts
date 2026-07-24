import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleCalendarService } from '../../../shared/api/googleCalendar.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-calendar-callback-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-[#F6F6F6]">
      @if (isLoading()) {
        <div class="flex flex-col items-center">
          <svg class="animate-spin h-12 w-12 text-[#D51C39] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 class="text-xl font-semibold text-[#121338]">Verifying connection...</h2>
          <p class="text-gray-500 mt-2">Please wait while we connect your Google Calendar.</p>
        </div>
      }
    </div>
  `
})
export class CalendarCallbackPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private googleCalendarService = inject(GoogleCalendarService);

  isLoading = signal(true);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const state = params['state'];

      if (code && state) {
        this.verifyCallback(code, state);
      } else {
        // Missing parameters, redirect back
        this.router.navigate(['/settings']);
      }
    });
  }

  private verifyCallback(code: string, state: string): void {
    this.googleCalendarService.verifyCallback(code, state)
      .pipe(
        catchError((error) => {
          console.error('Error verifying Google Calendar callback:', error);
          // Handle error (e.g. show toast), then redirect
          return of(null);
        }),
        finalize(() => {
          this.isLoading.set(false);
          this.router.navigate(['/settings']);
        })
      )
      .subscribe();
  }
}
