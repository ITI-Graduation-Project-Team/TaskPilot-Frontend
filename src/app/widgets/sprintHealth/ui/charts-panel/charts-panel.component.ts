import { Component, ChangeDetectionStrategy, input, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamPulseChartsDto } from '../../data/sprint-health.models';
import { TranslatePipe } from '@ngx-translate/core';
import { NgApexchartsModule, ChartComponent, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexStroke, ApexYAxis, ApexTitleSubtitle, ApexLegend, ApexFill, ApexTooltip } from 'ng-apexcharts';

export type BurndownChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  tooltip: ApexTooltip;
  legend: ApexLegend;
};

export type WorkloadChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  plotOptions: any;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  colors: string[];
};

@Component({
  selector: 'app-sprint-charts-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe, NgApexchartsModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

      <!-- Burndown Chart -->
      <div class="bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-base font-extrabold text-text-primary">{{ 'DASHBOARD.BURNDOWN_CHART' | translate }}</h2>
        </div>
        <apx-chart
          class="flex-1"
          [series]="burndownOptions().series"
          [chart]="burndownOptions().chart"
          [xaxis]="burndownOptions().xaxis"
          [yaxis]="burndownOptions().yaxis"
          [stroke]="burndownOptions().stroke"
          [dataLabels]="burndownOptions().dataLabels"
          [fill]="burndownOptions().fill"
          [tooltip]="burndownOptions().tooltip"
          [legend]="burndownOptions().legend"
        ></apx-chart>
      </div>

      <!-- Workload Chart -->
      <div class="bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col">
        <h2 class="text-base font-extrabold text-text-primary mb-2 flex justify-between items-center">
          {{ 'DASHBOARD.WORKLOAD_DIST' | translate }}
          <span class="text-xs text-text-secondary font-medium normal-case">This week</span>
        </h2>
        <apx-chart
          class="flex-1"
          [series]="workloadOptions().series"
          [chart]="workloadOptions().chart"
          [xaxis]="workloadOptions().xaxis"
          [yaxis]="workloadOptions().yaxis"
          [plotOptions]="workloadOptions().plotOptions"
          [dataLabels]="workloadOptions().dataLabels"
          [fill]="workloadOptions().fill"
          [tooltip]="workloadOptions().tooltip"
          [legend]="workloadOptions().legend"
          [colors]="workloadOptions().colors"
        ></apx-chart>
      </div>

      <!-- Top Contributors -->
      <div class="bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col">
        <h2 class="text-base font-extrabold text-text-primary mb-4">{{ 'DASHBOARD.TOP_CONTRIBUTORS' | translate }}</h2>
        <div class="space-y-3 flex-1 overflow-y-auto">
          @for (tc of charts().topContributors; track tc.initials; let i = $index) {
            <div class="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs"
                     [ngClass]="i === 0 ? 'bg-warning/10 text-warning' : (i === 1 ? 'bg-border text-text-secondary' : 'bg-primary/10 text-primary')">
                  {{ tc.initials }}
                </div>
                <div>
                  <h4 class="text-sm font-bold text-text-primary">{{ tc.name }}</h4>
                  <p class="text-xs text-text-secondary">{{ tc.completedTasksCount }} {{ 'DASHBOARD.TASKS_DONE' | translate }}</p>
                </div>
              </div>
              <div class="text-right">
                <span class="font-black text-primary">{{ tc.completedHours }}</span>
                <span class="text-xs text-text-secondary ml-1">hrs</span>
              </div>
            </div>
          }
          @if (charts().topContributors.length === 0) {
            <div class="text-center py-8 text-sm text-text-secondary">
              {{ 'DASHBOARD.NO_CONTRIBUTORS_YET' | translate }}
            </div>
          }
        </div>
      </div>

    </div>
  `
})
export class SprintChartsPanelComponent {
  charts = input.required<TeamPulseChartsDto>();

  burndownOptions = computed<BurndownChartOptions>(() => {
    const data = this.charts().burndown;
    return {
      series: [
        {
          name: 'Planned',
          data: data.idealTrend,
          type: 'line'
        },
        {
          name: 'Actual',
          data: data.actualTrend,
          type: 'area'
        }
      ],
      chart: {
        height: 350,
        type: 'line',
        fontFamily: 'inherit',
        toolbar: { show: false },
        zoom: { enabled: false },
        background: 'transparent'
      },
      stroke: {
        curve: 'smooth',
        width: [2, 3],
        dashArray: [5, 0]
      },
      fill: {
        type: ['solid', 'gradient'],
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.05,
          stops: [0, 90, 100]
        }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: data.labels,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#9ca3af' } }
      },
      yaxis: {
        labels: { style: { colors: '#9ca3af' } }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right'
      },
      tooltip: {
        theme: 'dark'
      }
    };
  });

  workloadOptions = computed<WorkloadChartOptions>(() => {
    const data = this.charts().workload;
    return {
      series: [{
        name: 'Workload',
        data: data.series
      }],
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'],
      chart: {
        type: 'bar',
        height: 280,
        fontFamily: 'inherit',
        toolbar: { show: false },
        background: 'transparent'
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: false,
          columnWidth: '20%',
          distributed: true
        }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: data.labels,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#9ca3af' } }
      },
      yaxis: {
        labels: { style: { colors: '#9ca3af' } }
      },
      fill: {
        opacity: 1
      },
      legend: { show: false },
      tooltip: {
        theme: 'dark'
      }
    };
  });
}
