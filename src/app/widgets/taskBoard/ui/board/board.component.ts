import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject, effect, untracked, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import {
  BacklogService,
  TaskItemDto,
  mapPriorityToFrontend,
  mapTypeToFrontend,
  mapStatusToFrontend,
  mapStatusToBackend
} from '../../../../shared/api/backlog.service';
import { apiClient } from '../../../../shared/api/axios.instance';
import { getUserIdFromToken } from '../../../../shared/lib/auth/cookie.helper';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { RetrospectiveModalComponent } from '../../../../pages/dashboardPage/ui/retrospective-modal/retrospective-modal.component';
import { SprintPlanningService } from '../../../../shared/api/sprint-planning.service';
import { AgileCoachChatComponent } from '../agile-coach-chat/agile-coach-chat.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { SprintRiskListComponent } from '../../../sprintRisks';
import { Router, ActivatedRoute } from '@angular/router';
import { AssignmentService } from '../../../../shared/api/assignment.service';
import { TasksService, TaskItemStatus } from '../../../../shared/api/tasks.service';
import { TaskDiscussionComponent } from '../task-discussion/task-discussion.component';
import {
  TaskAssigneePickerComponent,
  TaskAssignmentChangedEvent
} from '../../../../features/task-assignee-picker/task-assignee-picker.component';

interface Task {
  id: string;
  userStoryId: string;
  title: string;
  titleEn?: string;
  titleAr?: string;
  description: string;
  descriptionEn?: string;
  descriptionAr?: string;
  priority: 'Low' | 'Medium' | 'High';
  hours: number;
  actualHours?: number;
  type: 'Feature' | 'Bug' | 'Refactor';
  assigneeId?: string;
  assigneeName?: string;
  isOwnedByCurrentUser: boolean;
  permissions: {
    canDrag: boolean;
    canView: boolean;
    canSummarize: boolean;
    canEdit: boolean;
    canComment: boolean;
    canDownloadAttachments: boolean;
  };
  searchString?: string;
}

type ColumnKey = 'todo' | 'inProgress' | 'review' | 'done';

@Component({
  selector: 'app-board',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DragDropModule, RetrospectiveModalComponent, AgileCoachChatComponent, SprintRiskListComponent, TaskDiscussionComponent, TaskAssigneePickerComponent, TranslatePipe],
  template: `
    <div class="space-y-6">
      
      @if (isLoading()) {
        <!-- Loading indicator -->
        <div class="flex items-center justify-center p-12 bg-surface border border-border rounded-2xl shadow-sm">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            <span class="text-sm font-semibold text-text-secondary">{{ 'BOARD.LOADING_BACKLOG' | translate }}</span>
          </div>
        </div>
      } @else if (projectState.isProjectManager() && projectState.projects().length === 0) {
        <!-- PM First Project Creation Screen on Board -->
        <div class="bg-surface border border-border p-8 rounded-3xl shadow-lg max-w-xl mx-auto my-8 animate-[fadeUp_0.3s_ease_both]">
          <div class="flex items-start gap-4 mb-6">
            <div class="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-lg font-bold border border-primary/20 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-text-primary">{{ 'BOARD.CREATE_PROJECT_TITLE' | translate }}</h3>
              <p class="text-xs text-text-secondary mt-0.5">{{ 'BOARD.CREATE_PROJECT_DESC' | translate }}</p>
            </div>
          </div>

          <form (submit)="onCreateProject($event)" class="space-y-4">
            <div>
              <label class="block text-[11px] font-extrabold text-text-secondary mb-1.5 uppercase tracking-wider">{{ 'BOARD.PROJ_NAME_EN' | translate }}</label>
              <input type="text" name="projNameEn" required [placeholder]="'BOARD.PROJ_NAME_EN_PH' | translate" 
                     class="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold placeholder:text-gray-400/70">
            </div>

            <div>
              <label class="block text-[11px] font-extrabold text-text-secondary mb-1.5 uppercase tracking-wider">{{ 'BOARD.PROJ_NAME_AR' | translate }}</label>
              <input type="text" name="projNameAr" required [placeholder]="'BOARD.PROJ_NAME_AR_PH' | translate" dir="rtl"
                     class="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-right placeholder:text-gray-400/70">
            </div>

            <div>
              <label class="block text-[11px] font-extrabold text-text-secondary mb-1.5 uppercase tracking-wider">{{ 'BOARD.PROJ_DESC_EN' | translate }}</label>
              <textarea name="projDescEn" required rows="3" [placeholder]="'BOARD.PROJ_DESC_EN_PH' | translate"
                        class="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-gray-400/70"></textarea>
            </div>

            <div>
              <label class="block text-[11px] font-extrabold text-text-secondary mb-1.5 uppercase tracking-wider">{{ 'BOARD.PROJ_DESC_AR' | translate }}</label>
              <textarea name="projDescAr" required rows="3" [placeholder]="'BOARD.PROJ_DESC_AR_PH' | translate" dir="rtl"
                        class="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-right placeholder:text-gray-400/70"></textarea>
            </div>

            <button type="submit" 
                    class="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md shadow-primary/10 transition-all duration-200 hover:-translate-y-px active:translate-y-0 mt-2">
              {{ 'BOARD.CREATE_PROJECT_BTN' | translate }}
            </button>
          </form>
        </div>
      } @else if (!isAssignedToProject() || projectState.selectedProject()?.status === 'Archived' || projectState.selectedProject()?.status === 'Completed') {
        <!-- Warning Panel for unassigned employee or archived project -->
        <div class="bg-surface border border-warning/30 p-8 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto my-12 transition-colors duration-200">
          <div class="w-16 h-16 bg-warning/10 text-warning rounded-2xl flex items-center justify-center shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-text-primary">{{ 'BOARD.NO_ACTIVE_PROJECT' | translate }}</h3>
            <p class="text-text-secondary text-sm mt-2 max-w-md">
              {{ 'BOARD.NO_ACTIVE_PROJECT_DESC' | translate }}
            </p>
          </div>
        </div>
      } @else {
        
        <!-- Tabs Navigation -->
        <div class="flex items-center gap-6 border-b border-border mb-6">
          <button (click)="activeTab.set('board')"
                  [class.border-primary]="activeTab() === 'board'" [class.text-primary]="activeTab() === 'board'"
                  [class.border-transparent]="activeTab() !== 'board'" [class.text-text-secondary]="activeTab() !== 'board'"
                  class="pb-3 border-b-2 font-bold text-sm transition-colors hover:text-text-primary">
            {{ 'BOARD.KANBAN_BOARD' | translate }}
          </button>
        </div>

        @if (activeTab() === 'board') {
          <!-- Metrics overview -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2 transition-colors duration-200">
            <div>
              <p class="text-text-secondary text-sm font-medium">{{ 'BOARD.TOTAL_TASKS' | translate }}</p>
              <h3 class="text-text-primary text-2xl font-bold mt-1">{{ totalTasksCount() }}</h3>
            </div>
            <div class="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>

          <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2 transition-colors duration-200">
            <div>
              <p class="text-text-secondary text-sm font-medium">{{ 'BOARD.IN_PROGRESS' | translate }}</p>
              <h3 class="text-text-primary text-2xl font-bold mt-1">{{ inProgress().length }}</h3>
            </div>
            <div class="w-10 h-10 bg-warning/10 text-warning rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2 transition-colors duration-200">
            <div>
              <p class="text-text-secondary text-sm font-medium">{{ 'BOARD.UNDER_REVIEW' | translate }}</p>
              <h3 class="text-text-primary text-2xl font-bold mt-1">{{ review().length }}</h3>
            </div>
            <div class="w-10 h-10 bg-info/10 text-info rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>

          <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2 transition-colors duration-200">
            <div>
              <p class="text-text-secondary text-sm font-medium">{{ 'BOARD.COMPLETED' | translate }}</p>
              <h3 class="text-text-primary text-2xl font-bold mt-1">{{ done().length }}</h3>
            </div>
            <div class="w-10 h-10 bg-success/10 text-success rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Action buttons & Board Title -->
        <div class="flex items-center justify-between flex-wrap gap-4 mt-8">
          <div>
            @if (projectState.isProjectManager()) {
              <div class="flex items-center gap-3 mb-1">
                <button (click)="backToSprints.emit()" class="text-sm font-bold text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {{ 'BOARD.BACK_TO_SPRINTS' | translate }}
                </button>
              </div>
            }
            <h2 class="text-2xl font-bold text-text-primary">{{ projectName() }} {{ 'BOARD.WORKSPACE' | translate }}</h2>
            <p class="text-text-secondary text-sm mt-1">{{ 'BOARD.MANAGE_MONITOR' | translate }}</p>
          </div>
          
          <div class="flex items-center flex-wrap gap-3">
            @if (projectState.isProjectManager() && sprintStatus() === 'Planned') {
              @if (hasUnassignedTasks()) {
                <button (click)="goToAssignment()" 
                        class="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:-translate-y-px active:translate-y-0 text-sm">
                  👥 {{ 'BOARD.ASSIGN_TASKS' | translate }}
                </button>
              } @else {
                <button (click)="goToAssignment()"
                        class="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:-translate-y-px active:translate-y-0 text-sm">
                  👥 {{ currentLang === 'ar' ? 'إعادة التعيين' : 'Reassign Tasks' }}
                </button>
              }
              <button (click)="cancelSprintClicked()" 
                      class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:-translate-y-px active:translate-y-0 text-sm">
                ❌ {{ 'BOARD.CANCEL_SPRINT' | translate }}
              </button>
              <button (click)="startSprint()" 
                      [disabled]="projectState.projectEmployeeCount() === 0 || hasUnassignedTasks()"
                      [title]="projectState.projectEmployeeCount() === 0 ? (currentLang === 'ar' ? 'يجب تعيين موظف واحد على الأقل لهذا المشروع قبل بدء السبرنت' : 'At least one employee must be assigned to this project before starting a sprint') : (hasUnassignedTasks() ? (currentLang === 'ar' ? 'لا يمكن بدء السبرنت. تأكد من تعيين جميع المهام للموظفين أولاً.' : 'Cannot start sprint. Make sure all tasks are assigned to employees first.') : '')"
                      class="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:-translate-y-px active:translate-y-0 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                ▶ {{ 'BOARD.START_SPRINT' | translate }}
              </button>
            }

            @if (projectState.isProjectManager() && sprintStatus() === 'Active') {
              <button (click)="completeSprintBtnClicked()" 
                      class="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:-translate-y-px active:translate-y-0 text-sm">
                {{ 'BOARD.COMPLETE_SPRINT' | translate }}
              </button>
            }
            @if (projectState.isProjectManager() && sprintStatus() === 'Completed') {
              <button (click)="openRetrospectivePage()" 
                      class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:-translate-y-px active:translate-y-0 text-sm">
                📋 {{ 'BOARD.SPRINT_RETRO' | translate }}
              </button>
            }
          </div>
        </div>

        @if (projectState.isProjectManager() && activeSprintId()) {
          <div class="mt-6 mb-6">
            <app-sprint-risk-list [sprintId]="activeSprintId()!"></app-sprint-risk-list>
          </div>
        }

        <!-- Board controls -->
        <div class="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div class="grid grid-cols-1 xl:grid-cols-[minmax(220px,1fr)_auto_auto_auto] gap-3 items-end">
            <label class="block">
              <span class="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">{{ 'BOARD.SEARCH_TASKS' | translate }}</span>
              <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
                <input
                  type="search"
                  [ngModel]="boardSearch()"
                  (ngModelChange)="boardSearch.set($event)"
                  [placeholder]="'BOARD.SEARCH_PLACEHOLDER' | translate"
                  class="w-full h-11 bg-background border border-border rounded-xl pl-9 pr-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
              </div>
            </label>

            <label class="block min-w-40">
              <span class="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">{{ 'BOARD.PRIORITY' | translate }}</span>
              <select
                [ngModel]="priorityFilter()"
                (ngModelChange)="priorityFilter.set($event)"
                class="w-full h-11 bg-background border border-border rounded-xl px-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                <option value="All">{{ 'BOARD.ALL_PRIORITIES' | translate }}</option>
                <option value="High">{{ 'BOARD.HIGH' | translate }}</option>
                <option value="Medium">{{ 'BOARD.MEDIUM' | translate }}</option>
                <option value="Low">{{ 'BOARD.LOW' | translate }}</option>
              </select>
            </label>

            <label class="block min-w-40">
              <span class="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">{{ 'BOARD.TYPE' | translate }}</span>
              <select
                [ngModel]="typeFilter()"
                (ngModelChange)="typeFilter.set($event)"
                class="w-full h-11 bg-background border border-border rounded-xl px-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                <option value="All">{{ 'BOARD.ALL_TYPES' | translate }}</option>
                <option value="Feature">{{ 'BOARD.FEATURE' | translate }}</option>
                <option value="Bug">{{ 'BOARD.BUG' | translate }}</option>
                <option value="Refactor">{{ 'BOARD.REFACTOR' | translate }}</option>
              </select>
            </label>

            <button
              type="button"
              (click)="resetBoardFilters()"
              [disabled]="!hasActiveBoardFilters()"
              class="h-11 px-4 border border-border text-text-secondary hover:text-text-primary hover:bg-background disabled:opacity-45 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all">
              {{ 'BOARD.CLEAR_FILTERS' | translate }}
            </button>
          </div>

          <div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary">
            <span>{{ 'BOARD.SHOWING_TASKS' | translate: { visible: visibleTasksCount(), total: totalTasksCount() } }}</span>
            @if (isBoardReadonly()) {
              <span class="px-2.5 py-1 rounded-full bg-warning/10 text-warning font-semibold">{{ 'BOARD.DRAG_DISABLED' | translate: { status: projectState.selectedProject()?.status } }}</span>
            } @else if (hasActiveBoardFilters()) {
              <span class="px-2.5 py-1 rounded-full bg-warning/10 text-warning font-semibold">{{ 'BOARD.DRAG_PAUSED' | translate }}</span>
            }
          </div>
        </div>
        <!-- Kanban columns -->
        <div cdkDropListGroup class="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-6 pb-4 hide-scrollbar" style="scrollbar-width: thin;">
          
          <!-- TO DO -->
          <div class="flex flex-col bg-sidebar border border-border rounded-2xl p-4 min-h-[500px] min-w-[85vw] md:min-w-[45vw] lg:min-w-0 shrink-0">
            <div class="flex items-center justify-between mb-4 px-1">
              <span class="text-sm font-bold text-text-primary uppercase tracking-wider">{{ 'BOARD.TO_DO' | translate }}</span>
              <span class="px-2 py-0.5 text-xs font-semibold bg-gray-200 dark:bg-border text-text-secondary rounded-full">{{ todo().length }}</span>
            </div>
            
            <div cdkDropList
                 id="todo-list"
                 [cdkDropListData]="todo()"
                 (cdkDropListDropped)="drop($event)"
                 class="flex-1 space-y-3 p-1 rounded-lg">
              @for (task of visibleTodo(); track task.id) {
                <div cdkDrag [cdkDragDisabled]="hasActiveBoardFilters() || isBoardReadonly() || !task.permissions.canDrag" 
                     class="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200" 
                     [class.cursor-grab]="!hasActiveBoardFilters() && !isBoardReadonly() && task.permissions.canDrag" 
                     [class.cursor-default]="hasActiveBoardFilters() || isBoardReadonly() || !task.permissions.canDrag"
                     [class.opacity-75]="!task.permissions.canDrag">
                  <div class="flex items-center justify-between mb-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                          [ngClass]="{
                            'bg-primary/10 text-primary': task.type === 'Feature',
                            'bg-error/10 text-error': task.type === 'Bug',
                            'bg-warning/10 text-warning': task.type === 'Refactor'
                          }">
                      {{ ('BOARD.' + task.type.toUpperCase()) | translate }}
                    </span>
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                          [ngClass]="{
                            'bg-error/10 text-error': task.priority === 'High',
                            'bg-warning/10 text-warning': task.priority === 'Medium',
                            'bg-primary/10 text-primary': task.priority === 'Low'
                          }">
                      {{ ('BOARD.' + task.priority.toUpperCase()) | translate }}
                    </span>
                  </div>
                  @if (task.isOwnedByCurrentUser) {
                    <span class="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-2 px-2 py-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z" />
                        <path d="M19.4 21a8.9 8.9 0 0 0-14.8 0" />
                      </svg>
                      {{ 'BOARD.MY_TASK' | translate }}
                    </span>
                  }
                  <h4 class="font-bold text-text-primary text-[15px] mb-1" [attr.dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">{{ getTaskTitle(task) }}</h4>
                  <p class="text-text-secondary text-xs line-clamp-2 mb-3" [attr.dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">{{ getTaskDescription(task) }}</p>
                  @if (projectState.isProjectManager() && sprintStatus() === 'Planned' && plannedSprintId()) {
                    <div class="mb-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-md bg-background px-2.5 py-2">
                      <span class="shrink-0 text-[10px] font-bold uppercase text-text-secondary">{{ currentLang === 'ar' ? 'المسؤول' : 'Assignee' }}</span>
                      <app-task-assignee-picker
                        class="min-w-0 justify-self-end"
                        [sprintId]="plannedSprintId()!"
                        [taskId]="task.id"
                        [assigneeId]="task.assigneeId"
                        [assigneeName]="task.assigneeName"
                        [language]="currentLang"
                        (assignmentChanged)="onTaskAssignmentChanged(task, $event)" />
                    </div>
                  }
                  <div class="flex items-center justify-between border-t border-border pt-3 mt-3">
                    <span class="text-xs text-text-secondary flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ task.hours }}h
                    </span>
                    <div class="flex items-center gap-3">
                      @if (task.permissions.canSummarize) {
                        <button (click)="openSummarizeChat(task)" class="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          {{ 'BOARD.SUMMARIZE' | translate }}
                        </button>
                      }
                      @if (task.permissions.canView) {
                        <button (click)="openEditModal(task)" class="text-xs text-primary font-semibold hover:underline">
                          {{ projectState.isProjectManager() && !isBoardReadonly() ? ('BOARD.EDIT' | translate) : ('BOARD.VIEW' | translate) }}
                        </button>
                      }
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="h-24 border border-dashed border-border rounded-xl flex items-center justify-center text-xs text-text-secondary">
                  {{ emptyColumnMessage('todo') }}
                </div>
              }
              @if (visibleTodo().length < filteredTodo().length) {
                <button type="button" (click)="showMore('todo')" class="w-full mt-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-primary hover:bg-primary/5 transition-all">
                  {{ 'BOARD.SHOW_MORE' | translate: { count: remainingTasks('todo') } }}
                </button>
              } @else if (todoLimit() > boardPageSize && filteredTodo().length > boardPageSize) {
                <button type="button" (click)="showLess('todo')" class="w-full mt-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-text-secondary hover:text-text-primary transition-all">
                  {{ 'BOARD.SHOW_LESS' | translate }}
                </button>
              }
            </div>
          </div>

          <!-- IN PROGRESS -->
          <div class="flex flex-col bg-sidebar border border-border rounded-2xl p-4 min-h-[500px] min-w-[85vw] md:min-w-[45vw] lg:min-w-0 shrink-0">
            <div class="flex items-center justify-between mb-4 px-1">
              <span class="text-sm font-bold text-text-primary uppercase tracking-wider">{{ 'BOARD.IN_PROGRESS' | translate }}</span>
              <span class="px-2 py-0.5 text-xs font-semibold bg-warning/15 text-warning rounded-full">{{ inProgress().length }}</span>
            </div>

            <div cdkDropList
                 id="in-progress-list"
                 [cdkDropListData]="inProgress()"
                 (cdkDropListDropped)="drop($event)"
                 class="flex-1 space-y-3 p-1 rounded-lg">
              @for (task of visibleInProgress(); track task.id) {
                <div cdkDrag [cdkDragDisabled]="hasActiveBoardFilters() || isBoardReadonly() || !task.permissions.canDrag" class="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200" [class.cursor-grab]="!hasActiveBoardFilters() && !isBoardReadonly() && task.permissions.canDrag" [class.cursor-default]="hasActiveBoardFilters() || isBoardReadonly() || !task.permissions.canDrag" [class.opacity-75]="!task.permissions.canDrag">
                  <div class="flex items-center justify-between mb-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                          [ngClass]="{
                            'bg-primary/10 text-primary': task.type === 'Feature',
                            'bg-error/10 text-error': task.type === 'Bug',
                            'bg-warning/10 text-warning': task.type === 'Refactor'
                          }">
                      {{ ('BOARD.' + task.type.toUpperCase()) | translate }}
                    </span>
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                          [ngClass]="{
                            'bg-error/10 text-error': task.priority === 'High',
                            'bg-warning/10 text-warning': task.priority === 'Medium',
                            'bg-primary/10 text-primary': task.priority === 'Low'
                          }">
                      {{ ('BOARD.' + task.priority.toUpperCase()) | translate }}
                    </span>
                  </div>
                  @if (task.isOwnedByCurrentUser) {
                    <span class="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-2 px-2 py-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z" />
                        <path d="M19.4 21a8.9 8.9 0 0 0-14.8 0" />
                      </svg>
                      {{ 'BOARD.MY_TASK' | translate }}
                    </span>
                  }
                  <h4 class="font-bold text-text-primary text-[15px] mb-1" [attr.dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">{{ getTaskTitle(task) }}</h4>
                  <p class="text-text-secondary text-xs line-clamp-2 mb-3" [attr.dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">{{ getTaskDescription(task) }}</p>
                  <div class="flex items-center justify-between border-t border-border pt-3 mt-3">
                    <span class="text-xs text-text-secondary flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ task.hours }}h
                    </span>
                    <div class="flex items-center gap-3">
                      @if (task.permissions.canSummarize) {
                        <button (click)="openSummarizeChat(task)" class="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          {{ 'BOARD.SUMMARIZE' | translate }}
                        </button>
                      }
                      @if (task.permissions.canView) {
                        <button (click)="openEditModal(task)" class="text-xs text-primary font-semibold hover:underline">
                          {{ projectState.isProjectManager() && !isBoardReadonly() ? ('BOARD.EDIT' | translate) : ('BOARD.VIEW' | translate) }}
                        </button>
                      }
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="h-24 border border-dashed border-border rounded-xl flex items-center justify-center text-xs text-text-secondary">
                  {{ emptyColumnMessage('inProgress') }}
                </div>
              }
              @if (visibleInProgress().length < filteredInProgress().length) {
                <button type="button" (click)="showMore('inProgress')" class="w-full mt-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-primary hover:bg-primary/5 transition-all">
                  {{ 'BOARD.SHOW_MORE' | translate: { count: remainingTasks('inProgress') } }}
                </button>
              } @else if (inProgressLimit() > boardPageSize && filteredInProgress().length > boardPageSize) {
                <button type="button" (click)="showLess('inProgress')" class="w-full mt-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-text-secondary hover:text-text-primary transition-all">
                  {{ 'BOARD.SHOW_LESS' | translate }}
                </button>
              }
            </div>
          </div>

          <!-- UNDER REVIEW -->
          <div class="flex flex-col bg-sidebar border border-border rounded-2xl p-4 min-h-[500px] min-w-[85vw] md:min-w-[45vw] lg:min-w-0 shrink-0">
            <div class="flex items-center justify-between mb-4 px-1">
              <span class="text-sm font-bold text-text-primary uppercase tracking-wider">{{ 'BOARD.REVIEW' | translate }}</span>
              <span class="px-2 py-0.5 text-xs font-semibold bg-info/15 text-info rounded-full">{{ review().length }}</span>
            </div>

            <div cdkDropList
                 id="review-list"
                 [cdkDropListData]="review()"
                 (cdkDropListDropped)="drop($event)"
                 class="flex-1 space-y-3 p-1 rounded-lg">
              @for (task of visibleReview(); track task.id) {
                <div cdkDrag [cdkDragDisabled]="hasActiveBoardFilters() || isBoardReadonly() || !task.permissions.canDrag" class="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200" [class.cursor-grab]="!hasActiveBoardFilters() && !isBoardReadonly() && task.permissions.canDrag" [class.cursor-default]="hasActiveBoardFilters() || isBoardReadonly() || !task.permissions.canDrag" [class.opacity-75]="!task.permissions.canDrag">
                  <div class="flex items-center justify-between mb-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                          [ngClass]="{
                            'bg-primary/10 text-primary': task.type === 'Feature',
                            'bg-error/10 text-error': task.type === 'Bug',
                            'bg-warning/10 text-warning': task.type === 'Refactor'
                          }">
                      {{ ('BOARD.' + task.type.toUpperCase()) | translate }}
                    </span>
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                          [ngClass]="{
                            'bg-error/10 text-error': task.priority === 'High',
                            'bg-warning/10 text-warning': task.priority === 'Medium',
                            'bg-primary/10 text-primary': task.priority === 'Low'
                          }">
                      {{ ('BOARD.' + task.priority.toUpperCase()) | translate }}
                    </span>
                  </div>
                  @if (task.isOwnedByCurrentUser) {
                    <span class="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-2 px-2 py-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z" />
                        <path d="M19.4 21a8.9 8.9 0 0 0-14.8 0" />
                      </svg>
                      {{ 'BOARD.MY_TASK' | translate }}
                    </span>
                  }
                  <h4 class="font-bold text-text-primary text-[15px] mb-1" [attr.dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">{{ getTaskTitle(task) }}</h4>
                  <p class="text-text-secondary text-xs line-clamp-2 mb-3" [attr.dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">{{ getTaskDescription(task) }}</p>
                  <div class="flex items-center justify-between border-t border-border pt-3 mt-3">
                    <span class="text-xs text-text-secondary flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ task.hours }}h
                    </span>
                    <div class="flex items-center gap-3">
                      @if (task.permissions.canSummarize) {
                        <button (click)="openSummarizeChat(task)" class="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          {{ 'BOARD.SUMMARIZE' | translate }}
                        </button>
                      }
                      @if (task.permissions.canView) {
                        <button (click)="openEditModal(task)" class="text-xs text-primary font-semibold hover:underline">
                          {{ projectState.isProjectManager() && !isBoardReadonly() ? ('BOARD.EDIT' | translate) : ('BOARD.VIEW' | translate) }}
                        </button>
                      }
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="h-24 border border-dashed border-border rounded-xl flex items-center justify-center text-xs text-text-secondary">
                  {{ emptyColumnMessage('review') }}
                </div>
              }
              @if (visibleReview().length < filteredReview().length) {
                <button type="button" (click)="showMore('review')" class="w-full mt-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-primary hover:bg-primary/5 transition-all">
                  {{ 'BOARD.SHOW_MORE' | translate: { count: remainingTasks('review') } }}
                </button>
              } @else if (reviewLimit() > boardPageSize && filteredReview().length > boardPageSize) {
                <button type="button" (click)="showLess('review')" class="w-full mt-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-text-secondary hover:text-text-primary transition-all">
                  {{ 'BOARD.SHOW_LESS' | translate }}
                </button>
              }
            </div>
          </div>

          <!-- DONE -->
          <div class="flex flex-col bg-sidebar border border-border rounded-2xl p-4 min-h-[500px] min-w-[85vw] md:min-w-[45vw] lg:min-w-0 shrink-0">
            <div class="flex items-center justify-between mb-4 px-1">
              <span class="text-sm font-bold text-text-primary uppercase tracking-wider">{{ 'BOARD.DONE' | translate }}</span>
              <span class="px-2 py-0.5 text-xs font-semibold bg-success/15 text-success rounded-full">{{ done().length }}</span>
            </div>

            <div cdkDropList
                 id="done-list"
                 [cdkDropListData]="done()"
                 (cdkDropListDropped)="drop($event)"
                 class="flex-1 space-y-3 p-1 rounded-lg">
              @for (task of visibleDone(); track task.id) {
                <div cdkDrag [cdkDragDisabled]="hasActiveBoardFilters() || isBoardReadonly() || !task.permissions.canDrag" class="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200" [class.cursor-grab]="!hasActiveBoardFilters() && !isBoardReadonly() && task.permissions.canDrag" [class.cursor-default]="hasActiveBoardFilters() || isBoardReadonly() || !task.permissions.canDrag" [class.opacity-75]="!task.permissions.canDrag">
                  <div class="flex items-center justify-between mb-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                          [ngClass]="{
                            'bg-primary/10 text-primary': task.type === 'Feature',
                            'bg-error/10 text-error': task.type === 'Bug',
                            'bg-warning/10 text-warning': task.type === 'Refactor'
                          }">
                      {{ ('BOARD.' + task.type.toUpperCase()) | translate }}
                    </span>
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                          [ngClass]="{
                            'bg-error/10 text-error': task.priority === 'High',
                            'bg-warning/10 text-warning': task.priority === 'Medium',
                            'bg-primary/10 text-primary': task.priority === 'Low'
                          }">
                      {{ ('BOARD.' + task.priority.toUpperCase()) | translate }}
                    </span>
                  </div>
                  @if (task.isOwnedByCurrentUser) {
                    <span class="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-2 px-2 py-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z" />
                        <path d="M19.4 21a8.9 8.9 0 0 0-14.8 0" />
                      </svg>
                      {{ 'BOARD.MY_TASK' | translate }}
                    </span>
                  }
                  <h4 class="font-bold text-text-primary text-[15px] mb-1 line-through opacity-75" [attr.dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">{{ getTaskTitle(task) }}</h4>
                  <p class="text-text-secondary text-xs line-clamp-2 mb-3 opacity-75" [attr.dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">{{ getTaskDescription(task) }}</p>
                  <div class="flex items-center justify-between border-t border-border pt-3 mt-3">
                    <span class="text-xs text-text-secondary flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ task.hours }}h
                    </span>
                    <div class="flex items-center gap-3">
                      @if (task.permissions.canSummarize) {
                        <button (click)="openSummarizeChat(task)" class="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          {{ 'BOARD.SUMMARIZE' | translate }}
                        </button>
                      }
                      @if (task.permissions.canView) {
                        <button (click)="openEditModal(task)" class="text-xs text-primary font-semibold hover:underline">
                          {{ projectState.isProjectManager() && !isBoardReadonly() ? ('BOARD.EDIT' | translate) : ('BOARD.VIEW' | translate) }}
                        </button>
                      }
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="h-24 border border-dashed border-border rounded-xl flex items-center justify-center text-xs text-text-secondary">
                  {{ emptyColumnMessage('done') }}
                </div>
              }
              @if (visibleDone().length < filteredDone().length) {
                <button type="button" (click)="showMore('done')" class="w-full mt-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-primary hover:bg-primary/5 transition-all">
                  {{ 'BOARD.SHOW_MORE' | translate: { count: remainingTasks('done') } }}
                </button>
              } @else if (doneLimit() > boardPageSize && filteredDone().length > boardPageSize) {
                <button type="button" (click)="showLess('done')" class="w-full mt-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-text-secondary hover:text-text-primary transition-all">
                  {{ 'BOARD.SHOW_LESS' | translate }}
                </button>
              }
            </div>
          </div>
        </div>
        }
      }
    
    </div>

    <!-- Edit/Add Task Modal Overlay -->
    @if (showModal()) {
      <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-surface border border-border w-full rounded-2xl shadow-2xl flex flex-col transition-all duration-300"
             [ngClass]="isEditing() ? 'max-w-6xl max-h-[90vh]' : 'max-w-md'">
          
          <!-- Modal Header -->
          <div class="flex items-center justify-between p-6 pb-4 border-b border-border shrink-0 bg-background rounded-t-2xl">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-black text-text-primary tracking-tight">
                  {{ isEditing() ? (currentLang === 'ar' ? 'تفاصيل المهمة' : 'Task Details') : (currentLang === 'ar' ? 'إنشاء مهمة جديدة' : 'Create New Task') }}
                </h3>
                <p class="text-[11px] font-bold text-text-secondary uppercase tracking-wider mt-0.5">
                  {{ isEditing() ? (currentLang === 'ar' ? 'إدارة معلومات المهمة والنقاش' : 'Manage task info and chat') : (currentLang === 'ar' ? 'أضف إلى المهام المتراكمة' : 'Add to your backlog') }}
                </p>
              </div>
            </div>
            <button (click)="closeModal()" class="w-9 h-9 flex items-center justify-center rounded-xl text-text-secondary hover:bg-surface hover:text-text-primary transition-colors border border-border shadow-sm hover:shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Modal Body (Grid for Trello-like layout) -->
          <div class="p-6 overflow-y-auto flex-1 scrollbar-thin">
            <div class="grid grid-cols-1 gap-8 h-full" [ngClass]="(isEditing() || modalTask().id) ? 'lg:grid-cols-[1fr_1fr]' : ''">
              
              <!-- LEFT COLUMN: Main Task Info & Form -->
              <div class="space-y-6 flex flex-col">
                @if (projectState.isProjectManager() && !isBoardReadonly()) {
                  <div>
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">{{ currentLang === 'ar' ? 'عنوان المهمة' : 'Task Title' }}</label>
                    <input type="text" [(ngModel)]="modalTask().title" 
                           [placeholder]="currentLang === 'ar' ? 'ما الذي يجب القيام به؟' : 'What needs to be done?'"
                           class="w-full px-4 py-3.5 border border-border bg-surface text-text-primary rounded-xl outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all duration-200 font-extrabold text-[15px] shadow-sm placeholder:text-text-secondary/50" />
                  </div>

                  <div>
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">{{ currentLang === 'ar' ? 'الوصف' : 'Description' }}</label>
                    <textarea [(ngModel)]="modalTask().description" rows="5"
                              [placeholder]="currentLang === 'ar' ? 'قدم المزيد من السياق...' : 'Provide more context...'"
                              class="w-full px-4 py-3.5 border border-border bg-surface text-text-primary rounded-xl outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all duration-200 resize-none font-medium text-[13px] shadow-sm leading-relaxed placeholder:text-text-secondary/50"></textarea>
                  </div>

                  <div class="grid grid-cols-2 gap-5 relative">
                    <div class="relative">
                      <label class="block text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">{{ currentLang === 'ar' ? 'الأولوية' : 'Priority' }}</label>
                      <button type="button" (click)="togglePrioritySelect()"
                              class="w-full flex items-center justify-between px-4 py-3 border border-border bg-background hover:bg-surface text-text-primary rounded-xl transition-all duration-200 font-bold text-[13px] shadow-sm">
                        <div class="flex items-center gap-2">
                          <span class="w-2.5 h-2.5 rounded-full" 
                                [ngClass]="{'bg-error': modalTask().priority === 'High', 'bg-amber-500': modalTask().priority === 'Medium', 'bg-emerald-500': modalTask().priority === 'Low'}"></span>
                          {{ currentLang === 'ar' ? (modalTask().priority === 'High' ? 'عالية' : modalTask().priority === 'Medium' ? 'متوسطة' : 'منخفضة') : modalTask().priority }}
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-text-secondary transition-transform" [ngClass]="{'rotate-180': isPrioritySelectOpen()}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      @if (isPrioritySelectOpen()) {
                        <div class="absolute z-50 w-full mt-2 bg-surface border border-border rounded-xl shadow-xl py-1 overflow-hidden animate-[fadeUp_0.2s_ease_out]">
                          @for (p of ['High', 'Medium', 'Low']; track p) {
                            <button type="button" (click)="selectPriority(p)" 
                                    class="w-full px-4 py-2.5 flex items-center justify-between hover:bg-background transition-colors text-left font-bold text-[13px]">
                              <div class="flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full" 
                                      [ngClass]="{'bg-error': p === 'High', 'bg-amber-500': p === 'Medium', 'bg-emerald-500': p === 'Low'}"></span>
                                {{ currentLang === 'ar' ? (p === 'High' ? 'عالية' : p === 'Medium' ? 'متوسطة' : 'منخفضة') : p }}
                              </div>
                              @if (modalTask().priority === p) {
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              }
                            </button>
                          }
                        </div>
                      }
                    </div>

                    <div class="relative">
                      <label class="block text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">{{ currentLang === 'ar' ? 'النوع' : 'Type' }}</label>
                      <button type="button" (click)="toggleTypeSelect()"
                              class="w-full flex items-center justify-between px-4 py-3 border border-border bg-background hover:bg-surface text-text-primary rounded-xl transition-all duration-200 font-bold text-[13px] shadow-sm">
                        <div class="flex items-center gap-2">
                          <span class="text-lg leading-none" [ngSwitch]="modalTask().type">
                            <ng-container *ngSwitchCase="'Feature'">✨</ng-container>
                            <ng-container *ngSwitchCase="'Bug'">🐛</ng-container>
                            <ng-container *ngSwitchCase="'Refactor'">♻️</ng-container>
                          </span>
                          {{ currentLang === 'ar' ? (modalTask().type === 'Feature' ? 'ميزة' : modalTask().type === 'Bug' ? 'مشكلة' : 'تحسين') : modalTask().type }}
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-text-secondary transition-transform" [ngClass]="{'rotate-180': isTypeSelectOpen()}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      @if (isTypeSelectOpen()) {
                        <div class="absolute z-50 w-full mt-2 bg-surface border border-border rounded-xl shadow-xl py-1 overflow-hidden animate-[fadeUp_0.2s_ease_out]">
                          @for (t of ['Feature', 'Bug', 'Refactor']; track t) {
                            <button type="button" (click)="selectType(t)" 
                                    class="w-full px-4 py-2.5 flex items-center justify-between hover:bg-background transition-colors text-left font-bold text-[13px]">
                              <div class="flex items-center gap-2">
                                <span class="text-lg leading-none" [ngSwitch]="t">
                                  <ng-container *ngSwitchCase="'Feature'">✨</ng-container>
                                  <ng-container *ngSwitchCase="'Bug'">🐛</ng-container>
                                  <ng-container *ngSwitchCase="'Refactor'">♻️</ng-container>
                                </span>
                                {{ currentLang === 'ar' ? (t === 'Feature' ? 'ميزة' : t === 'Bug' ? 'مشكلة' : 'تحسين') : t }}
                              </div>
                              @if (modalTask().type === t) {
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              }
                            </button>
                          }
                        </div>
                      }
                    </div>
                  </div>

                  <div>
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">{{ currentLang === 'ar' ? 'التقدير' : 'Estimation' }}</label>
                    <div class="relative">
                      <div class="absolute top-1/2 -translate-y-1/2 text-text-secondary" [ngClass]="currentLang === 'ar' ? 'right-4' : 'left-4'">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <input type="number" [(ngModel)]="modalTask().hours" 
                             class="w-full py-3 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 font-bold text-[13px] shadow-sm"
                             [ngClass]="currentLang === 'ar' ? 'pr-10 pl-16' : 'pl-10 pr-16'" />
                      <span class="absolute top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary uppercase"
                            [ngClass]="currentLang === 'ar' ? 'left-4' : 'right-4'">{{ currentLang === 'ar' ? 'ساعات' : 'hrs' }}</span>
                    </div>
                  </div>

                  <div>
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">{{ currentLang === 'ar' ? 'الموظف المعين' : 'Assigned Employee' }}</label>
                    @if (sprintStatus() === 'Planned' && plannedSprintId() && modalTask().id) {
                      <div class="rounded-xl border border-border bg-surface px-4 py-3.5 shadow-sm">
                        <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                          <div class="min-w-0">
                            <p class="truncate text-[13px] font-bold text-text-primary">
                              {{ modalTask().assigneeName || (currentLang === 'ar' ? 'غير معين' : 'Unassigned') }}
                            </p>
                            <p class="text-[10px] text-text-secondary">
                              {{ currentLang === 'ar' ? 'يمكن تغييره طالما السبرنت لم يبدأ' : 'Can be changed while the sprint is planned' }}
                            </p>
                          </div>
                          <app-task-assignee-picker
                            class="min-w-0 max-w-[13rem]"
                            [sprintId]="plannedSprintId()!"
                            [taskId]="modalTask().id"
                            [assigneeId]="modalTask().assigneeId"
                            [assigneeName]="modalTask().assigneeName"
                            [language]="currentLang"
                            panelPlacement="above"
                            (assignmentChanged)="onTaskAssignmentChanged(modalTask(), $event)" />
                        </div>
                      </div>
                    } @else {
                      <div [ngClass]="modalTask().assigneeId ? 'border-border bg-surface' : 'border-dashed border-gray-300 bg-gray-50/50'"
                           class="px-4 py-3.5 border text-text-primary rounded-xl flex min-w-0 items-center gap-3 shadow-sm transition-all duration-200">

                        @if (modalTask().assigneeId) {
                          <div class="w-8 h-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                            {{ modalTask().assigneeName!.charAt(0) }}
                          </div>
                          <div class="flex min-w-0 flex-col">
                            <span class="truncate font-bold text-[13px]">{{ modalTask().assigneeName }}</span>
                            <span class="text-[10px] text-text-secondary">{{ currentLang === 'ar' ? 'تم التعيين' : 'Assigned' }}</span>
                          </div>
                        } @else {
                          <div class="w-8 h-8 shrink-0 rounded-full bg-gray-100/80 text-gray-400 flex items-center justify-center border border-dashed border-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div class="flex min-w-0 flex-col">
                            <span class="truncate font-bold text-[13px] text-gray-500">{{ currentLang === 'ar' ? 'غير معين' : 'Unassigned' }}</span>
                            <span class="text-[10px] text-gray-400">{{ currentLang === 'ar' ? 'في انتظار التعيين' : 'Awaiting assignment' }}</span>
                          </div>
                        }
                      </div>
                    }
                  </div>
                } @else {
                  <div class="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div class="p-6 space-y-4">
                      <h4 class="text-2xl font-black text-text-primary leading-tight tracking-tight">{{ modalTask().title }}</h4>
                      <p class="text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap font-medium bg-background border border-border/50 rounded-xl p-4">{{ modalTask().description || (currentLang === 'ar' ? 'لم يتم تقديم وصف.' : 'No description provided.') }}</p>
                    </div>
                    <div class="grid grid-cols-4 divide-x divide-border border-t border-border bg-background text-center">
                      <div class="p-4 hover:bg-surface transition-colors cursor-default">
                        <span class="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">{{ currentLang === 'ar' ? 'النوع' : 'Type' }}</span>
                        <span class="text-text-primary font-extrabold text-sm flex items-center justify-center gap-1.5">
                          <span class="text-lg leading-none" [ngSwitch]="modalTask().type">
                            <ng-container *ngSwitchCase="'Feature'">✨</ng-container>
                            <ng-container *ngSwitchCase="'Bug'">🐛</ng-container>
                            <ng-container *ngSwitchCase="'Refactor'">♻️</ng-container>
                          </span>
                          {{ currentLang === 'ar' ? (modalTask().type === 'Feature' ? 'ميزة' : modalTask().type === 'Bug' ? 'مشكلة' : 'تحسين') : modalTask().type }}
                        </span>
                      </div>
                      <div class="p-4 hover:bg-surface transition-colors cursor-default">
                        <span class="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">{{ currentLang === 'ar' ? 'الأولوية' : 'Priority' }}</span>
                        <span class="text-text-primary font-extrabold text-sm flex items-center justify-center gap-1.5">
                          <span class="w-2.5 h-2.5 rounded-full" 
                                [ngClass]="{'bg-error': modalTask().priority === 'High', 'bg-amber-500': modalTask().priority === 'Medium', 'bg-emerald-500': modalTask().priority === 'Low'}"></span>
                          {{ currentLang === 'ar' ? (modalTask().priority === 'High' ? 'عالية' : modalTask().priority === 'Medium' ? 'متوسطة' : 'منخفضة') : modalTask().priority }}
                        </span>
                      </div>
                      <div class="p-4 hover:bg-surface transition-colors cursor-default">
                        <span class="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">{{ currentLang === 'ar' ? 'المقدرة' : 'Estimated' }}</span>
                        <span class="text-text-primary font-extrabold text-sm flex items-center justify-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {{ modalTask().hours }}{{ currentLang === 'ar' ? 'س' : 'h' }}
                        </span>
                      </div>
                      <div class="p-4 hover:bg-surface transition-colors cursor-default">
                        <span class="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">{{ currentLang === 'ar' ? 'الفعلية' : 'Actual' }}</span>
                        <span class="text-text-primary font-extrabold text-sm flex items-center justify-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {{ modalTask().actualHours || 0 }}{{ currentLang === 'ar' ? 'س' : 'h' }}
                        </span>
                      </div>
                    </div>
                  </div>

                }

                <div class="flex-1"></div> <!-- Spacer -->

                <!-- Buttons inside left column if it's editing -->
                @if (isEditing()) {
                  @if (!inlineAction()) {
                    <div class="pt-6 border-t border-border mt-6">
                      <!-- PM Actions for Review and Done columns -->
                      @if (projectState.isProjectManager() && !isBoardReadonly()) {
                        @if (originalColumn === 'review') {
                          <div class="flex items-center gap-3 w-full pb-5 mb-5 border-b border-border border-dashed">
                            <button (click)="pmAcceptReview(modalTask()); closeModal()" class="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-px">
                              {{ currentLang === 'ar' ? 'قبول (مكتملة)' : 'Accept (Done)' }}
                            </button>
                            <button (click)="inlineAction.set('reject')" class="flex-1 py-3 bg-error hover:bg-error/90 text-white text-sm font-bold rounded-xl shadow-md shadow-error/20 transition-all hover:-translate-y-px">
                              {{ currentLang === 'ar' ? 'رفض (قيد التنفيذ)' : 'Reject (In Progress)' }}
                            </button>
                          </div>
                        } @else if (originalColumn === 'done') {
                          @if (sprintStatus() !== 'Completed') {
                            <div class="flex items-center gap-3 w-full pb-5 mb-5 border-b border-border border-dashed">
                              <button (click)="inlineAction.set('reopen')" class="w-full py-3 bg-warning hover:bg-warning/90 text-white text-sm font-bold rounded-xl shadow-md shadow-warning/20 transition-all hover:-translate-y-px">
                                {{ currentLang === 'ar' ? 'إعادة فتح (قيد التنفيذ)' : 'Reopen (In Progress)' }}
                              </button>
                            </div>
                          }
                        }
                      }
                      
                      <div class="flex items-center space-x-3">
                        @if (projectState.isProjectManager() && !isBoardReadonly()) {
                          <button (click)="deleteTask()" class="px-5 py-3 text-error hover:bg-error/10 font-bold rounded-xl transition-colors">
                            {{ currentLang === 'ar' ? 'حذف المهمة' : 'Delete Task' }}
                          </button>
                        }
                        <div class="flex-1"></div>
                        <button (click)="closeModal()" class="px-5 py-3 border border-border text-text-secondary hover:text-text-primary hover:bg-surface font-bold rounded-xl transition-colors">
                          {{ currentLang === 'ar' ? 'إلغاء' : 'Cancel' }}
                        </button>
                        @if (projectState.isProjectManager() && !isBoardReadonly()) {
                          <button (click)="saveTask()" class="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md shadow-primary/20 transition-all hover:-translate-y-px">
                            {{ currentLang === 'ar' ? 'حفظ التغييرات' : 'Save Changes' }}
                          </button>
                        }
                      </div>
                    </div>
                  } @else {
                    <div class="flex flex-col gap-4 p-5 rounded-xl border border-border bg-surface mt-6 animate-[fadeIn_0.2s_ease_both]">
                      <div class="flex items-center justify-between">
                        <h4 class="font-bold text-text-primary text-sm">{{ inlineAction() === 'reject' ? (currentLang === 'ar' ? 'رفض المهمة' : 'Reject Task') : (currentLang === 'ar' ? 'إعادة فتح المهمة' : 'Reopen Task') }}</h4>
                        <button (click)="inlineAction.set(null)" class="text-text-secondary hover:text-text-primary p-1.5 rounded-lg hover:bg-background transition-colors">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                      <div class="space-y-3">
                        <textarea [(ngModel)]="inlineReasonEn" rows="2" placeholder="{{ currentLang === 'ar' ? 'السبب (بالإنجليزية)' : 'Reason (English)' }}" class="w-full px-4 py-2.5 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm resize-none"></textarea>
                        <textarea [(ngModel)]="inlineReasonAr" rows="2" dir="rtl" placeholder="{{ currentLang === 'ar' ? 'السبب (بالعربية)' : 'Reason (Arabic)' }}" class="w-full px-4 py-2.5 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm resize-none"></textarea>
                      </div>
                      <div class="flex justify-end gap-3 mt-1">
                        <button (click)="inlineAction.set(null)" class="px-5 py-2.5 text-sm text-text-secondary font-bold hover:text-text-primary transition-colors">{{ currentLang === 'ar' ? 'إلغاء' : 'Cancel' }}</button>
                        <button (click)="confirmInlineAction()" [disabled]="!inlineReasonEn && !inlineReasonAr" class="px-6 py-2.5 text-sm text-white font-bold rounded-xl shadow-md transition-all hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0" [ngClass]="inlineAction() === 'reject' ? 'bg-error hover:bg-error/90 shadow-error/20' : 'bg-warning hover:bg-warning/90 shadow-warning/20'">
                          {{ currentLang === 'ar' ? 'تأكيد' : 'Confirm' }}
                        </button>
                      </div>
                    </div>
                  }
                }
              </div>

              <!-- RIGHT COLUMN: Discussion -->
              @if (isEditing() || modalTask().id) {
                <div class="flex flex-col h-full border-border lg:border-l lg:pl-8 space-y-6 lg:pt-0 pt-6 border-t lg:border-t-0">
                  <!-- Task Discussion Component -->
                  <div class="flex-1 min-h-[400px] flex flex-col bg-background rounded-2xl border border-border shadow-inner overflow-hidden">
                    <app-task-discussion [taskId]="modalTask().id" [isReadonly]="isBoardReadonly()" class="flex-1" />
                  </div>
                </div>
              }
            </div>
          </div>
          
          <!-- Bottom Buttons (For Add Mode) -->
          @if (!isEditing()) {
            <div class="p-6 border-t border-border flex items-center justify-end space-x-3 bg-surface rounded-b-2xl shrink-0">
              <button (click)="closeModal()" class="px-5 py-3 border border-border text-text-secondary hover:text-text-primary hover:bg-background font-bold rounded-xl transition-colors">
                {{ currentLang === 'ar' ? 'إلغاء' : 'Cancel' }}
              </button>
              <button (click)="saveTask()" class="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md shadow-primary/20 transition-all hover:-translate-y-px">
                {{ currentLang === 'ar' ? 'إنشاء المهمة' : 'Create Task' }}
              </button>
            </div>
          }
        </div>
      </div>
    }



    @if (isRetroModalOpen() && (activeSprintId() || completedSprintId())) {
      <app-retrospective-modal [projectId]="projectState.selectedProjectId()" [sprintId]="(activeSprintId() || completedSprintId())!" (close)="isRetroModalOpen.set(false)"></app-retrospective-modal>
    }

    <!-- Summarize Chat Modal -->
    @if (chatTask()) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-end p-4 sm:p-6 animate-fade-in"
           (click)="closeSummarizeChat()">
        <div class="w-full max-w-md h-[82vh] flex flex-col" (click)="$event.stopPropagation()">
          <app-agile-coach-chat
            [taskItemId]="chatTask()!.id"
            [taskTitle]="chatTask()!.title"
            [lang]="currentLang"
            [isOpen]="true"
            [loadInitialSummary]="true"
            (closed)="closeSummarizeChat()"
            class="h-full"
          />
        </div>
      </div>
    }

    <!-- ─── COMPLETE SPRINT MODAL ─── -->
    @if (showCompleteSprintModal()) {
      <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]">
        <div class="bg-surface border border-border rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-[scaleUp_0.25s_ease_both]" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
          <!-- Header -->
          <div class="px-6 py-5 border-b border-border bg-sidebar/50 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-bold text-text-primary tracking-wide">{{ currentLang === 'ar' ? 'إنهاء السبرنت' : 'Complete Sprint' }}</h2>
                <p class="text-[11px] text-text-secondary uppercase tracking-wider font-semibold">{{ currentLang === 'ar' ? 'تأكيد المهام المتبقية' : 'Confirm remaining tasks' }}</p>
              </div>
            </div>
            <button (click)="showCompleteSprintModal.set(false)" class="p-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-xl transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div class="p-6 space-y-6 overflow-y-auto">
            <!-- Unfinished Tasks Info -->
            <div class="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
              <h3 class="text-sm font-bold text-amber-600 mb-2 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {{ currentLang === 'ar' ? 'مهام سيتم نقلها للباك لوج' : 'Tasks moving to Backlog' }}
              </h3>
              <ul class="text-xs text-text-secondary space-y-1.5 list-disc list-inside marker:text-amber-500/50">
                @if (todo().length > 0) {
                  <li><strong class="text-text-primary">{{ todo().length }}</strong> {{ currentLang === 'ar' ? 'مهام (ToDo) ستعود للباك لوج' : 'tasks (ToDo) will move to Backlog' }}</li>
                }
                @if (inProgress().length > 0) {
                  <li><strong class="text-text-primary">{{ inProgress().length }}</strong> {{ currentLang === 'ar' ? 'مهام (In Progress) ستعود للباك لوج (سيتم إزالة تعيينها)' : 'tasks (In Progress) will move to Backlog (assignments cleared)' }}</li>
                }
                @if (todo().length === 0 && inProgress().length === 0) {
                  <li>{{ currentLang === 'ar' ? 'لا يوجد مهام غير مكتملة' : 'No unfinished tasks' }}</li>
                }
              </ul>
            </div>

            <!-- Review Action Required -->
            @if (review().length > 0) {
              <div class="space-y-4">
                <div>
                  <h3 class="text-sm font-bold text-text-primary">{{ currentLang === 'ar' ? 'مهام تحتاج قرارك (المراجعة)' : 'Tasks in Review - Action Required' }}</h3>
                  <p class="text-xs text-text-secondary mt-1">{{ review().length }} {{ currentLang === 'ar' ? 'مهام بانتظار قرارك كمراجع. ماذا تود أن تفعل بها؟' : 'tasks are waiting for your review. What would you like to do with them?' }}</p>
                </div>
                
                <div class="grid sm:grid-cols-2 gap-3">
                  <!-- Accept All -->
                  <button (click)="completeSprintFromBoard('AcceptAll')" class="group p-4 rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-left transition-all active:scale-[0.98]">
                    <div class="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div class="font-bold text-emerald-700 text-sm mb-1">{{ currentLang === 'ar' ? 'قبول الجميع' : 'Accept All' }}</div>
                    <div class="text-[11px] text-emerald-600/80">{{ currentLang === 'ar' ? 'تحويل لـ Done' : 'Mark as Done' }}</div>
                  </button>

                  <!-- Reject All -->
                  <button (click)="completeSprintFromBoard('SendToBacklog')" class="group p-4 rounded-2xl border-2 border-error/20 bg-error/5 hover:border-error/40 hover:bg-error/10 text-left transition-all active:scale-[0.98]">
                    <div class="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    </div>
                    <div class="font-bold text-error text-sm mb-1">{{ currentLang === 'ar' ? 'رفض الجميع' : 'Reject All' }}</div>
                    <div class="text-[11px] text-error/80">{{ currentLang === 'ar' ? 'إرسال للباك لوج' : 'Send to Backlog' }}</div>
                  </button>
                </div>
              </div>
            }
          </div>

          <div class="p-6 border-t border-border flex items-center justify-end gap-3 bg-surface shrink-0">
            <button (click)="showCompleteSprintModal.set(false)" class="px-5 py-2.5 text-text-secondary hover:text-text-primary text-sm font-bold transition-colors">
              {{ currentLang === 'ar' ? 'إلغاء' : 'Cancel' }}
            </button>
            @if (review().length === 0) {
              <button (click)="completeSprintFromBoard()" class="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl shadow-md transition-all hover:-translate-y-px">
                {{ currentLang === 'ar' ? 'إنهاء السبرنت' : 'Complete Sprint' }}
              </button>
            }
          </div>
        </div>
      </div>
    }

    <!-- ─── NO EMPLOYEES REQUIRED MODAL ─── -->
    @if (showNoEmployeesModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]">
        <div class="bg-surface border border-border rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 text-center animate-[scaleUp_0.25s_ease_both]" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
          <div class="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-2xl">
            ⚠️
          </div>
          <div>
            <h3 class="text-lg font-bold text-text-primary">
              {{ currentLang === 'ar' ? 'مطلوب موظفين لبدء السبرينت' : 'Employees Required to Start Sprint' }}
            </h3>
            <p class="text-xs text-text-secondary mt-2 leading-relaxed">
              {{ currentLang === 'ar' ? 'لا يمكن بدء السبرينت لمشروع بدون موظفين معينين. يرجى تعيين أعضاء في الفريق أولاً.' : 'Cannot start sprint for a project with no assigned employees. Please assign team members to this project first.' }}
            </p>
          </div>
          <div class="flex items-center justify-center gap-3 pt-2">
            <button
              (click)="showNoEmployeesModal.set(false)"
              class="px-4 py-2 border border-border text-text-secondary hover:text-text-primary text-xs font-semibold rounded-xl transition-all">
              {{ currentLang === 'ar' ? 'إلغاء' : 'Cancel' }}
            </button>
            <button
              (click)="showNoEmployeesModal.set(false); goToTeam()"
              class="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
              {{ currentLang === 'ar' ? 'تعيين الموظفين' : 'Assign Employees' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class BoardComponent implements OnInit, OnChanges {
  @Input() overrideSprintId: string | null = null;
  @Input() overrideSprintStatus: string | null = null;
  @Output() backToSprints = new EventEmitter<void>();
  @Output() sprintStatusChanged = new EventEmitter<void>();

  @ViewChild(TaskDiscussionComponent) discussionComponent!: TaskDiscussionComponent;

  showNoEmployeesModal = signal(false);
  showCompleteSprintModal = signal(false);
  private backlogService = inject(BacklogService);
  private sprintService = inject(SprintPlanningService);
  private assignmentService = inject(AssignmentService);
  public projectState = inject(ProjectStateService);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private tasksService = inject(TasksService);
  public tr = inject(TranslateService);

  // Loading and assignment status signals
  isLoading = signal(true);
  isAssignedToProject = signal(false);
  projectName = signal('');

  // Real active ids
  activeProjectId = '';
  activeUserStoryId = '';
  currentUserId = signal<string | null>(getUserIdFromToken());

  private buildPermissions(assigneeId: string | undefined, isProjectManager: boolean) {
    const isAssignee = assigneeId === this.currentUserId();
    const canInteract = isProjectManager || isAssignee;

    return {
      canDrag: canInteract,
      canView: canInteract,
      canSummarize: isAssignee,
      canEdit: isProjectManager,
      canComment: canInteract,
      canDownloadAttachments: canInteract
    };
  }

  onTaskAssignmentChanged(task: Task, assignment: TaskAssignmentChangedEvent): void {
    const applyAssignment = (item: Task): Task => ({
      ...item,
      assigneeId: assignment.employeeId,
      assigneeName: assignment.employeeName,
      isOwnedByCurrentUser: assignment.employeeId === this.currentUserId(),
      permissions: this.buildPermissions(assignment.employeeId, this.projectState.isProjectManager())
    });

    this.todo.update(tasks => tasks.map(item => item.id === task.id ? applyAssignment(item) : item));
    this.inProgress.update(tasks => tasks.map(item => item.id === task.id ? applyAssignment(item) : item));
    this.review.update(tasks => tasks.map(item => item.id === task.id ? applyAssignment(item) : item));
    this.done.update(tasks => tasks.map(item => item.id === task.id ? applyAssignment(item) : item));

    if (this.modalTask().id === task.id) {
      this.modalTask.update(item => applyAssignment(item));
    }

    const allTasks = [...this.todo(), ...this.inProgress(), ...this.review(), ...this.done()];
    this.hasAssignments.set(allTasks.some(item => Boolean(item.assigneeId)));
    this.hasUnassignedTasks.set(allTasks.length > 0 && allTasks.some(item => !item.assigneeId));
  }
  activeSprintId = signal<string | null>(null);
  plannedSprintId = signal<string | null>(null);
  completedSprintId = signal<string | null>(null);
  sprintStatus = signal<string | null>(null);

  isBoardReadonly = computed(() => {
    return this.projectState.selectedProject()?.status === 'Completed' || 
           this.projectState.selectedProject()?.status === 'Archived' ||
           this.sprintStatus() === 'Completed';
  });

  isRetroModalOpen = signal(false);
  isChatOpen = signal(false);

  openRetrospectivePage() {
    const sId = this.activeSprintId() || this.completedSprintId();
    if (sId) {
      this.router.navigate(['/dashboard', 'retrospective'], { queryParams: { sprintId: sId } });
    } else {
      this.router.navigate(['/dashboard', 'retrospective']);
    }
  }

  chatTask = signal<TaskItemDto | null>(null);

  openSummarizeChat(task: any) {
    this.chatTask.set(task);
  }

  closeSummarizeChat() {
    this.chatTask.set(null);
  }

  get currentLang(): string {
    return this.tr.currentLang() || 'en';
  }

  getTaskTitle(task: Task): string {
    return task.title || '';
  }

  getTaskDescription(task: Task): string {
    return task.description || '';
  }

  private sortTasksOwnedByCurrentUser(a: Task, b: Task): number {
    return Number(b.isOwnedByCurrentUser) - Number(a.isOwnedByCurrentUser);
  }

  // Task columns
  todo = signal<Task[]>([]);
  inProgress = signal<Task[]>([]);
  review = signal<Task[]>([]);
  done = signal<Task[]>([]);

  // PM Action Modals State
  inlineAction = signal<'reject' | 'reopen' | null>(null);
  inlineReasonEn = '';
  inlineReasonAr = '';

  async pmAcceptReview(task: Task) {
    if (!this.projectState.isProjectManager() || this.isBoardReadonly()) return;
    try {
      await this.tasksService.updateTaskStatus(task.id, TaskItemStatus.Done);
      this.toastService.show(this.currentLang === 'ar' ? 'تم قبول المهمة وانتقلت للإنجاز' : 'Task accepted and marked Done', 'success');
      await this.loadWorkspaceData();
    } catch (err: any) {
      this.toastService.show(err.response?.data?.message || 'Failed to accept task', 'error');
    }
  }

  async confirmInlineAction() {
    const action = this.inlineAction();
    const task = this.modalTask();
    if (!task || !action || (!this.inlineReasonEn && !this.inlineReasonAr)) return;
    try {
      if (action === 'reject') {
        await this.tasksService.pmRejectReview(task.id, this.inlineReasonEn, this.inlineReasonAr);
        this.toastService.show(this.currentLang === 'ar' ? 'تم رفض المهمة بنجاح' : 'Task successfully rejected', 'success');
      } else {
        await this.tasksService.pmReopenTask(task.id, this.inlineReasonEn, this.inlineReasonAr);
        this.toastService.show(this.currentLang === 'ar' ? 'تم إعادة فتح المهمة' : 'Task successfully reopened', 'success');
      }

      // Auto-post the reason as a comment so developers can see it in chat
      const actionTitleEn = action === 'reject' ? 'Task Status Update: Returned to In Progress ' : 'Task Status Update: Reopened ';
      const actionTitleAr = action === 'reject' ? 'تحديث حالة المهمة: إعادة المهمة للتنفيذ ' : 'تحديث لحالة المهمة : تمت إعادة الفتح ';

      const reasonLabelEn = 'Manager\'s Feedback:';
      const reasonLabelAr = 'ملاحظة مدير المشروع:';

      const actionTitle = this.currentLang === 'ar' ? actionTitleAr : actionTitleEn;
      const reasonLabel = this.currentLang === 'ar' ? reasonLabelAr : reasonLabelEn;

      const reasonText = [this.inlineReasonEn, this.inlineReasonAr].filter(r => !!r).join('\n');
      const commentContent = `${actionTitle}\n\n${reasonLabel}\n"${reasonText}"`;

      await this.tasksService.addComment(task.id, commentContent);

      this.inlineAction.set(null);
      this.inlineReasonEn = '';
      this.inlineReasonAr = '';

      // Update local modal state so the UI reflects the new "InProgress" status 
      // and hides the Review/Done PM action buttons immediately without closing the modal
      this.originalColumn = 'inProgress';
      this.modalTask.set({ ...task });

      if (this.discussionComponent) {
        this.discussionComponent.loadData();
      }

      // Refresh background data quietly
      await this.loadWorkspaceData();
    } catch (err: any) {
      this.toastService.show(err.response?.data?.message || `Failed to ${action} task`, 'error');
    }
  }

  totalTasksCount = computed(() => {
    return this.todo().length + this.inProgress().length + this.review().length + this.done().length;
  });

  activeTab = signal<'board' | 'health'>('board');

  readonly boardPageSize = 8;
  boardSearch = signal('');
  priorityFilter = signal<'All' | Task['priority']>('All');
  typeFilter = signal<'All' | Task['type']>('All');
  todoLimit = signal(this.boardPageSize);
  inProgressLimit = signal(this.boardPageSize);
  reviewLimit = signal(this.boardPageSize);
  doneLimit = signal(this.boardPageSize);

  hasActiveBoardFilters = computed(() => {
    return Boolean(this.boardSearch().trim()) || this.priorityFilter() !== 'All' || this.typeFilter() !== 'All';
  });

  filteredTodo = computed(() => this.filterTasks(this.todo()));
  filteredInProgress = computed(() => this.filterTasks(this.inProgress()));
  filteredReview = computed(() => this.filterTasks(this.review()));
  filteredDone = computed(() => this.filterTasks(this.done()));

  visibleTodo = computed(() => this.filteredTodo().slice(0, this.todoLimit()));
  visibleInProgress = computed(() => this.filteredInProgress().slice(0, this.inProgressLimit()));
  visibleReview = computed(() => this.filteredReview().slice(0, this.reviewLimit()));
  visibleDone = computed(() => this.filteredDone().slice(0, this.doneLimit()));

  visibleTasksCount = computed(() => {
    return this.visibleTodo().length + this.visibleInProgress().length + this.visibleReview().length + this.visibleDone().length;
  });

  showModal = signal(false);
  isEditing = signal(false);

  isPrioritySelectOpen = signal(false);
  isTypeSelectOpen = signal(false);

  togglePrioritySelect() {
    this.isPrioritySelectOpen.update(v => !v);
    this.isTypeSelectOpen.set(false);
  }

  toggleTypeSelect() {
    this.isTypeSelectOpen.update(v => !v);
    this.isPrioritySelectOpen.set(false);
  }

  selectPriority(val: any) {
    this.modalTask.update(t => ({ ...t, priority: val }));
    this.isPrioritySelectOpen.set(false);
  }

  selectType(val: any) {
    this.modalTask.update(t => ({ ...t, type: val }));
    this.isTypeSelectOpen.set(false);
  }

  modalTask = signal<Task>({
    id: '',
    userStoryId: '',
    title: '',
    description: '',
    priority: 'Medium',
    hours: 4,
    type: 'Feature',
    assigneeId: undefined,
    assigneeName: undefined,
    isOwnedByCurrentUser: false,
    permissions: {
      canDrag: true,
      canView: true,
      canSummarize: true,
      canEdit: true,
      canComment: true,
      canDownloadAttachments: true
    }
  });

  hasAssignments = signal(false);
  hasUnassignedTasks = signal(false);
  originalColumn: 'todo' | 'inProgress' | 'review' | 'done' = 'todo';

  constructor() {
    // Automatically trigger reload when the active selected project changes
    effect(() => {
      const projId = this.projectState.selectedProjectId();
      untracked(() => {
        this.isLoading.set(true);
        this.loadWorkspaceData()
          .catch(err => console.error('Error loading backlog data:', err))
          .finally(() => this.isLoading.set(false));
      });
    });
  }

  async ngOnInit() {
    this.sprintStatus.set(this.overrideSprintStatus);

    this.activatedRoute.queryParams.subscribe(params => {
      const taskId = params['taskId'];
      if (taskId) {
        this.handleDeepLinkTaskId(taskId);
      }
    });
  }

  private deepLinkInterval: any;

  private handleDeepLinkTaskId(taskId: string) {
    if (this.deepLinkInterval) {
      clearInterval(this.deepLinkInterval);
    }
    
    // We must wait for isLoading to be completely false before searching
    this.deepLinkInterval = setInterval(() => {
      if (!this.isLoading()) {
        clearInterval(this.deepLinkInterval);
        this.deepLinkInterval = null;
        this.executeTaskDeepLink(taskId);
      }
    }, 100);
  }

  ngOnDestroy() {
    if (this.deepLinkInterval) {
      clearInterval(this.deepLinkInterval);
    }
  }

  private executeTaskDeepLink(taskId: string) {
    const allLoadedTasks = [...this.todo(), ...this.inProgress(), ...this.review(), ...this.done()];
    console.log(`[DeepLink] Searching for taskId: ${taskId}`);
    console.log(`[DeepLink] Total loaded tasks: ${allLoadedTasks.length}`);
    const targetTask = allLoadedTasks.find(t => String(t.id).toLowerCase() === String(taskId).toLowerCase());
    console.log(`[DeepLink] Found task:`, targetTask);
    
    if (targetTask) {
      setTimeout(() => this.openEditModal(targetTask), 200);
    } else {
      this.toastService.show(
        this.currentLang === 'ar' 
          ? 'المهمة المطلوبة غير موجودة في السبرينت الحالي (قد تكون محذوفة أو في سبرينت منتهي)' 
          : 'The requested task is not found in the current sprint (it might be in a completed sprint).',
        'warning'
      );
    }
    
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { taskId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const sprintStatusChange = changes['overrideSprintStatus'];
    const sprintIdChange = changes['overrideSprintId'];

    // Re-run only when inputs change after initial load
    // (firstChange = false means it's an update, not initial binding)
    if (
      (sprintStatusChange && !sprintStatusChange.firstChange) ||
      (sprintIdChange && !sprintIdChange.firstChange)
    ) {
      this.loadWorkspaceData();
    }
  }

  goToAssignment() {
    const sprintId = this.plannedSprintId();
    if (sprintId) {
      this.router.navigate(['/dashboard/assignment', sprintId]);
    }
  }

  async startSprint(): Promise<void> {
    const projectId = this.projectState.selectedProjectId();
    const sprintId = this.plannedSprintId();
    if (!projectId || !sprintId) return;

    if (this.projectState.projectEmployeeCount() === 0) {
      this.showNoEmployeesModal.set(true);
      return;
    }

    if (this.hasUnassignedTasks()) {
      this.toastService.show(this.currentLang === 'ar' ? 'لا يمكن بدء السبرنت. تأكد من تعيين جميع المهام للموظفين أولاً.' : 'Cannot start sprint. Make sure all tasks are assigned to employees first.', 'error');
      return;
    }

    try {
      await this.sprintService.startSprint(projectId, sprintId);
      this.toastService.show(this.currentLang === 'ar' ? 'تم بدء السبرنت بنجاح' : 'Sprint started successfully', 'success');
      this.sprintStatusChanged.emit();
    } catch (e: any) {
      const errorCode = e?.response?.data?.errors?.[0]?.code || e?.response?.data?.error?.code || e?.response?.data?.code || e?.error?.code || e?.code;
      if (errorCode === 'NO_EMPLOYEES_ASSIGNED') {
        this.showNoEmployeesModal.set(true);
      } else if (errorCode === 'SPRINT_UNASSIGNED_TASKS_EXIST') {
        this.toastService.show(this.currentLang === 'ar' ? 'لا يمكن بدء السبرنت. تأكد من تعيين جميع المهام للموظفين.' : 'Cannot start sprint. Make sure all tasks are assigned to employees.', 'error');
      } else if (errorCode === 'ANOTHER_SPRINT_ALREADY_ACTIVE') {
        this.toastService.show(this.currentLang === 'ar' ? 'لا يمكن البدء: يوجد سبرنت نشط بالفعل في هذا المشروع.' : 'Cannot start: Another sprint is already active in this project.', 'error');
      } else {
        this.toastService.show(e?.response?.data?.message || (this.currentLang === 'ar' ? 'فشل بدء السبرنت' : 'Failed to start sprint'), 'error');
      }
    }
  }

  cancelSprintClicked() {
    const projectId = this.projectState.selectedProjectId();
    const sprintId = this.plannedSprintId();
    if (!projectId || !sprintId) return;

    this.confirmDialog.confirm({
      title: this.currentLang === 'ar' ? 'إلغاء السبرينت' : 'Cancel Sprint',
      message: this.currentLang === 'ar' ? 'هل أنت متأكد من إلغاء هذا السبرينت؟ ستعود جميع المهام إلى الـ Backlog.' : 'Are you sure you want to cancel this planned sprint? All tasks will be returned to the backlog.',
      confirmLabel: this.currentLang === 'ar' ? 'إلغاء السبرينت' : 'Cancel Sprint',
      cancelLabel: this.currentLang === 'ar' ? 'تراجع' : 'Keep Sprint',
      type: 'danger'
    }).then(async (confirmed) => {
      if (confirmed) {
        try {
          await this.sprintService.cancelSprint(projectId, sprintId);
          this.toastService.show(
            this.currentLang === 'ar' ? 'تم إلغاء السبرينت بنجاح' : 'Sprint cancelled successfully',
            'success'
          );
          // Go to Sprints tab
          this.backToSprints.emit();
        } catch (e: any) {
          this.toastService.show(
            e?.response?.data?.message || (this.currentLang === 'ar' ? 'فشل إلغاء السبرينت' : 'Failed to cancel sprint'),
            'error'
          );
        }
      }
    });
  }

  public async loadWorkspaceData() {
    const projectId = this.projectState.selectedProjectId();
    if (!projectId) {
      this.isAssignedToProject.set(false);
      this.todo.set([]);
      this.inProgress.set([]);
      this.review.set([]);
      this.done.set([]);
      return;
    }

    this.isAssignedToProject.set(true);
    this.activeProjectId = projectId;

    // Lazy-load employee count only when the board is actually open and user is PM
    if (this.projectState.isProjectManager()) {
      this.projectState.loadProjectEmployeeCount(projectId);
    }

    const projectInfo = this.projectState.projects().find(p => p.id === projectId);
    this.projectName.set(projectInfo?.nameEn || 'Project');

    // Fetch sprints to determine board context
    let activeSprint: { sprintId: string } | null = null;
    let plannedSprint: { sprintId: string } | null = null;
    let completedSprint: { sprintId: string } | null = null;

    if (!this.overrideSprintId || !this.overrideSprintStatus) {
      // Step 1: Fire all sprint queries in parallel to avoid waterfall wait times
      const [activeRes, plannedRes, completedRes] = await Promise.allSettled([
        this.sprintService.getActiveSprint(projectId),
        this.sprintService.getPlannedSprint(projectId),
        this.sprintService.getLatestCompletedSprint(projectId)
      ]);

      if (activeRes.status === 'fulfilled') {
        const resolved = (activeRes.value as any)?.data || activeRes.value;
        if (resolved && resolved.sprintId) activeSprint = resolved;
      }
      if (plannedRes.status === 'fulfilled') {
        const resolved = (plannedRes.value as any)?.data || plannedRes.value;
        if (resolved && resolved.sprintId) plannedSprint = resolved;
      }
      if (completedRes.status === 'fulfilled') {
        const resolved = (completedRes.value as any)?.data || completedRes.value;
        if (resolved && resolved.sprintId) completedSprint = resolved;
      }
    }

    // Step 2: Branch based on result
    if (this.overrideSprintId && this.overrideSprintStatus) {
      const status = this.overrideSprintStatus;
      if (status === 'Active') {
        this.activeSprintId.set(this.overrideSprintId);
        this.plannedSprintId.set(null);
        this.completedSprintId.set(null);
      } else if (status === 'Planned') {
        this.plannedSprintId.set(this.overrideSprintId);
        this.activeSprintId.set(null);
        this.completedSprintId.set(null);
      } else if (status === 'Completed') {
        this.completedSprintId.set(this.overrideSprintId);
        this.activeSprintId.set(null);
        this.plannedSprintId.set(null);
      } else {
        this.activeSprintId.set(null);
        this.plannedSprintId.set(null);
        this.completedSprintId.set(null);
      }
      this.sprintStatus.set(status);
    } else if (activeSprint && activeSprint.sprintId) {
      this.activeSprintId.set(activeSprint.sprintId);
      this.plannedSprintId.set(null);
      this.completedSprintId.set(null);
      this.sprintStatus.set('Active');
    } else if (plannedSprint && plannedSprint.sprintId) {
      this.activeSprintId.set(null);
      this.plannedSprintId.set(plannedSprint.sprintId);
      this.completedSprintId.set(null);
      this.sprintStatus.set('Planned');
    } else if (completedSprint && completedSprint.sprintId) {
      this.activeSprintId.set(null);
      this.plannedSprintId.set(null);
      this.completedSprintId.set(completedSprint.sprintId);
      this.sprintStatus.set('Completed');
    } else {
      this.activeSprintId.set(null);
      this.plannedSprintId.set(null);
      this.completedSprintId.set(null);
      this.sprintStatus.set(null);
    }

    // 4. Load only the tasks that belong to the sprint being viewed.
    let tasks: any[] = [];
    const sprintId = this.overrideSprintId
      || this.activeSprintId()
      || this.plannedSprintId()
      || this.completedSprintId();

    if (this.projectState.isProjectManager() && this.sprintStatus() === 'Planned' && sprintId) {
      void this.assignmentService.getAssignmentTeam(sprintId).catch(() => undefined);
    }

    if (!sprintId) {
      tasks = [];
    } else {
      try {
        tasks = await this.tasksService.getSprintTasks(this.activeProjectId, sprintId);
        if (this.projectState.isProjectManager()) {
          this.activeUserStoryId = tasks[0]?.userStoryId || '';
        }
      } catch (err) {
        console.error('Failed to load sprint tasks:', err);
        this.activeUserStoryId = '';
        tasks = [];
      }
    }

    // 5. Populate task columns from real data
    const todoList: Task[] = [];
    const inProgressList: Task[] = [];
    const reviewList: Task[] = [];
    const doneList: Task[] = [];

    const isPm = this.projectState.isProjectManager();
    for (const t of tasks) {
      const task: Task = {
        id: t.taskId,
        userStoryId: t.userStoryId || '',
        title: this.currentLang === 'ar' ? (t.titleAr || t.titleEn) : t.titleEn,
        titleEn: t.titleEn,
        titleAr: t.titleAr,
        description: this.currentLang === 'ar' ? (t.descriptionAr || t.descriptionEn || '') : (t.descriptionEn || ''),
        descriptionEn: t.descriptionEn,
        descriptionAr: t.descriptionAr,
        priority: mapPriorityToFrontend(t.priority),
        hours: t.estimatedHours || 0,
        actualHours: t.actualHours || 0,
        type: mapTypeToFrontend(t.type),
        assigneeId: t.assigneeId,
        assigneeName: t.assigneeName,
        isOwnedByCurrentUser: t.assigneeId === this.currentUserId(),
        permissions: this.buildPermissions(t.assigneeId, isPm)
      };

      const title = this.currentLang === 'ar' ? (t.titleAr || t.titleEn) : t.titleEn;
      const desc = this.currentLang === 'ar' ? (t.descriptionAr || t.descriptionEn || '') : (t.descriptionEn || '');
      task.searchString = `${title} ${desc}`.toLowerCase();

      const col = mapStatusToFrontend(t.status);
      if (col === 'todo') todoList.push(task);
      else if (col === 'inProgress') inProgressList.push(task);
      else if (col === 'review') reviewList.push(task);
      else if (col === 'done') doneList.push(task);
    }

    this.todo.set(todoList.sort(this.sortTasksOwnedByCurrentUser.bind(this)));
    this.inProgress.set(inProgressList.sort(this.sortTasksOwnedByCurrentUser.bind(this)));
    this.review.set(reviewList.sort(this.sortTasksOwnedByCurrentUser.bind(this)));
    this.done.set(doneList.sort(this.sortTasksOwnedByCurrentUser.bind(this)));
    const isTaskAssigned = (t: any): boolean => {
      if (t.isAssigned === true) return true;
      if (t.isAssigned === false) return false;
      const val = t.employeeId || t.assignedTo || t.assigneeId || t.assignedEmployeeId ||
        t.assignedToEmployeeId || t.assignedUserId || t.userId || t.developerId ||
        t.assignedDeveloperId || t.assignedEmployee || t.employee || t.assignee ||
        t.assignedToName || t.assignedEmployeeName;
      return val !== undefined && val !== null && val !== '';
    };

    this.hasAssignments.set(tasks.some((t: any) => isTaskAssigned(t)));
    const unassignedExist = tasks.length > 0 && tasks.some((t: any) => !isTaskAssigned(t));
    this.hasUnassignedTasks.set(unassignedExist);
  }

  private filterTasks(tasks: Task[]): Task[] {
    const query = this.boardSearch().trim().toLowerCase();
    const priority = this.priorityFilter();
    const type = this.typeFilter();

    return tasks.filter(task => {
      const matchesSearch = !query || (task.searchString && task.searchString.includes(query));
      const matchesPriority = priority === 'All' || task.priority === priority;
      const matchesType = type === 'All' || task.type === type;
      return matchesSearch && matchesPriority && matchesType;
    });
  }

  private limitSignalFor(column: ColumnKey) {
    if (column === 'inProgress') return this.inProgressLimit;
    if (column === 'review') return this.reviewLimit;
    if (column === 'done') return this.doneLimit;
    return this.todoLimit;
  }

  private filteredTasksFor(column: ColumnKey): Task[] {
    if (column === 'inProgress') return this.filteredInProgress();
    if (column === 'review') return this.filteredReview();
    if (column === 'done') return this.filteredDone();
    return this.filteredTodo();
  }

  showMore(column: ColumnKey) {
    const limit = this.limitSignalFor(column);
    const total = this.filteredTasksFor(column).length;
    limit.set(Math.min(total, limit() + this.boardPageSize));
  }

  showLess(column: ColumnKey) {
    this.limitSignalFor(column).set(this.boardPageSize);
  }

  remainingTasks(column: ColumnKey): number {
    const limit = this.limitSignalFor(column)();
    const total = this.filteredTasksFor(column).length;
    return Math.min(this.boardPageSize, Math.max(total - limit, 0));
  }

  resetBoardFilters() {
    this.boardSearch.set('');
    this.priorityFilter.set('All');
    this.typeFilter.set('All');
  }

  emptyColumnMessage(column: ColumnKey): string {
    if (this.hasActiveBoardFilters()) return this.tr.instant('BOARD.NO_MATCHING_TASKS');
    if (column === 'todo') return this.tr.instant('BOARD.NO_TASKS_TODO');
    if (column === 'inProgress') return this.tr.instant('BOARD.DROP_TASKS_HERE');
    if (column === 'review') return this.tr.instant('BOARD.DROP_TASKS_VALIDATION');
    return this.tr.instant('BOARD.NO_COMPLETED_TASKS');
  }
  async drop(event: CdkDragDrop<Task[]>) {
    if (this.hasActiveBoardFilters()) {
      this.toastService.show('Clear filters before moving tasks on the board.', 'error');
      return;
    }

    if (this.sprintStatus() !== 'Active') {
      this.toastService.show(this.currentLang === 'ar' ? 'لا يمكن تحريك المهام إلا إذا كان السبرينت نشطاً' : 'Tasks can only be moved when the sprint is Active.', 'error');
      return;
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      const sourceColumnId = event.previousContainer.id;
      const targetColumnId = event.container.id;

      let oldStatus = 'todo';
      if (sourceColumnId === 'in-progress-list') oldStatus = 'inProgress';
      else if (sourceColumnId === 'review-list') oldStatus = 'review';
      else if (sourceColumnId === 'done-list') oldStatus = 'done';

      let newStatus = 'todo';
      if (targetColumnId === 'in-progress-list') newStatus = 'inProgress';
      else if (targetColumnId === 'review-list') newStatus = 'review';
      else if (targetColumnId === 'done-list') newStatus = 'done';

      // PM Drag & Drop Logic
      if (this.projectState.isProjectManager()) {
        if (oldStatus === 'review' && newStatus === 'done') {
          await this.pmAcceptReview(task);
        } else if (oldStatus === 'review' && newStatus === 'inProgress') {
          this.openEditModal(task, 'reject');
        } else if (oldStatus === 'done' && newStatus === 'inProgress') {
          this.openEditModal(task, 'reopen');
        } else {
          this.toastService.show(this.currentLang === 'ar' ? 'غير مسموح بهذا الإجراء' : 'This transition is not allowed for Project Managers.', 'error');
        }
        return; // Don't transfer item manually; reloading or modal will handle it.
      }

      // Developer Drag & Drop Logic
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Notify signals IMMEDIATELY so the UI updates instantly without waiting for backend
      this.todo.update(v => [...v]);
      this.inProgress.update(v => [...v]);
      this.review.update(v => [...v]);
      this.done.update(v => [...v]);

      try {
        const statusEnum = this.mapColumnToEnum(newStatus);
        const updatedTask = await this.tasksService.updateTaskStatus(task.id, statusEnum);
        this.toastService.show('Task status updated successfully.', 'success');
        
        // Update actualHours if provided by backend
        if (updatedTask && typeof updatedTask.actualHours === 'number') {
          task.actualHours = updatedTask.actualHours;
          // Update signals again only if hours changed
          this.todo.update(v => [...v]);
          this.inProgress.update(v => [...v]);
          this.review.update(v => [...v]);
          this.done.update(v => [...v]);
        }
      } catch (err: any) {
        console.error('Failed to update task status in backend:', err);
        const errorMsg = err?.response?.data?.message || err?.response?.data?.error?.message || err?.message || 'Failed to update task status.';
        this.toastService.show(errorMsg, 'error');
        
        // Rollback visually by moving item back
        transferArrayItem(
          event.container.data,
          event.previousContainer.data,
          event.currentIndex,
          event.previousIndex
        );
        
        // Notify signals of rollback
        this.todo.update(v => [...v]);
        this.inProgress.update(v => [...v]);
        this.review.update(v => [...v]);
        this.done.update(v => [...v]);
      }
    }
  }

  private mapColumnToEnum(column: string): TaskItemStatus {
    if (column === 'inProgress') return TaskItemStatus.InProgress;
    if (column === 'review') return TaskItemStatus.Review;
    if (column === 'done') return TaskItemStatus.Done;
    return TaskItemStatus.ToDo;
  }

  openEditModal(task: Task, defaultAction: 'reject' | 'reopen' | null = null) {
    this.isChatOpen.set(false);
    this.isEditing.set(true);
    if (this.todo().some(t => t.id === task.id)) this.originalColumn = 'todo';
    else if (this.inProgress().some(t => t.id === task.id)) this.originalColumn = 'inProgress';
    else if (this.review().some(t => t.id === task.id)) this.originalColumn = 'review';
    else if (this.done().some(t => t.id === task.id)) this.originalColumn = 'done';

    this.inlineAction.set(defaultAction);
    this.inlineReasonEn = '';
    this.inlineReasonAr = '';

    this.modalTask.set({ ...task });
    this.showModal.set(true);
  }

  closeModal() {
    this.isChatOpen.set(false);
    this.inlineAction.set(null);
    this.showModal.set(false);
  }

  async saveTask() {
    const taskData = this.modalTask();

    try {
      this.isLoading.set(true);
      if (this.projectState.isProjectManager()) {
        if (!taskData.title.trim()) {
          this.toastService.show('Task title is required.', 'error');
          this.isLoading.set(false);
          return;
        }

        if (this.isEditing()) {
          await this.backlogService.updateTask(taskData.id, {
            titleEn: taskData.titleEn || '',
            titleAr: taskData.titleAr,
            descriptionEn: taskData.descriptionEn,
            descriptionAr: taskData.descriptionAr,
            estimatedHours: taskData.hours,
            effortSize: 'Medium',
            priority: taskData.priority,
            type: taskData.type,
            status: this.originalColumn
          });
          this.toastService.show('Task updated successfully.', 'success');
        } else {
          await this.backlogService.createTask(this.activeUserStoryId, {
            titleEn: taskData.titleEn || '',
            titleAr: taskData.titleAr,
            descriptionEn: taskData.descriptionEn,
            descriptionAr: taskData.descriptionAr,
            estimatedHours: taskData.hours,
            effortSize: 'Medium',
            priority: taskData.priority,
            type: taskData.type,
            status: 'todo'
          });
          this.toastService.show('Task created successfully.', 'success');
        }
      }
      this.closeModal();
      await this.loadWorkspaceData();
    } catch (err: any) {
      console.error('Error saving task:', err);
      const errorMsg = err?.response?.data?.message || err?.response?.data?.error?.message || err?.message || 'Failed to save task. Please try again.';
      this.toastService.show(errorMsg, 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteTask() {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      type: 'danger'
    });
    if (confirmed) {
      try {
        this.isLoading.set(true);
        await this.backlogService.deleteTask(this.modalTask().id);
        this.toastService.show('Task deleted successfully.', 'success');
        this.closeModal();
        await this.loadWorkspaceData();
      } catch (err) {
        console.error('Error deleting task:', err);
        this.toastService.show('Failed to delete task. Please try again.', 'error');
      } finally {
        this.isLoading.set(false);
      }
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
    if (success) {
      form.reset();
      this.toastService.show('Project created successfully.', 'success');
    } else {
      this.toastService.show('Failed to create project.', 'error');
    }
  }



  async completeSprintBtnClicked(): Promise<void> {
    if (this.todo().length > 0 || this.inProgress().length > 0 || this.review().length > 0) {
      this.showCompleteSprintModal.set(true);
    } else {
      await this.completeSprintFromBoard();
    }
  }

  async completeSprintFromBoard(reviewAction?: 'AcceptAll' | 'SendToBacklog'): Promise<void> {
    const projectId = this.projectState.selectedProjectId();
    const sprintId = this.activeSprintId();
    if (!projectId || !sprintId) return;

    try {
      await this.sprintService.completeSprint(projectId, sprintId, reviewAction);
      this.toastService.show(this.currentLang === 'ar' ? 'تم إنهاء السبرنت بنجاح' : 'Sprint completed successfully', 'success');
      this.showCompleteSprintModal.set(false);
      this.sprintStatusChanged.emit();
    } catch (e: any) {
      const errorCode = e?.response?.data?.errors?.[0]?.code || e?.response?.data?.error?.code || e?.response?.data?.code || e?.error?.code || e?.code;
      if (errorCode === 'SPRINT_HAS_UNFINISHED_TASKS') {
        this.showCompleteSprintModal.set(true);
      } else {
        this.toastService.show(this.currentLang === 'ar' ? 'فشل إنهاء السبرنت' : 'Failed to complete sprint', 'error');
      }
    }
  }



  goToTeam(): void {
    this.router.navigate(['/dashboard', 'team']);
  }
}
