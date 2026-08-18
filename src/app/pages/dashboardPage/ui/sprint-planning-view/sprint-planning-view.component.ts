import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  SprintPlanningService,
  SprintSuggestionDto,
  ConfirmSprintRequest,
} from '../../../../shared/api/sprint-planning.service';
import { BacklogService, UserStoryDto } from '../../../../shared/api/backlog.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { SprintStoryEditorComponent } from './sprint-story-editor.component';
import { SprintStoryPickerComponent } from './sprint-story-picker.component';
import { parseApiError } from '../../../../shared/api/api-error';
import { AiActivityComponent } from '../../../../shared/ui/ai-activity/ai-activity.component';

type PageState = 'empty' | 'loading' | 'suggestion' | 'confirming' | 'no-sprints';

interface SprintCard {
  sprint: SprintSuggestionDto;
  removedStoryIds: Set<string>;
  totalHours: number;
  visibleStories: UserStoryDto[];
}

interface SuggestedStoryMeta {
  reason: string;
  priorityScore: number;
  estimatedHours: number;
}

const LOADING_HINTS = [
  { en: 'Analyzing your backlog...', ar: 'جاري تحليل قائمة المهام...' },
  { en: 'Calculating team capacity...', ar: 'حساب قدرة الفريق الاستيعابية...' },
  { en: 'Optimizing sprint scope...', ar: 'تحسين نطاق السبرينت...' },
  { en: 'Grouping user stories by priority...', ar: 'تجميع المهام حسب الأولوية...' },
  { en: 'Balancing workload across the team...', ar: 'موازنة أعباء العمل على الفريق...' },
  { en: 'Finalizing sprint proposal...', ar: 'وضع اللمسات الأخيرة على المقترح...' },
];

@Component({
  selector: 'app-sprint-planning-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SprintStoryEditorComponent, SprintStoryPickerComponent, AiActivityComponent],
  template: `
    <div class="space-y-6 animate-[fadeIn_0.25s_ease_both]">

      <!-- ─── ACTIVE SPRINT WARNING BANNER ─── -->
      @if (projectState.selectedProjectId() && hasActiveSprint()) {
        <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 flex-wrap" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
          <div class="flex items-start gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold text-lg">
              ℹ️
            </div>
            <div>
              <h4 class="text-sm font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <span>{{ currentLang() === 'ar' ? 'سبرينت نشط قيد التشغيل' : 'Active Sprint in Progress' }}</span>
                @if (activeSprintTitle()) {
                  <span class="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-900 dark:text-amber-200 font-mono">
                    {{ activeSprintTitle() }}
                  </span>
                }
              </h4>
              <p class="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                {{ currentLang() === 'ar' 
                  ? 'يوجد سبرينت نشط حالياً لهذا المشروع. لا يمكنك تخطيط سبرينت جديد أو توليد مقترحات حتى يتم إكمال السبرينت الحالي أو إغلاقه.' 
                  : 'An active sprint is currently running for this project. You cannot plan or generate suggestions for a new sprint until the current active sprint is completed or closed.' }}
              </p>
            </div>
          </div>
          <button
            (click)="navigateToActiveSprint()"
            class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0 flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            {{ currentLang() === 'ar' ? 'عرض السبرينت النشط' : 'View Active Sprint' }}
          </button>
        </div>
      }

      <!-- ─── NO EMPLOYEES WARNING BANNER ─── -->
      @if (projectState.selectedProjectId() && !hasActiveSprint() && hasPlannedSprint()) {
        <div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-4" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
          <div class="flex min-w-0 items-start gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3M5 11h14M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
              </svg>
            </div>
            <div>
              <h4 class="text-sm font-extrabold text-text-primary">
                {{ currentLang() === 'ar' ? 'يوجد سبرينت مخطط له بالفعل' : 'Planned sprint exists' }}
                @if (plannedSprintTitle()) { <span class="text-primary">· {{ plannedSprintTitle() }}</span> }
              </h4>
              <p class="mt-1 text-sm leading-5 text-text-secondary">
                {{ currentLang() === 'ar' ? 'ابدأ السبرينت المخطط له أو احذفه قبل إنشاء تخطيط جديد.' : 'Start or remove the planned sprint before creating another sprint plan.' }}
              </p>
            </div>
          </div>
          <button type="button" (click)="navigateToPlannedSprint()" class="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-sm hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            {{ currentLang() === 'ar' ? 'عرض السبرينت المخطط' : 'View planned sprint' }}
          </button>
        </div>
      }

      @if (projectState.selectedProjectId() && !hasActiveSprint() && !hasPlannedSprint() && projectState.projectEmployeeCount() === 0) {
        <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 flex-wrap" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
          <div class="flex items-start gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold text-lg">
              ⚠️
            </div>
            <div>
              <h4 class="text-sm font-extrabold text-amber-800 dark:text-amber-300">
                {{ currentLang() === 'ar' ? '⚠️ لم يتم تعيين أعضاء للفريق' : '⚠️ No Team Members Assigned' }}
              </h4>
              <p class="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                {{ currentLang() === 'ar' ? 'لا يمكنك إنشاء أو تخطيط السبرينتات حتى يتم تعيين موظف واحد على الأقل لهذا المشروع.' : 'You cannot create or plan sprints until at least one employee is assigned to this project.' }}
              </p>
            </div>
          </div>
          <button
            (click)="goToTeam()"
            class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0 flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
            {{ currentLang() === 'ar' ? 'تعيين الموظفين' : 'Assign Employees' }}
          </button>
        </div>
      }

      <!-- ─── Page Header ─── -->
      <div class="flex items-start justify-between gap-4 flex-wrap" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <div class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h2 class="text-xl font-extrabold text-text-primary font-display">
              {{ currentLang() === 'ar' ? 'تخطيط السبرينت بالذكاء الاصطناعي' : 'AI Sprint Planning' }}
            </h2>
          </div>
          <p class="text-sm text-text-secondary max-w-xl">
            {{ currentLang() === 'ar' ? 'دع الذكاء الاصطناعي يحلل المهام ويقترح السبرينت الأفضل تلقائياً — ثم راجع، عدّل، وأكّد.' : 'Let the AI analyze your backlog and automatically propose an optimal sprint — then review, adjust, and confirm.' }}
          </p>
        </div>

        @if (pageState() === 'suggestion') {
          <div class="flex items-center gap-2 shrink-0">
            <button
              (click)="onRegenerate()"
              [disabled]="pageState() === 'confirming' || projectState.projectEmployeeCount() === 0 || hasActiveSprint() || hasPlannedSprint()"
              [title]="getGenerationDisabledTooltip()"
              class="flex items-center gap-1.5 px-4 py-2 border border-border rounded-xl text-sm font-bold text-text-secondary hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ currentLang() === 'ar' ? 'إعادة التوليد' : 'Regenerate' }}
            </button>

            <button
              (click)="onConfirmSprint()"
              [disabled]="!canConfirm()"
              [title]="getGenerationDisabledTooltip()"
              class="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              @if (pageState() === 'confirming') {
                <div class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                {{ currentLang() === 'ar' ? 'جاري التأكيد…' : 'Confirming…' }}
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                {{ currentLang() === 'ar' ? 'تأكيد السبرينت' : 'Confirm Sprint' }}
              }
            </button>
          </div>
        } @else if (pageState() === 'no-sprints') {
          <div class="flex items-center gap-2 shrink-0">
            <button
              (click)="onGenerate()"
              [disabled]="projectState.projectEmployeeCount() === 0 || hasActiveSprint() || hasPlannedSprint()"
              [title]="getGenerationDisabledTooltip()"
              class="flex items-center gap-1.5 px-4 py-2 border border-border rounded-xl text-sm font-bold text-text-secondary hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ currentLang() === 'ar' ? 'إعادة المحاولة' : 'Try Again' }}
            </button>
          </div>
        }
      </div>

      <!-- ─── NO SPRINTS STATE ─── -->
      @if (pageState() === 'no-sprints') {
        <div class="flex flex-col items-center justify-center text-center rounded-3xl border border-border bg-surface px-6 py-12 shadow-sm max-w-3xl mx-auto mt-8 animate-[fadeIn_0.3s_ease_both]" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">

          <!-- Icon Badge with pulse ring -->
          <div class="relative mb-6">
            <div class="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto ring-8 ring-amber-500/5 shadow-inner">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
          </div>

          <!-- Status Tag -->
          <div class="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-extrabold tracking-wide">
            <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            {{ currentLang() === 'ar' ? 'لا توجد سبرينتات متوفرة' : 'No Sprints Available' }}
          </div>

          <h3 class="text-xl font-extrabold text-text-primary mb-2 font-display">
            {{ currentLang() === 'ar' ? 'لم يتم العثور على سبرينتات قابلة للتخطيط' : 'No Sprint Proposals Found' }}
          </h3>
          <p class="text-sm text-text-secondary max-w-md mx-auto leading-relaxed mb-6">
            {{ currentLang() === 'ar'
              ? 'يبدو أن قائمة المهام (Backlog) لا تحتوي على قصص مستخدمين غير معينة للتخطيط، أو لم يرجع الذكاء الاصطناعي مقترحات حالياً. أضف قصص مستخدم جديدة ثم أعد التوليد.'
              : 'Your project backlog does not have unassigned user stories ready for planning, or no suggestions were returned. Add user stories to your backlog to enable sprint planning.' }}
          </p>

          <!-- Status Info Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8 w-full max-w-xl text-left" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
            <!-- Card 1: Stories Count -->
            <div class="p-4 rounded-2xl bg-sidebar border border-border/80 flex flex-col justify-between shadow-xs">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                  {{ currentLang() === 'ar' ? 'قصص قائمة المهام' : 'Backlog Stories' }}
                </span>
                <span class="w-2 h-2 rounded-full" [class.bg-emerald-500]="storiesMap().size > 0" [class.bg-amber-500]="storiesMap().size === 0"></span>
              </div>
              <p class="text-lg font-black text-text-primary">
                {{ storiesMap().size }} {{ currentLang() === 'ar' ? 'قصة' : 'Stories' }}
              </p>
            </div>

            <!-- Card 2: AI Planner Status -->
            <div class="p-4 rounded-2xl bg-sidebar border border-border/80 flex flex-col justify-between shadow-xs">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                  {{ currentLang() === 'ar' ? 'مخطط الذكاء الاصطناعي' : 'AI Planner' }}
                </span>
                <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <p class="text-xs font-bold text-text-primary">
                {{ currentLang() === 'ar' ? 'جاهز للتوليد' : 'Ready' }}
              </p>
            </div>

            <!-- Card 3: Selected Workspace -->
            <div class="p-4 rounded-2xl bg-sidebar border border-border/80 flex flex-col justify-between shadow-xs">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                  {{ currentLang() === 'ar' ? 'المشروع الحالي' : 'Workspace' }}
                </span>
                <span class="text-xs">📁</span>
              </div>
              <p class="text-xs font-bold text-text-primary truncate" [title]="projectState.selectedProject()?.nameEn">
                {{ (currentLang() === 'ar' ? projectState.selectedProject()?.nameAr : projectState.selectedProject()?.nameEn) || 'Active Workspace' }}
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-center gap-3 flex-wrap">


            <button
              (click)="onGenerate()"
              [disabled]="hasActiveSprint() || hasPlannedSprint()"
              [title]="getGenerationDisabledTooltip()"
              class="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-md transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              {{ currentLang() === 'ar' ? 'إعادة التوليد بالذكاء الاصطناعي' : 'Try AI Generation Again' }}
            </button>
          </div>

        </div>
      }

      <!-- ─── EMPTY STATE ─── -->
      @if (pageState() === 'empty') {
        @if (projectState.selectedProject()?.status === 'Completed' || projectState.selectedProject()?.status === 'Archived') {
          <div class="bg-surface border border-warning/30 p-8 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto my-12 transition-colors duration-200">
            <div class="w-16 h-16 bg-warning/10 text-warning rounded-2xl flex items-center justify-center shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-text-primary">No Active Project</h3>
              <p class="text-text-secondary text-sm mt-2 max-w-md">
                You are currently not viewing an active project. Please select an active project from the dropdown.
              </p>
            </div>
          </div>
        } @else {
          <div class="flex flex-col items-center justify-center text-center rounded-2xl border border-border bg-surface px-6 py-12 shadow-sm max-w-3xl mx-auto mt-8 animate-[fadeIn_0.3s_ease_both]" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">

            <!-- Icon / Illustration -->
            <div class="relative mb-6">
              <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto ring-8 ring-primary/5">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
            </div>

            <h3 class="text-xl font-bold text-text-primary mb-2">
              {{ currentLang() === 'ar' ? 'المخطط الذكي للسبرينت' : 'AI Sprint Planner' }}
            </h3>
            <p class="text-sm text-text-secondary max-w-md mx-auto leading-relaxed mb-6">
              {{ currentLang() === 'ar' ? 'قائمة المهام جاهزة. دع الذكاء الاصطناعي يحلل الأولويات، ويقدّر القدرة الاستيعابية، لإنشاء أفضل مقترح للسبرينت الخاص بفريقك.' : 'Your backlog is ready. Let the AI analyze task priorities, estimate capacity, and build the optimal sprint proposal for your team.' }}
            </p>

            @if (projectState.selectedProject(); as sp) {
              <div class="mb-10 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sidebar border border-border">
                <span class="w-2 h-2 rounded-full bg-primary"></span>
                <p class="text-xs font-medium text-text-secondary">
                  {{ currentLang() === 'ar' ? sp.nameAr : sp.nameEn }}
                </p>
              </div>
            }

            <!-- Steps preview (horizontal linear flow) -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-10 w-full max-w-lg mx-auto">
              @for (step of emptyStateSteps; track step.labelEn; let isLast = $last) {
                <div class="flex flex-col items-center text-center flex-1">
                  <div class="w-10 h-10 mb-3 rounded-full bg-sidebar border border-border flex items-center justify-center text-primary font-bold shadow-sm">
                    {{ step.icon }}
                  </div>
                  <p class="text-xs font-bold text-text-primary mb-1">{{ currentLang() === 'ar' ? step.labelAr : step.labelEn }}</p>
                  <p class="text-[11px] text-text-secondary leading-tight">{{ currentLang() === 'ar' ? step.descAr : step.descEn }}</p>
                </div>
                @if (!isLast) {
                  <!-- connector -->
                  <div class="hidden sm:block w-8 h-[1px] bg-border shrink-0 mt-[-30px]"></div>
                }
              }
            </div>

            <button
              id="generate-sprint-btn"
              (click)="onGenerate()"
              [disabled]="projectState.projectEmployeeCount() === 0 || hasActiveSprint() || hasPlannedSprint()"
              [title]="getGenerationDisabledTooltip()"
              class="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow-sm transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              {{ currentLang() === 'ar' ? 'توليد المقترح بالذكاء الاصطناعي' : 'Generate AI Sprint Suggestion' }}
            </button>
          </div>
        }
      }

      <!-- ─── LOADING STATE — AI Generation Screen ─── -->
      @if (pageState() === 'loading') {
        <div class="mx-auto mt-8 max-w-3xl" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
          <app-ai-activity
            [title]="currentLang() === 'ar' ? 'بنجهز اقتراح السبرينت' : 'Designing the strongest sprint proposal'"
            [description]="currentLang() === 'ar' ? loadingHint().ar : loadingHint().en"
          />
        </div>
        <div class="hidden" aria-hidden="true" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">

          <!-- Glowing orb -->
          <div class="relative mb-8 mt-4">
            <div class="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-50" style="animation-duration: 2s;"></div>
            <div class="absolute inset-[-12px] rounded-full bg-primary/10 animate-pulse" style="animation-duration: 3s;"></div>
            <div class="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center shadow-xl shadow-primary/20">
              <svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m15.364 6.364l-.707-.707M6.343 17.657l-.707-.707m12.728-11.314l-.707.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
          </div>

          <h3 class="text-xl font-bold text-text-primary mb-3">
            {{ currentLang() === 'ar' ? 'الذكاء الاصطناعي يعمل...' : 'AI is working...' }}
          </h3>
          
          <div class="min-h-[2.5rem] flex items-center justify-center mt-2">
            <p class="text-sm font-semibold text-text-secondary transition-all duration-500 animate-[pulse_1.5s_ease-in-out_infinite]">
              {{ currentLang() === 'ar' ? loadingHint().ar : loadingHint().en }}
            </p>
          </div>

          <!-- Progress dots -->
          <div class="flex items-center justify-center gap-2 mt-8 mb-4">
            @for (dot of [0,1,2]; track dot) {
              <div class="w-2 h-2 rounded-full bg-primary/40 animate-bounce"
                   [style.animation-delay]="dot * 150 + 'ms'"></div>
            }
          </div>
        </div>
      }

      <!-- ─── SUGGESTION VIEW ─── -->
      @if (pageState() === 'suggestion' || pageState() === 'confirming') {
        <div class="space-y-5 animate-[fadeIn_0.3s_ease_both]">

          <!-- Sprint cards -->
          @for (card of sprintCards(); track card.sprint.titleEn; let idx = $index) {
            <div class="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

              <!-- Sprint header -->
              <div class="px-5 py-4 bg-sidebar border-b border-border flex items-center gap-3 flex-wrap">
                <span class="px-3 py-1 text-xs font-extrabold bg-primary/10 text-primary rounded-full">
                  {{ currentLang() === 'ar' ? 'السبرينت ' + (idx + 1) : 'Sprint ' + (idx + 1) }}
                </span>
                <div class="flex-1 min-w-0">
                  <input
                    type="text"
                    [ngModel]="card.sprint.sprintTitle || card.sprint.titleEn"
                    (ngModelChange)="card.sprint.sprintTitle = $event"
                    [id]="'sprint-title-' + idx"
                    [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'"
                    class="bg-transparent text-sm font-bold text-text-primary outline-none focus:border-b focus:border-primary pb-0.5 w-full transition-all"
                    [placeholder]="currentLang() === 'ar' ? 'عنوان السبرينت' : 'Sprint Title'">
                </div>
                <span class="text-xs text-text-secondary font-semibold shrink-0">
                  {{ visibleStoryCount(card) }} {{ currentLang() === 'ar' ? 'قصة' : 'stories' }}
                </span>
              </div>

              <!-- Summary metrics -->
              <div class="px-5 pt-4 pb-2" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">

                  <!-- Story count -->
                  <div class="rounded-xl bg-sidebar border border-border p-3">
                    <p class="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">{{ currentLang() === 'ar' ? 'قصص المستخدم' : 'User Stories' }}</p>
                    <p class="text-xl font-extrabold text-text-primary">{{ visibleStoryCount(card) }}</p>
                  </div>

                  <!-- Total hours -->
                  <div class="rounded-xl bg-sidebar border border-border p-3">
                    <p class="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">{{ currentLang() === 'ar' ? 'الساعات التقديرية' : 'Est. Hours' }}</p>
                    <p class="text-xl font-extrabold text-text-primary">{{ calcHours(card) }}</p>
                  </div>

                  <!-- Duration -->
                  <div class="rounded-xl bg-sidebar border border-border p-3">
                    <p class="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">{{ currentLang() === 'ar' ? 'المدة' : 'Duration' }}</p>
                    <p class="text-xl font-extrabold text-text-primary">{{ currentLang() === 'ar' ? 'أسبوعين' : '2 wks' }}</p>
                  </div>

                  <!-- Team Capacity (Explanation) -->
                  <div class="rounded-xl bg-primary/5 border border-primary/15 p-3 flex flex-col justify-center">
                    <p class="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">{{ currentLang() === 'ar' ? 'استيعاب الفريق' : 'Team Capacity' }}</p>
                    <p class="text-xs font-semibold text-text-primary leading-tight">{{ card.sprint.capacityExplanation }}</p>
                  </div>
                </div>

                <!-- Goal input -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
                  <div>
                    <label [for]="'goal-en-' + idx" class="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                      {{ currentLang() === 'ar' ? 'هدف السبرينت (EN)' : 'Sprint Goal (EN)' }}
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="card.sprint.sprintGoalEn"
                      [id]="'goal-en-' + idx"
                      dir="ltr"
                      class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text-primary"
                      placeholder="What should this sprint achieve?">
                  </div>
                  <div>
                    <label [for]="'goal-ar-' + idx" class="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                      {{ currentLang() === 'ar' ? 'هدف السبرينت (AR)' : 'Sprint Goal (AR)' }}
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="card.sprint.sprintGoalAr"
                      [id]="'goal-ar-' + idx"
                      dir="rtl"
                      class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text-primary"
                      placeholder="ما الذي يجب أن ينجزه هذا السبرينت؟">
                  </div>
                </div>
              </div>

              <!-- AI Risk Alerts -->
              @if (risks().length > 0) {
                <div class="px-5 pb-4" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
                  <div class="rounded-xl bg-warning/5 border border-warning/20 p-3.5">
                    <div class="flex items-center gap-2 mb-2">
                      <svg class="w-3.5 h-3.5 text-warning shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      <p class="text-[10px] font-bold text-warning uppercase tracking-wider">
                        {{ currentLang() === 'ar' ? 'تنبيهات المخاطر (AI)' : 'AI Risk Alerts' }}
                      </p>
                    </div>
                    @for (risk of risks(); track risk) {
                      <p class="text-xs text-text-primary leading-5 mt-1">· {{ risk }}</p>
                    }
                  </div>
                </div>
              }

              <!-- User Story list -->
              <div class="px-5 pb-5 space-y-2" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
                <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-xs font-extrabold uppercase tracking-wider text-text-secondary">
                      {{ currentLang() === 'ar' ? 'قصص المستخدم' : 'User Stories' }}
                    </p>
                    <p class="mt-1 text-sm text-text-secondary">
                      {{ currentLang() === 'ar' ? 'راجع التفاصيل وعدّل نطاق السبرينت قبل التأكيد.' : 'Review details and adjust sprint scope before confirming.' }}
                    </p>
                  </div>
                  <button
                    type="button"
                    (click)="openStoryPicker(idx, $event)"
                    [disabled]="availableStoryCount(card) === 0 || pageState() === 'confirming'"
                    class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3.5 text-sm font-bold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    {{ currentLang() === 'ar' ? 'إضافة من قائمة المهام' : 'Add from backlog' }}
                  </button>
                </div>

                @for (storyId of card.sprint.userStoryIds; track storyId) {
                  @if (!card.removedStoryIds.has(storyId)) {
                    @if (getStory(storyId); as story) {
                      <div class="group flex items-start gap-3 p-3 rounded-xl border border-border bg-sidebar hover:border-primary/30 hover:bg-primary/[0.03] transition-all duration-150 cursor-default"
                        [class.border-primary]="editingStory()?.id === story.id"
                        [class.bg-primary/5]="editingStory()?.id === story.id">

                        <!-- Priority dot -->
                        <div class="shrink-0 mt-0.5">
                          <span class="inline-block w-2.5 h-2.5 rounded-full"
                            [class.bg-error]="story.priority === '2' || story.priority === 'High'"
                            [class.bg-warning]="story.priority === '1' || story.priority === 'Medium'"
                            [class.bg-text-secondary]="story.priority === '0' || story.priority === 'Low'">
                          </span>
                        </div>

                        <!-- Story info -->
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-semibold leading-5 text-text-primary">{{ story.title }}</p>
                          @if (story.tasks && story.tasks.length > 0) {
                            <p class="text-xs text-text-secondary mt-0.5">
                              {{ story.tasks.length }} {{ currentLang() === 'ar' ? 'مهمة' : (story.tasks.length !== 1 ? 'tasks' : 'task') }}
                              · {{ storyHours(story) }} {{ currentLang() === 'ar' ? 'ساعة (تقدير)' : 'h est.' }}
                            </p>
                          }
                          @if (getStoryMeta(storyId); as meta) {
                              @if (meta.reason) {
                                <p class="text-[10px] text-text-secondary mt-1 leading-4 line-clamp-2 italic opacity-80">{{ meta.reason }}</p>
                              }
                            }
                        </div>

                        <!-- Priority badge -->
                        <span class="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border"
                          [class.bg-error/10]="story.priority === '2' || story.priority === 'High'"
                          [class.text-error]="story.priority === '2' || story.priority === 'High'"
                          [class.border-error/20]="story.priority === '2' || story.priority === 'High'"
                          [class.bg-warning/10]="story.priority === '1' || story.priority === 'Medium'"
                          [class.text-warning]="story.priority === '1' || story.priority === 'Medium'"
                          [class.border-warning/20]="story.priority === '1' || story.priority === 'Medium'"
                          [class.bg-border/40]="story.priority === '0' || story.priority === 'Low'"
                          [class.text-text-secondary]="story.priority === '0' || story.priority === 'Low'"
                          [class.border-border]="story.priority === '0' || story.priority === 'Low'">
                          {{ mapPriority(story.priority) }}
                        </span>

                        <button
                          type="button"
                          (click)="openStoryEditor(story, $event)"
                          [disabled]="pageState() === 'confirming'"
                          class="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-bold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                          [attr.aria-label]="currentLang() === 'ar' ? 'تعديل ' + story.title : 'Edit ' + story.title">
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.862 3.487a2.25 2.25 0 113.182 3.182L8.25 18.463 3 21l2.537-5.25L16.862 3.487z" />
                          </svg>
                          <span class="hidden sm:inline">{{ currentLang() === 'ar' ? 'تعديل' : 'Edit' }}</span>
                        </button>

                        <!-- Remove from scope button -->
                        <button
                          type="button"
                          (click)="removeStory(card, storyId)"
                          [id]="'remove-story-' + storyId"
                          [disabled]="pageState() === 'confirming'"
                          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-all duration-150 hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error disabled:opacity-50"
                          [attr.aria-label]="currentLang() === 'ar' ? 'إزالة القصة من السبرينت' : 'Remove story from sprint'">
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    } @else {
                      <!-- Fallback for unknown story ID -->
                      <div class="flex items-center gap-3 p-3 rounded-xl border border-border bg-sidebar">
                        <div class="shrink-0 w-2.5 h-2.5 rounded-full bg-border"></div>
                        <p class="text-sm text-text-secondary font-mono" dir="ltr">{{ storyId.substring(0, 16) }}…</p>
                        <button
                          (click)="removeStory(card, storyId)"
                          class="shrink-0 ml-auto p-1 rounded-lg text-text-secondary hover:text-error hover:bg-error/10 transition-all">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    }
                  }
                }

                @if (visibleStoryCount(card) === 0) {
                  <div class="text-center py-6 text-text-secondary text-xs font-semibold">
                    {{ currentLang() === 'ar' ? 'تمت إزالة جميع المهام — أضف مهام مرة أخرى أو قم بإعادة التوليد.' : 'All stories removed — add stories back or regenerate.' }}
                  </div>
                }
              </div>
            </div>
          }

          <!-- Live scope impact rail -->
          <div class="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/20 bg-surface/95 p-3 shadow-xl shadow-black/5 backdrop-blur-md" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
            <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2">
              <div>
                <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">{{ currentLang() === 'ar' ? 'نطاق السبرينت' : 'Sprint scope' }}</p>
                <p class="mt-0.5 text-sm font-extrabold text-text-primary">{{ totalVisibleStories() }} {{ currentLang() === 'ar' ? 'قصة' : (totalVisibleStories() === 1 ? 'story' : 'stories') }}</p>
              </div>
              <div class="h-9 w-px bg-border" aria-hidden="true"></div>
              <div>
                <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">{{ currentLang() === 'ar' ? 'الساعات' : 'Estimated' }}</p>
                <p class="mt-0.5 text-sm font-extrabold text-text-primary">{{ primaryCardHours() }}h</p>
              </div>
              <div class="h-9 w-px bg-border" aria-hidden="true"></div>
              <div>
                <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">{{ currentLang() === 'ar' ? 'التعديلات المحفوظة' : 'Saved edits' }}</p>
                <p class="mt-0.5 text-sm font-extrabold" [class.text-primary]="changedStoryIds().size > 0" [class.text-text-primary]="changedStoryIds().size === 0">{{ changedStoryIds().size }}</p>
              </div>
            </div>
            @if (primaryCapacity() > 100) {
              <div class="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm font-bold text-warning" role="status">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                {{ currentLang() === 'ar' ? 'النطاق يتجاوز السعة' : 'Scope exceeds capacity' }}
              </div>
            }
          </div>
        </div>
      }

      <!-- ─── ACTIVE SPRINT ALREADY RUNNING MODAL ─── -->
      @if (editingStory(); as story) {
        <div class="fixed inset-0 z-[70]" aria-live="polite">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true"></div>
          <div class="absolute inset-y-0 w-full max-w-xl animate-[sheetIn_0.24s_ease-out_both] sm:w-[min(520px,92vw)]"
            [class.right-0]="currentLang() !== 'ar'" [class.left-0]="currentLang() === 'ar'">
            <app-sprint-story-editor
              [story]="story"
              [lang]="currentLang()"
              (saved)="onStorySaved($event)"
              (cancelled)="closeStoryEditor()" />
          </div>
        </div>
      }

      @if (storyPickerOpen()) {
        <div class="fixed inset-0 z-[70]">
          <button type="button" class="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm" (click)="closeStoryPicker()" [attr.aria-label]="currentLang() === 'ar' ? 'إغلاق قائمة القصص' : 'Close story picker'"></button>
          <div class="absolute inset-y-0 w-full max-w-xl animate-[sheetIn_0.24s_ease-out_both] sm:w-[min(520px,92vw)]"
            [class.right-0]="currentLang() !== 'ar'" [class.left-0]="currentLang() === 'ar'">
            <app-sprint-story-picker
              [stories]="allBacklogStories()"
              [selectedStoryIds]="pickerSelectedStoryIds()"
              [lang]="currentLang()"
              (storiesAdded)="addStoriesToSprint($event)"
              (cancelled)="closeStoryPicker()" />
          </div>
        </div>
      }

      @if (showPlannedSprintModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]">
          <div class="w-full max-w-md space-y-5 rounded-3xl border border-border bg-surface p-6 text-center shadow-2xl" role="dialog" aria-modal="true" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3M5 11h14M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" /></svg>
            </div>
            <div>
              <h3 class="text-lg font-extrabold text-text-primary">{{ currentLang() === 'ar' ? 'يوجد سبرينت مخطط له بالفعل' : 'Planned Sprint Already Exists' }}</h3>
              <p class="mt-2 text-sm leading-6 text-text-secondary">{{ currentLang() === 'ar' ? 'لا يمكن إنشاء اقتراح جديد حتى تبدأ السبرينت المخطط له أو تحذفه.' : 'A new suggestion cannot be generated until the planned sprint is started or removed.' }}</p>
              @if (plannedSprintTitle()) {
                <p class="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-bold text-primary">{{ plannedSprintTitle() }}</p>
              }
            </div>
            <div class="flex items-center justify-center gap-3">
              <button type="button" (click)="showPlannedSprintModal.set(false)" class="min-h-11 rounded-xl border border-border px-4 text-sm font-bold text-text-secondary hover:bg-sidebar">{{ currentLang() === 'ar' ? 'إغلاق' : 'Close' }}</button>
              <button type="button" (click)="showPlannedSprintModal.set(false); navigateToPlannedSprint()" class="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-primary-hover">{{ currentLang() === 'ar' ? 'عرض السبرينت المخطط' : 'View planned sprint' }}</button>
            </div>
          </div>
        </div>
      }

      @if (showActiveSprintModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]">
          <div class="bg-surface border border-border rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 text-center animate-[scaleUp_0.25s_ease_both]" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
            <div class="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-2xl">
              ℹ️
            </div>
            <div>
              <h3 class="text-lg font-bold text-text-primary">
                {{ currentLang() === 'ar' ? 'يوجد سبرينت نشط حالياً' : 'Active Sprint Already Running' }}
              </h3>
              <p class="text-xs text-text-secondary mt-2 leading-relaxed">
                {{ currentLang() === 'ar' 
                  ? 'هناك سبرينت نشط يعمل حالياً على هذا المشروع. لا يمكنك تخطيط سبرينت جديد حتى يتم إكمال السبرينت الحالي.' 
                  : 'There is an active sprint currently running on this project. You cannot plan or generate a new sprint until the active sprint is completed.' }}
              </p>
              @if (activeSprintTitle()) {
                <div class="mt-3 inline-block px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold font-mono">
                  🏃 {{ activeSprintTitle() }}
                </div>
              }
            </div>
            <div class="flex items-center justify-center gap-3 pt-2">
              <button
                (click)="showActiveSprintModal.set(false)"
                class="px-4 py-2 border border-border text-text-secondary hover:text-text-primary text-xs font-semibold rounded-xl transition-all">
                {{ currentLang() === 'ar' ? 'إغلاق' : 'Close' }}
              </button>
              <button
                (click)="showActiveSprintModal.set(false); navigateToActiveSprint()"
                class="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                {{ currentLang() === 'ar' ? 'عرض السبرينت النشط' : 'View Active Sprint' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ─── NO EMPLOYEES REQUIRED MODAL ─── -->
      @if (showNoEmployeesModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]">
          <div class="bg-surface border border-border rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 text-center animate-[scaleUp_0.25s_ease_both]" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
            <div class="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <div>
              <h3 class="text-lg font-bold text-text-primary">
                {{ currentLang() === 'ar' ? 'مطلوب موظفين لتخطيط السبرينت' : 'Employees Required for Sprint Planning' }}
              </h3>
              <p class="text-xs text-text-secondary mt-2 leading-relaxed">
                {{ currentLang() === 'ar' ? 'لا يمكن تنفيذ تخطيط السبرينت لمشروع بدون موظفين معينين. يرجى تعيين أعضاء في الفريق أولاً.' : 'Cannot perform sprint planning for a project with no assigned employees. Please assign team members to this project first.' }}
              </p>
            </div>
            <div class="flex items-center justify-center gap-3 pt-2">
              <button
                (click)="showNoEmployeesModal.set(false)"
                class="px-4 py-2 border border-border text-text-secondary hover:text-text-primary text-xs font-semibold rounded-xl transition-all">
                {{ currentLang() === 'ar' ? 'إلغاء' : 'Cancel' }}
              </button>
              <button
                (click)="showNoEmployeesModal.set(false); goToTeam()"
                class="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                </svg>
                {{ currentLang() === 'ar' ? 'تعيين الموظفين' : 'Assign Employees' }}
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: `
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes sheetIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
    @media (prefers-reduced-motion: reduce) {
      :host * { animation-duration: 1ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; }
    }
  `
})
export class SprintPlanningViewComponent implements OnInit, OnDestroy {
  /** Emitted when sprint confirmed — parent should navigate to 'sprint' tab */
  /** Emitted when PM needs to assign team members */


  private sprintService = inject(SprintPlanningService);
  private backlogService = inject(BacklogService);
  public projectState = inject(ProjectStateService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // ── State signals ──────────────────────────────────────────────
  currentLang = signal<'en' | 'ar'>(typeof localStorage !== 'undefined' ? (localStorage.getItem('app_lang') as 'en' | 'ar') || 'en' : 'en');
  showNoEmployeesModal = signal<boolean>(false);
  showActiveSprintModal = signal<boolean>(false);
  showPlannedSprintModal = signal<boolean>(false);
  hasActiveSprint = signal<boolean>(false);
  hasPlannedSprint = signal<boolean>(false);
  activeSprintId = signal<string | null>(null);
  activeSprintTitle = signal<string>('');
  plannedSprintId = signal<string | null>(null);
  plannedSprintTitle = signal<string>('');
  pageState = signal<PageState>('empty');
  isBacklogLoading = signal<boolean>(false);
  suggestions = signal<SprintSuggestionDto[]>([]);
  storiesMap = signal<Map<string, UserStoryDto>>(new Map());
  loadingHint = signal(LOADING_HINTS[0]);
  // total hours returned directly from the AI suggestion API (used when story tasks have no hours)
  apiTotalHours = signal<number>(0);
  // AI-provided risks list
  risks = signal<string[]>([]);
  // AI-provided per-story metadata (reason, priorityScore, estimatedHours)
  suggestedStoriesMeta = signal<Map<string, SuggestedStoryMeta>>(new Map());
  private hintIndex = 0;
  private hintTimer: ReturnType<typeof setInterval> | null = null;

  // Sprint cards — built from suggestions, each tracks removed story IDs
  sprintCards = signal<SprintCard[]>([]);
  editingStory = signal<UserStoryDto | null>(null);
  storyPickerOpen = signal(false);
  pickerCardIndex = signal(0);
  changedStoryIds = signal<Set<string>>(new Set());
  private overlayTrigger: HTMLElement | null = null;

  // ── Computed values ────────────────────────────────────────────
  totalVisibleStories = computed(() =>
    this.sprintCards().reduce((acc, c) => acc + this.visibleStoryCount(c), 0)
  );
  allBacklogStories = computed(() => [...this.storiesMap().values()]);
  pickerSelectedStoryIds = computed(() => {
    const card = this.sprintCards()[this.pickerCardIndex()];
    return card ? card.sprint.userStoryIds.filter(id => !card.removedStoryIds.has(id)) : [];
  });
  primaryCardHours = computed(() => {
    const card = this.sprintCards()[0];
    return card ? this.calcHours(card) : 0;
  });
  primaryCapacity = computed(() => Math.round((this.primaryCardHours() / 160) * 100));
  canConfirm = computed(() =>
    this.pageState() !== 'confirming'
    && this.totalVisibleStories() > 0
    && this.projectState.projectEmployeeCount() > 0
    && !this.hasActiveSprint()
    && !this.hasPlannedSprint()
    && !this.editingStory()
    && !this.storyPickerOpen()
  );

  // ── Empty state steps ──────────────────────────────────────────
  readonly emptyStateSteps = [
    { icon: '1', labelEn: 'Analyzes Backlog', labelAr: 'تحليل قائمة المهام', descEn: 'Scans all user stories by priority', descAr: 'يفحص كل المهام حسب الأولوية' },
    { icon: '2', labelEn: 'Optimizes Scope', labelAr: 'تحديد النطاق', descEn: 'Balances capacity & velocity', descAr: 'يوازن القدرة الاستيعابية وسرعة الإنجاز' },
    { icon: '3', labelEn: 'You Confirm', labelAr: 'التأكيد', descEn: 'Review & finalize the sprint', descAr: 'راجع السبرينت واعتمد التخطيط' },
  ];

  // ── Lifecycle ──────────────────────────────────────────────────
  async ngOnInit() {
    const projId = this.projectState.selectedProjectId();
    if (projId) {
      await this.projectState.loadProjectEmployeeCount(projId);
    }
    await Promise.all([this.checkActiveSprint(), this.checkPlannedSprint()]);
    await this.loadBacklogStories();

    // Check if autoReplan was requested
    this.route.queryParams.subscribe(params => {
      if (params['autoReplan'] === 'true') {
        // Clear the param so it doesn't re-trigger on refresh
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { autoReplan: null },
          queryParamsHandling: 'merge'
        });
        
        // If we can generate, do it automatically
        if (this.projectState.projectEmployeeCount() > 0 && !this.hasActiveSprint() && !this.hasPlannedSprint()) {
          this.onGenerate();
        } else if (this.projectState.projectEmployeeCount() === 0) {
           this.showNoEmployeesModal.set(true);
        }
      }
    });
  }

  ngOnDestroy() {
    this.clearHintTimer();
  }

  // ── Active Sprint Validation ───────────────────────────────────
  async checkActiveSprint(): Promise<boolean> {
    const projId = this.projectState.selectedProjectId();
    if (!projId) {
      this.hasActiveSprint.set(false);
      this.activeSprintId.set(null);
      this.activeSprintTitle.set('');
      return false;
    }

    try {
      // 1. Try fetching all sprints to check for any sprint with status 'Active'
      const sprints = await this.sprintService.getAllSprints(projId);
      const active = sprints?.items?.find(s => s.status === 'Active');
      if (active) {
        this.hasActiveSprint.set(true);
        this.activeSprintId.set(active.sprintId);
        this.activeSprintTitle.set(this.currentLang() === 'ar' ? (active.titleAr || active.titleEn) : (active.titleEn || active.titleAr));
        return true;
      }

      // 2. Fallback: query active sprint endpoint
      const activeRes = await this.sprintService.getActiveSprint(projId);
      const activeData = activeRes?.data || activeRes;
      if (activeData && activeData.sprintId) {
        this.hasActiveSprint.set(true);
        this.activeSprintId.set(activeData.sprintId);
        this.activeSprintTitle.set(this.currentLang() === 'ar' ? (activeData.titleAr || activeData.titleEn) : (activeData.titleEn || activeData.titleAr));
        return true;
      }

      this.hasActiveSprint.set(false);
      this.activeSprintId.set(null);
      this.activeSprintTitle.set('');
      return false;
    } catch {
      this.hasActiveSprint.set(false);
      this.activeSprintId.set(null);
      this.activeSprintTitle.set('');
      return false;
    }
  }

  async checkPlannedSprint(): Promise<boolean> {
    const projId = this.projectState.selectedProjectId();
    if (!projId) {
      this.clearPlannedSprintState();
      return false;
    }

    const planned = await this.sprintService.getPlannedSprint(projId);
    if (!planned?.sprintId) {
      this.clearPlannedSprintState();
      return false;
    }

    this.hasPlannedSprint.set(true);
    this.plannedSprintId.set(planned.sprintId);
    this.plannedSprintTitle.set(
      this.currentLang() === 'ar'
        ? planned.titleAr || planned.titleEn || ''
        : planned.titleEn || planned.titleAr || '',
    );
    return true;
  }

  navigateToActiveSprint(): void {
    const activeId = this.activeSprintId();
    if (activeId) {
      this.router.navigate(['/dashboard', 'sprint'], {
        queryParams: { sprintId: activeId, sprintStatus: 'Active' }
      });
    } else {
      this.router.navigate(['/dashboard', 'sprint']);
    }
  }

  getGenerationDisabledTooltip(): string {
    const isAr = this.currentLang() === 'ar';
    if (this.hasActiveSprint()) {
      return isAr
        ? 'قم بإكمال السبرينت النشط الحالي قبل تخطيط سبرينت جديد.'
        : 'Complete the current active sprint before planning a new one.';
    }
    if (this.hasPlannedSprint()) {
      return isAr
        ? 'ابدأ السبرينت المخطط له أو احذفه قبل التخطيط لسبرينت جديد.'
        : 'Start or remove the existing planned sprint before planning a new one.';
    }
    if (this.projectState.projectEmployeeCount() === 0) {
      return isAr
        ? 'يجب تعيين موظف واحد على الأقل للمشروع أولاً'
        : 'At least one employee must be assigned to this project first';
    }
    return '';
  }

  // ── Backlog loader ─────────────────────────────────────────────
  // Fix A: The old single call getBacklog(projId, 1, 1000) relied on the server
  // accepting pageSize=1000 literally.  The server has no enforced MaxPageSize cap,
  // but passing 1000 is fragile and transfers the full UserStoryDto payload for up to
  // 1000 stories in one request.  Fix 1 (topological sort) now correctly selects
  // low-priority prerequisite stories — these sit further down the backlog sort order
  // and may be missing from whatever the old call returned, causing grey GUID rows.
  //
  // Solution: paginate with pageSize=100, following hasNextPage until exhausted.
  // BacklogService.backlogCache keys by (projectId, page, pageSize) so each page gets
  // its own cache slot — no stale cross-contamination between loop iterations.
  //
  // Follow-up recommendation: expose a dedicated GET /projects/{id}/backlog/all endpoint
  // (non-paginated, projection of id+title+priority+estimatedHours only) for sprint planning.
  // That would be lighter than iterating the full UserStoryDto paginated endpoint which
  // was designed for the backlog browsing UI, not bulk lookup.
  async loadBacklogStories() {
    const projId = this.projectState.selectedProjectId();
    if (!projId) return;
    this.isBacklogLoading.set(true);
    try {
      const map = new Map<string, UserStoryDto>();
      let page = 1;
      const pageSize = 100;
      let hasMore = true;
      // Safety valve: 20 × 100 = 2 000 stories ceiling.
      // A project with >2 000 unassigned backlog stories is pathological;
      // warn loudly and stop rather than loop indefinitely.
      const MAX_PAGES = 20;

      while (hasMore && page <= MAX_PAGES) {
        const res = await this.backlogService.getBacklog(projId, page, pageSize);
        (res?.userStories?.items || []).forEach((s: UserStoryDto) => map.set(s.id, s));
        hasMore = res?.userStories?.hasNextPage === true;
        page++;
      }

      if (hasMore && page > MAX_PAGES) {
        console.warn(
          `[SprintPlanningView] loadBacklogStories: hit MAX_PAGES (${MAX_PAGES}) safety limit ` +
          `— backlog has more than ${MAX_PAGES * pageSize} stories. ` +
          `storiesMap may be incomplete. Consider a dedicated bulk-fetch endpoint.`
        );
      }

      this.storiesMap.set(map);
      if (map.size === 0 && (this.pageState() === 'empty' || this.pageState() === 'no-sprints')) {
        this.pageState.set('no-sprints');
      }
    } catch {
      // Non-fatal — story titles will fall back to ID
    } finally {
      this.isBacklogLoading.set(false);
    }
  }

  // ── Generate ───────────────────────────────────────────────────
  async onGenerate() {
    const projId = this.projectState.selectedProjectId();
    if (!projId) {
      this.toastService.show('No project selected. Please choose a project first.', 'error');
      return;
    }

    if (this.projectState.projectEmployeeCount() === 0) {
      this.showNoEmployeesModal.set(true);
      return;
    }

    // Pre-check active sprint state before triggering generation
    const isAlreadyActive = await this.checkActiveSprint();
    if (isAlreadyActive) {
      this.showActiveSprintModal.set(true);
      return;
    }

    const isAlreadyPlanned = await this.checkPlannedSprint();
    if (isAlreadyPlanned) {
      this.showPlannedSprintModal.set(true);
      return;
    }

    this.risks.set([]);
    this.suggestedStoriesMeta.set(new Map());
    this.pageState.set('loading');
    this.startHintCycle();

    try {
      const res = await this.sprintService.getSprintSuggestions(projId);

      // The API returns { data: { sprintGoalEn, sprintGoalAr, totalEstimatedHours, stories: [...] }, succeeded: true }
      const raw = res.data || res || [];
      let mappedSuggestions: SprintSuggestionDto[] = [];
      let apiTotalHours = 0;

      if (Array.isArray(raw)) {
        mappedSuggestions = raw.map((item: any) => ({
          sprintNumber: item.sprintNumber,
          sprintTitle: item.sprintTitle || item.sprintTitleEn || item.titleEn,
          titleEn: item.sprintTitle || item.sprintTitleEn || item.titleEn || (item.sprintNumber ? `Sprint ${item.sprintNumber}` : 'Sprint 1'),
          titleAr: item.sprintNumber ? `السبرينت ${item.sprintNumber}` : 'السبرينت 1',
          sprintGoalEn: item.sprintGoalEn || item.goalEn || '',
          sprintGoalAr: item.sprintGoalAr || item.goalAr || '',
          goalEn: item.sprintGoalEn || item.goalEn || '',
          goalAr: item.sprintGoalAr || item.goalAr || '',
          capacityExplanation: item.capacityExplanation || '',
          userStoryIds: (item.stories || item.userStoryIds || []).map((s: any) => s.storyId || s.id || s),
        }));
      } else if (raw && typeof raw === 'object') {
        const storiesList: any[] = raw.stories || raw.userStoryIds || [];
        apiTotalHours = raw.totalEstimatedHours || 0;
        const userStoryIds = storiesList.map((s: any) => (typeof s === 'string' ? s : s.storyId || s.id));

        // Extract AI risks
        this.risks.set(raw.risks || []);

        // Build per-story AI metadata map
        const metaMap = new Map<string, SuggestedStoryMeta>();
        storiesList.forEach((s: any) => {
          if (s && typeof s === 'object') {
            const id = s.storyId || s.id;
            if (id) {
              metaMap.set(id, {
                reason: s.reason || s.reasonEn || '',
                priorityScore: s.priorityScore ?? 0,
                estimatedHours: s.estimatedHours || 0,
              });
            }
          }
        });
        this.suggestedStoriesMeta.set(metaMap);

        const titleEn = raw.sprintTitle || raw.sprintTitleEn || raw.titleEn || (raw.sprintNumber ? `Sprint ${raw.sprintNumber}` : 'Sprint 1');
        const goalEn = raw.sprintGoalEn || raw.goalEn || '';
        const goalAr = raw.sprintGoalAr || raw.goalAr || '';

        mappedSuggestions = [
          {
            sprintNumber: raw.sprintNumber,
            sprintTitle: titleEn,
            titleEn: titleEn,
            titleAr: raw.sprintNumber ? `السبرينت ${raw.sprintNumber}` : 'السبرينت 1',
            sprintGoalEn: goalEn,
            sprintGoalAr: goalAr,
            goalEn: goalEn,
            goalAr: goalAr,
            capacityExplanation: raw.capacityExplanation || '',
            userStoryIds: userStoryIds,
          }
        ];
      }

      if (mappedSuggestions.length === 0 || mappedSuggestions[0].userStoryIds.length === 0) {
        this.toastService.show(
          this.currentLang() === 'ar'
            ? 'لم يتم إرجاع أي مقترحات للسبرينت. تأكد من وجود قصص مستخدمين في قائمة المهام.'
            : 'No sprint suggestions returned. Make sure your backlog has user stories.',
          'error'
        );
        this.pageState.set('no-sprints');
        return;
      }

      this.suggestions.set(mappedSuggestions);
      this.apiTotalHours.set(apiTotalHours);
      this.buildSprintCards(mappedSuggestions);
      this.pageState.set('suggestion');
    } catch (err: any) {
      this.handleApiError(err, 'generate');
      this.pageState.set('no-sprints');
    } finally {
      this.clearHintTimer();
    }
  }

  // ── Regenerate ─────────────────────────────────────────────────
  async onRegenerate() {
    await this.onGenerate();
  }

  goToTeam(): void {
    this.router.navigate(['/dashboard', 'team']);
  }

  // ── Confirm ────────────────────────────────────────────────────
  async onConfirmSprint() {
    const projId = this.projectState.selectedProjectId();
    if (!projId || this.totalVisibleStories() === 0) return;

    this.pageState.set('confirming');

    // Build payload — only include non-removed story IDs
    const card = this.sprintCards()[0];
    if (!card) {
      this.pageState.set('suggestion');
      return;
    }

    const payload = {
      titleEn: card.sprint.sprintTitle || card.sprint.titleEn || '',
      titleAr: card.sprint.titleAr || card.sprint.sprintTitle || card.sprint.titleEn || '',
      sprintGoalEn: card.sprint.sprintGoalEn || card.sprint.goalEn || '',
      sprintGoalAr: card.sprint.sprintGoalAr || card.sprint.goalAr || '',
      userStoryIds: card.sprint.userStoryIds.filter(id => !card.removedStoryIds.has(id)),
    };

    try {
      await this.sprintService.confirmSprints(projId, payload);
      this.toastService.show('Sprint confirmed successfully.', 'success');
      this.router.navigate(['/dashboard', 'sprint']);
    } catch (err: any) {
      this.handleApiError(err, 'confirm');
      this.pageState.set('suggestion');
    }
  }

  // ── Remove story (client-side) ─────────────────────────────────
  removeStory(card: SprintCard, storyId: string) {
    const cardIndex = this.sprintCards().indexOf(card);
    if (cardIndex < 0) return;

    this.sprintCards.update(cards => cards.map((item, index) => {
      if (index !== cardIndex) return item;
      const removedStoryIds = new Set(item.removedStoryIds);
      removedStoryIds.add(storyId);
      return { ...item, removedStoryIds };
    }));

    this.toastService.show(
      this.currentLang() === 'ar' ? 'تمت إزالة القصة من نطاق السبرينت.' : 'Story removed from sprint scope.',
      'info',
      5000,
      {
        label: this.currentLang() === 'ar' ? 'تراجع' : 'Undo',
        onClick: () => this.restoreStory(cardIndex, storyId),
      }
    );
  }

  navigateToPlannedSprint(): void {
    const plannedId = this.plannedSprintId();
    this.router.navigate(['/dashboard', 'sprint'], {
      queryParams: plannedId ? { sprintId: plannedId, sprintStatus: 'Planned' } : undefined,
    });
  }

  private clearPlannedSprintState(): void {
    this.hasPlannedSprint.set(false);
    this.plannedSprintId.set(null);
    this.plannedSprintTitle.set('');
  }

  restoreStory(cardIndex: number, storyId: string): void {
    this.sprintCards.update(cards => cards.map((item, index) => {
      if (index !== cardIndex) return item;
      const removedStoryIds = new Set(item.removedStoryIds);
      removedStoryIds.delete(storyId);
      return { ...item, removedStoryIds };
    }));
  }

  openStoryEditor(story: UserStoryDto, event: Event): void {
    this.overlayTrigger = event.currentTarget as HTMLElement;
    this.editingStory.set(story);
  }

  closeStoryEditor(): void {
    if (!this.editingStory()) return;
    this.editingStory.set(null);
    this.restoreOverlayFocus();
  }

  onStorySaved(updatedStory: UserStoryDto): void {
    this.storiesMap.update(current => {
      const next = new Map(current);
      next.set(updatedStory.id, updatedStory);
      return next;
    });
    this.changedStoryIds.update(current => new Set(current).add(updatedStory.id));
    this.toastService.show(
      this.currentLang() === 'ar' ? 'تم حفظ قصة المستخدم.' : 'User story saved.',
      'success'
    );
    this.editingStory.set(null);
    this.restoreOverlayFocus();
  }

  openStoryPicker(cardIndex: number, event: Event): void {
    this.overlayTrigger = event.currentTarget as HTMLElement;
    this.pickerCardIndex.set(cardIndex);
    this.storyPickerOpen.set(true);
  }

  closeStoryPicker(): void {
    if (!this.storyPickerOpen()) return;
    this.storyPickerOpen.set(false);
    this.restoreOverlayFocus();
  }

  addStoriesToSprint(storyIds: string[]): void {
    const cardIndex = this.pickerCardIndex();
    this.sprintCards.update(cards => cards.map((item, index) => {
      if (index !== cardIndex) return item;
      const userStoryIds = [...new Set([...item.sprint.userStoryIds, ...storyIds])];
      const removedStoryIds = new Set(item.removedStoryIds);
      storyIds.forEach(id => removedStoryIds.delete(id));
      return {
        ...item,
        sprint: { ...item.sprint, userStoryIds },
        removedStoryIds,
      };
    }));
    this.storyPickerOpen.set(false);
    this.toastService.show(
      this.currentLang() === 'ar'
        ? `تمت إضافة ${storyIds.length} قصة إلى السبرينت.`
        : `${storyIds.length} ${storyIds.length === 1 ? 'story' : 'stories'} added to the sprint.`,
      'success'
    );
    this.restoreOverlayFocus();
  }

  availableStoryCount(card: SprintCard): number {
    const selected = new Set(card.sprint.userStoryIds.filter(id => !card.removedStoryIds.has(id)));
    return this.allBacklogStories().filter(story => !selected.has(story.id)).length;
  }

  private restoreOverlayFocus(): void {
    const trigger = this.overlayTrigger;
    this.overlayTrigger = null;
    queueMicrotask(() => trigger?.focus());
  }

  // ── Template helpers ───────────────────────────────────────────
  getStory(id: string): UserStoryDto | undefined {
    return this.storiesMap().get(id);
  }

  getStoryMeta(id: string): SuggestedStoryMeta | undefined {
    return this.suggestedStoriesMeta().get(id);
  }

  visibleStoryCount(card: SprintCard): number {
    return card.sprint.userStoryIds.filter(id => !card.removedStoryIds.has(id)).length;
  }

  storyHours(story: UserStoryDto): number {
    return (story.tasks || []).reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  }

  calcHours(card: SprintCard): number {
    let total = 0;
    for (const id of card.sprint.userStoryIds) {
      if (!card.removedStoryIds.has(id)) {
        const story = this.getStory(id);
        if (story) total += this.storyHours(story);
      }
    }

    // If backlog tasks have no estimated hours (0), fall back to the AI API total
    if (total === 0 && this.apiTotalHours() > 0) {
      return this.apiTotalHours();
    }
    return total;
  }



  mapPriority(priority: string): string {
    const isAr = this.currentLang() === 'ar';
    if (priority === '2' || priority === 'High') return isAr ? 'عالي' : 'High';
    if (priority === '3' || priority === 'Critical') return isAr ? 'حرج' : 'Critical';
    if (priority === '0' || priority === 'Low') return isAr ? 'منخفض' : 'Low';
    return isAr ? 'متوسط' : 'Medium';
  }

  // ── Private helpers ────────────────────────────────────────────
  private buildSprintCards(suggestions: SprintSuggestionDto[]) {
    const cards: SprintCard[] = suggestions.map(sprint => ({
      sprint: { ...sprint },
      removedStoryIds: new Set<string>(),
      totalHours: 0,
      visibleStories: [],
    }));
    this.sprintCards.set(cards);
  }

  private startHintCycle() {
    this.hintIndex = 0;
    this.loadingHint.set(LOADING_HINTS[0]);
    this.hintTimer = setInterval(() => {
      this.hintIndex = (this.hintIndex + 1) % LOADING_HINTS.length;
      this.loadingHint.set(LOADING_HINTS[this.hintIndex]);
    }, 1800);
  }

  private clearHintTimer() {
    if (this.hintTimer) {
      clearInterval(this.hintTimer);
      this.hintTimer = null;
    }
  }

  private handleApiError(err: any, context: 'generate' | 'confirm') {
    const parsed = parseApiError(
      err,
      context === 'confirm'
        ? 'Failed to confirm sprint. Please try again.'
        : 'Sprint generation failed. Please try again.',
    );
    const errorCode = parsed.code;

    if (errorCode === 'ANOTHER_SPRINT_ALREADY_PLANNED') {
      this.hasPlannedSprint.set(true);
      this.showPlannedSprintModal.set(true);
      this.toastService.show(
        this.currentLang() === 'ar'
          ? 'يوجد سبرينت مخطط له بالفعل. ابدأه أو احذفه قبل إنشاء تخطيط جديد.'
          : 'A planned sprint already exists. Start or remove it before creating another plan.',
        'warning',
        6000,
        {
          label: this.currentLang() === 'ar' ? 'عرض السبرينت المخطط' : 'View planned sprint',
          onClick: () => this.navigateToPlannedSprint(),
        },
      );
      void this.checkPlannedSprint();
      return;
    }

    if (errorCode === 'ANOTHER_SPRINT_ALREADY_ACTIVE') {
      this.hasActiveSprint.set(true);
      this.showActiveSprintModal.set(true);
      const isAr = this.currentLang() === 'ar';
      this.toastService.show(
        isAr
          ? 'يوجد سبرينت نشط قيد التشغيل لهذا المشروع بالفعل. يرجى إكماله أولاً.'
          : 'An active sprint is currently running for this project. Please complete it first.',
        'warning',
        6000,
        {
          label: isAr ? 'عرض السبرينت' : 'View Active Sprint',
          onClick: () => this.navigateToActiveSprint()
        }
      );
      return;
    }

    if (errorCode === 'NO_EMPLOYEES_ASSIGNED') {
      this.showNoEmployeesModal.set(true);
      return;
    }

    const { status, message: serverMsg } = parsed;

    if (status === 403) {
      this.toastService.show('You do not have permission to manage sprints for this project.', 'error');
    } else if (status === 404) {
      this.toastService.show(serverMsg || 'The requested sprint resource was not found.', 'error');
    } else if (status === 400) {
      this.toastService.show(
        serverMsg || (context === 'confirm'
          ? 'Sprint validation failed. Check your sprint data and try again.'
          : 'Could not generate sprint. Ensure your backlog has valid user stories.'),
        'error'
      );
    } else if (status === 409) {
      // 409 means a domain conflict, not necessarily an active sprint.
      // Only the explicit active/planned codes above may change sprint state.
      this.toastService.show(serverMsg, 'warning');
    } else {
      this.toastService.show(serverMsg, 'error');
    }

    console.error(`[SprintPlanningView] ${context} error:`, err);
  }
}
