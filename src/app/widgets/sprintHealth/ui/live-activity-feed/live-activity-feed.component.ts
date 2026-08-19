import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityFeedItemDto } from '../../data/sprint-health.models';
import { TranslatePipe } from '@ngx-translate/core';
import { Dialog } from '@angular/cdk/dialog';
import { SprintAuditLogModalComponent } from '../sprint-audit-log-modal/sprint-audit-log-modal.component';

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
        <button
          type="button"
          (click)="reloadRequested.emit()"
          [disabled]="isLoading()"
          class="min-h-9 rounded-xl border border-border bg-background px-3 text-xs font-black text-primary transition-colors hover:bg-primary/5 disabled:cursor-wait disabled:opacity-60">
          {{ isLoading() ? 'Loading...' : 'Reload' }}
        </button>
      </div>

      <!-- Feed -->
      <div class="flex-1 overflow-y-auto pr-1 space-y-0" style="max-height: 360px; scrollbar-width: thin; scrollbar-color: var(--border) transparent;">

        @if (isLoading() && activities().length === 0) {
          <div class="space-y-3">
            @for (i of [1,2,3]; track i) {
              <div class="flex items-center gap-3 rounded-xl p-2">
                <div class="h-10 w-10 animate-pulse rounded-full bg-border"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3 w-1/2 animate-pulse rounded bg-border"></div>
                  <div class="h-3 w-3/4 animate-pulse rounded bg-border"></div>
                </div>
              </div>
            }
          </div>
        } @else if (activities().length === 0) {
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
                    @if (item.actionType === 'INFO') {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wide">INFO</span>
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
        <button (click)="openFullAuditLog()" class="text-sm font-semibold text-primary hover:underline flex items-center gap-1 w-max">
          View full audit log <span class="text-lg leading-none">&rarr;</span>
        </button>
      </div>
    </div>
  `
})
export class SprintLiveActivityFeedComponent {
  private dialog = inject(Dialog);
  
  activities = input.required<ActivityFeedItemDto[]>();
  isLoading = input<boolean>(false);
  sprintId = input.required<string>();
  reloadRequested = output<void>();

  openFullAuditLog() {
    this.dialog.open(SprintAuditLogModalComponent, {
      data: { sprintId: this.sprintId() }
    });
  }

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
    if (t === 'INFO') return 'bg-primary/10 text-primary';
    return 'bg-primary/10 text-primary';
  }
}
