import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import {
  EmployeeAiSummaryDto,
  ManagedProjectsAiSummaryDto,
  ProjectAiSummaryDto,
  ProjectMemberAiUsageDto,
  TelemetryService,
} from '../../../../shared/api/Telemetry-api/telemetry.service';

@Component({
  selector: 'app-ai-telemetry',
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      @if (isPM()) {
        <section class="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm dark:border-indigo-500/20 dark:bg-slate-900" aria-labelledby="all-projects-usage-title">
          <div class="p-6 sm:p-8">
            <div class="mb-6 flex items-start gap-3">
              <span class="rounded-xl bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.25">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6.5A2.5 2.5 0 016.5 4h3A2.5 2.5 0 0112 6.5v3A2.5 2.5 0 019.5 12h-3A2.5 2.5 0 014 9.5v-3zm8 8a2.5 2.5 0 012.5-2.5h3a2.5 2.5 0 012.5 2.5v3a2.5 2.5 0 01-2.5 2.5h-3a2.5 2.5 0 01-2.5-2.5v-3zm2.5-10.5h3A2.5 2.5 0 0120 6.5v1A2.5 2.5 0 0117.5 10h-3A2.5 2.5 0 0112 7.5v-1A2.5 2.5 0 0114.5 4zM6.5 14h1A2.5 2.5 0 0110 16.5v1A2.5 2.5 0 017.5 20h-1A2.5 2.5 0 014 17.5v-1A2.5 2.5 0 016.5 14z" />
                </svg>
              </span>
              <div>
                <h2 id="all-projects-usage-title" class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{{ 'TELEMETRY.ALL_PROJECTS_TITLE' | translate }}</h2>
                <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">{{ 'TELEMETRY.ALL_PROJECTS_DESC' | translate }}</p>
              </div>
            </div>

            @if (portfolioLoading()) {
              <div class="grid grid-cols-2 gap-4 md:grid-cols-4" aria-live="polite" [attr.aria-label]="'TELEMETRY.LOADING' | translate">
                @for (placeholder of metricPlaceholders; track placeholder) {
                  <div class="h-[78px] rounded-xl border border-slate-100 bg-slate-50 motion-safe:animate-pulse dark:border-slate-700 dark:bg-slate-800/50"></div>
                }
              </div>
            } @else if (portfolioError()) {
              <div class="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300" role="alert">
                <span>{{ portfolioError() }}</span>
                <button type="button" class="min-h-11 rounded-lg border border-red-200 bg-white px-4 py-2 font-semibold text-red-700 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:border-red-500/30 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-500/10" (click)="loadPortfolioData()">
                  {{ 'TELEMETRY.RETRY' | translate }}
                </button>
              </div>
            } @else {
              <ng-container [ngTemplateOutlet]="metricsGrid" [ngTemplateOutletContext]="{ $implicit: portfolioSummary() }" />
            }
          </div>
        </section>
      }

      <section class="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 dark:border-slate-800 dark:bg-slate-900">
        <div class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-purple-500/0 opacity-0 transition-all duration-500 group-hover:from-indigo-500/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 group-hover:opacity-100"></div>
        <div class="p-6 sm:p-8">
          <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="mb-1 flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                <span class="rounded-xl bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </span>
                {{ 'TELEMETRY.TITLE' | translate }}
              </h2>
              <p class="text-sm text-slate-600 dark:text-slate-400">{{ isPM() ? ('TELEMETRY.PM_DESC' | translate) : ('TELEMETRY.EMP_DESC' | translate) }}</p>
            </div>
            @if (!isPM() || projectId()) {
              <span class="max-w-full self-start truncate rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-300 sm:max-w-[45%] sm:self-auto" [title]="isPM() ? selectedProjectName() : ('TELEMETRY.ROLE_EMP' | translate)">
                {{ isPM() ? selectedProjectName() : ('TELEMETRY.ROLE_EMP' | translate) }}
              </span>
            }
          </div>

          @if (detailLoading()) {
            <div class="flex flex-col items-center justify-center py-12" aria-live="polite">
              <svg class="mb-4 h-8 w-8 animate-spin text-indigo-600 motion-reduce:animate-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">{{ 'TELEMETRY.LOADING' | translate }}</p>
            </div>
          } @else if (detailError()) {
            <div class="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300" role="alert">
              <span>{{ detailError() }}</span>
              <button type="button" class="min-h-11 rounded-lg border border-red-200 bg-white px-4 py-2 font-semibold text-red-700 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:border-red-500/30 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-500/10" (click)="retryDetail()">{{ 'TELEMETRY.RETRY' | translate }}</button>
            </div>
          } @else if (isPM() && !projectId()) {
            <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
              <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm12-3c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zM9 10l12-3" /></svg>
              </div>
              <h3 class="mb-1 font-bold text-slate-900 dark:text-white">{{ 'TELEMETRY.NO_PROJECT' | translate }}</h3>
              <p class="mx-auto max-w-sm text-sm text-slate-600 dark:text-slate-400">{{ 'TELEMETRY.NO_PROJECT_DESC' | translate }}</p>
            </div>
          } @else {
            <div class="space-y-8 animate-fade-in motion-reduce:animate-none">
              <ng-container [ngTemplateOutlet]="metricsGrid" [ngTemplateOutletContext]="{ $implicit: currentSummary() }" />
              @if (isPM() && projectSummary()) {
                <div class="grid grid-cols-1 gap-8 border-t border-slate-100 pt-4 dark:border-slate-800 md:grid-cols-2">
                  <div>
                    <h3 class="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      {{ 'TELEMETRY.MODEL_USAGE' | translate }}
                    </h3>
                    <div class="space-y-4">
                      @for (model of modelUsage(); track model.name) {
                        <div>
                          <div class="mb-1.5 flex justify-between text-sm"><span class="font-medium text-slate-700 dark:text-slate-300">{{ model.name }}</span><span class="text-slate-600 dark:text-slate-400">{{ model.count }} {{ 'TELEMETRY.OPS' | translate }}</span></div>
                          <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div class="h-2 rounded-full bg-indigo-500 transition-all duration-300 motion-reduce:transition-none" [style.width.%]="model.percentage"></div></div>
                        </div>
                      } @empty {
                        <p class="text-sm italic text-slate-500 dark:text-slate-400">{{ 'TELEMETRY.NO_DATA' | translate }}</p>
                      }
                    </div>
                  </div>
                  <div>
                    <h3 class="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      {{ 'TELEMETRY.TEAM_USAGE' | translate }}
                    </h3>
                    <div class="overflow-hidden rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/30">
                      <ul class="max-h-64 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800/50">
                        @for (member of projectMembers(); track member.userId) {
                          <li class="flex items-center justify-between p-3 transition-colors hover:bg-white dark:hover:bg-slate-800">
                            <div class="flex min-w-0 flex-col"><span class="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{{ member.fullName }}</span><span class="max-w-[150px] truncate text-xs text-slate-600 dark:text-slate-400">{{ member.email }}</span></div>
                            <div class="flex shrink-0 flex-col text-right tabular-nums"><span class="text-sm font-bold text-slate-900 dark:text-white">{{ member.totalCostUsd | currency:'USD':'symbol':'1.2-4' }}</span><span class="text-xs font-medium text-indigo-600 dark:text-indigo-400">{{ member.totalOperations }} {{ 'TELEMETRY.OPS' | translate }}</span></div>
                          </li>
                        } @empty {
                          <li class="p-4 text-center text-sm italic text-slate-500 dark:text-slate-400">{{ 'TELEMETRY.NO_TEAM_DATA' | translate }}</li>
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
    </div>

    <ng-template #metricsGrid let-summary>
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-shadow duration-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50"><p class="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{{ 'TELEMETRY.METRIC_OPS' | translate }}</p><span class="text-2xl font-black leading-none text-slate-900 tabular-nums dark:text-white">{{ (summary?.totalOperations || 0) | number }}</span></div>
        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-shadow duration-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50"><p class="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{{ 'TELEMETRY.METRIC_TOKENS' | translate }}</p><span class="text-2xl font-black leading-none text-indigo-600 tabular-nums dark:text-indigo-400">{{ (summary?.totalTokens || 0) | number }}</span></div>
        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-shadow duration-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50"><p class="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{{ 'TELEMETRY.METRIC_COST' | translate }}</p><span class="text-2xl font-black leading-none text-emerald-600 tabular-nums dark:text-emerald-400">{{ (summary?.totalCostUsd || 0) | currency:'USD':'symbol':'1.2-4' }}</span></div>
        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-shadow duration-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50"><p class="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{{ 'TELEMETRY.METRIC_LATENCY' | translate }}</p><span class="text-2xl font-black leading-none text-amber-600 tabular-nums dark:text-amber-500">{{ (summary?.averageResponseTimeMs || 0) / 1000 | number:'1.1-2' }}s</span></div>
      </div>
    </ng-template>
  `,
})
export class AiTelemetryComponent {
  private readonly projectState = inject(ProjectStateService);
  private readonly telemetryService = inject(TelemetryService);
  private readonly translate = inject(TranslateService);

  readonly isPM = this.projectState.isProjectManager;
  readonly projectId = this.projectState.selectedProjectId;
  readonly metricPlaceholders = [1, 2, 3, 4];
  readonly portfolioLoading = signal(false);
  readonly portfolioError = signal<string | null>(null);
  readonly portfolioSummary = signal<ManagedProjectsAiSummaryDto | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal<string | null>(null);
  readonly employeeSummary = signal<EmployeeAiSummaryDto | null>(null);
  readonly projectSummary = signal<ProjectAiSummaryDto | null>(null);
  readonly projectMembers = signal<ProjectMemberAiUsageDto[]>([]);

  private portfolioRequested = false;
  private employeeRequested = false;
  private lastProjectId: string | null = null;
  private projectRequestSequence = 0;

  constructor() {
    effect(() => {
      if (this.projectState.loading()) return;
      const isProjectManager = this.isPM();
      const selectedProjectId = this.projectId();

      if (isProjectManager) {
        if (!this.portfolioRequested) {
          this.portfolioRequested = true;
          void this.loadPortfolioData();
        }
        if (selectedProjectId && selectedProjectId !== this.lastProjectId) {
          this.lastProjectId = selectedProjectId;
          void this.loadProjectData(selectedProjectId);
        } else if (!selectedProjectId) {
          this.lastProjectId = null;
          this.projectRequestSequence++;
          this.projectSummary.set(null);
          this.projectMembers.set([]);
          this.detailError.set(null);
          this.detailLoading.set(false);
        }
      } else if (!this.employeeRequested) {
        this.employeeRequested = true;
        void this.loadEmployeeData();
      }
    });
  }

  currentSummary(): EmployeeAiSummaryDto | ProjectAiSummaryDto | null {
    return this.isPM() ? this.projectSummary() : this.employeeSummary();
  }

  selectedProjectName(): string {
    const project = this.projectState.selectedProject();
    const localizedName = this.translate.currentLang() === 'ar' ? project?.nameAr : project?.nameEn;
    return localizedName || project?.name || this.projectSummary()?.projectName || '';
  }

  modelUsage(): Array<{ name: string; count: number; percentage: number }> {
    const summary = this.projectSummary();
    if (!summary?.modelUsageCounts) return [];
    const total = summary.totalOperations || 1;
    return Object.entries(summary.modelUsageCounts)
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
  }

  async loadPortfolioData(): Promise<void> {
    this.portfolioLoading.set(true);
    this.portfolioError.set(null);
    try {
      const response = await this.telemetryService.getManagedProjectsSummary();
      if (response.succeeded) this.portfolioSummary.set(response.data);
      else this.portfolioError.set(response.message || this.translate.instant('TELEMETRY.ALL_PROJECTS_ERROR'));
    } catch (error: any) {
      this.portfolioError.set(error?.message || this.translate.instant('TELEMETRY.ALL_PROJECTS_ERROR'));
    } finally {
      this.portfolioLoading.set(false);
    }
  }

  retryDetail(): void {
    const selectedProjectId = this.projectId();
    if (this.isPM() && selectedProjectId) void this.loadProjectData(selectedProjectId);
    else if (!this.isPM()) void this.loadEmployeeData();
  }

  private async loadEmployeeData(): Promise<void> {
    this.detailLoading.set(true);
    this.detailError.set(null);
    try {
      const response = await this.telemetryService.getEmployeeSummary();
      if (response.succeeded) this.employeeSummary.set(response.data);
      else this.detailError.set(response.message || this.translate.instant('TELEMETRY.DETAIL_ERROR'));
    } catch (error: any) {
      this.detailError.set(error?.message || this.translate.instant('TELEMETRY.DETAIL_ERROR'));
    } finally {
      this.detailLoading.set(false);
    }
  }

  private async loadProjectData(projectId: string): Promise<void> {
    const requestSequence = ++this.projectRequestSequence;
    this.detailLoading.set(true);
    this.detailError.set(null);
    try {
      const [summaryResponse, membersResponse] = await Promise.all([
        this.telemetryService.getProjectSummary(projectId),
        this.telemetryService.getProjectMembersUsage(projectId),
      ]);
      if (requestSequence !== this.projectRequestSequence || this.projectId() !== projectId) return;
      if (summaryResponse.succeeded && membersResponse.succeeded) {
        this.projectSummary.set(summaryResponse.data);
        this.projectMembers.set(membersResponse.data || []);
      } else {
        this.detailError.set(summaryResponse.message || membersResponse.message || this.translate.instant('TELEMETRY.DETAIL_ERROR'));
      }
    } catch (error: any) {
      if (requestSequence === this.projectRequestSequence) {
        this.detailError.set(error?.message || this.translate.instant('TELEMETRY.DETAIL_ERROR'));
      }
    } finally {
      if (requestSequence === this.projectRequestSequence) this.detailLoading.set(false);
    }
  }
}
