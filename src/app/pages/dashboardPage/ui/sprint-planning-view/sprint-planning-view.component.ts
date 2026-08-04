import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  SprintPlanningService,
  SprintSuggestionDto,
} from '../../../../shared/api/sprint-planning.service';
import { BacklogService, UserStoryDto } from '../../../../shared/api/backlog.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { ToastService } from '../../../../shared/services/toast.service';

type PageState = 'empty' | 'loading' | 'suggestion' | 'confirming' | 'no-sprints';

interface SprintCard {
  sprint: SprintSuggestionDto;
  removedStoryIds: Set<string>;
  totalHours: number;
  visibleStories: UserStoryDto[];
}

interface SuggestedStoryMeta {
  reasonEn: string;
  reasonAr: string;
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
  imports: [CommonModule, FormsModule],
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
      @if (projectState.selectedProjectId() && !hasActiveSprint() && projectState.projectEmployeeCount() === 0) {
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
              [disabled]="pageState() === 'confirming' || projectState.projectEmployeeCount() === 0 || hasActiveSprint()"
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
              [disabled]="pageState() === 'confirming' || totalVisibleStories() === 0 || projectState.projectEmployeeCount() === 0 || hasActiveSprint()"
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
              [disabled]="projectState.projectEmployeeCount() === 0 || hasActiveSprint()"
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
              (click)="loadBacklogStories()"
              [disabled]="isBacklogLoading()"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-sidebar hover:bg-border border border-border text-text-primary font-bold rounded-xl shadow-xs transition-all text-xs disabled:opacity-50">
              <svg class="w-4 h-4 text-text-secondary" [class.animate-spin]="isBacklogLoading()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ currentLang() === 'ar' ? 'تحديث قائمة المهام' : 'Refresh Backlog' }}
            </button>

            <button
              (click)="onGenerate()"
              [disabled]="hasActiveSprint()"
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
              [disabled]="projectState.projectEmployeeCount() === 0 || hasActiveSprint()"
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
        <div class="flex flex-col items-center justify-center text-center rounded-2xl border border-border bg-surface px-6 py-16 shadow-sm max-w-3xl mx-auto mt-8 animate-[fadeIn_0.3s_ease_both]" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">

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
                    [ngModel]="currentLang() === 'ar' ? card.sprint.titleAr : card.sprint.titleEn"
                    (ngModelChange)="currentLang() === 'ar' ? card.sprint.titleAr = $event : card.sprint.titleEn = $event"
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
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">

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

                  <!-- Capacity -->
                  <div class="rounded-xl bg-primary/5 border border-primary/15 p-3">
                    <p class="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">{{ currentLang() === 'ar' ? 'نسبة الاستيعاب %' : 'Capacity %' }}</p>
                    <p class="text-xl font-extrabold text-primary">{{ calcCapacity(card) }}%</p>
                  </div>
                </div>

                <!-- Capacity bar -->
                <div class="mb-4">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{{ currentLang() === 'ar' ? 'الاستيعاب المستخدم' : 'Capacity Used' }}</span>
                    <span class="text-[10px] font-bold"
                      [class.text-emerald-600]="calcCapacity(card) <= 80"
                      [class.text-warning]="calcCapacity(card) > 80 && calcCapacity(card) <= 100"
                      [class.text-error]="calcCapacity(card) > 100">
                      {{ calcCapacity(card) }}%
                    </span>
                  </div>
                  <div class="h-2 w-full bg-border/50 rounded-full overflow-hidden" [dir]="'ltr'">
                    <div class="h-full rounded-full transition-all duration-700"
                      [style.width]="(calcCapacity(card) > 100 ? 100 : calcCapacity(card)) + '%'"
                      [class.bg-emerald-500]="calcCapacity(card) <= 80"
                      [class.bg-warning]="calcCapacity(card) > 80 && calcCapacity(card) <= 100"
                      [class.bg-error]="calcCapacity(card) > 100">
                    </div>
                  </div>
                </div>

                <!-- Capacity Explanation -->
                @if (currentLang() === 'ar' ? card.sprint.capacityExplanationAr : card.sprint.capacityExplanationEn) {
                  <div class="mb-4 text-[11px] text-text-secondary bg-primary/5 p-2 rounded-lg border border-primary/10">
                    <span class="font-bold mr-1">{{ currentLang() === 'ar' ? 'معلومات الاستيعاب:' : 'Capacity Info:' }}</span>
                    {{ currentLang() === 'ar' ? card.sprint.capacityExplanationAr : card.sprint.capacityExplanationEn }}
                  </div>
                }

                <!-- Goal input -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
                  <div>
                    <label [for]="'goal-en-' + idx" class="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                      {{ currentLang() === 'ar' ? 'هدف السبرينت (EN)' : 'Sprint Goal (EN)' }}
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="card.sprint.goalEn"
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
                      [(ngModel)]="card.sprint.goalAr"
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
                <p class="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                  {{ currentLang() === 'ar' ? 'قصص المستخدم' : 'User Stories' }}
                </p>

                @for (storyId of card.sprint.userStoryIds; track storyId) {
                  @if (!card.removedStoryIds.has(storyId)) {
                    @if (getStory(storyId); as story) {
                      <div class="group flex items-start gap-3 p-3 rounded-xl border border-border bg-sidebar hover:border-primary/30 hover:bg-primary/[0.03] transition-all duration-150 cursor-default">

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
                          <p class="text-sm font-semibold text-text-primary truncate">{{ currentLang() === 'ar' ? story.titleAr : story.titleEn }}</p>
                          @if (story.tasks && story.tasks.length > 0) {
                            <p class="text-xs text-text-secondary mt-0.5">
                              {{ story.tasks.length }} {{ currentLang() === 'ar' ? 'مهمة' : (story.tasks.length !== 1 ? 'tasks' : 'task') }}
                              · {{ storyHours(story) }} {{ currentLang() === 'ar' ? 'ساعة (تقدير)' : 'h est.' }}
                            </p>
                          }
                          @if (getStoryMeta(storyId); as meta) {
                            @if (currentLang() === 'ar' ? meta.reasonAr : meta.reasonEn) {
                              <p class="text-[10px] text-text-secondary mt-1 leading-4 line-clamp-2 italic opacity-80">{{ currentLang() === 'ar' ? meta.reasonAr : meta.reasonEn }}</p>
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

                        <!-- Remove button -->
                        <button
                          (click)="removeStory(card, storyId)"
                          [id]="'remove-story-' + storyId"
                          class="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-lg text-text-secondary hover:text-error hover:bg-error/10 transition-all duration-150"
                          [title]="currentLang() === 'ar' ? 'إزالة من السبرينت' : 'Remove from sprint'">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          <!-- Bottom action bar -->
          <div class="flex items-center justify-between gap-3 pt-2 pb-4 flex-wrap" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
            <p class="text-xs text-text-secondary">
              @if (currentLang() === 'ar') {
                إجمالي <span class="font-bold text-text-primary">{{ totalVisibleStories() }}</span> قصة في
                <span class="font-bold text-text-primary">{{ suggestions().length }}</span> سبرينت
              } @else {
                <span class="font-bold text-text-primary">{{ totalVisibleStories() }}</span> total stories across
                <span class="font-bold text-text-primary">{{ suggestions().length }}</span> sprint{{ suggestions().length !== 1 ? 's' : '' }}
              }
            </p>
          </div>
        </div>
      }

      <!-- ─── ACTIVE SPRINT ALREADY RUNNING MODAL ─── -->
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

  // ── State signals ──────────────────────────────────────────────
  currentLang = signal<'en' | 'ar'>(typeof localStorage !== 'undefined' ? (localStorage.getItem('app_lang') as 'en' | 'ar') || 'en' : 'en');
  showNoEmployeesModal = signal<boolean>(false);
  showActiveSprintModal = signal<boolean>(false);
  hasActiveSprint = signal<boolean>(false);
  activeSprintId = signal<string | null>(null);
  activeSprintTitle = signal<string>('');
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

  // ── Computed values ────────────────────────────────────────────
  totalVisibleStories = computed(() =>
    this.sprintCards().reduce((acc, c) => acc + this.visibleStoryCount(c), 0)
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
      this.projectState.loadProjectEmployeeCount(projId);
    }
    await this.checkActiveSprint();
    await this.loadBacklogStories();
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
      const active = sprints.find(s => s.status === 'Active');
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
    if (this.projectState.projectEmployeeCount() === 0) {
      return isAr
        ? 'يجب تعيين موظف واحد على الأقل للمشروع أولاً'
        : 'At least one employee must be assigned to this project first';
    }
    return '';
  }

  // ── Backlog loader ─────────────────────────────────────────────
  async loadBacklogStories() {
    const projId = this.projectState.selectedProjectId();
    if (!projId) return;
    this.isBacklogLoading.set(true);
    try {
      const res = await this.backlogService.getBacklog(projId);
      const map = new Map<string, UserStoryDto>();
      (res?.userStories || []).forEach((s: UserStoryDto) => map.set(s.id, s));
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
          sprintTitleEn: item.sprintTitleEn || item.titleEn,
          sprintTitleAr: item.sprintTitleAr || item.titleAr,
          titleEn: item.sprintTitleEn || item.titleEn || (item.sprintNumber ? `Sprint ${item.sprintNumber}` : 'Sprint 1'),
          titleAr: item.sprintTitleAr || item.titleAr || (item.sprintNumber ? `السبرينت ${item.sprintNumber}` : 'السبرينت 1'),
          goalEn: item.sprintGoalEn || item.goalEn || '',
          goalAr: item.sprintGoalAr || item.goalAr || '',
          sprintGoalEn: item.sprintGoalEn || item.goalEn || '',
          sprintGoalAr: item.sprintGoalAr || item.goalAr || '',
          userStoryIds: (item.stories || item.userStoryIds || []).map((s: any) => s.storyId || s.id || s),
        }));
      } else if (raw && typeof raw === 'object') {
        const titleEn = raw.sprintTitleEn || raw.titleEn || (raw.sprintNumber ? `Sprint ${raw.sprintNumber}` : 'Sprint 1');
        const titleAr = raw.sprintTitleAr || raw.titleAr || (raw.sprintNumber ? `السبرينت ${raw.sprintNumber}` : 'السبرينت 1');
        const goalEn = raw.sprintGoalEn || raw.goalEn || '';
        const goalAr = raw.sprintGoalAr || raw.goalAr || '';
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
                reasonEn: s.reasonEn || '',
                reasonAr: s.reasonAr || '',
                priorityScore: s.priorityScore ?? 0,
                estimatedHours: s.estimatedHours || 0,
              });
            }
          }
        });
        this.suggestedStoriesMeta.set(metaMap);

        mappedSuggestions = [
          {
            sprintNumber: raw.sprintNumber,
            sprintTitleEn: titleEn,
            sprintTitleAr: titleAr,
            titleEn: titleEn,
            titleAr: titleAr,
            goalEn: goalEn,
            goalAr: goalAr,
            sprintGoalEn: goalEn,
            sprintGoalAr: goalAr,
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
      titleEn: card.sprint.titleEn,
      titleAr: card.sprint.titleAr,
      sprintGoalEn: card.sprint.goalEn,
      sprintGoalAr: card.sprint.goalAr,
      userStoryIds: card.sprint.userStoryIds.filter(id => !card.removedStoryIds.has(id)),
    };

    try {
      // The backend expects a single ConfirmSprintRequest object
      await this.sprintService.confirmSprints(projId, payload as any);
      this.toastService.show('Sprint confirmed successfully.', 'success');
      this.router.navigate(['/dashboard', 'sprint']);
    } catch (err: any) {
      this.handleApiError(err, 'confirm');
      this.pageState.set('suggestion');
    }
  }

  // ── Remove story (client-side) ─────────────────────────────────
  removeStory(card: SprintCard, storyId: string) {
    card.removedStoryIds.add(storyId);
    // Trigger signal re-evaluation by reassigning the array
    this.sprintCards.set([...this.sprintCards()]);
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

  calcCapacity(card: SprintCard): number {
    // Assume 2-week sprint, 40 h/developer standard capacity = 160 h (4 devs)
    const sprintCapacity = 160;
    const hours = this.calcHours(card);
    if (hours === 0) return 0;
    return Math.round((hours / sprintCapacity) * 100);
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
    const errorCode = err?.response?.data?.error?.code || err?.response?.data?.code || err?.error?.code || err?.code;
    const errorDesc = err?.response?.data?.error?.description || err?.response?.data?.message || err?.message;

    if (errorCode === 'ANOTHER_SPRINT_ALREADY_ACTIVE' || errorCode === 'Sprint.AnotherAlreadyActive' || errorDesc === 'Sprint.AnotherAlreadyActive') {
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

    const status = err?.response?.status ?? err?.status;
    let serverMsg = err?.response?.data?.message || err?.response?.data?.error?.description;

    // ASP.NET Core Problem Details puts field errors in an "errors" object
    const errorsObj = err?.response?.data?.errors;
    if (!serverMsg && errorsObj) {
      if (Array.isArray(errorsObj) && errorsObj.length > 0) {
        serverMsg = errorsObj[0];
      } else if (typeof errorsObj === 'object') {
        // Extract the first error message from the dictionary
        const firstKey = Object.keys(errorsObj)[0];
        if (firstKey && Array.isArray(errorsObj[firstKey]) && errorsObj[firstKey].length > 0) {
          serverMsg = `${firstKey}: ${errorsObj[firstKey][0]}`;
        } else if (firstKey) {
          serverMsg = `${firstKey}: ${errorsObj[firstKey]}`;
        }
      }
    }

    if (status === 409) {
      this.hasActiveSprint.set(true);
      this.showActiveSprintModal.set(true);
      const isAr = this.currentLang() === 'ar';
      this.toastService.show(
        isAr 
          ? 'يوجد تعارض: هناك سبرينت نشط بالفعل.' 
          : 'Conflict: An active sprint is already running for this project.',
        'warning',
        6000,
        {
          label: isAr ? 'عرض السبرينت' : 'View Active Sprint',
          onClick: () => this.navigateToActiveSprint()
        }
      );
      return;
    }

    if (status === 403) {
      this.toastService.show('You do not have permission to manage sprints for this project.', 'error');
    } else if (status === 404) {
      this.toastService.show('Project not found. Please refresh and try again.', 'error');
    } else if (status === 400) {
      this.toastService.show(
        serverMsg ?? (context === 'confirm'
          ? 'Sprint validation failed. Check your sprint data and try again.'
          : 'Could not generate sprint. Ensure your backlog has valid user stories.'),
        'error'
      );
    } else {
      this.toastService.show(
        context === 'confirm'
          ? (serverMsg || 'Failed to confirm sprint. Please try again.')
          : (serverMsg || 'Sprint generation failed. Please try again.'),
        'error'
      );
    }

    console.error(`[SprintPlanningView] ${context} error:`, err);
  }
}
