import { Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { TelemetryService, EmployeeAiSummaryDto, ProjectAiSummaryDto, ProjectMemberAiUsageDto } from '../../../../shared/api/Telemetry-api/telemetry.service';

@Component({
  selector: 'app-ai-telemetry',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 relative group dark:bg-slate-900 dark:border-slate-800">
      
      <!-- Gradient border effect on hover -->
      <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-purple-500/0 opacity-0 group-hover:from-indigo-500/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none -z-10"></div>

      <div class="p-6 sm:p-8">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-1 flex items-center gap-3">
              <span class="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              {{ 'TELEMETRY.TITLE' | translate }}
            </h2>
            <p class="text-slate-500 dark:text-slate-400 text-sm">
              {{ isPM() ? ('TELEMETRY.PM_DESC' | translate) : ('TELEMETRY.EMP_DESC' | translate) }}
            </p>
          </div>
          <span class="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/30 rounded-full uppercase tracking-wider">
            {{ isPM() ? ('TELEMETRY.ROLE_PM' | translate) : ('TELEMETRY.ROLE_EMP' | translate) }}
          </span>
        </div>

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="flex flex-col items-center justify-center py-12">
            <svg class="animate-spin h-8 w-8 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-slate-500 text-sm font-medium">{{ 'TELEMETRY.LOADING' | translate }}</p>
          </div>
        }
        
        <!-- Error State -->
        @else if (error()) {
          <div class="p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {{ error() }}
          </div>
        }

        <!-- Empty State for PM with no project -->
        @else if (isPM() && !projectId()) {
          <div class="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-slate-100 border-dashed dark:bg-slate-800/50 dark:border-slate-700">
            <div class="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm12-3c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zM9 10l12-3" />
              </svg>
            </div>
            <h3 class="text-slate-900 font-bold mb-1 dark:text-white">{{ 'TELEMETRY.NO_PROJECT' | translate }}</h3>
            <p class="text-slate-500 text-sm max-w-sm mx-auto">{{ 'TELEMETRY.NO_PROJECT_DESC' | translate }}</p>
          </div>
        }

        <!-- Data View -->
        @else {
          <div class="space-y-8 animate-fade-in">
            
            <!-- Key Metrics Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <!-- Total Operations -->
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700 hover:shadow-md transition-shadow duration-300">
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{{ 'TELEMETRY.METRIC_OPS' | translate }}</p>
                <div class="flex items-end gap-2">
                  <span class="text-2xl font-black text-slate-900 dark:text-white leading-none">{{ getSummary()?.totalOperations || 0 }}</span>
                </div>
              </div>

              <!-- Total Tokens -->
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700 hover:shadow-md transition-shadow duration-300">
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{{ 'TELEMETRY.METRIC_TOKENS' | translate }}</p>
                <div class="flex items-end gap-2">
                  <span class="text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{{ (getSummary()?.totalTokens || 0) | number }}</span>
                </div>
              </div>

              <!-- Total Cost -->
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700 hover:shadow-md transition-shadow duration-300">
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{{ 'TELEMETRY.METRIC_COST' | translate }}</p>
                <div class="flex items-end gap-2">
                  <span class="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{{ (getSummary()?.totalCostUsd || 0) | currency:'USD':'symbol':'1.2-4' }}</span>
                </div>
              </div>

              <!-- Avg Response Time -->
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700 hover:shadow-md transition-shadow duration-300">
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{{ 'TELEMETRY.METRIC_LATENCY' | translate }}</p>
                <div class="flex items-end gap-2">
                  <span class="text-2xl font-black text-amber-600 dark:text-amber-500 leading-none">{{ (getSummary()?.averageResponseTimeMs || 0) / 1000 | number:'1.1-2' }}s</span>
                </div>
              </div>

            </div>

            <!-- PM Specific Breakdown -->
            @if (isPM() && projectSummary()) {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                
                <!-- Model Usage Breakdown -->
                <div>
                  <h3 class="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    {{ 'TELEMETRY.MODEL_USAGE' | translate }}
                  </h3>
                  
                  <div class="space-y-4">
                    @for (model of getModelUsageArray(); track model.name) {
                      <div>
                        <div class="flex justify-between text-sm mb-1.5">
                          <span class="font-medium text-slate-700 dark:text-slate-300">{{ model.name }}</span>
                          <span class="text-slate-500">{{ model.count }} {{ 'TELEMETRY.OPS' | translate }}</span>
                        </div>
                        <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div class="bg-indigo-500 h-2 rounded-full transition-all duration-1000 ease-out" [style.width.%]="model.percentage"></div>
                        </div>
                      </div>
                    }
                    @if (getModelUsageArray().length === 0) {
                      <p class="text-sm text-slate-400 italic">{{ 'TELEMETRY.NO_DATA' | translate }}</p>
                    }
                  </div>
                </div>

                <!-- Team Members Usage -->
                <div>
                  <h3 class="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {{ 'TELEMETRY.TEAM_USAGE' | translate }}
                  </h3>
                  
                  <div class="bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <ul class="divide-y divide-slate-100 dark:divide-slate-800/50 max-h-64 overflow-y-auto">
                      @for (member of projectMembers(); track member.userId) {
                        <li class="p-3 hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center justify-between">
                          <div class="flex flex-col">
                            <span class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ member.fullName }}</span>
                            <span class="text-xs text-slate-500 truncate max-w-[150px]">{{ member.email }}</span>
                          </div>
                          <div class="text-right flex flex-col">
                            <span class="text-sm font-bold text-slate-900 dark:text-white">{{ member.totalCostUsd | currency:'USD':'symbol':'1.2-4' }}</span>
                            <span class="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{{ member.totalOperations }} {{ 'TELEMETRY.OPS' | translate }}</span>
                          </div>
                        </li>
                      }
                      @if (projectMembers().length === 0) {
                        <li class="p-4 text-sm text-slate-400 text-center italic">{{ 'TELEMETRY.NO_TEAM_DATA' | translate }}</li>
                      }
                    </ul>
                  </div>
                </div>

              </div>
            }
          </div>
        }
      </div>
    </section>
  `
})
export class AiTelemetryComponent implements OnInit {
  private projectState = inject(ProjectStateService);
  private telemetryService = inject(TelemetryService);
  private translate = inject(TranslateService);

  isPM = this.projectState.isProjectManager;
  projectId = this.projectState.selectedProjectId;
  
  isLoading = signal(false);
  error = signal<string | null>(null);

  employeeSummary = signal<EmployeeAiSummaryDto | null>(null);
  projectSummary = signal<ProjectAiSummaryDto | null>(null);
  projectMembers = signal<ProjectMemberAiUsageDto[]>([]);

  constructor() {
    // If PM changes selected project, we should reload
    effect(() => {
      const pid = this.projectId();
      const isPm = this.isPM();
      
      // We wrap it in a setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError 
      // if this runs during CD, though effect() usually runs after.
      setTimeout(() => {
        if (isPm && pid) {
          this.loadProjectData(pid);
        }
      }, 0);
    });
  }

  ngOnInit() {
    if (!this.isPM()) {
      this.loadEmployeeData();
    }
  }

  getSummary() {
    return this.isPM() ? this.projectSummary() : this.employeeSummary();
  }

  getModelUsageArray() {
    const summary = this.projectSummary();
    if (!summary || !summary.modelUsageCounts) return [];
    
    const total = summary.totalOperations || 1;
    return Object.entries(summary.modelUsageCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count); // Highest first
  }

  private async loadEmployeeData() {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const res = await this.telemetryService.getEmployeeSummary();
      if (res.succeeded) {
        this.employeeSummary.set(res.data);
      } else {
        this.error.set(res.message || 'Failed to load telemetry.');
      }
    } catch (e: any) {
      this.error.set(e?.message || 'An error occurred fetching telemetry.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadProjectData(projectId: string) {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const [summaryRes, membersRes] = await Promise.all([
        this.telemetryService.getProjectSummary(projectId),
        this.telemetryService.getProjectMembersUsage(projectId)
      ]);

      if (summaryRes.succeeded && membersRes.succeeded) {
        this.projectSummary.set(summaryRes.data);
        this.projectMembers.set(membersRes.data || []);
      } else {
        this.error.set(summaryRes.message || membersRes.message || 'Failed to load project telemetry.');
      }
    } catch (e: any) {
      this.error.set(e?.message || 'An error occurred fetching project telemetry.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
