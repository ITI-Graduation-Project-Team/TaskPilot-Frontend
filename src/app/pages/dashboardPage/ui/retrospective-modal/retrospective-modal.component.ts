import { Component, ChangeDetectionStrategy, signal, computed, inject, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SprintPlanningService, SprintRetrospectiveData, SprintImprovement, DeveloperMetric, PartiallyCompletedStory } from '../../../../shared/api/sprint-planning.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { extractApiError } from '../../../../shared/api/auth.api';

@Component({
  selector: 'app-retrospective-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]"
         [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      <div class="bg-surface border border-border rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-[scaleUp_0.25s_ease_both]">
        
        <!-- Header -->
        <div class="p-5 border-b border-border bg-sidebar flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-text-primary flex items-center gap-2">
                <span>{{ currentLang === 'ar' ? 'محلل الأداء الختامي للسبرنت' : 'Sprint Retrospective Analyzer' }}</span>
                @if (retro()?.sprintTitleEn) {
                  <span class="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                    {{ currentLang === 'ar' ? (retro()?.sprintTitleAr || retro()?.sprintTitleEn) : retro()?.sprintTitleEn }}
                  </span>
                }
              </h3>
              <p class="text-xs text-text-secondary">
                {{ currentLang === 'ar' ? 'تقرير ذكاء اصطناعي يلخص أداء الفريق، العقبات، والتوصيات.' : 'AI feedback report summarizing team performance, delays, and recommendations.' }}
              </p>
            </div>
          </div>
          <button (click)="close.emit()" class="p-2 hover:bg-background rounded-full transition-colors text-text-secondary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6 overflow-y-auto flex-1">
          @if (isLoading()) {
            <div class="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div class="w-9 h-9 rounded-full border-3 border-primary border-t-transparent animate-spin"></div>
              <span class="text-xs font-semibold text-text-secondary">
                {{ currentLang === 'ar' ? 'يقوم الذكاء الاصطناعي بتحليل الأداء حالياً...' : 'AI is running analytical retrospect engines...' }}
              </span>
            </div>
          } @else if (!activeRetro()) {
            <div class="flex flex-col items-center justify-center py-12 text-center space-y-4 bg-sidebar border border-border p-6 rounded-2xl">
              <svg class="w-12 h-12 text-text-secondary opacity-30 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <div class="space-y-1">
                <p class="text-sm font-bold text-text-primary">
                  {{ currentLang === 'ar' ? 'لا يوجد تقرير مراجعة بعد' : 'No retrospective generated yet' }}
                </p>
                <p class="text-xs text-text-secondary max-w-sm">
                  {{ currentLang === 'ar' 
                      ? 'لم يتم إنشاء تقرير المراجعة الختامية لهذا السبرنت المنتهي بعد.' 
                      : 'No retrospective generated yet for this completed sprint.' 
                  }}
                </p>
              </div>
              
              @if (projectState.isProjectManager()) {
                <button (click)="generateReport()" class="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all">
                  {{ currentLang === 'ar' ? 'إنشاء تقرير المراجعة بالذكاء الاصطناعي' : 'Generate AI Retrospective Report' }}
                </button>
              } @else {
                <p class="text-xs text-warning font-semibold bg-warning/10 px-3 py-1.5 rounded-lg border border-warning/20">
                  {{ currentLang === 'ar' 
                      ? 'يرجى الانتظار حتى يقوم مدير المشروع بإنشاء التقرير.' 
                      : 'Please wait until the Project Manager generates the report.' 
                  }}
                </p>
              }
            </div>
          } @else {
            
            <div class="space-y-5">
              <!-- KPI Row -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <!-- Completion Rate Card -->
                <div class="bg-primary/5 border border-primary/15 p-3.5 rounded-2xl text-center">
                  <span class="text-[10px] text-primary font-bold uppercase tracking-wider block">
                    {{ currentLang === 'ar' ? 'معدل الإنجاز' : 'Completion Rate' }}
                  </span>
                  <span class="text-text-primary text-xl font-black mt-1 block">
                    {{ (activeRetro()?.completionRate ?? 0) | number:'1.0-2' }}%
                  </span>
                </div>

                <!-- Total Tasks Card -->
                <div class="bg-sidebar border border-border p-3.5 rounded-2xl text-center">
                  <span class="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">
                    {{ currentLang === 'ar' ? 'إجمالي المهام' : 'Total Tasks' }}
                  </span>
                  <span class="text-text-primary text-xl font-black mt-1 block">
                    {{ activeRetro()?.totalTasks ?? 0 }}
                  </span>
                  <span class="text-[10px] text-emerald-500 font-semibold block mt-0.5">
                    {{ activeRetro()?.completedTasks ?? 0 }} {{ currentLang === 'ar' ? 'مكتملة' : 'completed' }}
                  </span>
                </div>

                <!-- Hours Breakdown Card -->
                <div class="bg-emerald-500/5 border border-emerald-500/15 p-3.5 rounded-2xl text-center">
                  <span class="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block">
                    {{ currentLang === 'ar' ? 'ساعات التقدير / الفعلية' : 'Est. / Actual Hours' }}
                  </span>
                  <span class="text-text-primary text-base font-black mt-1 block">
                    {{ activeRetro()?.totalEstimatedHours ?? 0 }}h / {{ activeRetro()?.totalActualHours ?? 0 }}h
                  </span>
                </div>

                <!-- Velocity Ratio Card -->
                <div class="bg-amber-500/5 border border-amber-500/15 p-3.5 rounded-2xl text-center">
                  <span class="text-[10px] text-amber-500 font-bold uppercase tracking-wider block">
                    {{ currentLang === 'ar' ? 'معدل السرعة' : 'Velocity Ratio' }}
                  </span>
                  <span class="text-text-primary text-xl font-black mt-1 block">
                    {{ (activeRetro()?.velocityRatio ?? (activeRetro()?.estimationAccuracy ? activeRetro()!.estimationAccuracy! / 100 : 1.0)) | number:'1.1-2' }}x
                  </span>
                </div>
              </div>

              <!-- ─── PARTIALLY COMPLETED STORIES ─── -->
              @if (activeRetro()?.partiallyCompletedStories && activeRetro()!.partiallyCompletedStories!.length > 0) {
                <div class="p-4 bg-sidebar border border-amber-500/20 rounded-2xl space-y-3">
                  <div class="flex items-center justify-between">
                    <h4 class="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {{ currentLang === 'ar' ? 'القصص شبه المكتملة (أولوية السبرينت القادم)' : 'Partially Completed Stories (Carry-over Priority)' }}
                    </h4>
                    <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      {{ activeRetro()!.partiallyCompletedStories!.length }} {{ currentLang === 'ar' ? 'قصة' : 'stories' }}
                    </span>
                  </div>

                  <div class="grid grid-cols-1 gap-2.5">
                    @for (story of activeRetro()!.partiallyCompletedStories!; track story.userStoryId) {
                      <div class="p-3 bg-surface rounded-xl border border-border flex flex-col space-y-2">
                        <div class="flex items-center justify-between gap-2">
                          <p class="text-xs font-bold text-text-primary">
                            {{ currentLang === 'ar' ? (story.titleAr || story.titleEn) : story.titleEn }}
                          </p>
                          <span class="text-xs font-extrabold text-amber-500 shrink-0">
                            {{ story.completionPercentage | number:'1.0-1' }}%
                          </span>
                        </div>

                        <!-- Progress Bar -->
                        <div class="w-full bg-border/50 h-2 rounded-full overflow-hidden">
                          <div class="bg-amber-500 h-full rounded-full transition-all duration-500"
                               [style.width]="story.completionPercentage + '%'"></div>
                        </div>

                        <!-- Tasks status -->
                        <div class="flex items-center justify-between text-[11px] text-text-secondary">
                          <span>{{ currentLang === 'ar' ? 'إجمالي المهام: ' : 'Total Tasks: ' }} <strong>{{ story.totalTasks }}</strong></span>
                          <span>{{ currentLang === 'ar' ? 'المكتملة: ' : 'Completed: ' }} <strong class="text-emerald-500">{{ story.completedTasks }}</strong></span>
                          <span>{{ currentLang === 'ar' ? 'المتبقية: ' : 'Remaining: ' }} <strong class="text-amber-500">{{ story.remainingTasks }}</strong></span>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- ─── AI IMPROVEMENTS / RECOMMENDATIONS ─── -->
              @if (activeRetro()?.improvements && activeRetro()!.improvements!.length > 0) {
                <div class="p-4 bg-sidebar border border-border rounded-2xl space-y-3">
                  <h4 class="text-xs font-bold text-primary uppercase tracking-wider flex items-center justify-between">
                    <span>{{ currentLang === 'ar' ? 'توصيات وتحسينات الذكاء الاصطناعي' : 'AI Strategic Improvements' }}</span>
                    @if (selectedEmployeeId()) {
                      <button (click)="selectedEmployeeId.set(null)" class="text-[10px] text-text-secondary hover:underline lowercase font-normal">
                        {{ currentLang === 'ar' ? 'إلغاء الفلترة' : 'Clear filter' }}
                      </button>
                    }
                  </h4>

                  <div class="space-y-2">
                    @for (imp of activeRetro()!.improvements!; track imp.recommendationEn) {
                      <div (click)="imp.targetEmployeeId ? toggleEmployeeFilter(imp.targetEmployeeId) : null"
                           class="p-3 bg-surface rounded-xl border transition-all cursor-pointer"
                           [class.border-primary]="selectedEmployeeId() === imp.targetEmployeeId && imp.targetEmployeeId"
                           [class.border-border]="selectedEmployeeId() !== imp.targetEmployeeId"
                           [class.bg-primary/5]="selectedEmployeeId() === imp.targetEmployeeId && imp.targetEmployeeId">
                        
                        <div class="flex items-center justify-between gap-2 mb-1">
                          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                                [class.bg-error/10]="imp.priority === 'High'"
                                [class.text-error]="imp.priority === 'High'"
                                [class.bg-warning/10]="imp.priority === 'Medium'"
                                [class.text-warning]="imp.priority === 'Medium'"
                                [class.bg-primary/10]="imp.priority === 'Low'"
                                [class.text-primary]="imp.priority === 'Low'">
                            {{ imp.priority }} Priority · {{ imp.category }}
                          </span>

                          @if (imp.targetEmployeeId) {
                            <span class="text-[10px] text-primary font-semibold underline">
                              {{ currentLang === 'ar' ? 'اضغط لتمييز المطور' : 'Click to highlight dev' }}
                            </span>
                          }
                        </div>

                        <p class="text-xs text-text-primary leading-relaxed font-medium">
                          {{ currentLang === 'ar' ? imp.recommendationAr : imp.recommendationEn }}
                        </p>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- ─── DEVELOPER BREAKDOWN METRICS ─── -->
              @if (activeRetro()?.developerBreakdowns && activeRetro()!.developerBreakdowns!.length > 0) {
                <div class="p-4 bg-sidebar border border-border rounded-2xl space-y-3">
                  <h4 class="text-xs font-bold text-text-primary uppercase tracking-wider">
                    {{ currentLang === 'ar' ? 'أداء مطوري الفريق' : 'Team Developer Breakdown' }}
                  </h4>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    @for (dev of activeRetro()!.developerBreakdowns!; track dev.employeeId) {
                      <div class="p-3 bg-surface rounded-xl border transition-all"
                           [class.ring-2]="selectedEmployeeId() === dev.employeeId"
                           [class.ring-primary]="selectedEmployeeId() === dev.employeeId"
                           [class.border-primary]="selectedEmployeeId() === dev.employeeId"
                           [class.border-border]="selectedEmployeeId() !== dev.employeeId">
                        <div class="flex items-center justify-between mb-1.5">
                          <p class="text-xs font-bold text-text-primary">{{ dev.fullName }}</p>
                          <span class="text-xs font-black text-primary">{{ dev.completionRate | number:'1.0-1' }}%</span>
                        </div>
                        <div class="space-y-1 text-[11px] text-text-secondary">
                          <div class="flex justify-between">
                            <span>{{ currentLang === 'ar' ? 'المهام (مسندة/مكتملة):' : 'Tasks (Assigned/Done):' }}</span>
                            <span class="font-semibold text-text-primary">{{ dev.assignedTasks ?? 0 }} / {{ dev.completedTasks ?? 0 }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span>{{ currentLang === 'ar' ? 'الساعات (تقديرية/فعلية):' : 'Hours (Est/Actual):' }}</span>
                            <span class="font-semibold text-text-primary">{{ dev.estimatedHours ?? 0 }}h / {{ dev.actualHours ?? 0 }}h</span>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Content Cards -->
              <div class="space-y-3">
                @if (activeRetro()?.whatWentWellEn || activeRetro()?.whatWentWellAr) {
                  <div class="p-4 bg-sidebar border border-border rounded-2xl">
                    <h4 class="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1.5">
                      {{ currentLang === 'ar' ? 'ما تم إنجازه بنجاح' : 'What Went Well' }}
                    </h4>
                    <p class="text-xs text-text-primary leading-relaxed">
                      {{ currentLang === 'ar' ? (activeRetro()?.whatWentWellAr || activeRetro()?.whatWentWellEn) : (activeRetro()?.whatWentWellEn || activeRetro()?.whatWentWellAr) }}
                    </p>
                  </div>
                }

                @if (activeRetro()?.challengesEn || activeRetro()?.challengesAr) {
                  <div class="p-4 bg-sidebar border border-border rounded-2xl">
                    <h4 class="text-xs font-bold text-error uppercase tracking-wider mb-1.5">
                      {{ currentLang === 'ar' ? 'التحديات والعقبات' : 'Challenges & Blockers' }}
                    </h4>
                    <p class="text-xs text-text-primary leading-relaxed">
                      {{ currentLang === 'ar' ? (activeRetro()?.challengesAr || activeRetro()?.challengesEn) : (activeRetro()?.challengesEn || activeRetro()?.challengesAr) }}
                    </p>
                  </div>
                }

                @if (activeRetro()?.actionItemsEn || activeRetro()?.actionItemsAr) {
                  <div class="p-4 bg-sidebar border border-border rounded-2xl">
                    <h4 class="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1.5">
                      {{ currentLang === 'ar' ? 'خطوات العمل القادمة' : 'Action Items' }}
                    </h4>
                    <p class="text-xs text-text-primary leading-relaxed">
                      {{ currentLang === 'ar' ? (activeRetro()?.actionItemsAr || activeRetro()?.actionItemsEn) : (activeRetro()?.actionItemsEn || activeRetro()?.actionItemsAr) }}
                    </p>
                  </div>
                }

                <div class="p-4 bg-sidebar border border-border rounded-2xl">
                  <h4 class="text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                    {{ currentLang === 'ar' ? 'ملخص انطباع الفريق' : 'Team Sentiment Summary' }}
                  </h4>
                  @if (activeRetro()?.teamSentimentSummaryEn?.trim() || activeRetro()?.teamSentimentSummaryAr?.trim()) {
                    <p class="text-xs text-text-primary leading-relaxed font-medium italic">
                      "{{ currentLang === 'ar' ? (activeRetro()?.teamSentimentSummaryAr || activeRetro()?.teamSentimentSummaryEn) : (activeRetro()?.teamSentimentSummaryEn || activeRetro()?.teamSentimentSummaryAr) }}"
                    </p>
                  } @else {
                    <p class="text-xs text-text-secondary leading-relaxed font-normal opacity-75 italic">
                      {{ currentLang === 'ar' ? 'لم يتم تسجيل ملخص انطباعات محدد للفريق في هذا السبرينت.' : 'No specific team sentiment feedback recorded for this sprint.' }}
                    </p>
                  }
                </div>
              </div>

            </div>
          }
        </div>

        <!-- Footer -->
        <div class="p-5 border-t border-border bg-sidebar flex items-center justify-end shrink-0">
          <button (click)="close.emit()" class="px-5 py-2 bg-background border border-border hover:bg-sidebar text-text-primary font-semibold rounded-xl text-xs transition-colors">
            {{ currentLang === 'ar' ? 'إغلاق' : 'Close' }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class RetrospectiveModalComponent implements OnInit {
  @Input() sprintId!: string;
  @Input() projectId?: string | null;
  @Output() close = new EventEmitter<void>();

  private sprintService = inject(SprintPlanningService);
  private toastService = inject(ToastService);
  public projectState = inject(ProjectStateService);

  retro = signal<SprintRetrospectiveData | null>(null);
  isLoading = signal(false);
  selectedEmployeeId = signal<string | null>(null);

  activeRetro = computed(() => {
    const raw: any = this.retro();
    if (!raw) return null;

    const metrics = raw.metrics;
    const analysis = raw.analysis;

    const completionRate = metrics?.completionRate ?? raw.completionRate ?? 0;
    const totalTasks = metrics?.totalTasks ?? raw.totalTasks ?? 0;
    const completedTasks = metrics?.completedTasks ?? raw.completedTasks ?? 0;
    const unfinishedTasks = metrics?.unfinishedTasks ?? raw.unfinishedTasks ?? raw.notStartedTasks ?? (totalTasks - completedTasks);
    const inProgressTasks = raw.inProgressTasks ?? 0;
    const notStartedTasks = raw.notStartedTasks ?? unfinishedTasks;
    const totalEstimatedHours = metrics?.totalEstimatedHours ?? raw.totalEstimatedHours ?? 0;
    const totalActualHours = metrics?.totalActualHours ?? raw.totalActualHours ?? 0;
    const velocityRatio = metrics?.velocityRatio ?? raw.velocityRatio ?? 1.0;
    const estimationAccuracy = raw.estimationAccuracy ?? (totalEstimatedHours > 0 ? Math.min(100, Math.round((totalActualHours / totalEstimatedHours) * 100)) : 100);
    const developerBreakdowns = metrics?.developerMetrics ?? raw.developerBreakdowns ?? [];

    const cleanStr = (val: any): string => {
      if (!val) return '';
      if (Array.isArray(val)) {
        val = val.filter(Boolean).join('\n• ');
      }
      if (typeof val !== 'string') return '';
      let trimmed = val.replace(/^["'\s]+|["'\s]+$/g, '').trim();
      const lowerTrimmed = trimmed.toLowerCase();
      if (trimmed === '""' || trimmed === "''" || lowerTrimmed === 'n/a' || trimmed === '-' || trimmed === '[]' || trimmed === '{}' || lowerTrimmed === 'null' || lowerTrimmed === 'undefined') {
        return '';
      }
      return trimmed;
    };

    const whatWentWellEn = cleanStr(analysis?.whatWentWellEn ?? raw.whatWentWellEn);
    const whatWentWellAr = cleanStr(analysis?.whatWentWellAr ?? raw.whatWentWellAr);
    const challengesEn = cleanStr(analysis?.challengesEn ?? raw.challengesEn);
    const challengesAr = cleanStr(analysis?.challengesAr ?? raw.challengesAr);
    const teamSentimentSummaryEn = cleanStr(analysis?.teamSentiment ?? raw.teamSentimentSummaryEn);
    const teamSentimentSummaryAr = cleanStr(analysis?.summaryAr ?? raw.teamSentimentSummaryAr);
    const actionItemsEn = cleanStr(raw.actionItemsEn);
    const actionItemsAr = cleanStr(raw.actionItemsAr);

    return {
      sprintId: raw.sprintId,
      sprintTitleEn: raw.sprintTitleEn,
      generatedAt: raw.generatedAt,
      completionRate,
      totalTasks,
      completedTasks,
      unfinishedTasks,
      inProgressTasks,
      notStartedTasks,
      totalEstimatedHours,
      totalActualHours,
      velocityRatio,
      estimationAccuracy,
      developerBreakdowns,
      whatWentWellEn,
      whatWentWellAr,
      challengesEn,
      challengesAr,
      teamSentimentSummaryEn,
      teamSentimentSummaryAr,
      actionItemsEn,
      actionItemsAr,
      improvements: raw.improvements || [],
      partiallyCompletedStories: raw.partiallyCompletedStories || []
    };
  });

  get currentLang(): string {
    return localStorage?.getItem('app_lang') || 'en';
  }

  async ngOnInit() {
    await this.loadRetrospective();
  }

  toggleEmployeeFilter(empId: string) {
    if (this.selectedEmployeeId() === empId) {
      this.selectedEmployeeId.set(null);
    } else {
      this.selectedEmployeeId.set(empId);
    }
  }

  async loadRetrospective() {
    this.isLoading.set(true);
    try {
      const pId = this.projectId || this.projectState.selectedProjectId();
      const res = await this.sprintService.getRetrospective(this.sprintId, pId || undefined);
      this.retro.set(res.data || res || null);
    } catch (e) {
      console.warn('No existing retro report found.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async generateReport() {
    this.isLoading.set(true);
    try {
      const pId = this.projectId || this.projectState.selectedProjectId();
      const res = await this.sprintService.generateRetrospective(this.sprintId, pId || undefined);
      this.retro.set(res.data || res || null);
      this.toastService.show(
        this.currentLang === 'ar' ? '🎉 تم إنشاء التقرير الختامي بنجاح!' : '🎉 Retrospective report generated successfully!',
        'success'
      );
    } catch (e: any) {
      console.error(e);
      const apiError = extractApiError(e);
      const fallbackMsg = this.currentLang === 'ar' ? 'فشل إنشاء تقرير التحليل الختامي.' : 'Failed to generate retrospective analysis. Check backend server logs.';
      this.toastService.show(apiError || fallbackMsg, 'error');
    } finally {
      this.isLoading.set(false);
    }
  }
}
