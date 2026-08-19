import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamPulseMemberDto } from '../../data/sprint-health.models';

@Component({
  selector: 'app-sprint-team-pulse-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <section class="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <div class="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="text-base font-extrabold text-text-primary">Team Pulse</h2>
          <p class="mt-1 text-xs text-text-secondary">
            Workload by member: assigned estimate, remaining capacity, active work, and execution pressure.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 text-[11px] font-bold text-text-secondary">
          <span class="flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-full bg-slate-300"></i>Underused</span>
          <span class="flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-full bg-emerald-500"></i>Available</span>
          <span class="flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-full bg-blue-500"></i>Healthy</span>
          <span class="flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-full bg-amber-500"></i>Near limit</span>
          <span class="flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-full bg-red-500"></i>Overloaded</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        @for (member of members(); track member.employeeId) {
          <article class="group relative rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-within:shadow-md"
                   [ngClass]="getCardClasses(member)">
            <button type="button" class="block w-full text-left outline-none">
              <div class="flex items-start justify-between gap-4">
                <div class="flex min-w-0 items-center gap-3">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-black"
                       [ngClass]="getAvatarClasses(member)">
                    {{ member.initials }}
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-extrabold text-text-primary" [title]="member.name">{{ member.name }}</p>
                    <p class="mt-0.5 truncate text-[11px] text-text-secondary" [title]="member.jobTitle">{{ member.jobTitle }}</p>
                  </div>
                </div>

                <div class="flex shrink-0 items-center gap-2">
                  <span class="rounded-full px-2.5 py-1 text-[10px] font-black" [ngClass]="getBadgeClasses(member)">
                    {{ getDisplayStatus(member) }}
                  </span>
                  @if (shouldPulse(member)) {
                    <span class="relative flex h-3 w-3 shrink-0">
                      <span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" [ngClass]="getPulseClasses(member)"></span>
                      <span class="relative inline-flex h-3 w-3 rounded-full" [ngClass]="getPulseClasses(member)"></span>
                    </span>
                  }
                </div>
              </div>

              <div class="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-wider text-text-secondary">Load</p>
                  <p class="mt-1 text-sm font-black text-text-primary">
                    {{ formatHours(member.assignedRemainingHours) }} / {{ formatHours(member.availableRemainingHours) }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-[10px] font-black uppercase tracking-wider text-text-secondary">Pressure</p>
                  <p class="mt-1 text-2xl font-black tabular-nums" [ngClass]="getPercentClass(member)">
                    {{ member.workloadPressurePercent }}%
                  </p>
                </div>
              </div>

              <div class="mt-3 h-2 overflow-hidden rounded-full bg-border">
                <div class="h-full rounded-full transition-all duration-300"
                     [ngClass]="getBarClasses(member)"
                     [style.width.%]="clamp(member.workloadPressurePercent)"></div>
              </div>

              <div class="mt-4 grid grid-cols-3 gap-2">
                <div class="rounded-lg bg-white/55 px-3 py-2">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Active</p>
                  <p class="mt-1 text-sm font-black text-text-primary">{{ member.activeTasksCount }}</p>
                </div>
                <div class="rounded-lg bg-white/55 px-3 py-2">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Review</p>
                  <p class="mt-1 text-sm font-black text-text-primary">{{ member.reviewTasksCount }}</p>
                </div>
                <div class="rounded-lg bg-white/55 px-3 py-2">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Free</p>
                  <p class="mt-1 truncate text-sm font-black" [ngClass]="getDeltaClass(member)">
                    {{ formatCapacityDelta(member.remainingCapacityDeltaHours) }}
                  </p>
                </div>
              </div>
            </button>

          </article>
        }
      </div>
    </section>
  `
})
export class SprintTeamPulseGridComponent {
  members = input.required<TeamPulseMemberDto[]>();

  clamp(value: number): number {
    return Math.max(0, Math.min(value || 0, 100));
  }

  formatHours(value: number): string {
    return `${Math.round((value || 0) * 10) / 10}h`;
  }

  formatCapacityDelta(value: number): string {
    const rounded = Math.round((value || 0) * 10) / 10;
    if (rounded > 0) return `${rounded}h free`;
    if (rounded < 0) return `${Math.abs(rounded)}h over`;
    return 'At capacity';
  }

  getDisplayStatus(member: TeamPulseMemberDto): string {
    const status = (member.loadStatus || member.riskLevel || '').toLowerCase();
    if (status === 'overloaded') return 'Overloaded';
    if (status === 'nearlimit') return 'Near limit';
    if (status === 'healthy') return 'Healthy';
    if (status === 'underused') return 'Underused';
    return 'Available';
  }

  getCardClasses(member: TeamPulseMemberDto): string {
    const status = this.getDisplayStatus(member).toLowerCase();
    if (status === 'overloaded') return 'border-error/40 bg-gradient-to-br from-error/15 to-error/5';
    if (status === 'near limit') return 'border-warning/40 bg-gradient-to-br from-warning/15 to-warning/5';
    if (status === 'healthy') return 'border-blue-200 bg-gradient-to-br from-blue-100 to-blue-50';
    if (status === 'underused') return 'border-border bg-background';
    return 'border-success/35 bg-gradient-to-br from-success/15 to-success/5';
  }

  getAvatarClasses(member: TeamPulseMemberDto): string {
    const status = this.getDisplayStatus(member).toLowerCase();
    if (status === 'overloaded') return 'bg-error/10 text-error';
    if (status === 'near limit') return 'bg-warning/10 text-warning';
    if (status === 'healthy') return 'bg-blue-100 text-blue-700';
    if (status === 'underused') return 'bg-slate-100 text-slate-600';
    return 'bg-success/10 text-success';
  }

  getBadgeClasses(member: TeamPulseMemberDto): string {
    const status = this.getDisplayStatus(member).toLowerCase();
    if (status === 'overloaded') return 'bg-error/10 text-error';
    if (status === 'near limit') return 'bg-warning/10 text-warning';
    if (status === 'healthy') return 'bg-blue-100 text-blue-700';
    if (status === 'underused') return 'bg-slate-100 text-slate-600';
    return 'bg-success/10 text-success';
  }

  getBarClasses(member: TeamPulseMemberDto): string {
    const status = this.getDisplayStatus(member).toLowerCase();
    if (status === 'overloaded') return 'bg-error';
    if (status === 'near limit') return 'bg-warning';
    if (status === 'healthy') return 'bg-blue-500';
    if (status === 'underused') return 'bg-slate-300';
    return 'bg-success';
  }

  getPercentClass(member: TeamPulseMemberDto): string {
    const status = this.getDisplayStatus(member).toLowerCase();
    if (status === 'overloaded') return 'text-error';
    if (status === 'near limit') return 'text-warning';
    if (status === 'healthy') return 'text-blue-700';
    if (status === 'underused') return 'text-slate-600';
    return 'text-success';
  }

  getDeltaClass(member: TeamPulseMemberDto): string {
    const value = member.remainingCapacityDeltaHours || 0;
    if (value < 0) return 'text-error';
    if (value <= 4 && member.assignedRemainingHours > 0) return 'text-warning';
    return 'text-success';
  }

  shouldPulse(member: TeamPulseMemberDto): boolean {
    const status = this.getDisplayStatus(member).toLowerCase();
    return status === 'overloaded' || status === 'near limit';
  }

  getPulseClasses(member: TeamPulseMemberDto): string {
    const status = this.getDisplayStatus(member).toLowerCase();
    if (status === 'overloaded') return 'bg-error';
    return 'bg-warning';
  }
}
