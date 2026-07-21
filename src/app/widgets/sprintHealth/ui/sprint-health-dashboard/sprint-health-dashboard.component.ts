import { Component, ChangeDetectionStrategy, OnInit, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SprintHealthService } from '../../data/sprint-health.service';
import { TeamPulseDto } from '../../data/sprint-health.models';
import { TranslatePipe } from '@ngx-translate/core';
import { SprintKpiCardsComponent } from '../kpi-cards/kpi-cards.component';
import { SprintTeamPulseGridComponent } from '../team-pulse-grid/team-pulse-grid.component';
import { SprintLiveActivityFeedComponent } from '../live-activity-feed/live-activity-feed.component';
import { SprintChartsPanelComponent } from '../charts-panel/charts-panel.component';

@Component({
  selector: 'app-sprint-health-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe, SprintKpiCardsComponent, SprintTeamPulseGridComponent, SprintLiveActivityFeedComponent, SprintChartsPanelComponent],
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
            <p class="font-bold text-sm">{{ 'SPRINT_HEALTH.ERROR_LOADING' | translate }}</p>
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
        <app-sprint-kpi-cards [kpis]="data()!.kpis"></app-sprint-kpi-cards>

        <!-- Team Pulse + Live Feed -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div class="col-span-1 lg:col-span-8">
            <app-sprint-team-pulse-grid [members]="data()!.members"></app-sprint-team-pulse-grid>
          </div>
          <div class="col-span-1 lg:col-span-4">
            <app-sprint-live-activity-feed [activities]="data()!.liveActivity"></app-sprint-live-activity-feed>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="pt-6">
          <app-sprint-charts-panel [charts]="data()!.charts"></app-sprint-charts-panel>
        </div>
      }

    </div>
  `
})
export class SprintHealthDashboardComponent implements OnInit {
  sprintId = input.required<string>();

  private sprintHealthService = inject(SprintHealthService);

  data = signal<TeamPulseDto | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

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
}
