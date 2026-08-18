import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../shared/services/toast.service';
import { TranslatePipe } from '@ngx-translate/core';
import { AiTelemetryComponent } from '../../../settings/ui/ai-telemetry/ai-telemetry.component';

@Component({
  selector: 'app-settings-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe, AiTelemetryComponent],
  template: `
    <div class="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      
      <!-- My Wallet Section -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/5 text-left rtl:text-right">
        <div class="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl flex items-center justify-between">
          <h3 class="font-bold text-slate-800 dark:text-white text-xl flex items-center gap-3">
            <span class="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <!-- Wallet Icon -->
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </span>
            My Wallet
          </h3>
          <span class="text-xs font-semibold px-3 py-1 bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 rounded-full uppercase tracking-wider">{{ 'EMPLOYEES.ACTIVE' | translate }}</span>
        </div>
        
        <div class="p-8">
          <!-- Wallet Balance Card -->
          <div class="group relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-slate-800/50 transition-all duration-300">
            <!-- Subtle gradient border on hover -->
            <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none -z-10"></div>
            
            <div class="flex items-start gap-5">
              <div class="w-16 h-16 rounded-2xl bg-white shadow-md shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 transform group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                <svg class="w-9 h-9 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                </svg>
              </div>
              <div class="text-left rtl:text-right">
                <h4 class="font-bold text-slate-900 dark:text-white text-lg tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
                  Current Balance
                </h4>
                <div class="flex items-baseline gap-1 mt-1">
                  <span class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">\${{ balance() | number:'1.2-2' }}</span>
                  <span class="text-sm text-slate-500 dark:text-slate-400 font-medium">USD</span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-xl">
                  Manage your wallet balance to cover premium API costs, priority support, or unlock special features.
                </p>
              </div>
            </div>
            
            <button 
              (click)="rechargeWallet()" 
              [disabled]="isRecharging()"
              class="shrink-0 relative overflow-hidden inline-flex items-center justify-center px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-sm font-bold rounded-xl shadow-lg shadow-slate-900/20 dark:shadow-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none focus:outline-none focus:ring-4 focus:ring-emerald-500/30">
              
              <span class="absolute inset-0 bg-white/20 dark:bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
              
              @if (isRecharging()) {
                <svg class="animate-spin -ml-1 mr-3 rtl:ml-3 rtl:-mr-1 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              } @else {
                <span class="relative flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Recharge Wallet
                </span>
              }
            </button>
          </div>
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
  private toastService = inject(ToastService);
  
  balance = signal(150.00);
  isRecharging = signal(false);

  rechargeWallet() {
    this.isRecharging.set(true);
    
    // Mock API call simulation
    setTimeout(() => {
      this.balance.update(b => b + 50.00);
      this.isRecharging.set(false);
      this.toastService.show('Successfully recharged $50.00 to your wallet!', 'success');
    }, 1500);
  }
}
