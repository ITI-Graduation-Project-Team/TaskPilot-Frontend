import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (dialog.isOpen()) {
      <!-- Backdrop -->
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.15s_ease_both]"
           (click)="dialog.resolve(false)">
        <!-- Panel -->
        <div class="bg-surface border border-border rounded-3xl w-full max-w-sm shadow-2xl p-7 space-y-5 animate-[scaleUp_0.2s_ease_both]"
             (click)="$event.stopPropagation()">

          <!-- Icon -->
          <div class="flex items-center justify-center">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center"
                 [class.bg-error/10]="dialog.config().type === 'danger'"
                 [class.bg-amber-500/10]="dialog.config().type === 'warning'"
                 [class.bg-primary/10]="dialog.config().type === 'info'">
              @if (dialog.config().type === 'danger') {
                <svg class="w-7 h-7 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              } @else if (dialog.config().type === 'warning') {
                <svg class="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              } @else {
                <svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
            </div>
          </div>

          <!-- Title + Message -->
          <div class="text-center space-y-2">
            <h3 class="text-base font-extrabold text-text-primary">{{ dialog.config().title }}</h3>
            <p class="text-sm text-text-secondary leading-relaxed">{{ dialog.config().message }}</p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button (click)="dialog.resolve(false)"
                    class="flex-1 py-2.5 border border-border text-text-primary font-semibold text-sm rounded-xl hover:bg-sidebar transition-all">
              {{ dialog.config().cancelLabel || 'Cancel' }}
            </button>
            <button (click)="dialog.resolve(true)"
                    class="flex-1 py-2.5 font-semibold text-sm rounded-xl shadow-md transition-all text-white"
                    [class.bg-error]="dialog.config().type === 'danger'"
                    [class.hover:bg-red-700]="dialog.config().type === 'danger'"
                    [class.bg-amber-500]="dialog.config().type === 'warning'"
                    [class.hover:bg-amber-600]="dialog.config().type === 'warning'"
                    [class.bg-primary]="dialog.config().type === 'info'"
                    [class.hover:bg-primary-hover]="dialog.config().type === 'info'">
              {{ dialog.config().confirmLabel || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmDialogComponent {
  dialog = inject(ConfirmDialogService);
}
