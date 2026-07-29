import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamPulseMemberDto } from '../../data/sprint-health.models';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-sprint-team-pulse-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 class="text-base font-extrabold text-text-primary flex items-center gap-2">
            <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {{ 'DASHBOARD.TEAM_PULSE' | translate }}
          </h2>
          <p class="text-xs text-text-secondary mt-0.5">
            {{ members().length }} {{ 'DASHBOARD.MEMBERS' | translate }} · {{ 'DASHBOARD.HOVER_FOR_DETAILS' | translate }}
          </p>
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-4 text-xs text-text-secondary">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-success"></span>
            <span>Healthy</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-warning"></span>
            <span>At Risk</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-error"></span>
            <span>High Risk</span>
          </div>
        </div>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2.5">
        @for (member of members(); track member.employeeId) {
          <div class="group relative">
            <!-- The Cell -->
            <div class="aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                 [ngClass]="getRiskBg(member.riskLevel)">
              <span class="text-base font-black tracking-wide" [ngClass]="getRiskText(member.riskLevel)">
                {{ member.initials }}
              </span>
            </div>

            <!-- Rich Tooltip -->
            <div class="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-[272px] z-[9999]
                        opacity-0 invisible group-hover:opacity-100 group-hover:visible
                        transition-all duration-200 scale-95 group-hover:scale-100 origin-bottom
                        pointer-events-none">

              <div class="bg-surface border border-border rounded-2xl shadow-2xl shadow-black/20 overflow-hidden relative">

                <!-- Arrow at the Bottom -->
                <div class="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-surface border-b border-r border-border rotate-45 z-10"></div>

                <div class="relative z-20 bg-surface">
                  <!-- Tooltip Header -->
                  <div class="p-4 pb-3 border-b border-border flex items-center gap-3">
                    <div class="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                         [ngClass]="getRiskBg(member.riskLevel)">
                      <span [ngClass]="getRiskText(member.riskLevel)">{{ member.initials }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="text-sm font-bold text-text-primary truncate">{{ member.name }}</h4>
                      <p class="text-[11px] text-text-secondary">{{ member.jobTitle }}</p>
                    </div>
                    <span class="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide flex-shrink-0"
                          [ngClass]="getRiskBadge(member.riskLevel)">
                      {{ member.riskLevel }}
                    </span>
                  </div>

                  <!-- Burnout Score -->
                  <div class="px-4 pt-3 pb-2">
                    <div class="flex items-center justify-between text-xs mb-1.5">
                      <span class="font-bold text-text-secondary uppercase tracking-wider text-[10px]">{{ 'DASHBOARD.BURNOUT_RISK_SCORE' | translate }}</span>
                      <span class="font-black text-sm" [ngClass]="getScoreColor(member.burnoutScore)">{{ member.burnoutScore }}%</span>
                    </div>
                    <div class="w-full bg-border rounded-full h-2">
                      <div class="h-2 rounded-full transition-all duration-700"
                           [ngClass]="getScoreBg(member.burnoutScore)"
                           [style.width.%]="member.burnoutScore"></div>
                    </div>
                  </div>

                  <!-- Risk Factors -->
                  <div class="px-4 pt-1 pb-3 space-y-2.5">
                    <p class="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">{{ 'DASHBOARD.RISK_FACTORS' | translate }}</p>

                    <!-- Workload -->
                    <div>
                      <div class="flex justify-between text-xs mb-1">
                        <span class="flex items-center gap-1.5 text-text-secondary font-medium">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                          {{ 'DASHBOARD.WORKLOAD' | translate }}
                        </span>
                        <span class="font-bold" [ngClass]="getFactorColor(member.riskFactors.workload)">{{ member.riskFactors.workload }}%</span>
                      </div>
                      <div class="w-full bg-border rounded-full h-1.5">
                        <div class="h-1.5 rounded-full" [ngClass]="getFactorBg(member.riskFactors.workload)" [style.width.%]="member.riskFactors.workload"></div>
                      </div>
                    </div>

                    <!-- Pace -->
                    <div>
                      <div class="flex justify-between text-xs mb-1">
                        <span class="flex items-center gap-1.5 text-text-secondary font-medium">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          {{ 'DASHBOARD.PACE' | translate }}
                        </span>
                        <span class="font-bold" [ngClass]="getFactorColor(member.riskFactors.pace)">{{ member.riskFactors.pace }}%</span>
                      </div>
                      <div class="w-full bg-border rounded-full h-1.5">
                        <div class="h-1.5 rounded-full" [ngClass]="getFactorBg(member.riskFactors.pace)" [style.width.%]="member.riskFactors.pace"></div>
                      </div>
                    </div>

                    <!-- Engagement -->
                    <div>
                      <div class="flex justify-between text-xs mb-1">
                        <span class="flex items-center gap-1.5 text-text-secondary font-medium">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                          {{ 'DASHBOARD.ENGAGEMENT' | translate }}
                        </span>
                        <span class="font-bold" [ngClass]="getFactorColor(member.riskFactors.engagement)">{{ member.riskFactors.engagement }}%</span>
                      </div>
                      <div class="w-full bg-border rounded-full h-1.5">
                        <div class="h-1.5 rounded-full" [ngClass]="getFactorBg(member.riskFactors.engagement)" [style.width.%]="member.riskFactors.engagement"></div>
                      </div>
                    </div>
                  </div>

                  <!-- 7-Day Trend -->
                  <div class="px-4 pb-3 border-t border-border pt-3">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">{{ 'DASHBOARD.7_DAY_TREND' | translate }}</span>
                      <span class="text-[11px] font-bold"
                            [ngClass]="getTrendColor(member.trendDirection)">
                        {{ getTrendLabel(member.trendDirection) }}
                      </span>
                    </div>
                    <!-- Mini Sparkline SVG -->
                    <svg [attr.viewBox]="'0 0 200 40'" class="w-full h-8" preserveAspectRatio="none">
                      <polyline
                        [attr.points]="getSparklinePoints(member.history)"
                        fill="none"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        [attr.stroke]="getTrendStroke(member.trendDirection)"/>
                    </svg>
                  </div>

                  <!-- Footer -->
                  <div class="px-4 py-2 bg-background border-t border-border flex items-center justify-between">
                    <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                      {{ member.jobTitle }}
                    </span>
                    <span class="text-[10px] font-semibold text-text-secondary">{{ 'DASHBOARD.ANALYZED_BY' | translate }}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class SprintTeamPulseGridComponent {
  members = input.required<TeamPulseMemberDto[]>();

  getRiskBg(level: string): string {
    const l = (level || '').toLowerCase();
    if (l === 'high' || l === 'critical') return 'bg-[#fee2e2] border border-[#f87171]/30 animate-[pulse_3s_ease-in-out_infinite]';
    if (l === 'warning' || l === 'atrisk' || l === 'medium') return 'bg-[#ffedd5] border border-[#fb923c]/30';
    return 'bg-[#dcfce7] border border-[#4ade80]/30';
  }

  getRiskText(level: string): string {
    const l = (level || '').toLowerCase();
    if (l === 'high' || l === 'critical') return 'text-[#991b1b]';
    if (l === 'warning' || l === 'atrisk' || l === 'medium') return 'text-[#9a3412]';
    return 'text-[#166534]';
  }

  getRiskBadge(level: string): string {
    const l = (level || '').toLowerCase();
    if (l === 'high' || l === 'critical') return 'bg-error/10 text-error border border-error/20';
    if (l === 'warning' || l === 'atrisk' || l === 'medium') return 'bg-warning/10 text-warning border border-warning/20';
    return 'bg-success/10 text-success border border-success/20';
  }

  getScoreColor(score: number): string {
    if (score >= 70) return 'text-error';
    if (score >= 40) return 'text-warning';
    return 'text-success';
  }

  getScoreBg(score: number): string {
    if (score >= 70) return 'bg-error';
    if (score >= 40) return 'bg-warning';
    return 'bg-success';
  }

  getFactorColor(score: number): string {
    if (score >= 70) return 'text-error';
    if (score >= 40) return 'text-warning';
    return 'text-success';
  }

  getFactorBg(score: number): string {
    if (score >= 70) return 'bg-error';
    if (score >= 40) return 'bg-warning';
    return 'bg-success';
  }

  getTrendColor(direction: string): string {
    const d = (direction || '').toLowerCase();
    if (d === 'improving' || d === 'down') return 'text-success';
    if (d === 'rising' || d === 'up' || d === 'worsening') return 'text-error';
    return 'text-text-secondary';
  }

  getTrendStroke(direction: string): string {
    const d = (direction || '').toLowerCase();
    if (d === 'improving' || d === 'down') return '#22c55e';
    if (d === 'rising' || d === 'up' || d === 'worsening') return '#ef4444';
    return '#94a3b8';
  }

  getTrendLabel(direction: string): string {
    const d = (direction || '').toLowerCase();
    if (d === 'improving' || d === 'down') return '↘ improving';
    if (d === 'rising' || d === 'up' || d === 'worsening') return '↗ rising';
    return '→ stable';
  }

  getSparklinePoints(history: number[]): string {
    if (!history || history.length < 2) return '0,20 200,20';
    const max = Math.max(...history, 1);
    const min = Math.min(...history, 0);
    const range = max - min || 1;
    const width = 200;
    const height = 40;
    const step = width / (history.length - 1);
    return history.map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
  }
}
