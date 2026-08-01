import { Component, ChangeDetectionStrategy, signal, inject, OnInit, effect, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BacklogService, BacklogDto, TaskItemDto, TaskPayload, UserStoryDto, UserStoryPayload } from '../../../../shared/api/backlog.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { AiRequirementsService } from '../../../../shared/api/ai-requirements.service';
import { SprintPlanningModalComponent } from '../sprint-planning-modal/sprint-planning-modal.component';
import { TechStackAdvisorModalComponent } from '../tech-stack-advisor-modal/tech-stack-advisor-modal.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { ProjectAiChatComponent } from '../../../../widgets/projectAiChat/project-ai-chat.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

interface StoryFormModel extends UserStoryPayload {
  id?: string;
}

interface TaskFormModel extends TaskPayload {
  id?: string;
  userStoryId?: string;
}

const EMPTY_STORY: StoryFormModel = {
  titleEn: '',
  titleAr: '',
  descriptionEn: '',
  descriptionAr: '',
  acceptanceCriteriaEn: '',
  acceptanceCriteriaAr: '',
  priority: 'Medium',
};

const EMPTY_TASK: TaskFormModel = {
  titleEn: '',
  titleAr: '',
  descriptionEn: '',
  descriptionAr: '',
  technicalSummaryEn: '',
  technicalSummaryAr: '',
  acceptanceCriteriaEn: '',
  acceptanceCriteriaAr: '',
  estimatedHours: 4,
  effortSize: 'Medium',
  priority: 'Medium',
  type: 'Technical',
  status: 'ToDo',
};

@Component({
  selector: 'app-backlog-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SprintPlanningModalComponent, TechStackAdvisorModalComponent, ProjectAiChatComponent, TranslatePipe],
  template: `
    <div class="space-y-6">
      @if (projectState.loading() || isLoading()) {
        <div class="flex items-center justify-center rounded-2xl border border-border bg-surface p-12 shadow-sm">
          <div class="flex flex-col items-center gap-3">
            <div class="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            <span class="text-sm font-semibold text-text-secondary">{{ 'PROFILE.LOADING' | translate }}</span>
          </div>
        </div>
      } @else if (projectState.isProjectManager() && projectState.projects().length === 0) {
        <div class="mx-auto my-8 max-w-xl rounded-3xl border border-border bg-surface p-8 shadow-lg">
          <div class="flex items-start gap-4 mb-6">
            <div class="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-lg font-bold border border-primary/20 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-text-primary">Create Your First Project</h3>
              <p class="text-xs text-text-secondary mt-0.5">Let's set up a workspace for your team.</p>
            </div>
          </div>
          <form (submit)="onCreateProject($event)" class="space-y-4">
            <div>
              <label class="block text-[11px] font-extrabold text-text-secondary mb-1.5 uppercase tracking-wider">Project Name (English)</label>
              <input type="text" name="projNameEn" required placeholder="e.g. E-Commerce Platform"
                     class="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold placeholder:text-gray-400/70">
            </div>

            <div>
              <label class="block text-[11px] font-extrabold text-text-secondary mb-1.5 uppercase tracking-wider">اسم المشروع (عربي)</label>
              <input type="text" name="projNameAr" required placeholder="مثال: منصة التجارة الإلكترونية" dir="rtl"
                     class="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-right placeholder:text-gray-400/70">
            </div>

            <div>
              <label class="block text-[11px] font-extrabold text-text-secondary mb-1.5 uppercase tracking-wider">Description (English)</label>
              <textarea name="projDescEn" required rows="3" placeholder="Brief details about the project scope..."
                        class="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-gray-400/70"></textarea>
            </div>

            <div>
              <label class="block text-[11px] font-extrabold text-text-secondary mb-1.5 uppercase tracking-wider">الوصف (عربي)</label>
              <textarea name="projDescAr" required rows="3" placeholder="تفاصيل مختصرة عن نطاق المشروع..." dir="rtl"
                        class="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-right placeholder:text-gray-400/70"></textarea>
            </div>

            <button type="submit" class="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white hover:bg-primary-hover shadow-md transition-all active:scale-[0.99] mt-2">Create Project</button>
          </form>
        </div>
      } @else if (!isAssigned() || projectState.selectedProject()?.status === 'Completed' || projectState.selectedProject()?.status === 'Archived') {
        <div class="mx-auto my-12 max-w-xl rounded-2xl border border-warning/30 bg-surface p-8 text-center shadow-sm">
          <h3 class="text-xl font-bold text-text-primary">No Active Project</h3>
          <p class="mt-2 text-sm text-text-secondary">Please select an active project, or contact your Project Manager to assign you to one.</p>
        </div>
      } @else {
        <header class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">{{ 'BACKLOG.PRODUCT_BACKLOG' | translate }}</p>
            <h2 class="mt-1 text-2xl font-extrabold text-text-primary font-display">{{ localizedProjectName() }}</h2>
            <p class="mt-1 text-sm text-text-secondary">{{ label('backlogSubtitle') }}</p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            @if (projectState.isProjectManager() && projectState.selectedProject()?.status !== 'Completed' && projectState.selectedProject()?.status !== 'Archived') {
              @if ((backlog()?.userStories?.length || 0) > 0) {
              }
              <button type="button" (click)="isChatOpen.set(true)" class="rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-700">{{ 'BACKLOG.EDIT_BACKLOG' | translate }}</button>
            }
          </div>
        </header>

        @if ((backlog()?.userStories?.length || 0) > 0) {
          <section class="rounded-2xl border border-border bg-surface shadow-sm">
            <div class="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-border bg-sidebar px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
              <span>{{ label('story') }}</span>
              <span class="hidden sm:block">{{ label('priority') }}</span>
              <span class="hidden md:block">{{ label('tasks') }}</span>
              <span>{{ label('actions') }}</span>
            </div>

            <div class="divide-y divide-border">
              @for (story of backlog()?.userStories; track story.id) {
                <article>
                  <div class="grid grid-cols-[1fr_auto] gap-3 px-4 py-4 md:grid-cols-[1fr_90px_80px_150px] md:items-center">
                    <button type="button" (click)="toggleStory(story.id)" class="min-w-0 text-left">
                      <div class="flex flex-wrap items-center gap-2">
                        <h3 class="truncate text-sm font-extrabold text-text-primary" [attr.dir]="isArabic() ? 'rtl' : 'ltr'">{{ storyTitle(story) }}</h3>
                        <span class="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{{ story.status }}</span>
                      </div>
                      <p class="mt-1 line-clamp-1 text-xs text-text-secondary" [attr.dir]="isArabic() ? 'rtl' : 'ltr'">{{ storyDescription(story) }}</p>
                    </button>
                    <span class="hidden text-xs font-bold text-text-secondary sm:block">{{ story.priority }}</span>
                    <span class="hidden text-xs font-bold text-text-secondary md:block">{{ story.tasks.length }}</span>
                    @if (projectState.isProjectManager() && projectState.selectedProject()?.status !== 'Completed' && projectState.selectedProject()?.status !== 'Archived') {
                      <div class="flex justify-end gap-2">
                        <button type="button" (click)="openTaskModal(story)" class="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-bold hover:bg-sidebar">{{ 'BACKLOG.TASK' | translate }}</button>
                        <button type="button" (click)="openStoryModal(story)" class="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-bold hover:bg-sidebar">{{ 'BACKLOG.EDIT' | translate }}</button>
                        <button type="button" (click)="deleteStory(story)" class="rounded-lg border border-error/30 px-2.5 py-1.5 text-[11px] font-bold text-error hover:bg-error/10">{{ 'BACKLOG.DELETE' | translate }}</button>
                      </div>
                    } @else {
                      <span></span>
                    }
                  </div>

                  @if (expandedStoryIds().includes(story.id)) {
                    <div class="border-t border-border bg-background/40 px-4 py-4">
                      <div class="rounded-xl border border-border bg-surface p-3" [attr.dir]="isArabic() ? 'rtl' : 'ltr'">
                        <p class="text-[11px] font-bold uppercase text-text-secondary">{{ isArabic() ? label('acceptanceCriteriaAr') : label('acceptanceCriteriaEn') }}</p>
                        <p class="mt-1 whitespace-pre-wrap text-xs text-text-primary">{{ storyAcceptanceCriteria(story) }}</p>
                      </div>

                      <div class="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
                        <table class="w-full min-w-[820px] text-left text-xs">
                          <thead class="bg-sidebar text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">
                            <tr>
                              <th class="px-3 py-2">{{ label('task') }}</th>
                              <th class="px-3 py-2">{{ label('status') }}</th>
                              <th class="px-3 py-2">{{ label('type') }}</th>
                              <th class="px-3 py-2">{{ label('priority') }}</th>
                              <th class="px-3 py-2">{{ label('effort') }}</th>
                              <th class="px-3 py-2">{{ label('hours') }}</th>
                              <th class="px-3 py-2 text-right">{{ label('actions') }}</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-border">
                            @for (task of story.tasks; track task.id) {
                              <tr>
                                <td class="px-3 py-3">
                                  <p class="font-bold text-text-primary" [attr.dir]="isArabic() ? 'rtl' : 'ltr'">{{ taskTitle(task) }}</p>
                                  <p class="mt-0.5 line-clamp-1 text-text-secondary" [attr.dir]="isArabic() ? 'rtl' : 'ltr'">{{ taskDescription(task) }}</p>
                                </td>
                                <td class="px-3 py-3 font-semibold text-text-secondary">{{ task.status }}</td>
                                <td class="px-3 py-3 font-semibold text-text-secondary">{{ task.type }}</td>
                                <td class="px-3 py-3 font-semibold text-text-secondary">{{ task.priority }}</td>
                                <td class="px-3 py-3 font-semibold text-text-secondary">{{ task.effortSize }}</td>
                                <td class="px-3 py-3 font-semibold text-text-secondary">{{ task.estimatedHours }}</td>
                                <td class="px-3 py-3">
                                  <div class="flex items-center justify-end gap-2">
                                    @if (projectState.isProjectManager() && projectState.selectedProject()?.status !== 'Completed' && projectState.selectedProject()?.status !== 'Archived') {
                                      <button type="button" (click)="openTaskModal(story, task)" class="font-bold text-primary hover:underline">{{ 'BACKLOG.EDIT' | translate }}</button>
                                      <button type="button" (click)="deleteTask(task)" class="font-bold text-error hover:underline">{{ 'BACKLOG.DELETE' | translate }}</button>
                                    }
                                  </div>
                                </td>
                              </tr>
                            } @empty {
                              <tr><td colspan="7" class="px-3 py-6 text-center text-text-secondary">{{ label('noTasks') }}</td></tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  }
                </article>
              }
            </div>
          </section>
        } @else {
          <section class="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-12 text-center shadow-sm">
            <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Empty backlog</p>
            <h3 class="mt-2 text-lg font-extrabold text-text-primary">Create stories manually or generate with AI</h3>
            <p class="mt-2 max-w-md text-sm text-text-secondary">AI generation will first confirm the tech stack, then persist bilingual user stories and implementation tasks.</p>
            @if (projectState.isProjectManager() && projectState.selectedProject()?.status !== 'Completed' && projectState.selectedProject()?.status !== 'Archived') {
              <div class="mt-5 flex flex-wrap justify-center gap-3">
                <button type="button" (click)="openStoryModal()" class="rounded-xl border border-border px-4 py-2.5 text-xs font-bold hover:bg-sidebar">Add story manually</button>
                <button type="button" (click)="generateWbs()" [disabled]="isGeneratingWbs()" class="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary-hover disabled:opacity-50">
                  {{ isGeneratingWbs() ? 'Generating backlog...' : 'Generate WBS with AI' }}
                </button>
              </div>
            }
          </section>
        }
      }
    </div>
    @if (isStoryModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <form (submit)="saveStory($event)" class="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <div class="shrink-0 border-b border-border bg-sidebar px-6 py-5">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h8M8 12h5m-5 5h8M5 5a2 2 0 012-2h10a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V5z" />
                  </svg>
                </div>
                <div>
                  <p class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary">{{ storyForm().id ? ('BACKLOG.UPDATE_STORY' | translate) : ('BACKLOG.NEW_STORY' | translate) }}</p>
                  <h3 class="mt-1 text-xl font-extrabold text-text-primary">{{ storyForm().id ? ('BACKLOG.EDIT_USER_STORY' | translate) : ('BACKLOG.ADD_USER_STORY' | translate) }}</h3>
                  <p class="mt-1 text-sm text-text-secondary">{{ 'BACKLOG.STORY_DESC' | translate }}</p>
                </div>
              </div>
              <button type="button" (click)="isStoryModalOpen.set(false)" aria-label="Close story form" class="rounded-xl border border-border p-2 text-text-secondary hover:bg-background hover:text-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div class="grid gap-5 lg:grid-cols-2">
              <section class="space-y-4 rounded-xl border border-border bg-background/50 p-4">
                <div class="flex items-center justify-between border-b border-border pb-2">
                  <h4 class="text-sm font-extrabold text-text-primary">English story</h4>
                  <span class="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">EN</span>
                </div>
                <label class="block space-y-1.5 text-xs font-bold text-text-secondary">Title EN
                  <input name="titleEn" required [(ngModel)]="storyForm().titleEn" class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20">
                </label>
                <label class="block space-y-1.5 text-xs font-bold text-text-secondary">Description EN
                  <textarea name="descriptionEn" rows="4" [(ngModel)]="storyForm().descriptionEn" class="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20"></textarea>
                </label>
                <label class="block space-y-1.5 text-xs font-bold text-text-secondary">{{ label('acceptanceCriteriaEn') }}
                  <textarea name="acceptanceCriteriaEn" rows="4" [(ngModel)]="storyForm().acceptanceCriteriaEn" class="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20"></textarea>
                </label>
              </section>

              <section class="space-y-4 rounded-xl border border-border bg-background/50 p-4" dir="rtl">
                <div class="flex items-center justify-between border-b border-border pb-2">
                  <h4 class="text-sm font-extrabold text-text-primary">Arabic story</h4>
                  <span class="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">AR</span>
                </div>
                <label class="block space-y-1.5 text-xs font-bold text-text-secondary">Title AR
                  <input name="titleAr" [(ngModel)]="storyForm().titleAr" class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20">
                </label>
                <label class="block space-y-1.5 text-xs font-bold text-text-secondary">Description AR
                  <textarea name="descriptionAr" rows="4" [(ngModel)]="storyForm().descriptionAr" class="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20"></textarea>
                </label>
                <label class="block space-y-1.5 text-xs font-bold text-text-secondary">{{ label('acceptanceCriteriaAr') }}
                  <textarea name="acceptanceCriteriaAr" rows="4" [(ngModel)]="storyForm().acceptanceCriteriaAr" class="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20"></textarea>
                </label>
              </section>
            </div>

            <label class="mt-5 block max-w-xs space-y-1.5 text-xs font-bold text-text-secondary">Priority
              <select name="priority" [(ngModel)]="storyForm().priority" class="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20"><option>Low</option><option>Medium</option><option>High</option></select>
            </label>
          </div>

          <div class="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border bg-sidebar px-6 py-4">
            <button type="button" (click)="isStoryModalOpen.set(false)" class="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-text-secondary hover:bg-background hover:text-text-primary">Cancel</button>
            <button type="submit" class="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-hover">Save story</button>
          </div>
        </form>
      </div>
    }
    @if (isTaskModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <form (submit)="saveTask($event)" class="flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <div class="shrink-0 border-b border-border bg-sidebar px-6 py-5">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5h6M9 12h6m-6 7h6M5 5h.01M5 12h.01M5 19h.01" />
                  </svg>
                </div>
                <div>
                  <p class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary">{{ taskForm().id ? 'Update task' : 'New task' }}</p>
                  <h3 class="mt-1 text-xl font-extrabold text-text-primary">{{ taskForm().id ? 'Edit implementation task' : 'Add implementation task' }}</h3>
                  <p class="mt-1 text-sm text-text-secondary">Fill the English and Arabic task columns, then set delivery metadata.</p>
                </div>
              </div>
              <button type="button" (click)="isTaskModalOpen.set(false)" aria-label="Close task form" class="rounded-xl border border-border p-2 text-text-secondary hover:bg-background hover:text-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div class="grid gap-5 lg:grid-cols-2">
                <section class="space-y-4 rounded-xl border border-border bg-background/50 p-4">
                  <div class="flex items-center justify-between border-b border-border pb-2">
                    <h4 class="text-sm font-extrabold text-text-primary">English task</h4>
                    <span class="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">EN</span>
                  </div>
                  <label class="block space-y-1.5 text-xs font-bold text-text-secondary">Title EN
                    <input name="taskTitleEn" required [(ngModel)]="taskForm().titleEn" class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20">
                  </label>
                  <label class="block space-y-1.5 text-xs font-bold text-text-secondary">Description EN
                    <textarea name="taskDescriptionEn" rows="3" [(ngModel)]="taskForm().descriptionEn" class="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20"></textarea>
                  </label>
                  <label class="block space-y-1.5 text-xs font-bold text-text-secondary">Technical summary EN
                    <textarea name="technicalSummaryEn" rows="3" [(ngModel)]="taskForm().technicalSummaryEn" class="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20"></textarea>
                  </label>
                  <label class="block space-y-1.5 text-xs font-bold text-text-secondary">{{ label('acceptanceCriteriaEn') }}
                    <textarea name="taskAcceptanceCriteriaEn" rows="3" [(ngModel)]="taskForm().acceptanceCriteriaEn" class="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20"></textarea>
                  </label>
                </section>

                <section class="space-y-4 rounded-xl border border-border bg-background/50 p-4" dir="rtl">
                  <div class="flex items-center justify-between border-b border-border pb-2">
                    <h4 class="text-sm font-extrabold text-text-primary">Arabic task</h4>
                    <span class="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">AR</span>
                  </div>
                  <label class="block space-y-1.5 text-xs font-bold text-text-secondary">Title AR
                    <input name="taskTitleAr" [(ngModel)]="taskForm().titleAr" class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20">
                  </label>
                  <label class="block space-y-1.5 text-xs font-bold text-text-secondary">Description AR
                    <textarea name="taskDescriptionAr" rows="3" [(ngModel)]="taskForm().descriptionAr" class="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20"></textarea>
                  </label>
                  <label class="block space-y-1.5 text-xs font-bold text-text-secondary">Technical summary AR
                    <textarea name="technicalSummaryAr" rows="3" [(ngModel)]="taskForm().technicalSummaryAr" class="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20"></textarea>
                  </label>
                  <label class="block space-y-1.5 text-xs font-bold text-text-secondary">{{ label('acceptanceCriteriaAr') }}
                    <textarea name="taskAcceptanceCriteriaAr" rows="3" [(ngModel)]="taskForm().acceptanceCriteriaAr" class="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20"></textarea>
                  </label>
                </section>
              </div>

              <aside class="space-y-4 rounded-xl border border-border bg-background/60 p-4">
                <div>
                  <h4 class="text-sm font-extrabold text-text-primary">Delivery details</h4>
                  <p class="mt-1 text-xs text-text-secondary">Status, sizing, and planning values.</p>
                </div>
                <label class="block space-y-1.5 text-xs font-bold text-text-secondary">Priority
                  <select name="taskPriority" [(ngModel)]="taskForm().priority" class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20"><option>Low</option><option>Medium</option><option>High</option></select>
                </label>
                <label class="block space-y-1.5 text-xs font-bold text-text-secondary">Effort
                  <select name="effortSize" [(ngModel)]="taskForm().effortSize" class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20"><option>Small</option><option>Medium</option><option>Large</option></select>
                </label>
                <label class="block space-y-1.5 text-xs font-bold text-text-secondary">Type
                  <select name="taskType" [(ngModel)]="taskForm().type" class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20"><option>Technical</option><option>NonTechnical</option></select>
                </label>
                <label class="block space-y-1.5 text-xs font-bold text-text-secondary">Status
                  <select name="taskStatus" [(ngModel)]="taskForm().status" class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20"><option>ToDo</option><option>InProgress</option><option>Review</option><option>Done</option></select>
                </label>
                <label class="block space-y-1.5 text-xs font-bold text-text-secondary">Estimated hours
                  <input type="number" name="estimatedHours" min="0.1" step="0.5" required [(ngModel)]="taskForm().estimatedHours" class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20">
                </label>
              </aside>
            </div>
          </div>

          <div class="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border bg-sidebar px-6 py-4">
            <button type="button" (click)="isTaskModalOpen.set(false)" class="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-text-secondary hover:bg-background hover:text-text-primary">Cancel</button>
            <button type="submit" class="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-hover">Save task</button>
          </div>
        </form>
      </div>
    }

    @if (isSprintPlanningModalOpen()) {
      <app-sprint-planning-modal (close)="onSprintPlanningModalClose()" (sprintConfirmed)="fetchBacklog(projectState.selectedProjectId()!)"></app-sprint-planning-modal>
    }

    @if (isTechStackAdvisorOpen() && projectState.selectedProjectId()) {
      <app-tech-stack-advisor-modal [projectId]="projectState.selectedProjectId()!" (close)="isTechStackAdvisorOpen.set(false)" (completed)="onAdvisorCompleted($event)"></app-tech-stack-advisor-modal>
    }

    <app-project-ai-chat 
        *ngIf="projectState.selectedProjectId()" 
        [projectId]="projectState.selectedProjectId()!" 
        [isOpen]="isChatOpen()" 
        (closeChat)="isChatOpen.set(false)"
        (backlogUpdated)="fetchBacklog(projectState.selectedProjectId()!)">
    </app-project-ai-chat>
  `,
})
export class BacklogViewComponent implements OnInit {
  @Output() navigateToTeam = new EventEmitter<void>();
  private backlogService = inject(BacklogService);
  private aiRequirementsService = inject(AiRequirementsService);
  public projectState = inject(ProjectStateService);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  isLoading = signal(false);
  isAssigned = signal(false);
  backlog = signal<BacklogDto | null>(null);
  isStoryModalOpen = signal(false);
  isTaskModalOpen = signal(false);
  isSprintPlanningModalOpen = signal(false);
  isTechStackAdvisorOpen = signal(false);
  isGeneratingWbs = signal(false);
  isChatOpen = signal(false);
  expandedStoryIds = signal<string[]>([]);
  storyForm = signal<StoryFormModel>({ ...EMPTY_STORY });
  taskForm = signal<TaskFormModel>({ ...EMPTY_TASK });

  private translate = inject(TranslateService);

  currentLang(): 'en' | 'ar' {
    return (this.translate.currentLang() || 'en') as 'en' | 'ar';
  }

  isArabic(): boolean {
    return this.currentLang() === 'ar';
  }

  label(key: string): string {
    const ar: Record<string, string> = {
      projectNameArPlaceholder: '\u0627\u0633\u0645 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0628\u0627\u0644\u0639\u0631\u0628\u064a\u0629',
      backlogSubtitle: '\u0642\u0635\u0635 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u060c \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0645\u062d\u0644\u064a\u0629\u060c \u0645\u0639\u0627\u064a\u064a\u0631 \u0627\u0644\u0642\u0628\u0648\u0644\u060c \u0648\u0645\u0647\u0627\u0645 \u0627\u0644\u062a\u0646\u0641\u064a\u0630.',
      story: '\u0627\u0644\u0642\u0635\u0629',
      task: '\u0627\u0644\u0645\u0647\u0645\u0629',
      tasks: '\u0627\u0644\u0645\u0647\u0627\u0645',
      priority: '\u0627\u0644\u0623\u0648\u0644\u0648\u064a\u0629',
      actions: '\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a',
      status: '\u0627\u0644\u062d\u0627\u0644\u0629',
      type: '\u0627\u0644\u0646\u0648\u0639',
      effort: '\u0627\u0644\u062c\u0647\u062f',
      hours: '\u0627\u0644\u0633\u0627\u0639\u0627\u062a',
      acceptanceCriteriaEn: '\u0645\u0639\u0627\u064a\u064a\u0631 \u0627\u0644\u0642\u0628\u0648\u0644 \u0628\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629',
      acceptanceCriteriaAr: '\u0645\u0639\u0627\u064a\u064a\u0631 \u0627\u0644\u0642\u0628\u0648\u0644 \u0628\u0627\u0644\u0639\u0631\u0628\u064a\u0629',
      notProvided: '\u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631.',
      notProvidedAr: '\u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631.',
      noTasks: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0647\u0627\u0645 \u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u0647\u0630\u0647 \u0627\u0644\u0642\u0635\u0629.',
      noDescription: '\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u0641\u0627\u0635\u064a\u0644 \u062d\u0627\u0644\u064a\u0627.'
    };
    const en: Record<string, string> = {
      projectNameArPlaceholder: 'Project name in Arabic',
      backlogSubtitle: 'User stories, localized details, acceptance criteria, and implementation tasks.',
      story: 'Story',
      task: 'Task',
      tasks: 'Tasks',
      priority: 'Priority',
      actions: 'Actions',
      status: 'Status',
      type: 'Type',
      effort: 'Effort',
      hours: 'Hours',
      acceptanceCriteriaEn: 'Acceptance criteria EN',
      acceptanceCriteriaAr: 'Acceptance criteria AR',
      notProvided: 'Not provided.',
      notProvidedAr: 'Not provided.',
      noTasks: 'No tasks assigned to this user story.',
      noDescription: 'No detail yet.'
    };
    return (this.isArabic() ? ar : en)[key] || key;
  }

  localizedProjectName(): string {
    const data = this.backlog();
    const project = this.projectState.selectedProject();
    return this.isArabic()
      ? (data?.projectNameAr || project?.nameAr || 'Backlog')
      : (data?.projectNameEn || project?.nameEn || 'Backlog');
  }

  storyTitle(story: UserStoryDto): string {
    return this.isArabic() ? (story.titleAr || '') : (story.titleEn || '');
  }

  storyDescription(story: UserStoryDto): string {
    return this.isArabic()
      ? (story.descriptionAr || this.label('noDescription'))
      : (story.descriptionEn || this.label('noDescription'));
  }


  storyAcceptanceCriteria(story: UserStoryDto): string {
    return this.isArabic()
      ? (story.acceptanceCriteriaAr || this.label('notProvidedAr'))
      : (story.acceptanceCriteriaEn || this.label('notProvided'));
  }
  taskTitle(task: TaskItemDto): string {
    return this.isArabic() ? (task.titleAr || '') : (task.titleEn || '');
  }

  taskDescription(task: TaskItemDto): string {
    return this.isArabic()
      ? (task.descriptionAr || task.technicalSummaryAr || this.label('noDescription'))
      : (task.descriptionEn || task.technicalSummaryEn || this.label('noDescription'));
  }
  selectedProjectHasStack = computed(() => {
    const project = this.projectState.selectedProject();
    return !!project?.techStack?.length;
  });

  constructor() {
    effect(() => {
      const projId = this.projectState.selectedProjectId();
      if (projId) {
        this.fetchBacklog(projId);
      } else {
        this.backlog.set(null);
        this.isAssigned.set(false);
      }
    });
  }

  ngOnInit() { }

  async fetchBacklog(projectId: string) {
    this.isLoading.set(true);
    this.isAssigned.set(true);
    try {
      const data = await this.backlogService.getBacklog(projectId);
      this.backlog.set(data);
      const firstStory = data.userStories[0]?.id;
      this.expandedStoryIds.set(firstStory ? [firstStory] : []);
    } catch (e) {
      console.error('Failed to fetch backlog:', e);
      this.backlog.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  onSprintPlanningModalClose() {
    this.isSprintPlanningModalOpen.set(false);
  }

  async generateWbs() {
    const projId = this.projectState.selectedProjectId();
    if (!projId) return;

    if (!this.selectedProjectHasStack()) {
      this.isTechStackAdvisorOpen.set(true);
      return;
    }

    this.isGeneratingWbs.set(true);
    try {
      await this.aiRequirementsService.generateWbs(projId);
      this.toastService.show('AI WBS user stories and task items generated successfully.', 'success');
      await this.fetchBacklog(projId);
    } catch (e: any) {
      if (e.message === 'Network Error' || e.code === 'ECONNABORTED' || e.code === 'ERR_NETWORK' || e.status === 504 || e.status === 0) {
        this.toastService.show('The AI is taking longer than expected. Generation is continuing in the background. Please refresh in a minute.', 'info');
      } else {
        const message = e?.response?.data?.message || e?.response?.data?.error?.message || e?.message || 'Check backend API logs.';
        this.toastService.show(`Failed to generate WBS: ${message}`, 'error');
      }
    } finally {
      this.isGeneratingWbs.set(false);
    }
  }

  async onAdvisorCompleted(projectId: string) {
    this.isTechStackAdvisorOpen.set(false);
    await this.projectState.loadProjects();
    this.projectState.setSelectedProject(projectId);
    await this.fetchBacklog(projectId);
  }

  toggleStory(storyId: string) {
    this.expandedStoryIds.update(ids => ids.includes(storyId) ? ids.filter(id => id !== storyId) : [...ids, storyId]);
  }

  openStoryModal(story?: UserStoryDto) {
    this.storyForm.set(story ? {
      id: story.id,
      titleEn: story.titleEn || '',
      titleAr: story.titleAr || '',
      descriptionEn: story.descriptionEn || '',
      descriptionAr: story.descriptionAr || '',
      acceptanceCriteriaEn: story.acceptanceCriteriaEn || '',
      acceptanceCriteriaAr: story.acceptanceCriteriaAr || '',
      priority: story.priority || 'Medium',
    } : { ...EMPTY_STORY });
    this.isStoryModalOpen.set(true);
  }

  async saveStory(event: Event) {
    event.preventDefault();
    const projId = this.projectState.selectedProjectId();
    if (!projId) return;

    try {
      this.isLoading.set(true);
      const story = this.storyForm();
      if (story.id) {
        await this.backlogService.updateUserStory(story.id, story);
        this.toastService.show('User story updated.', 'success');
      } else {
        const created = await this.backlogService.createUserStory(projId, story);
        this.expandedStoryIds.update(ids => [...ids, created.id]);
        this.toastService.show('User story created.', 'success');
      }
      this.isStoryModalOpen.set(false);
      await this.fetchBacklog(projId);
    } catch (e: any) {
      this.toastService.show(e?.response?.data?.message || 'Failed to save user story.', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteStory(story: UserStoryDto) {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete user story',
      message: `Delete "${story.titleEn}" and all of its tasks?`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      type: 'danger',
    });
    if (!confirmed) return;

    const projId = this.projectState.selectedProjectId();
    if (!projId) return;
    try {
      await this.backlogService.deleteUserStory(story.id);
      this.toastService.show('User story deleted.', 'success');
      await this.fetchBacklog(projId);
    } catch (e: any) {
      this.toastService.show(e?.response?.data?.message || 'Failed to delete user story.', 'error');
    }
  }

  openTaskModal(story: UserStoryDto, task?: TaskItemDto) {
    this.taskForm.set(task ? {
      id: task.id,
      userStoryId: story.id,
      titleEn: task.titleEn || '',
      titleAr: task.titleAr || '',
      descriptionEn: task.descriptionEn || '',
      descriptionAr: task.descriptionAr || '',
      technicalSummaryEn: task.technicalSummaryEn || '',
      technicalSummaryAr: task.technicalSummaryAr || '',
      acceptanceCriteriaEn: task.acceptanceCriteriaEn || '',
      acceptanceCriteriaAr: task.acceptanceCriteriaAr || '',
      estimatedHours: Number(task.estimatedHours || 1),
      effortSize: task.effortSize || 'Medium',
      priority: task.priority || 'Medium',
      type: task.type || 'Technical',
      status: task.status || 'ToDo',
    } : { ...EMPTY_TASK, userStoryId: story.id });
    this.isTaskModalOpen.set(true);
  }

  async saveTask(event: Event) {
    event.preventDefault();
    const projId = this.projectState.selectedProjectId();
    const task = this.taskForm();
    if (!projId || !task.userStoryId) return;

    try {
      this.isLoading.set(true);
      if (task.id) {
        await this.backlogService.updateTask(task.id, task);
        this.toastService.show('Task updated.', 'success');
      } else {
        await this.backlogService.createTask(task.userStoryId, task);
        this.toastService.show('Task created.', 'success');
      }
      this.isTaskModalOpen.set(false);
      await this.fetchBacklog(projId);
      this.expandedStoryIds.update(ids => ids.includes(task.userStoryId!) ? ids : [...ids, task.userStoryId!]);
    } catch (e: any) {
      this.toastService.show(e?.response?.data?.message || 'Failed to save task.', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteTask(task: TaskItemDto) {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete task',
      message: `Delete "${task.titleEn}"?`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      type: 'danger',
    });
    if (!confirmed) return;

    const projId = this.projectState.selectedProjectId();
    if (!projId) return;
    try {
      await this.backlogService.deleteTask(task.id);
      this.toastService.show('Task deleted.', 'success');
      await this.fetchBacklog(projId);
    } catch (e: any) {
      this.toastService.show(e?.response?.data?.message || 'Failed to delete task.', 'error');
    }
  }

  async onCreateProject(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const nameEn = (form.elements.namedItem('projNameEn') as HTMLInputElement).value;
    const nameAr = (form.elements.namedItem('projNameAr') as HTMLInputElement).value;
    const descEn = (form.elements.namedItem('projDescEn') as HTMLTextAreaElement).value;
    const descAr = (form.elements.namedItem('projDescAr') as HTMLTextAreaElement).value;

    const success = await this.projectState.createNewProject(nameEn, nameAr, descEn, descAr);
    if (success) form.reset();
  }
}










