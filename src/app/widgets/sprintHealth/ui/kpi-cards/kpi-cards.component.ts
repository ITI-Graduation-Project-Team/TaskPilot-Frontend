import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SprintHealthSummaryDto } from '../../data/sprint-health.models';

@Component({
  selector: 'app-sprint-kpi-cards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <section class="bg-surface border rounded-2xl p-5 shadow-sm" [ngClass]="getStatusBorder(summary().deliveryStatus)">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">Delivery Status</p>
            <h3 class="mt-2 text-2xl font-black text-text-primary">{{ summary().deliveryStatus }}</h3>
          </div>
          <span class="rounded-full px-2.5 py-1 text-[11px] font-black" [ngClass]="getStatusBadge(summary().deliveryStatus)">
            {{ getStatusLabel(summary().deliveryStatus) }}
          </span>
        </div>
        <p class="mt-4 text-xs leading-5 text-text-secondary">
          {{ getDeliveryReason() }}
        </p>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">Progress</p>
          <span class="text-sm font-black text-primary">{{ summary().effortProgressPercent }}%</span>
        </div>
        <h3 class="mt-2 text-3xl font-black text-text-primary">{{ summary().doneTasks }} / {{ summary().totalTasks }}</h3>
        <p class="mt-1 text-xs text-text-secondary">tasks completed</p>
        <div class="mt-4 space-y-2">
          <div>
            <div class="mb-1 flex items-center justify-between text-[11px] font-bold text-text-secondary">
              <span>Task progress</span>
              <span>{{ summary().progressPercent }}%</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-border">
              <div class="h-full rounded-full bg-primary transition-all duration-300" [style.width.%]="summary().progressPercent"></div>
            </div>
          </div>
          <div>
            <div class="mb-1 flex items-center justify-between text-[11px] font-bold text-text-secondary">
              <span>Work completed</span>
              <span>{{ summary().completedEstimatedHours }}h / {{ summary().totalEstimatedHours }}h</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-border">
              <div class="h-full rounded-full bg-success transition-all duration-300" [style.width.%]="summary().effortProgressPercent"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-5 shadow-sm">
        <p class="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">Remaining Work</p>
        <div class="mt-2 flex items-end gap-2">
          <h3 class="text-3xl font-black text-text-primary">{{ summary().remainingHours }}h</h3>
          <span class="pb-1 text-xs font-bold text-text-secondary">estimated left</span>
        </div>
        <p class="mt-1 text-xs text-text-secondary">{{ summary().workingDaysLeft }} working days left</p>
        <p class="mt-1 text-xs text-text-secondary">Needs about {{ formatDays(summary().estimatedWorkingDaysNeeded) }} working days at current team capacity</p>
        <div class="mt-4 flex gap-2 text-[11px] font-bold text-text-secondary">
          <span class="rounded-lg bg-background px-2 py-1">{{ summary().stuckTasksCount }} stuck</span>
          <span class="rounded-lg bg-background px-2 py-1">{{ summary().estimateExceededCount }} over estimate</span>
        </div>
      </section>

      <section class="bg-surface border rounded-2xl p-5 shadow-sm"
               [ngClass]="summary().capacityUsagePercent > 100 ? 'border-error/40' : 'border-border'">
        <div class="flex items-center justify-between">
          <p class="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">Team Capacity</p>
          <span class="text-sm font-black" [ngClass]="summary().capacityUsagePercent > 100 ? 'text-error' : 'text-success'">
            {{ summary().capacityUsagePercent }}%
          </span>
        </div>
        <h3 class="mt-2 text-3xl font-black text-text-primary">
          {{ summary().remainingHours }}h needed / {{ summary().teamRemainingCapacity }}h available
        </h3>
        <p class="mt-1 text-xs text-text-secondary">
          {{ formatSpareCapacity(summary().spareCapacityHours) }} · {{ summary().overloadedCount }} overloaded members
        </p>
        <div class="mt-4 h-2 overflow-hidden rounded-full bg-border">
          <div class="h-full rounded-full transition-all duration-300"
               [ngClass]="summary().capacityUsagePercent > 100 ? 'bg-error' : 'bg-success'"
               [style.width.%]="clamp(summary().capacityUsagePercent)"></div>
        </div>
      </section>
    </div>
  `
})
export class SprintKpiCardsComponent {
  summary = input.required<SprintHealthSummaryDto>();

  clamp(value: number): number {
    return Math.max(0, Math.min(value || 0, 100));
  }

  formatDays(value: number): string {
    if (!value) return '0';
    return `${Math.round(value * 10) / 10}`;
  }

  formatSpareCapacity(value: number): string {
    if (value >= 0) return `${value}h spare capacity`;
    return `${Math.abs(value)}h over capacity`;
  }

  getStatusLabel(status: string): string {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'critical') return 'Critical';
    if (normalized === 'at risk') return 'At Risk';
    return 'On Track';
  }

  getStatusBorder(status: string): string {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'critical') return 'border-error/50';
    if (normalized === 'at risk') return 'border-warning/50';
    return 'border-success/40';
  }

  getStatusBadge(status: string): string {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'critical') return 'bg-error/10 text-error';
    if (normalized === 'at risk') return 'bg-warning/10 text-warning';
    return 'bg-success/10 text-success';
  }

  getDeliveryReason(): string {
    const s = this.summary();
    if (s.remainingHours <= 0) return 'All sprint work is completed.';
    if (s.capacityUsagePercent > 100) return 'Remaining work is higher than the team capacity left.';
    if (s.stuckTasksCount > 0) return `${s.stuckTasksCount} task(s) may be stuck in progress.`;
    return 'Progress, workload, and capacity are aligned.';
  }
}
