import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  SprintPlanningService,
  SprintRetrospectiveData,
  SprintImprovement,
  DeveloperMetric,
  PartiallyCompletedStory,
  SprintListItem
} from '../../../../shared/api/sprint-planning.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { extractApiError } from '../../../../shared/api/auth.api';
import { AiActivityComponent } from '../../../../shared/ui/ai-activity/ai-activity.component';

@Component({
  selector: 'app-retrospective-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, AiActivityComponent],
  template: `
    <div class="space-y-6 animate-[fadeIn_0.25s_ease_both]">

      <!-- ─── HEADER BANNER ─── -->
      <div class="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm relative" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
        <!-- Ambient background glow -->
        <div class="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div class="absolute -top-24 -right-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
          <div class="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-2 max-w-xl">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-3 py-1 text-xs font-extrabold bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center gap-1.5 shrink-0">
                <svg class="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                {{ currentLang() === 'ar' ? 'ذكاء اصطناعي تحليلي' : 'AI Performance Intelligence' }}
              </span>
              @if (retro()?.sprintTitleEn) {
                <span class="px-3 py-1 text-xs font-bold bg-sidebar border border-border text-text-primary rounded-full shrink-0">
                  {{ currentLang() === 'ar' ? (retro()?.sprintTitleAr || retro()?.sprintTitleEn) : retro()?.sprintTitleEn }}
                </span>
              }
            </div>

            <h2 class="text-2xl sm:text-3xl font-black text-text-primary font-display tracking-tight">
              {{ currentLang() === 'ar' ? 'مراجعة أداء السبرينت والتحليل الختامي' : 'Sprint Retrospective & Analytics' }}
            </h2>
            <p class="text-sm text-text-secondary leading-relaxed">
              {{ currentLang() === 'ar'
                ? 'مراجعة شاملة مدعومة بالذكاء الاصطناعي لتحليل معدلات الإنجاز، أداء المطورين، التوصيات الهيكلية، والقصص الشبه منتهية.'
                : 'Comprehensive AI-driven report analyzing sprint completion rates, developer metrics, capacity recommendations, and carry-over stories.' }}
            </p>
          </div>

          <!-- Sprint Selector Dropdown & Actions -->
          <div class="flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0">
            @if (sprints().length > 0) {
              <!-- Dropdown Backdrop -->
              @if (isDropdownOpen()) {
                <div class="fixed inset-0 z-40" (click)="isDropdownOpen.set(false)"></div>
              }
              <div class="relative min-w-[220px] max-w-[280px] z-50">
                <button
                  type="button"
                  (click)="isDropdownOpen.set(!isDropdownOpen())"
                  class="w-full flex items-center justify-between gap-3 bg-sidebar border border-border hover:border-primary/40 text-text-primary text-xs font-bold rounded-xl px-4 py-2.5 outline-none transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-primary/20 text-left">
                  <span class="truncate flex-1">
                    @if (selectedSprint()) {
                      {{ selectedSprint()!.title }}
                    } @else {
                      {{ currentLang() === 'ar' ? 'اختر السبرينت' : 'Select Sprint' }}
                    }
                  </span>
                  <svg class="w-4 h-4 text-text-tertiary transition-transform duration-200 shrink-0" 
                       [class.rotate-180]="isDropdownOpen()" 
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                
                @if (isDropdownOpen()) {
                  <div class="absolute top-full mt-2 w-full min-w-[260px] end-0 sm:end-auto bg-surface border border-border rounded-xl shadow-lg overflow-hidden flex flex-col max-h-[300px] animate-[fadeIn_0.15s_ease_out]">
                    <div class="overflow-y-auto overscroll-contain py-1.5 custom-scrollbar">
                      @for (sp of sprints(); track sp.sprintId) {
                        <button
                          type="button"
                          (click)="onSprintSelected(sp.sprintId); isDropdownOpen.set(false)"
                          class="w-full text-left flex items-center justify-between px-4 py-2.5 text-xs transition-colors hover:bg-primary/5 hover:text-primary group"
                          [class.bg-primary/10]="selectedSprintId() === sp.sprintId"
                          [class.text-primary]="selectedSprintId() === sp.sprintId"
                          [class.font-extrabold]="selectedSprintId() === sp.sprintId"
                          [class.text-text-primary]="selectedSprintId() !== sp.sprintId"
                          [class.font-semibold]="selectedSprintId() !== sp.sprintId">
                          <span class="truncate pr-3">
                            {{ sp.title }}
                          </span>
                          @if (sp.status === 'Completed') {
                            <span class="shrink-0 flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                              Done
                            </span>
                          } @else {
                            <span class="shrink-0 text-[10px] uppercase font-bold text-text-tertiary">{{ sp.status }}</span>
                          }
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            @if (projectState.isProjectManager()) {
              <button
                (click)="generateReport()"
                [disabled]="isLoading() || !selectedSprintId()"
                class="whitespace-nowrap shrink-0 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0">
                @if (isLoading()) {
                  <div class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  {{ currentLang() === 'ar' ? 'جاري التحليل…' : 'Analyzing…' }}
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  {{ currentLang() === 'ar' ? (retro() ? 'إعادة التوليد' : 'إنشاء التقرير بالذكاء الاصطناعي') : (retro() ? 'Regenerate Retro' : 'Generate AI Retrospective') }}
                }
              </button>
            }
          </div>
        </div>
      </div>

      <!-- ─── LOADING STATE ─── -->
      @if (isGenerating()) {
        <div class="mx-auto my-8 max-w-3xl">
          <app-ai-activity
            [title]="currentLang() === 'ar' ? 'بنحلل أداء السبرينت' : 'Analyzing sprint performance'"
            [description]="currentLang() === 'ar' ? 'بنراجع معدل الإنجاز ودقة التقديرات والمهام المرحلة لاستخراج توصيات عملية.' : 'Reviewing completion, estimation accuracy, velocity, and carry-over work to produce practical recommendations.'"
          />
        </div>
      } @else if (isLoading()) {
        <div class="flex flex-col items-center justify-center text-center rounded-3xl border border-border bg-surface px-6 py-20 shadow-sm max-w-3xl mx-auto my-8 animate-[fadeIn_0.3s_ease_both]">
          <div class="relative mb-6">
            <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto animate-pulse">
              <svg class="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
          </div>
          <h3 class="text-xl font-bold text-text-primary mb-2">
            {{ currentLang() === 'ar' ? 'الذكاء الاصطناعي يقوم بتحليل نتائج السبرينت...' : 'AI is processing sprint retrospective parameters...' }}
          </h3>
          <p class="text-xs text-text-secondary">
            {{ currentLang() === 'ar' ? 'حساب معدل الإنجاز، دقة الساعات، والقصص شبه المكتملة...' : 'Computing completion accuracy, velocity ratios, and carry-over stories...' }}
          </p>
        </div>
      } @else if (sprints().length === 0) {
        <!-- ─── NO COMPLETED SPRINTS STATE ─── -->
        <div class="flex flex-col items-center justify-center text-center rounded-3xl border border-border bg-surface px-6 py-16 shadow-sm max-w-2xl mx-auto my-6 animate-[fadeIn_0.3s_ease_both]" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
          <div class="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-5 ring-8 ring-amber-500/5">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h3 class="text-xl font-extrabold text-text-primary mb-2 font-display">
            {{ currentLang() === 'ar' ? 'لا توجد سبرينتات مكتملة بعد' : 'No Completed Sprints Yet' }}
          </h3>
          <p class="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
            {{ currentLang() === 'ar'
              ? 'تتطلب مراجعة السبرينت الإنتهاء من سبرينت واحد على الأقل. قم بإكمال السبرينت الحالي من لوحة المهام أولاً لتوليد التقرير بنجاح.'
              : 'Retrospectives are only generated for completed sprints. Complete your active sprint first to enable AI performance analysis.' }}
          </p>
        </div>
      } @else if (!activeRetro()) {
        <!-- ─── NO RETRO REPORT READY STATE ─── -->
        <div class="flex flex-col items-center justify-center text-center rounded-3xl border border-border bg-surface px-6 py-16 shadow-sm max-w-2xl mx-auto my-6 animate-[fadeIn_0.3s_ease_both]" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
          <div class="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5 ring-8 ring-primary/5">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h3 class="text-xl font-extrabold text-text-primary mb-2 font-display">
            {{ currentLang() === 'ar' ? 'لم يتم إنشاء تقرير المراجعة بعد' : 'No Retrospective Report Generated' }}
          </h3>
          <p class="text-sm text-text-secondary max-w-md mx-auto leading-relaxed mb-6">
            {{ currentLang() === 'ar'
              ? 'لم يتم توليد تقرير المراجعة الختامية لذكاء الاصطناعي لهذا السبرينت. انقر على زر إنشاء التقرير أدناه لبدء التحليل.'
              : 'No retrospective analytics generated for this sprint yet. Click the button below to trigger AI performance synthesis.' }}
          </p>

          @if (projectState.isProjectManager()) {
            <button
              (click)="generateReport()"
              class="px-6 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              {{ currentLang() === 'ar' ? 'إنشاء تقرير المراجعة الآن' : 'Generate AI Retrospective Now' }}
            </button>
          } @else {
            <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
              {{ currentLang() === 'ar' ? 'يرجى الانتظار حتى يقوم مدير المشروع بإنشاء التقرير.' : 'Please wait until the Project Manager generates the report.' }}
            </div>
          }
        </div>
      } @else {
        <!-- ─── RETRO REPORT MAIN DASHBOARD ─── -->
        <div class="space-y-6" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">

          <!-- 1. KPI Executive Summary Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <!-- Completion Rate Card -->
            <div class="p-5 rounded-2xl bg-surface border border-border shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  {{ currentLang() === 'ar' ? 'معدل الإنجاز' : 'Completion Rate' }}
                </span>
                <span class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  %
                </span>
              </div>
              <div class="space-y-1">
                <p class="text-3xl font-black text-text-primary tracking-tight">
                  {{ (activeRetro()?.completionRate ?? 0) | number:'1.0-2' }}%
                </p>
                <div class="w-full bg-border/50 h-2 rounded-full overflow-hidden mt-2">
                  <div class="h-full rounded-full transition-all duration-700"
                       [style.width]="(activeRetro()?.completionRate ?? 0) + '%'"
                       [class.bg-emerald-500]="(activeRetro()?.completionRate ?? 0) >= 80"
                       [class.bg-amber-500]="(activeRetro()?.completionRate ?? 0) >= 50 && (activeRetro()?.completionRate ?? 0) < 80"
                       [class.bg-error]="(activeRetro()?.completionRate ?? 0) < 50">
                  </div>
                </div>
              </div>
            </div>

            <!-- Task Distribution Card -->
            <div class="p-5 rounded-2xl bg-surface border border-border shadow-xs hover:border-emerald-500/30 transition-all flex flex-col justify-between">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  {{ currentLang() === 'ar' ? 'إجمالي المهام' : 'Total Tasks' }}
                </span>
                <span class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
              </div>
              <div>
                <p class="text-3xl font-black text-text-primary tracking-tight mb-2">
                  {{ activeRetro()?.totalTasks ?? 0 }}
                </p>
                <div class="flex items-center justify-between text-xs font-semibold text-text-secondary pt-1 border-t border-border/60">
                  <span class="text-emerald-500">{{ currentLang() === 'ar' ? 'مكتمل:' : 'Done:' }} {{ activeRetro()?.completedTasks ?? 0 }}</span>
                  <span class="text-text-secondary">{{ currentLang() === 'ar' ? 'غير مكتمل:' : 'Unfinished:' }} {{ activeRetro()?.unfinishedTasks ?? 0 }}</span>
                </div>
              </div>
            </div>

            <!-- Estimation Hours Card -->
            <div class="p-5 rounded-2xl bg-surface border border-border shadow-xs hover:border-amber-500/30 transition-all flex flex-col justify-between">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  {{ currentLang() === 'ar' ? 'ساعات التقدير vs الفعلية' : 'Est. vs Actual Hours' }}
                </span>
                <span class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-bold">
                  ⏱
                </span>
              </div>
              <div>
                <div class="flex items-baseline gap-2">
                  <p class="text-3xl font-black text-text-primary tracking-tight">
                    {{ activeRetro()?.totalActualHours ?? 0 }}h
                  </p>
                  <span class="text-xs font-bold text-text-secondary">
                    / {{ activeRetro()?.totalEstimatedHours ?? 0 }}h {{ currentLang() === 'ar' ? 'تقدير' : 'est.' }}
                  </span>
                </div>
                <p class="text-[11px] font-semibold text-text-secondary mt-1">
                  {{ currentLang() === 'ar' ? 'دقة التقدير: ' : 'Accuracy: ' }}
                  <strong class="text-text-primary">{{ (activeRetro()?.estimationAccuracy ?? 100) | number:'1.0-1' }}%</strong>
                </p>
              </div>
            </div>

          </div>

          <!-- 2. Partially Completed Stories (Carry-over Priority) Section -->
          @if (activeRetro()?.partiallyCompletedStories && activeRetro()!.partiallyCompletedStories!.length > 0) {
            <div class="rounded-3xl border border-amber-500/30 bg-surface p-6 shadow-sm space-y-4">
              <div class="flex items-center justify-between gap-4 flex-wrap">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                    ⚡
                  </div>
                  <div>
                    <h3 class="text-base font-extrabold text-text-primary font-display">
                      {{ currentLang() === 'ar' ? 'القصص شبه المكتملة (أولوية التسليم بالسبرينت القادم)' : 'Partially Completed Stories (High Carry-over Priority)' }}
                    </h3>
                    <p class="text-xs text-text-secondary">
                      {{ currentLang() === 'ar'
                        ? 'قصص أُنجز جزء كبير من مهامها في هذا السبرينت ويُوصى بوضعها كأولوية قصوى في تخطيط السبرينت القادم.'
                        : 'User stories with significant progress in this sprint. Prioritized for immediate completion in the next sprint.' }}
                    </p>
                  </div>
                </div>

                <span class="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-extrabold">
                  {{ activeRetro()!.partiallyCompletedStories!.length }} {{ currentLang() === 'ar' ? 'قصص شبه منتهية' : 'Partially Done Stories' }}
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @for (story of activeRetro()!.partiallyCompletedStories!; track story.userStoryId) {
                  <div class="p-4 rounded-2xl bg-sidebar border border-border/80 space-y-3 hover:border-amber-500/40 transition-all">
                    <div class="flex items-start justify-between gap-3">
                      <h4 class="text-sm font-extrabold text-text-primary leading-snug">
                        {{ currentLang() === 'ar' ? (story.titleAr || story.titleEn) : story.titleEn }}
                      </h4>
                      <span class="text-xs font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg shrink-0">
                        {{ story.completionPercentage | number:'1.0-1' }}%
                      </span>
                    </div>

                    <!-- Progress bar -->
                    <div class="w-full bg-border/50 h-2 rounded-full overflow-hidden">
                      <div class="bg-amber-500 h-full rounded-full transition-all duration-700"
                           [style.width]="story.completionPercentage + '%'"></div>
                    </div>

                    <!-- Task breakdown -->
                    <div class="grid grid-cols-3 gap-2 text-center text-xs">
                      <div class="p-2 rounded-xl bg-surface border border-border">
                        <span class="text-[10px] text-text-secondary block font-bold uppercase">Total</span>
                        <span class="font-extrabold text-text-primary">{{ story.totalTasks }}</span>
                      </div>
                      <div class="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <span class="text-[10px] text-emerald-500 block font-bold uppercase">Done</span>
                        <span class="font-extrabold text-emerald-500">{{ story.completedTasks }}</span>
                      </div>
                      <div class="p-2 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        <span class="text-[10px] text-amber-500 block font-bold uppercase">Remaining</span>
                        <span class="font-extrabold text-amber-500">{{ story.remainingTasks }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- 3. AI Improvements & Strategic Recommendations Section -->
          @if (activeRetro()?.improvements && activeRetro()!.improvements!.length > 0) {
            <div class="rounded-3xl border border-border bg-surface p-6 shadow-sm space-y-4">
              <div class="flex items-center justify-between flex-wrap gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    💡
                  </div>
                  <div>
                    <h3 class="text-base font-extrabold text-text-primary font-display">
                      {{ currentLang() === 'ar' ? 'توصيات الذكاء الاصطناعي الاستراتيجية' : 'AI Strategic Recommendations' }}
                    </h3>
                    <p class="text-xs text-text-secondary">
                      {{ currentLang() === 'ar'
                        ? 'انقر على التوصية الموجهة لمطور معين لتمييز أداء المطور مباشرة في الجدول أدناه.'
                        : 'Click any developer-targeted recommendation to highlight their performance metrics below.' }}
                    </p>
                  </div>
                </div>

                @if (selectedEmployeeId()) {
                  <button (click)="selectedEmployeeId.set(null)" class="text-xs text-primary font-bold hover:underline">
                    {{ currentLang() === 'ar' ? 'إلغاء التظليل' : 'Clear Highlight' }}
                  </button>
                }
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @for (imp of activeRetro()!.improvements!; track imp.recommendationEn) {
                  <div
                    (click)="imp.targetEmployeeId ? toggleEmployeeFilter(imp.targetEmployeeId) : null"
                    class="p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative"
                    [class.border-primary]="selectedEmployeeId() === imp.targetEmployeeId && imp.targetEmployeeId"
                    [class.bg-primary/5]="selectedEmployeeId() === imp.targetEmployeeId && imp.targetEmployeeId"
                    [class.border-border]="selectedEmployeeId() !== imp.targetEmployeeId"
                    [class.bg-sidebar]="selectedEmployeeId() !== imp.targetEmployeeId">
                    
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                            [class.bg-error/10]="imp.priority === 'High'"
                            [class.text-error]="imp.priority === 'High'"
                            [class.bg-warning/10]="imp.priority === 'Medium'"
                            [class.text-warning]="imp.priority === 'Medium'"
                            [class.bg-primary/10]="imp.priority === 'Low'"
                            [class.text-primary]="imp.priority === 'Low'">
                        {{ currentLang() === 'ar' ? 'أولوية ' + (imp.priority === 'High' ? 'عالية' : (imp.priority === 'Medium' ? 'متوسطة' : 'منخفضة')) : imp.priority + ' Priority' }} · {{ translateCategory(imp.category) }}
                      </span>

                      @if (imp.targetEmployeeId) {
                        <span class="text-[11px] text-primary font-bold flex items-center gap-1">
                          🔍 {{ currentLang() === 'ar' ? 'انقر لتمييز المطور' : 'Click to highlight dev' }}
                        </span>
                      }
                    </div>

                    <p class="text-xs font-semibold text-text-primary leading-relaxed">
                      {{ currentLang() === 'ar' ? imp.recommendationAr : imp.recommendationEn }}
                    </p>
                  </div>
                }
              </div>
            </div>
          }

          <!-- 4. Team Developer Performance Grid -->
          @if (activeRetro()?.developerBreakdowns && activeRetro()!.developerBreakdowns!.length > 0) {
            <div class="rounded-3xl border border-border bg-surface p-6 shadow-sm space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-extrabold text-text-primary font-display flex items-center gap-2">
                  <span>{{ currentLang() === 'ar' ? 'أداء مطوري الفريق والإنتاجية' : 'Team Developers Breakdown & Velocity' }}</span>
                  <span class="text-xs font-extrabold text-text-secondary bg-sidebar px-2.5 py-0.5 rounded-full border border-border">
                    {{ activeRetro()!.developerBreakdowns!.length }} {{ currentLang() === 'ar' ? 'مطوّر' : 'Devs' }}
                  </span>
                </h3>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (dev of activeRetro()!.developerBreakdowns!; track dev.employeeId) {
                  <div
                    class="p-4 rounded-2xl bg-sidebar border transition-all space-y-3"
                    [class.ring-2]="selectedEmployeeId() === dev.employeeId"
                    [class.ring-primary]="selectedEmployeeId() === dev.employeeId"
                    [class.border-primary]="selectedEmployeeId() === dev.employeeId"
                    [class.border-border]="selectedEmployeeId() !== dev.employeeId">
                    
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-extrabold text-xs">
                          {{ getInitials(dev.fullName) }}
                        </div>
                        <div>
                          <p class="text-xs font-extrabold text-text-primary">{{ dev.fullName }}</p>
                        </div>
                      </div>

                      <span class="text-xs font-black px-2.5 py-1 rounded-lg bg-surface border border-border text-primary">
                        {{ dev.completionRate | number:'1.0-1' }}%
                      </span>
                    </div>

                    <div class="space-y-1.5 text-xs text-text-secondary pt-2 border-t border-border/60">
                      <div class="flex justify-between">
                        <span>{{ currentLang() === 'ar' ? 'المسند / المكتمل:' : 'Assigned / Done:' }}</span>
                        <strong class="text-text-primary">{{ dev.assignedTasks ?? 0 }} / {{ dev.completedTasks ?? 0 }} {{ currentLang() === 'ar' ? 'مهام' : 'tasks' }}</strong>
                      </div>
                      <div class="flex justify-between">
                        <span>{{ currentLang() === 'ar' ? 'التقدير / الفعلي (ساعات):' : 'Est / Actual Hours:' }}</span>
                        <strong class="text-text-primary">{{ dev.estimatedHours ?? 0 }}h / {{ dev.actualHours ?? 0 }}h</strong>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- 5. Qualitative Retrospective Cards (Went well, Challenges, Action items, Sentiment) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <!-- What Went Well -->
            @if (currentLang() === 'ar' ? activeRetro()?.whatWentWellAr : activeRetro()?.whatWentWellEn) {
              <div class="p-5 rounded-3xl bg-emerald-500/[0.03] border border-emerald-500/20 space-y-2">
                <h4 class="text-xs font-extrabold text-emerald-500 uppercase tracking-wider flex items-center gap-2">
                  <span>🎉 {{ currentLang() === 'ar' ? 'ما تم إنجازه بنجاح (What Went Well)' : 'What Went Well' }}</span>
                </h4>
                <p class="text-xs text-text-primary leading-relaxed font-medium whitespace-pre-line">
                  {{ currentLang() === 'ar' ? activeRetro()?.whatWentWellAr : activeRetro()?.whatWentWellEn }}
                </p>
              </div>
            }

            <!-- Challenges & Blockers -->
            @if (currentLang() === 'ar' ? activeRetro()?.challengesAr : activeRetro()?.challengesEn) {
              <div class="p-5 rounded-3xl bg-error/[0.03] border border-error/20 space-y-2">
                <h4 class="text-xs font-extrabold text-error uppercase tracking-wider flex items-center gap-2">
                  <span>🚨 {{ currentLang() === 'ar' ? 'التحديات والعقبات (Challenges & Blockers)' : 'Challenges & Blockers' }}</span>
                </h4>
                <p class="text-xs text-text-primary leading-relaxed font-medium whitespace-pre-line">
                  {{ currentLang() === 'ar' ? activeRetro()?.challengesAr : activeRetro()?.challengesEn }}
                </p>
              </div>
            }

            <!-- Action Items -->
            @if (currentLang() === 'ar' ? activeRetro()?.actionItemsAr : activeRetro()?.actionItemsEn) {
              <div class="p-5 rounded-3xl bg-amber-500/[0.03] border border-amber-500/20 space-y-2">
                <h4 class="text-xs font-extrabold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                  <span>📋 {{ currentLang() === 'ar' ? 'خطوات العمل القادمة (Action Items)' : 'Action Items' }}</span>
                </h4>
                <p class="text-xs text-text-primary leading-relaxed font-medium whitespace-pre-line">
                  {{ currentLang() === 'ar' ? activeRetro()?.actionItemsAr : activeRetro()?.actionItemsEn }}
                </p>
              </div>
            }

            <!-- Team Sentiment Summary -->
            <div class="p-5 rounded-3xl bg-primary/[0.03] border border-primary/20 space-y-2">
              <h4 class="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-2">
                <span>💬 {{ currentLang() === 'ar' ? 'ملخص انطباع الفريق (Team Sentiment)' : 'Team Sentiment Summary' }}</span>
              </h4>
              @if (currentLang() === 'ar' ? activeRetro()?.teamSentimentSummaryAr : activeRetro()?.teamSentimentSummaryEn) {
                <p class="text-xs text-text-primary leading-relaxed font-medium italic">
                  "{{ currentLang() === 'ar' ? activeRetro()?.teamSentimentSummaryAr : activeRetro()?.teamSentimentSummaryEn }}"
                </p>
              } @else {
                <p class="text-xs text-text-secondary leading-relaxed font-normal opacity-75 italic">
                  {{ currentLang() === 'ar' ? 'لم يتم تسجيل ملخص انطباعات محدد للفريق في هذا السبرينت.' : 'No specific team sentiment feedback recorded for this sprint.' }}
                </p>
              }
            </div>

          </div>

        </div>
      }

    </div>
  `,
  styles: [`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class RetrospectiveViewComponent implements OnInit {
  private sprintService = inject(SprintPlanningService);
  private toastService = inject(ToastService);
  public projectState = inject(ProjectStateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  currentLang = signal<'en' | 'ar'>(
    typeof localStorage !== 'undefined' ? (localStorage.getItem('app_lang') as 'en' | 'ar') || 'en' : 'en'
  );

  retro = signal<SprintRetrospectiveData | null>(null);
  sprints = signal<SprintListItem[]>([]);
  selectedSprintId = signal<string>('');
  isLoading = signal<boolean>(false);
  isGenerating = signal(false);
  selectedEmployeeId = signal<string | null>(null);

  isDropdownOpen = signal(false);

  selectedSprint = computed(() => {
    return this.sprints().find(s => s.sprintId === this.selectedSprintId()) || null;
  });

  translateCategory(category: string): string {
    if (this.currentLang() !== 'ar') return category;
    
    const catMap: Record<string, string> = {
      'CAPACITY': 'السعة (الحمل)',
      'TASK MANAGEMENT': 'إدارة المهام',
      'EFFICIENCY': 'الكفاءة',
      'QUALITY': 'الجودة',
      'COLLABORATION': 'التعاون',
      'PLANNING': 'التخطيط',
      'ESTIMATION': 'التقدير الزمنـي'
    };
    
    const upper = category?.toUpperCase() || '';
    return catMap[upper] || category;
  }

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

    // Older cached retrospectives may still mention velocity in these two
    // qualitative sections. Keep the UI clean even before they are regenerated.
    const withoutVelocityDetails = (val: any): string => cleanStr(val)
      .split(/(?<=[.!?؟])\s+|\n+/)
      .filter(sentence => !/(?:velocity\s*ratio|velocity|نسبة\s*السرعة|معدل\s*السرعة)/i.test(sentence))
      .join('\n')
      .trim();

    const whatWentWellEn = withoutVelocityDetails(analysis?.whatWentWellEn ?? raw.whatWentWellEn);
    const whatWentWellAr = withoutVelocityDetails(analysis?.whatWentWellAr ?? raw.whatWentWellAr);
    const challengesEn = cleanStr(analysis?.challengesEn ?? raw.challengesEn);
    const challengesAr = cleanStr(analysis?.challengesAr ?? raw.challengesAr);
    const teamSentimentSummaryEn = withoutVelocityDetails(analysis?.summaryEn ?? raw.teamSentimentSummaryEn ?? analysis?.teamSentiment);
    const teamSentimentSummaryAr = withoutVelocityDetails(analysis?.summaryAr ?? raw.teamSentimentSummaryAr);
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

  constructor() {
    effect(() => {
      const pId = this.projectState.selectedProjectId();
      if (pId) {
        this.loadSprintsList();
      }
    });
  }

  ngOnInit() {}

  async loadSprintsList() {
    const projId = this.projectState.selectedProjectId();
    if (!projId) return;

    try {
      const list = await this.sprintService.getAllSprints(projId);
      // Retrospectives are only available for completed sprints
      const completedSprints = (list?.items || []).filter(s => s.status === 'Completed');
      this.sprints.set(completedSprints);

      // Check query param sprintId or pick latest completed sprint
      const querySprintId = this.route.snapshot.queryParamMap.get('sprintId');
      if (querySprintId && completedSprints.some(s => s.sprintId === querySprintId)) {
        this.selectedSprintId.set(querySprintId);
      } else if (completedSprints.length > 0) {
        this.selectedSprintId.set(completedSprints[0].sprintId);
      } else {
        this.selectedSprintId.set('');
      }

      if (this.selectedSprintId()) {
        await this.loadRetrospective(this.selectedSprintId());
      }
    } catch (e) {
      console.warn('Failed to load sprints list for retro view:', e);
    }
  }

  async onSprintSelected(sprintId: string) {
    this.selectedSprintId.set(sprintId);
    await this.loadRetrospective(sprintId);
  }

  async loadRetrospective(sprintId: string) {
    if (!sprintId) return;
    this.isLoading.set(true);
    try {
      const pId = this.projectState.selectedProjectId();
      const res = await this.sprintService.getRetrospective(sprintId, pId || undefined);
      this.retro.set(res.data || res || null);
    } catch (e) {
      this.retro.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  async generateReport() {
    const sId = this.selectedSprintId();
    const pId = this.projectState.selectedProjectId();
    if (!sId) {
      this.toastService.show('Please select a sprint first.', 'error');
      return;
    }

    this.isGenerating.set(true);
    this.isLoading.set(true);
    try {
      const res = await this.sprintService.generateRetrospective(sId, pId || undefined);
      this.retro.set(res.data || res || null);
      this.toastService.show(
        this.currentLang() === 'ar' ? '🎉 تم إنشاء التقرير الختامي بنجاح!' : '🎉 Retrospective report generated successfully!',
        'success'
      );
    } catch (e: any) {
      console.error(e);
      const apiError = extractApiError(e);
      const fallbackMsg = this.currentLang() === 'ar' ? 'فشل إنشاء تقرير التحليل الختامي.' : 'Failed to generate retrospective analysis.';
      this.toastService.show(apiError || fallbackMsg, 'error');
    } finally {
      this.isGenerating.set(false);
      this.isLoading.set(false);
    }
  }

  toggleEmployeeFilter(empId: string) {
    if (this.selectedEmployeeId() === empId) {
      this.selectedEmployeeId.set(null);
    } else {
      this.selectedEmployeeId.set(empId);
    }
  }

  getInitials(name: string): string {
    if (!name) return 'DEV';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
}
