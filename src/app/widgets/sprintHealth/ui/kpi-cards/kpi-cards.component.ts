import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardKpisDto } from '../../data/sprint-health.models';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-sprint-kpi-cards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

      <!-- Sprint Progress -->
      <div class="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3 group">
        <div class="flex items-center justify-between">
          <p class="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
            {{ 'DASHBOARD.ACTIVE_PROJECTS' | translate }}
          </p>
          <div class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
        </div>
        <div>
          <h3 class="text-3xl font-black text-text-primary tracking-tight">{{ kpis().sprintProgressValue }}</h3>
          <p class="text-xs text-text-secondary mt-1">{{ kpis().sprintProgressSubtext }}</p>
        </div>
        <div class="h-1 bg-border rounded-full overflow-hidden">
          <div class="h-full bg-primary rounded-full transition-all duration-700" [style.width]="getProgressPercent()"></div>
        </div>
      </div>

      <!-- Sprint Velocity -->
      <div class="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3 group">
        <div class="flex items-center justify-between">
          <p class="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
            {{ 'DASHBOARD.SPRINT_VELOCITY' | translate }}
          </p>
          <div class="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
        </div>
        <div>
          <h3 class="text-3xl font-black text-text-primary tracking-tight">
            {{ kpis().sprintVelocityValue }}<span class="text-base font-semibold text-text-secondary ml-1">pts</span>
          </h3>
          <p class="text-xs text-text-secondary mt-1">{{ kpis().sprintVelocitySubtext }}</p>
        </div>
      </div>

      <!-- Sprint Health -->
      <div class="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3 group"
           [class.border-error]="kpis().sprintHealthValue < 70"
           [class.border-success]="kpis().sprintHealthValue >= 70">
        <div class="flex items-center justify-between">
          <p class="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
            {{ 'DASHBOARD.SPRINT_HEALTH' | translate }}
          </p>
          <div class="w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
               [ngClass]="kpis().sprintHealthValue >= 70 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
          </div>
        </div>
        <div>
          <h3 class="text-3xl font-black tracking-tight"
              [ngClass]="kpis().sprintHealthValue >= 70 ? 'text-success' : 'text-error'">
            {{ kpis().sprintHealthValue }}%
          </h3>
          <p class="text-xs text-text-secondary mt-1">{{ kpis().sprintHealthSubtext }}</p>
        </div>
        <div class="h-1.5 bg-border rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-700"
               [ngClass]="kpis().sprintHealthValue >= 70 ? 'bg-success' : 'bg-error'"
               [style.width.%]="kpis().sprintHealthValue"></div>
        </div>
      </div>

      <!-- Team Burnout Risk -->
      <div class="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3 group"
           [class.border-error]="kpis().teamBurnoutRiskValue > 50">
        <div class="flex items-center justify-between">
          <p class="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
            {{ 'DASHBOARD.TEAM_BURNOUT_RISK' | translate }}
          </p>
          <div class="w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
               [ngClass]="kpis().teamBurnoutRiskValue > 50 ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
        </div>
        <div>
          <h3 class="text-3xl font-black tracking-tight"
              [ngClass]="kpis().teamBurnoutRiskValue > 50 ? 'text-error' : kpis().teamBurnoutRiskValue > 25 ? 'text-warning' : 'text-text-primary'">
            {{ kpis().teamBurnoutRiskValue }}%
          </h3>
          <p class="text-xs text-text-secondary mt-1">{{ kpis().teamBurnoutRiskSubtext }}</p>
        </div>
        <div class="h-1.5 bg-border rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-700"
               [ngClass]="kpis().teamBurnoutRiskValue > 50 ? 'bg-error' : 'bg-warning'"
               [style.width.%]="kpis().teamBurnoutRiskValue"></div>
        </div>
      </div>

    </div>
  `
})
export class SprintKpiCardsComponent {
  kpis = input.required<DashboardKpisDto>();

  getProgressPercent(): string {
    const val = this.kpis().sprintProgressValue; // e.g. "1 / 3"
    const parts = val.split('/').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && parts[1] > 0) {
      return `${Math.round((parts[0] / parts[1]) * 100)}%`;
    }
    return '0%';
  }
}
