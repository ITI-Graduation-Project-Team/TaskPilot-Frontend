import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-general-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface rounded-3xl border border-border p-6 md:p-8 shadow-sm">
      <div class="mb-6">
        <h3 class="text-lg font-bold text-text-primary font-display">General Settings</h3>
        <p class="text-sm text-text-secondary mt-1">Manage your company's core identity and branding.</p>
      </div>

      <div class="grid gap-8 lg:grid-cols-[1fr_auto]">
        <!-- Form Section -->
        <form class="space-y-5" (submit)="saveSettings($event)">
          
          <div>
            <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Company Name</label>
            <input type="text" [(ngModel)]="companyName" name="companyName" required placeholder="e.g. Acme Corp" 
                   class="w-full max-w-md bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold text-text-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all">
          </div>

          <div class="pt-4">
            <button type="submit" [disabled]="isSaving()"
                    class="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              @if (isSaving()) {
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Saving...
              } @else {
                Save Settings
              }
            </button>
          </div>
        </form>

        <!-- Logo Upload Section -->
        <div class="lg:border-l lg:border-border lg:pl-8 flex flex-col items-center">
          <p class="text-xs font-bold text-text-secondary mb-4 uppercase tracking-wider text-center">Company Logo</p>
          
          <div class="relative group cursor-pointer">
            <!-- Current Logo or Placeholder -->
            <div class="w-32 h-32 rounded-2xl bg-sidebar border-2 border-dashed border-border flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
              <svg class="w-10 h-10 text-text-secondary group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            
            <!-- Hover Overlay -->
            <div class="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span class="text-white text-xs font-bold">Change Logo</span>
            </div>
            
            <!-- Hidden File Input -->
            <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" title="Upload new logo">
          </div>
          <p class="text-[10px] text-text-secondary mt-3 text-center max-w-[140px]">Recommended: Square image, SVG or PNG.</p>
        </div>
      </div>
    </div>
  `
})
export class GeneralSettingsComponent {
  projectState = inject(ProjectStateService);
  toastService = inject(ToastService);
  themeService = inject(ThemeService);

  companyName = signal(this.projectState.companyName() || '');
  isSaving = signal(false);

  async saveSettings(event: Event) {
    event.preventDefault();
    if (!this.companyName().trim()) return;

    this.isSaving.set(true);
    // Mock save delay as there's no dedicated endpoint for updating name only in swagger yet
    setTimeout(() => {
      this.toastService.show('Settings saved successfully', 'success');
      this.isSaving.set(false);
    }, 800);
  }
}
