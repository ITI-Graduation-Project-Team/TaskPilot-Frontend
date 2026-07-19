import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject, effect, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { AgileCoachSummaryComponent } from '../agile-coach-summary/agile-coach-summary.component';
import { AgileCoachChatComponent } from '../agile-coach-chat/agile-coach-chat.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { SprintRiskListComponent } from '../../../sprintRisks';
import { Router, ActivatedRoute } from '@angular/router';
import { AssignmentService } from '../../../../shared/api/assignment.service';
import { TasksService, TaskItemStatus } from '../../../../shared/api/tasks.service';
import { TaskDiscussionComponent } from '../task-discussion/task-discussion.component';

interface Task {
  id: string;
  userStoryId: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  hours: number;
  type: 'Feature' | 'Bug' | 'Refactor';
}

type ColumnKey = 'todo' | 'inProgress' | 'review' | 'done';

@Component({
  selector: 'app-board',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DragDropModule, RetrospectiveModalComponent, AgileCoachSummaryComponent, AgileCoachChatComponent, SprintRiskListComponent, TaskDiscussionComponent],
  template: `
    <div class="space-y-6">
      
      @if (isLoading()) {
        <!-- Loading indicator -->
        <div class="flex items-center justify-center p-12 bg-surface border border-border rounded-2xl shadow-sm">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            <span class="text-sm font-semibold text-text-secondary">Loading Workspace Backlog...</span>
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

            <button type="submit" 
                    class="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md shadow-primary/10 transition-all duration-200 hover:-translate-y-px active:translate-y-0 mt-2">
              Create Project
            </button>
          </form>
        </div>
      } @else if (!isAssignedToProject() || isBoardReadonly()) {
        <!-- Warning Panel for unassigned employee or archived project -->
        <div class="bg-surface border border-warning/30 p-8 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto my-12 transition-colors duration-200">
          <div class="w-16 h-16 bg-warning/10 text-warning rounded-2xl flex items-center justify-center shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-text-primary">No Active Project</h3>
            <p class="text-text-secondary text-sm mt-2 max-w-md">
              You are currently not viewing an active project. Please select an active project from the dropdown, or ask your Project Manager to assign you to one.
            </p>
          </div>
        </div>
      } @else {
        
        <!-- Metrics overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between transition-colors duration-200">
            <div>
              <p class="text-text-secondary text-sm font-medium">Total Tasks</p>
              <h3 class="text-text-primary text-2xl font-bold mt-1">{{ totalTasksCount() }}</h3>
            </div>
            <div class="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>

          <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between transition-colors duration-200">
            <div>
              <p class="text-text-secondary text-sm font-medium">In Progress</p>
              <h3 class="text-text-primary text-2xl font-bold mt-1">{{ inProgress().length }}</h3>
            </div>
            <div class="w-10 h-10 bg-warning/10 text-warning rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between transition-colors duration-200">
            <div>
              <p class="text-text-secondary text-sm font-medium">Under Review</p>
              <h3 class="text-text-primary text-2xl font-bold mt-1">{{ review().length }}</h3>
            </div>
            <div class="w-10 h-10 bg-info/10 text-info rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>

          <div class="bg-surface border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between transition-colors duration-200">
            <div>
              <p class="text-text-secondary text-sm font-medium">Completed</p>
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
                <button (click)="onBackToSprints()" class="text-sm font-bold text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Sprints
                </button>
              </div>
            }
            <h2 class="text-2xl font-bold text-text-primary">{{ projectName() }} Workspace</h2>
            <p class="text-text-secondary text-sm mt-1">Drag and drop tasks to update their current progress state.</p>
          </div>
          
          <div class="flex items-center gap-3">
            @if (projectState.isProjectManager() && sprintStatus() === 'Planned') {
              <button (click)="goToAssignment()" 
                      class="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:-translate-y-px active:translate-y-0 text-sm">
                👥 Assign Tasks
              </button>
              <button (click)="startSprint()" 
                      class="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:-translate-y-px active:translate-y-0 text-sm">
                ▶ Start Sprint
              </button>
            }
            @if (projectState.isProjectManager() && sprintStatus() === 'Active') {
              <button (click)="completeSprintFromBoard()" 
                      class="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:-translate-y-px active:translate-y-0 text-sm">
                Complete Sprint
              </button>
            }
            @if (projectState.isProjectManager() && sprintStatus() === 'Completed') {
              <button (click)="isRetroModalOpen.set(true)" 
                      class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:-translate-y-px active:translate-y-0 text-sm">
                📋 Sprint Retro
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
              <span class="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Search tasks</span>
              <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
                <input
                  type="search"
                  [ngModel]="boardSearch()"
                  (ngModelChange)="boardSearch.set($event)"
                  placeholder="Search by title or description"
                  class="w-full h-11 bg-background border border-border rounded-xl pl-9 pr-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
              </div>
            </label>

            <label class="block min-w-40">
              <span class="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Priority</span>
              <select
                [ngModel]="priorityFilter()"
                (ngModelChange)="priorityFilter.set($event)"
                class="w-full h-11 bg-background border border-border rounded-xl px-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                <option value="All">All priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>

            <label class="block min-w-40">
              <span class="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">Type</span>
              <select
                [ngModel]="typeFilter()"
                (ngModelChange)="typeFilter.set($event)"
                class="w-full h-11 bg-background border border-border rounded-xl px-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                <option value="All">All types</option>
                <option value="Feature">Feature</option>
                <option value="Bug">Bug</option>
                <option value="Refactor">Refactor</option>
              </select>
            </label>

            <button
              type="button"
              (click)="resetBoardFilters()"
              [disabled]="!hasActiveBoardFilters()"
              class="h-11 px-4 border border-border text-text-secondary hover:text-text-primary hover:bg-background disabled:opacity-45 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all">
              Clear filters
            </button>
          </div>

          <div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary">
            <span>Showing {{ visibleTasksCount() }} of {{ totalTasksCount() }} tasks. Each column loads in focused batches.</span>
            @if (isBoardReadonly()) {
              <span class="px-2.5 py-1 rounded-full bg-warning/10 text-warning font-semibold">Drag is disabled (Project is {{ projectState.selectedProject()?.status }})</span>
            } @else if (hasActiveBoardFilters()) {
              <span class="px-2.5 py-1 rounded-full bg-warning/10 text-warning font-semibold">Drag is paused while filters are active</span>
            }
          </div>
        </div>
        <!-- Kanban columns -->
        <div cdkDropListGroup class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          <!-- TO DO -->
          <div class="flex flex-col bg-sidebar border border-border rounded-2xl p-4 min-h-[500px]">
            <div class="flex items-center justify-between mb-4 px-1">
              <span class="text-sm font-bold text-text-primary uppercase tracking-wider">To Do</span>
              <span class="px-2 py-0.5 text-xs font-semibold bg-gray-200 dark:bg-border text-text-secondary rounded-full">{{ todo().length }}</span>
            </div>
            
            <div cdkDropList
                 id="todo-list"
                 [cdkDropListData]="todo()"
                 (cdkDropListDropped)="drop($event)"
                 class="flex-1 space-y-3 p-1 rounded-lg">
              @for (task of visibleTodo(); track task.id) {
                <div cdkDrag [cdkDragDisabled]="hasActiveBoardFilters() || isBoardReadonly()" class="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200" [class.cursor-grab]="!hasActiveBoardFilters() && !isBoardReadonly()" [class.cursor-default]="hasActiveBoardFilters() || isBoardReadonly()">
                  <div class="flex items-center justify-between mb-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                          [ngClass]="{
                            'bg-primary/10 text-primary': task.type === 'Feature',
                            'bg-error/10 text-error': task.type === 'Bug',
                            'bg-warning/10 text-warning': task.type === 'Refactor'
                          }">
                      {{ task.type }}
                    </span>
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                          [ngClass]="{
                            'bg-error/10 text-error': task.priority === 'High',
                            'bg-warning/10 text-warning': task.priority === 'Medium',
                            'bg-primary/10 text-primary': task.priority === 'Low'
                          }">
                      {{ task.priority }}
                    </span>
                  </div>
                  <h4 class="font-bold text-text-primary text-[15px] mb-1">{{ task.title }}</h4>
                  <p class="text-text-secondary text-xs line-clamp-2 mb-3">{{ task.description }}</p>
                  <div class="flex items-center justify-between border-t border-border pt-3 mt-3">
                    <span class="text-xs text-text-secondary flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ task.hours }}h
                    </span>
                    <button (click)="openEditModal(task)" class="text-xs text-primary font-semibold hover:underline">
                      {{ projectState.isProjectManager() && !isBoardReadonly() ? 'Edit' : 'View' }}
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="h-24 border border-dashed border-border rounded-xl flex items-center justify-center text-xs text-text-secondary">
                  {{ emptyColumnMessage('todo') }}
                </div>
              }
              @if (visibleTodo().length < filteredTodo().length) {
                <button type="button" (click)="showMore('todo')" class="w-full mt-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-primary hover:bg-primary/5 transition-all">
                  Show {{ remainingTasks('todo') }} more
                </button>
              } @else if (todoLimit() > boardPageSize && filteredTodo().length > boardPageSize) {
                <button type="button" (click)="showLess('todo')" class="w-full mt-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-text-secondary hover:text-text-primary transition-all">
                  Show less
                </button>
              }
            </div>
          </div>

          <!-- IN PROGRESS -->
          <div class="flex flex-col bg-sidebar border border-border rounded-2xl p-4 min-h-[500px]">
            <div class="flex items-center justify-between mb-4 px-1">
              <span class="text-sm font-bold text-text-primary uppercase tracking-wider">In Progress</span>
              <span class="px-2 py-0.5 text-xs font-semibold bg-warning/15 text-warning rounded-full">{{ inProgress().length }}</span>
            </div>

            <div cdkDropList
                 id="in-progress-list"
                 [cdkDropListData]="inProgress()"
                 (cdkDropListDropped)="drop($event)"
                 class="flex-1 space-y-3 p-1 rounded-lg">
              @for (task of visibleInProgress(); track task.id) {
                <div cdkDrag [cdkDragDisabled]="hasActiveBoardFilters() || isBoardReadonly()" class="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200" [class.cursor-grab]="!hasActiveBoardFilters() && !isBoardReadonly()" [class.cursor-default]="hasActiveBoardFilters() || isBoardReadonly()">
                  <div class="flex items-center justify-between mb-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                          [ngClass]="{
                            'bg-primary/10 text-primary': task.type === 'Feature',
                            'bg-error/10 text-error': task.type === 'Bug',
                            'bg-warning/10 text-warning': task.type === 'Refactor'
                          }">
                      {{ task.type }}
                    </span>
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                          [ngClass]="{
                            'bg-error/10 text-error': task.priority === 'High',
                            'bg-warning/10 text-warning': task.priority === 'Medium',
                            'bg-primary/10 text-primary': task.priority === 'Low'
                          }">
                      {{ task.priority }}
                    </span>
                  </div>
                  <h4 class="font-bold text-text-primary text-[15px] mb-1">{{ task.title }}</h4>
                  <p class="text-text-secondary text-xs line-clamp-2 mb-3">{{ task.description }}</p>
                  <div class="flex items-center justify-between border-t border-border pt-3 mt-3">
                    <span class="text-xs text-text-secondary flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ task.hours }}h
                    </span>
                    <button (click)="openEditModal(task)" class="text-xs text-primary font-semibold hover:underline">Edit</button>
                  </div>
                </div>
              } @empty {
                <div class="h-24 border border-dashed border-border rounded-xl flex items-center justify-center text-xs text-text-secondary">
                  {{ emptyColumnMessage('inProgress') }}
                </div>
              }
              @if (visibleInProgress().length < filteredInProgress().length) {
                <button type="button" (click)="showMore('inProgress')" class="w-full mt-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-primary hover:bg-primary/5 transition-all">
                  Show {{ remainingTasks('inProgress') }} more
                </button>
              } @else if (inProgressLimit() > boardPageSize && filteredInProgress().length > boardPageSize) {
                <button type="button" (click)="showLess('inProgress')" class="w-full mt-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-text-secondary hover:text-text-primary transition-all">
                  Show less
                </button>
              }
            </div>
          </div>

          <!-- UNDER REVIEW -->
          <div class="flex flex-col bg-sidebar border border-border rounded-2xl p-4 min-h-[500px]">
            <div class="flex items-center justify-between mb-4 px-1">
              <span class="text-sm font-bold text-text-primary uppercase tracking-wider">Review</span>
              <span class="px-2 py-0.5 text-xs font-semibold bg-info/15 text-info rounded-full">{{ review().length }}</span>
            </div>

            <div cdkDropList
                 id="review-list"
                 [cdkDropListData]="review()"
                 (cdkDropListDropped)="drop($event)"
                 class="flex-1 space-y-3 p-1 rounded-lg">
              @for (task of visibleReview(); track task.id) {
                <div cdkDrag [cdkDragDisabled]="hasActiveBoardFilters() || isBoardReadonly()" class="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200" [class.cursor-grab]="!hasActiveBoardFilters() && !isBoardReadonly()" [class.cursor-default]="hasActiveBoardFilters() || isBoardReadonly()">
                  <div class="flex items-center justify-between mb-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                          [ngClass]="{
                            'bg-primary/10 text-primary': task.type === 'Feature',
                            'bg-error/10 text-error': task.type === 'Bug',
                            'bg-warning/10 text-warning': task.type === 'Refactor'
                          }">
                      {{ task.type }}
                    </span>
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                          [ngClass]="{
                            'bg-error/10 text-error': task.priority === 'High',
                            'bg-warning/10 text-warning': task.priority === 'Medium',
                            'bg-primary/10 text-primary': task.priority === 'Low'
                          }">
                      {{ task.priority }}
                    </span>
                  </div>
                  <h4 class="font-bold text-text-primary text-[15px] mb-1">{{ task.title }}</h4>
                  <p class="text-text-secondary text-xs line-clamp-2 mb-3">{{ task.description }}</p>
                  <div class="flex items-center justify-between border-t border-border pt-3 mt-3">
                    <span class="text-xs text-text-secondary flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ task.hours }}h
                    </span>
                    <button (click)="openEditModal(task)" class="text-xs text-primary font-semibold hover:underline">Edit</button>
                  </div>
                </div>
              } @empty {
                <div class="h-24 border border-dashed border-border rounded-xl flex items-center justify-center text-xs text-text-secondary">
                  {{ emptyColumnMessage('review') }}
                </div>
              }
              @if (visibleReview().length < filteredReview().length) {
                <button type="button" (click)="showMore('review')" class="w-full mt-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-primary hover:bg-primary/5 transition-all">
                  Show {{ remainingTasks('review') }} more
                </button>
              } @else if (reviewLimit() > boardPageSize && filteredReview().length > boardPageSize) {
                <button type="button" (click)="showLess('review')" class="w-full mt-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-text-secondary hover:text-text-primary transition-all">
                  Show less
                </button>
              }
            </div>
          </div>

          <!-- DONE -->
          <div class="flex flex-col bg-sidebar border border-border rounded-2xl p-4 min-h-[500px]">
            <div class="flex items-center justify-between mb-4 px-1">
              <span class="text-sm font-bold text-text-primary uppercase tracking-wider">Done</span>
              <span class="px-2 py-0.5 text-xs font-semibold bg-success/15 text-success rounded-full">{{ done().length }}</span>
            </div>

            <div cdkDropList
                 id="done-list"
                 [cdkDropListData]="done()"
                 (cdkDropListDropped)="drop($event)"
                 class="flex-1 space-y-3 p-1 rounded-lg">
              @for (task of visibleDone(); track task.id) {
                <div cdkDrag [cdkDragDisabled]="hasActiveBoardFilters() || isBoardReadonly()" class="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200" [class.cursor-grab]="!hasActiveBoardFilters() && !isBoardReadonly()" [class.cursor-default]="hasActiveBoardFilters() || isBoardReadonly()">
                  <div class="flex items-center justify-between mb-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                          [ngClass]="{
                            'bg-primary/10 text-primary': task.type === 'Feature',
                            'bg-error/10 text-error': task.type === 'Bug',
                            'bg-warning/10 text-warning': task.type === 'Refactor'
                          }">
                      {{ task.type }}
                    </span>
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                          [ngClass]="{
                            'bg-error/10 text-error': task.priority === 'High',
                            'bg-warning/10 text-warning': task.priority === 'Medium',
                            'bg-primary/10 text-primary': task.priority === 'Low'
                          }">
                      {{ task.priority }}
                    </span>
                  </div>
                  <h4 class="font-bold text-text-primary text-[15px] mb-1 line-through opacity-75">{{ task.title }}</h4>
                  <p class="text-text-secondary text-xs line-clamp-2 mb-3">{{ task.description }}</p>
                  <div class="flex items-center justify-between border-t border-border pt-3 mt-3">
                    <span class="text-xs text-text-secondary flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ task.hours }}h
                    </span>
                    <button (click)="openEditModal(task)" class="text-xs text-primary font-semibold hover:underline">Edit</button>
                  </div>
                </div>
              } @empty {
                <div class="h-24 border border-dashed border-border rounded-xl flex items-center justify-center text-xs text-text-secondary">
                  {{ emptyColumnMessage('done') }}
                </div>
              }
              @if (visibleDone().length < filteredDone().length) {
                <button type="button" (click)="showMore('done')" class="w-full mt-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-primary hover:bg-primary/5 transition-all">
                  Show {{ remainingTasks('done') }} more
                </button>
              } @else if (doneLimit() > boardPageSize && filteredDone().length > boardPageSize) {
                <button type="button" (click)="showLess('done')" class="w-full mt-3 py-2.5 rounded-xl border border-border bg-surface text-xs font-bold text-text-secondary hover:text-text-primary transition-all">
                  Show less
                </button>
              }
            </div>
          </div>

        </div>
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
                  {{ isEditing() ? 'Task Details' : 'Create New Task' }}
                </h3>
                <p class="text-[11px] font-bold text-text-secondary uppercase tracking-wider mt-0.5">
                  {{ isEditing() ? 'Manage task info and chat' : 'Add to your backlog' }}
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
            <div class="grid grid-cols-1 gap-8 h-full" [ngClass]="isEditing() ? 'lg:grid-cols-[1fr_1fr]' : ''">
              
              <!-- LEFT COLUMN: Main Task Info & Form -->
              <div class="space-y-6 flex flex-col">
                @if (projectState.isProjectManager()) {
                  <div>
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">Task Title</label>
                    <input type="text" [(ngModel)]="modalTask().title" 
                           placeholder="What needs to be done?"
                           class="w-full px-4 py-3.5 border border-border bg-surface text-text-primary rounded-xl outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all duration-200 font-extrabold text-[15px] shadow-sm placeholder:text-text-secondary/50" />
                  </div>

                  <div>
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">Description</label>
                    <textarea [(ngModel)]="modalTask().description" rows="5"
                              placeholder="Provide more context..."
                              class="w-full px-4 py-3.5 border border-border bg-surface text-text-primary rounded-xl outline-none focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all duration-200 resize-none font-medium text-[13px] shadow-sm leading-relaxed placeholder:text-text-secondary/50"></textarea>
                  </div>

                  <div class="grid grid-cols-2 gap-5 relative">
                    <div class="relative">
                      <label class="block text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">Priority</label>
                      <button type="button" (click)="togglePrioritySelect()"
                              class="w-full flex items-center justify-between px-4 py-3 border border-border bg-background hover:bg-surface text-text-primary rounded-xl transition-all duration-200 font-bold text-[13px] shadow-sm">
                        <div class="flex items-center gap-2">
                          <span class="w-2.5 h-2.5 rounded-full" 
                                [ngClass]="{'bg-error': modalTask().priority === 'High', 'bg-amber-500': modalTask().priority === 'Medium', 'bg-emerald-500': modalTask().priority === 'Low'}"></span>
                          {{ modalTask().priority }}
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
                                {{ p }}
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
                      <label class="block text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">Type</label>
                      <button type="button" (click)="toggleTypeSelect()"
                              class="w-full flex items-center justify-between px-4 py-3 border border-border bg-background hover:bg-surface text-text-primary rounded-xl transition-all duration-200 font-bold text-[13px] shadow-sm">
                        <div class="flex items-center gap-2">
                          <span class="text-lg leading-none" [ngSwitch]="modalTask().type">
                            <ng-container *ngSwitchCase="'Feature'">✨</ng-container>
                            <ng-container *ngSwitchCase="'Bug'">🐛</ng-container>
                            <ng-container *ngSwitchCase="'Refactor'">♻️</ng-container>
                          </span>
                          {{ modalTask().type }}
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
                                {{ t }}
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
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">Estimation</label>
                    <div class="relative">
                      <div class="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <input type="number" [(ngModel)]="modalTask().hours" 
                             class="w-full pl-10 pr-16 py-3 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 font-bold text-[13px] shadow-sm" />
                      <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary uppercase">hrs</span>
                    </div>
                  </div>
                } @else {
                  <div class="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div class="p-6 space-y-4">
                      <h4 class="text-2xl font-black text-text-primary leading-tight tracking-tight">{{ modalTask().title }}</h4>
                      <p class="text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap font-medium bg-background border border-border/50 rounded-xl p-4">{{ modalTask().description || 'No description provided.' }}</p>
                    </div>
                    <div class="grid grid-cols-3 divide-x divide-border border-t border-border bg-background text-center">
                      <div class="p-4 hover:bg-surface transition-colors cursor-default">
                        <span class="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">Type</span>
                        <span class="text-text-primary font-extrabold text-sm flex items-center justify-center gap-1.5">
                          <span class="text-lg leading-none" [ngSwitch]="modalTask().type">
                            <ng-container *ngSwitchCase="'Feature'">✨</ng-container>
                            <ng-container *ngSwitchCase="'Bug'">🐛</ng-container>
                            <ng-container *ngSwitchCase="'Refactor'">♻️</ng-container>
                          </span>
                          {{ modalTask().type }}
                        </span>
                      </div>
                      <div class="p-4 hover:bg-surface transition-colors cursor-default">
                        <span class="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">Priority</span>
                        <span class="text-text-primary font-extrabold text-sm flex items-center justify-center gap-1.5">
                          <span class="w-2.5 h-2.5 rounded-full" 
                                [ngClass]="{'bg-error': modalTask().priority === 'High', 'bg-amber-500': modalTask().priority === 'Medium', 'bg-emerald-500': modalTask().priority === 'Low'}"></span>
                          {{ modalTask().priority }}
                        </span>
                      </div>
                      <div class="p-4 hover:bg-surface transition-colors cursor-default">
                        <span class="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">Estimated</span>
                        <span class="text-text-primary font-extrabold text-sm flex items-center justify-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {{ modalTask().hours }}h
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Actual Hours Spent</label>
                    <div class="relative">
                      <input type="number" [(ngModel)]="employeeActualHours" min="0" step="0.5"
                             class="w-full px-4 py-3.5 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200 font-bold"
                             placeholder="e.g. 4.5" />
                      <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary">hours</span>
                    </div>
                    <p class="text-xs text-text-secondary mt-2 font-medium">Update the actual hours you spent working on this task.</p>
                  </div>
                }

                <div class="flex-1"></div> <!-- Spacer -->

                <!-- Buttons inside left column if it's editing -->
                @if (isEditing()) {
                  <div class="flex items-center space-x-3 pt-6 border-t border-border mt-6">
                    @if (projectState.isProjectManager() && !isBoardReadonly()) {
                      <button (click)="deleteTask()" class="px-5 py-3 text-error hover:bg-error/10 font-bold rounded-xl transition-colors">
                        Delete Task
                      </button>
                    }
                    <div class="flex-1"></div>
                    <button (click)="closeModal()" class="px-5 py-3 border border-border text-text-secondary hover:text-text-primary hover:bg-surface font-bold rounded-xl transition-colors">
                      Cancel
                    </button>
                    @if (!isBoardReadonly()) {
                      <button (click)="saveTask()" class="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md shadow-primary/20 transition-all hover:-translate-y-px">
                        {{ projectState.isProjectManager() ? 'Save Changes' : 'Save Hours' }}
                      </button>
                    }
                  </div>
                }
              </div>

              <!-- RIGHT COLUMN: Discussion & AI Coach -->
              @if (isEditing()) {
                <div class="flex flex-col h-full border-border lg:border-l lg:pl-8 space-y-6 lg:pt-0 pt-6 border-t lg:border-t-0">
                  <!-- Agile Coach Features -->
                  @if (projectState.isProjectManager()) {
                    <div class="space-y-4 shrink-0">
                      <app-agile-coach-summary
                        [taskItemId]="modalTask().id"
                        [lang]="currentLang"
                        (openChat)="isChatOpen.set(true)"
                      />

                      <app-agile-coach-chat
                        [taskItemId]="modalTask().id"
                        [lang]="currentLang"
                        [isOpen]="isChatOpen()"
                        (closed)="isChatOpen.set(false)"
                      />
                    </div>
                  }

                  <!-- Task Discussion Component -->
                  <div class="flex-1 min-h-[400px] flex flex-col bg-background rounded-2xl border border-border shadow-inner overflow-hidden">
                    <app-task-discussion [taskId]="modalTask().id" class="flex-1" />
                  </div>
                </div>
              }
            </div>
          </div>
          
          <!-- Bottom Buttons (For Add Mode) -->
          @if (!isEditing()) {
            <div class="p-6 border-t border-border flex items-center justify-end space-x-3 bg-surface rounded-b-2xl shrink-0">
              <button (click)="closeModal()" class="px-5 py-3 border border-border text-text-secondary hover:text-text-primary hover:bg-background font-bold rounded-xl transition-colors">
                Cancel
              </button>
              <button (click)="saveTask()" class="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md shadow-primary/20 transition-all hover:-translate-y-px">
                Create Task
              </button>
            </div>
          }
        </div>
      </div>
    }



    @if (isRetroModalOpen() && (activeSprintId() || completedSprintId())) {
      <app-retrospective-modal [sprintId]="(activeSprintId() || completedSprintId())!" (close)="isRetroModalOpen.set(false)"></app-retrospective-modal>
    }
  `
})
export class BoardComponent implements OnInit {
  overrideSprintId: string | null = null;
  overrideSprintStatus: string | null = null;
  private route = inject(ActivatedRoute);
  private backlogService = inject(BacklogService);
  private sprintService = inject(SprintPlanningService);
  private assignmentService = inject(AssignmentService);
  public projectState = inject(ProjectStateService);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);
  private router = inject(Router);
  private tasksService = inject(TasksService);

  employeeActualHours = 0;

  isBoardReadonly = computed(() => {
    return this.projectState.selectedProject()?.status === 'Completed' || this.projectState.selectedProject()?.status === 'Archived';
  });

  // Loading and assignment status signals
  isLoading = signal(true);
  isAssignedToProject = signal(false);
  projectName = signal('');

  // Real active ids
  activeProjectId = '';
  activeUserStoryId = '';
  activeSprintId = signal<string | null>(null);
  plannedSprintId = signal<string | null>(null);
  completedSprintId = signal<string | null>(null);
  sprintStatus = signal<string | null>(null);
  isRetroModalOpen = signal(false);
  isChatOpen = signal(false);

  get currentLang(): string {
    return localStorage?.getItem('app_lang') || 'en';
  }

  // Task columns
  todo = signal<Task[]>([]);
  inProgress = signal<Task[]>([]);
  review = signal<Task[]>([]);
  done = signal<Task[]>([]);

  totalTasksCount = computed(() => {
    return this.todo().length + this.inProgress().length + this.review().length + this.done().length;
  });
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
    type: 'Feature'
  });

  private originalColumn: 'todo' | 'inProgress' | 'review' | 'done' = 'todo';

  constructor() {
    // Automatically trigger reload when the active selected project changes
    effect(() => {
      const projId = this.projectState.selectedProjectId();
      this.isLoading.set(true);
      this.loadWorkspaceData()
        .catch(err => console.error('Error loading backlog data:', err))
        .finally(() => this.isLoading.set(false));
    });
  }

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.overrideSprintId = params.get('sprintId');
      this.overrideSprintStatus = params.get('status');
      this.sprintStatus.set(this.overrideSprintStatus);
      this.loadWorkspaceData();
    });
  }

  onBackToSprints() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sprintId: null, status: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  goToAssignment() {
    const sprintId = this.plannedSprintId();
    if (sprintId) {
      this.router.navigate(['/assignment', sprintId]);
    }
  }

  async startSprint(): Promise<void> {
    const projectId = this.projectState.selectedProjectId();
    const sprintId = this.plannedSprintId();
    if (!projectId || !sprintId) return;

    try {
      await this.sprintService.startSprint(projectId, sprintId);
      this.toastService.show('Sprint started successfully', 'success');
      this.loadWorkspaceData();
    } catch (error) {
      this.toastService.show('Failed to start sprint', 'error');
    }
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

    const projectInfo = this.projectState.projects().find(p => p.id === projectId);
    this.projectName.set(projectInfo?.nameEn || 'Project');

    // Fetch active sprint to enable retrospectives
    // Step 1: Try to get active sprint — treat 404 as null, not an error
    let activeSprint: { sprintId: string } | null = null;
    try {
      const activeSprintRes = await this.sprintService.getActiveSprint(projectId);
      const resolved = activeSprintRes?.data || activeSprintRes;
      if (resolved && resolved.sprintId) {
        activeSprint = resolved;
      }
    } catch {
      // 404 or any error = no active sprint. Continue to planned check.
      activeSprint = null;
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
    } else {
      this.activeSprintId.set(null);

      // Step 3: Try to get planned sprint — isolated try/catch
      try {
        const plannedSprint = await this.sprintService.getPlannedSprint(projectId);
        if (plannedSprint && plannedSprint.sprintId) {
          this.plannedSprintId.set(plannedSprint.sprintId);
          this.sprintStatus.set('Planned');
        } else {
          this.plannedSprintId.set(null);
          this.sprintStatus.set(null);
        }
      } catch {
        this.plannedSprintId.set(null);
        this.sprintStatus.set(null);
      }

      if (!this.plannedSprintId()) {
        try {
          const completedSprint = await this.sprintService.getLatestCompletedSprint(projectId);
          if (completedSprint && completedSprint.sprintId) {
            this.activeSprintId.set(null);
            this.plannedSprintId.set(null);
            this.completedSprintId.set(completedSprint.sprintId);
            this.sprintStatus.set('Completed');
          } else {
            this.completedSprintId.set(null);
            this.sprintStatus.set(null);
          }
        } catch {
          this.completedSprintId.set(null);
          this.sprintStatus.set(null);
        }
      }
    }

    // 4. Load only the tasks that belong to the sprint being viewed.
    let tasks: any[] = [];
    const sprintId = this.overrideSprintId
      || this.activeSprintId()
      || this.plannedSprintId()
      || this.completedSprintId();

    if (!sprintId) {
      tasks = [];
    } else if (this.projectState.isProjectManager()) {
      try {
        tasks = await this.tasksService.getSprintTasks(this.activeProjectId, sprintId);
        this.activeUserStoryId = tasks[0]?.userStoryId || '';
      } catch (err) {
        console.error('Failed to load sprint tasks:', err);
        this.activeUserStoryId = '';
        tasks = [];
      }
    } else {
      // Load only this employee's assignments for the selected sprint.
      try {
        tasks = await this.tasksService.getMySprintTasks(this.activeProjectId, sprintId);
      } catch (err) {
        console.error('Error loading employee sprint tasks:', err);
        tasks = [];
      }
    }

    // 5. Populate task columns from real data
    const todoList: Task[] = [];
    const inProgressList: Task[] = [];
    const reviewList: Task[] = [];
    const doneList: Task[] = [];

    for (const t of tasks) {
      const task: Task = {
        id: t.id || t.taskId,
        userStoryId: t.userStoryId || '',
        title: t.titleEn,
        description: t.descriptionEn || '',
        priority: mapPriorityToFrontend(t.priority),
        hours: t.estimatedHours || 0,
        type: mapTypeToFrontend(t.type)
      };
      (task as any).actualHours = t.actualHours || 0;

      const col = mapStatusToFrontend(t.status);
      if (col === 'todo') todoList.push(task);
      else if (col === 'inProgress') inProgressList.push(task);
      else if (col === 'review') reviewList.push(task);
      else if (col === 'done') doneList.push(task);
    }

    this.todo.set(todoList);
    this.inProgress.set(inProgressList);
    this.review.set(reviewList);
    this.done.set(doneList);
  }

  private filterTasks(tasks: Task[]): Task[] {
    const query = this.boardSearch().trim().toLowerCase();
    const priority = this.priorityFilter();
    const type = this.typeFilter();

    return tasks.filter(task => {
      const matchesSearch = !query || `${task.title} ${task.description}`.toLowerCase().includes(query);
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
    if (this.hasActiveBoardFilters()) return 'No matching tasks';
    if (column === 'todo') return 'No tasks to do';
    if (column === 'inProgress') return 'Drop tasks here to start';
    if (column === 'review') return 'Drop tasks for validation';
    return 'No completed tasks yet';
  }
  async drop(event: CdkDragDrop<Task[]>) {
    if (this.hasActiveBoardFilters()) {
      this.toastService.show('Clear filters before moving tasks on the board.', 'error');
      return;
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const task = event.container.data[event.currentIndex];
      const targetColumnId = event.container.id;

      let newStatus = 'todo';
      if (targetColumnId === 'in-progress-list') newStatus = 'inProgress';
      else if (targetColumnId === 'review-list') newStatus = 'review';
      else if (targetColumnId === 'done-list') newStatus = 'done';

      try {
        if (this.projectState.isProjectManager()) {
          await this.backlogService.updateTask(task.id, {
            titleEn: task.title,
            descriptionEn: task.description,
            estimatedHours: task.hours,
            effortSize: 'Medium',
            priority: task.priority,
            type: task.type,
            status: newStatus
          });
        } else {
          const statusEnum = this.mapColumnToEnum(newStatus);
          
          const response = await this.tasksService.updateTaskStatus(task.id, statusEnum);
          if (statusEnum === TaskItemStatus.Done && response?.actualHours !== undefined) {
            this.employeeActualHours = response.actualHours;
            // Optionally update the task object if it has an actualHours field
            (task as any).actualHours = response.actualHours;
          }
          this.toastService.show('Task status updated successfully.', 'success');
        }
      } catch (err) {
        console.error('Failed to update task status in backend:', err);
        this.toastService.show('Failed to update task status.', 'error');
        // Rollback status visually? The current logic just re-renders from state
      }
    }

    this.todo.set([...this.todo()]);
    this.inProgress.set([...this.inProgress()]);
    this.review.set([...this.review()]);
    this.done.set([...this.done()]);
  }

  private mapColumnToEnum(column: string): TaskItemStatus {
    if (column === 'inProgress') return TaskItemStatus.InProgress;
    if (column === 'review') return TaskItemStatus.Review;
    if (column === 'done') return TaskItemStatus.Done;
    return TaskItemStatus.ToDo;
  }

  openEditModal(task: Task) {
    this.isChatOpen.set(false);
    this.isEditing.set(true);
    if (this.todo().some(t => t.id === task.id)) this.originalColumn = 'todo';
    else if (this.inProgress().some(t => t.id === task.id)) this.originalColumn = 'inProgress';
    else if (this.review().some(t => t.id === task.id)) this.originalColumn = 'review';
    else if (this.done().some(t => t.id === task.id)) this.originalColumn = 'done';

    this.modalTask.set({ ...task });
    this.employeeActualHours = (task as any).actualHours || 0;
    this.showModal.set(true);
  }

  closeModal() {
    this.isChatOpen.set(false);
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
            titleEn: taskData.title,
            descriptionEn: taskData.description,
            estimatedHours: taskData.hours,
            effortSize: 'Medium',
            priority: taskData.priority,
            type: taskData.type,
            status: this.originalColumn
          });
        } else {
          await this.backlogService.createTask(this.activeUserStoryId, {
            titleEn: taskData.title,
            descriptionEn: taskData.description,
            estimatedHours: taskData.hours,
            effortSize: 'Medium',
            priority: taskData.priority,
            type: taskData.type,
            status: 'todo'
          });
        }
      } else {
        // Employee saving log actual hours
        await this.tasksService.logActualHours(taskData.id, this.employeeActualHours);
        this.toastService.show('Actual hours logged successfully.', 'success');
      }
      this.closeModal();
      await this.loadWorkspaceData();
    } catch (err) {
      console.error('Error saving task:', err);
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
    }
  }

  async completeSprintFromBoard(): Promise<void> {
    const projectId = this.projectState.selectedProjectId();
    const sprintId = this.activeSprintId();
    if (!projectId || !sprintId) return;

    try {
      await this.sprintService.completeSprint(projectId, sprintId);
      this.toastService.show('Sprint completed successfully', 'success');
      this.loadWorkspaceData();
    } catch {
      this.toastService.show('Failed to complete sprint', 'error');
    }
  }
}






