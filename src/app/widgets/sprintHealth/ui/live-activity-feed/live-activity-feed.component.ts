import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityFeedItemDto } from '../../data/sprint-health.models';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-sprint-live-activity-feed',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-base font-extrabold text-text-primary">
          {{ 'DASHBOARD.LIVE_ACTIVITY' | translate }}
        </h2>
        <div class="flex items-center gap-2">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          <span class="text-[11px] font-bold text-success uppercase tracking-wide">{{ 'DASHBOARD.LIVE' | translate }}</span>
        </div>
      </div>

      <!-- Feed -->
      <div class="flex-1 overflow-y-auto pr-1 space-y-0" style="max-height: 360px; scrollbar-width: thin; scrollbar-color: var(--border) transparent;">

        @if (activities().length === 0) {
          <div class="text-center py-12 text-text-secondary text-sm flex flex-col items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-border flex items-center justify-center">
              <svg class="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span>{{ 'DASHBOARD.NO_ACTIVITY' | translate }}</span>
          </div>
        }

        <div class="space-y-4">
          @for (item of activities(); track item.id) {
            <div class="flex items-start gap-3 p-2 hover:bg-background rounded-xl transition-colors">
              <!-- Avatar -->
              <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                   [ngClass]="getAvatarBg(item.actionType)">
                {{ item.initials }}
              </div>
              
              <!-- Content -->
              <div class="flex-1 min-w-0 pt-0.5">
                <div class="flex items-center justify-between mb-0.5">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-sm text-text-primary">{{ item.name }}</span>
                    @if (item.actionType === 'ALERT') {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-error/10 text-error uppercase tracking-wide">ALERT</span>
                    }
                    @if (item.actionType === 'SUCCESS') {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success uppercase tracking-wide">SUCCESS</span>
                    }
                    @if (item.actionType === 'WARNING') {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning uppercase tracking-wide">WARNING</span>
                    }
                    @if (item.agentTag) {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">{{ item.agentTag }}</span>
                    }
                  </div>
                  <span class="text-xs text-text-secondary whitespace-nowrap">{{ item.timeAgo }}</span>
                </div>
                <p class="text-sm text-text-secondary leading-relaxed">{{ item.description }}</p>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Footer Link -->
      <div class="mt-4 pt-4 border-t border-border">
        <a href="javascript:void(0)" class="text-sm font-semibold text-primary hover:underline flex items-center gap-1 w-max">
          View full audit log <span class="text-lg leading-none">&rarr;</span>
        </a>
      </div>
    </div>
  `
})
export class SprintLiveActivityFeedComponent {
  activities = input.required<ActivityFeedItemDto[]>();

  getDotBg(type: string): string {
    const t = (type || '').toUpperCase();
    if (t === 'ALERT') return 'bg-error text-error';
    if (t === 'WARNING') return 'bg-warning text-warning';
    if (t === 'SUCCESS') return 'bg-success text-success';
    return 'bg-primary text-primary';
  }

  getAvatarBg(type: string): string {
    const t = (type || '').toUpperCase();
    if (t === 'ALERT') return 'bg-error/10 text-error';
    if (t === 'WARNING') return 'bg-warning/10 text-warning';
    if (t === 'SUCCESS') return 'bg-success/10 text-success';
    return 'bg-primary/10 text-primary';
  }
}
