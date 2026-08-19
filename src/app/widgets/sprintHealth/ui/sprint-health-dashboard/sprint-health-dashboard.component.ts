import { Component, ChangeDetectionStrategy, OnInit, inject, signal, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SprintHealthService } from '../../data/sprint-health.service';
import { ActivityFeedItemDto, TeamPulseDto } from '../../data/sprint-health.models';
import { SprintKpiCardsComponent } from '../kpi-cards/kpi-cards.component';
import { SprintTeamPulseGridComponent } from '../team-pulse-grid/team-pulse-grid.component';
import { SprintLiveActivityFeedComponent } from '../live-activity-feed/live-activity-feed.component';
import { NotificationHubService } from '../../../../shared/services/notification-hub.service';

@Component({
  selector: 'app-sprint-health-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SprintKpiCardsComponent, SprintTeamPulseGridComponent, SprintLiveActivityFeedComponent],
  template: `
    <div class="space-y-8 py-2">

      <!-- Loading Skeleton -->
      @if (isLoading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-pulse">
          @for (i of [1,2,3,4]; track i) {
            <div class="h-28 bg-border rounded-2xl"></div>
          }
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-pulse">
          <div class="col-span-1 lg:col-span-8 h-80 bg-border rounded-2xl"></div>
          <div class="col-span-1 lg:col-span-4 h-80 bg-border rounded-2xl"></div>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="p-5 bg-error/5 border border-error/20 text-error rounded-2xl flex items-center gap-3">
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <div>
            <p class="font-bold text-sm">Could not load sprint health</p>
            <p class="text-xs opacity-75 mt-0.5">{{ error() }}</p>
          </div>
          <button (click)="fetchData()" class="ml-auto px-4 py-1.5 text-xs font-bold border border-error/30 rounded-xl hover:bg-error/10 transition-colors">
            Retry
          </button>
        </div>
      }

      <!-- Dashboard Content -->
      @if (!isLoading() && data()) {

        <!-- KPI Cards Row -->
        <app-sprint-kpi-cards [summary]="data()!.summary"></app-sprint-kpi-cards>

        <div class="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <section class="xl:col-span-8 bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <div class="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 class="text-base font-extrabold text-text-primary">Needs Attention</h2>
                <p class="mt-1 text-xs text-text-secondary">The most important delivery issues to review first.</p>
              </div>
              <span class="rounded-full bg-background px-3 py-1 text-xs font-black text-text-secondary">
                {{ data()!.needsAttention.length }} open
              </span>
            </div>

            @if (data()!.needsAttention.length > 0) {
              <div class="space-y-3">
                @for (item of data()!.needsAttention; track item.title) {
                  <article class="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div class="min-w-0">
                      <div class="mb-1 flex flex-wrap items-center gap-2">
                        <span class="rounded-full px-2 py-0.5 text-[10px] font-black uppercase" [ngClass]="getSeverityClasses(item.severity)">
                          {{ item.severity }}
                        </span>
                        <span class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{{ item.type }}</span>
                      </div>
                      <h3 class="text-sm font-extrabold text-text-primary">{{ item.title }}</h3>
                      <p class="mt-1 text-xs leading-5 text-text-secondary">{{ item.description }}</p>
                    </div>
                    <span class="shrink-0 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-black text-primary">
                      {{ item.actionLabel }}
                    </span>
                  </article>
                }
              </div>
            } @else {
              <div class="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center">
                <p class="text-sm font-bold text-text-primary">No urgent health issues</p>
                <p class="mt-1 text-xs text-text-secondary">Progress and capacity currently look aligned.</p>
              </div>
            }
          </section>

          <section class="xl:col-span-4 bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <h2 class="text-base font-extrabold text-text-primary">Risk Summary</h2>
            <div class="mt-4 space-y-3">
              @for (risk of data()!.risks; track risk.type) {
                <article class="rounded-xl border border-border bg-background p-3">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm font-extrabold text-text-primary">{{ risk.label }}</p>
                    <span class="rounded-full px-2 py-0.5 text-[10px] font-black uppercase" [ngClass]="getSeverityClasses(risk.severity)">
                      {{ risk.severity }}
                    </span>
                  </div>
                  <p class="mt-1 text-xs leading-5 text-text-secondary">{{ risk.description }}</p>
                </article>
              }
            </div>
          </section>
        </div>

        <!-- Team Pulse + Live Feed -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div class="col-span-1 lg:col-span-8">
            <app-sprint-team-pulse-grid [members]="data()!.members"></app-sprint-team-pulse-grid>
          </div>
          <div class="col-span-1 lg:col-span-4">
            <app-sprint-live-activity-feed
              [activities]="activities()"
              [isLoading]="isActivityLoading()"
              [sprintId]="sprintId()"
              (reloadRequested)="fetchActivity()">
            </app-sprint-live-activity-feed>
          </div>
        </div>
      }

    </div>
  `
})
export class SprintHealthDashboardComponent implements OnInit {
  sprintId = input.required<string>();

  private sprintHealthService = inject(SprintHealthService);
  private notificationHub = inject(NotificationHubService);
  private lastRealtimeChangeKey: string | null = null;

  data = signal<TeamPulseDto | null>(null);
  activities = signal<ActivityFeedItemDto[]>([]);
  isLoading = signal<boolean>(true);
  isActivityLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const change = this.notificationHub.latestTaskStatusChange();
      if (!change || change.sprintId !== this.sprintId()) return;

      const changeKey = `${change.taskId}:${change.previousStatus}:${change.newStatus}:${change.occurredAt}`;
      if (changeKey === this.lastRealtimeChangeKey) return;

      this.lastRealtimeChangeKey = changeKey;
      queueMicrotask(() => this.fetchData());
    });
  }

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.isLoading.set(true);
    this.error.set(null);

    this.sprintHealthService.getTeamPulse(this.sprintId()).subscribe({
      next: (res) => {
        if (res.isSuccess && res.value) {
          this.data.set(res.value);
          this.fetchActivity();
        } else {
          this.error.set(res.error?.description || 'Failed to load team pulse data.');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Network error. Please check your connection.');
        this.isLoading.set(false);
      }
    });
  }

  fetchActivity() {
    this.isActivityLoading.set(true);

    this.sprintHealthService.getRecentActivity(this.sprintId()).subscribe({
      next: (activities) => {
        this.activities.set(activities);
        this.isActivityLoading.set(false);
      },
      error: () => {
        this.activities.set([]);
        this.isActivityLoading.set(false);
      }
    });
  }

  getSeverityClasses(severity: string): string {
    const normalized = (severity || '').toLowerCase();
    if (normalized === 'critical') return 'bg-error/10 text-error';
    if (normalized === 'high') return 'bg-error/10 text-error';
    if (normalized === 'medium') return 'bg-warning/10 text-warning';
    return 'bg-success/10 text-success';
  }
}
