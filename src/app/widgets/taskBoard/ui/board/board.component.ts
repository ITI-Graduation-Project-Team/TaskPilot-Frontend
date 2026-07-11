import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject, effect } from '@angular/core';
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
  imports: [CommonModule, FormsModule, DragDropModule, RetrospectiveModalComponent, AgileCoachSummaryComponent, AgileCoachChatComponent],
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
        <div class="bg-surface border border-border p-8 rounded-2xl shadow-lg max-w-xl mx-auto my-8 animate-[fadeUp_0.3s_ease_both]">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-text-primary">Create Your First Project</h3>
              <p class="text-text-secondary text-xs mt-0.5">Let's set up a workspace for your team.</p>
            </div>
          </div>

          <form (submit)="onCreateProject($event)" class="space-y-5">
            <div>
              <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Project Name (English)</label>
              <input type="text" name="projNameEn" required placeholder="e.g. E-Commerce Platform" 
                     class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
            </div>
            <div>
              <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">اسم المشروع (عربي)</label>
              <input type="text" name="projNameAr" required placeholder="مثال: منصة التجارة الإلكترونية" dir="rtl"
                     class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
            </div>
            <div>
              <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Description</label>
              <textarea name="projDesc" placeholder="Brief details about the project scope..." rows="3" required
                        class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"></textarea>
            </div>

            <button type="submit" 
                    class="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md shadow-primary/10 transition-all duration-200 hover:-translate-y-px active:translate-y-0">
              Create Project
            </button>
          </form>
        </div>
      } @else if (!isAssignedToProject()) {
        <!-- Warning Panel for unassigned employee -->
        <div class="bg-surface border border-warning/30 p-8 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto my-12 transition-colors duration-200">
          <div class="w-16 h-16 bg-warning/10 text-warning rounded-2xl flex items-center justify-center shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-text-primary">No Project Assignment</h3>
            <p class="text-text-secondary text-sm mt-2 max-w-md">
              You are currently not assigned to any projects. Please ask your Project Manager or Admin to assign you to a project to start viewing and executing tasks.
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
            <h2 class="text-2xl font-bold text-text-primary">{{ projectName() }} Workspace</h2>
            <p class="text-text-secondary text-sm">Drag and drop tasks to update their current progress state.</p>
          </div>
          
          <div class="flex items-center gap-3">
            @if (projectState.isProjectManager() && activeSprintId()) {
              <button (click)="isRetroModalOpen.set(true)" 
                      class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:-translate-y-px active:translate-y-0 text-sm">
                📋 Sprint Retro
              </button>
            }
          </div>
        </div>


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
            @if (hasActiveBoardFilters()) {
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
                <div cdkDrag [cdkDragDisabled]="hasActiveBoardFilters()" class="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200" [class.cursor-grab]="!hasActiveBoardFilters()" [class.cursor-default]="hasActiveBoardFilters()">
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
                      {{ projectState.isProjectManager() ? 'Edit' : 'View' }}
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
                <div cdkDrag [cdkDragDisabled]="hasActiveBoardFilters()" class="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200" [class.cursor-grab]="!hasActiveBoardFilters()" [class.cursor-default]="hasActiveBoardFilters()">
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
                <div cdkDrag [cdkDragDisabled]="hasActiveBoardFilters()" class="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200" [class.cursor-grab]="!hasActiveBoardFilters()" [class.cursor-default]="hasActiveBoardFilters()">
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
                <div cdkDrag [cdkDragDisabled]="hasActiveBoardFilters()" class="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200" [class.cursor-grab]="!hasActiveBoardFilters()" [class.cursor-default]="hasActiveBoardFilters()">
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
        <div class="bg-surface border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-border">
            <h3 class="text-lg font-bold text-text-primary">
              Modify Task Details
            </h3>
            <button (click)="closeModal()" class="text-text-secondary hover:text-text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Form -->
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">Task Title</label>
              <input type="text" [(ngModel)]="modalTask().title" [disabled]="!projectState.isProjectManager()"
                     class="w-full px-3.5 py-2 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary transition-all duration-200 disabled:opacity-75 disabled:bg-surface" />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">Description</label>
              <textarea [(ngModel)]="modalTask().description" rows="3" [disabled]="!projectState.isProjectManager()"
                        class="w-full px-3.5 py-2 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary transition-all duration-200 disabled:opacity-75 disabled:bg-surface"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">Priority</label>
                <select [(ngModel)]="modalTask().priority" [disabled]="!projectState.isProjectManager()"
                        class="w-full px-3.5 py-2 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary transition-all duration-200 disabled:opacity-75 disabled:bg-surface">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">Type</label>
                <select [(ngModel)]="modalTask().type" [disabled]="!projectState.isProjectManager()"
                        class="w-full px-3.5 py-2 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary transition-all duration-200 disabled:opacity-75 disabled:bg-surface">
                  <option value="Feature">Feature</option>
                  <option value="Bug">Bug</option>
                  <option value="Refactor">Refactor</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">Estimation (Hours)</label>
              <input type="number" [(ngModel)]="modalTask().hours" [disabled]="!projectState.isProjectManager()"
                     class="w-full px-3.5 py-2 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary transition-all duration-200 disabled:opacity-75 disabled:bg-surface" />
            </div>

            <!-- Agile Coach Features (only for existing tasks and Project Managers) -->
            @if (isEditing() && projectState.isProjectManager()) {
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
            }
          </div>

          <!-- Buttons -->
          <div class="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            @if (isEditing() && projectState.isProjectManager()) {
              <button (click)="deleteTask()" class="px-4 py-2 text-error hover:bg-error/10 font-semibold rounded-xl mr-auto">
                Delete Task
              </button>
            }
            <button (click)="closeModal()" class="px-4 py-2 border border-border text-text-secondary hover:text-text-primary rounded-xl">
              {{ projectState.isProjectManager() ? 'Cancel' : 'Close' }}
            </button>
            @if (projectState.isProjectManager()) {
              <button (click)="saveTask()" class="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-md shadow-primary/10">
                Save changes
              </button>
            }
          </div>
        </div>
      </div>
    }

    <!-- Retrospective Modal -->
    @if (isRetroModalOpen() && activeSprintId()) {
      <app-retrospective-modal [sprintId]="activeSprintId()!" (close)="isRetroModalOpen.set(false)"></app-retrospective-modal>
    }
  `
})
export class BoardComponent implements OnInit {
  private backlogService = inject(BacklogService);
  private sprintService = inject(SprintPlanningService);
  public projectState = inject(ProjectStateService);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  // Loading and assignment status signals
  isLoading = signal(true);
  isAssignedToProject = signal(false);
  projectName = signal('');
  
  // Real active ids
  activeProjectId = '';
  activeUserStoryId = '';
  activeSprintId = signal<string | null>(null);
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

  async ngOnInit() {}

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
    try {
      const activeSprintRes = await this.sprintService.getActiveSprint(projectId);
      const activeSprint = activeSprintRes?.data || activeSprintRes;
      if (activeSprint && activeSprint.id) {
        this.activeSprintId.set(activeSprint.id);
      } else {
        this.activeSprintId.set(null);
      }
    } catch (e) {
      this.activeSprintId.set(null);
    }

    // 4. Load backlog
    let backlog = await this.backlogService.getBacklog(this.activeProjectId);
    let userStory = backlog?.userStories?.[0];
    
    // Automatically create a user story if somehow missing
    if (!userStory) {
      userStory = await this.backlogService.createUserStory(this.activeProjectId, {
        titleEn: 'Sprint Backlog Story',
        titleAr: '\u0642\u0635\u0629 \u0645\u0647\u0627\u0645 \u0627\u0644\u0633\u0628\u0631\u0646\u062a',
        descriptionEn: 'Auto generated story for managing project tasks.',
        descriptionAr: '\u0642\u0635\u0629 \u062a\u0644\u0642\u0627\u0626\u064a\u0629 \u0644\u0625\u062f\u0627\u0631\u0629 \u0645\u0647\u0627\u0645 \u0627\u0644\u0645\u0634\u0631\u0648\u0639.',
        acceptanceCriteriaEn: 'Tasks can be created, updated, moved, and tracked.',
        acceptanceCriteriaAr: '\u064a\u0645\u0643\u0646 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0647\u0627\u0645 \u0648\u062a\u062d\u062f\u064a\u062b\u0647\u0627 \u0648\u0646\u0642\u0644\u0647\u0627 \u0648\u062a\u062a\u0628\u0639\u0647\u0627.',
        priority: 'Medium'
      });
    }
    this.activeUserStoryId = userStory.id;

    // Refresh backlog tasks
    backlog = await this.backlogService.getBacklog(this.activeProjectId);
    const tasks = backlog?.userStories?.flatMap(us => us.tasks) || [];

    // 5. Populate task columns from real data
    const todoList: Task[] = [];
    const inProgressList: Task[] = [];
    const reviewList: Task[] = [];
    const doneList: Task[] = [];

    for (const t of tasks) {
      const task: Task = {
        id: t.id,
        userStoryId: t.userStoryId,
        title: t.titleEn,
        description: t.descriptionEn || '',
        priority: mapPriorityToFrontend(t.priority),
        hours: t.estimatedHours,
        type: mapTypeToFrontend(t.type)
      };

      const status = mapStatusToFrontend(t.status);
      if (status === 'inProgress') inProgressList.push(task);
      else if (status === 'review') reviewList.push(task);
      else if (status === 'done') doneList.push(task);
      else todoList.push(task);
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
        await this.backlogService.updateTask(task.id, {
          titleEn: task.title,
          descriptionEn: task.description,
          estimatedHours: task.hours,
          effortSize: 'Medium',
          priority: task.priority,
          type: task.type,
          status: newStatus
        });
      } catch (err) {
        console.error('Failed to update task status in backend:', err);
      }
    }

    this.todo.set([...this.todo()]);
    this.inProgress.set([...this.inProgress()]);
    this.review.set([...this.review()]);
    this.done.set([...this.done()]);
  }

  openEditModal(task: Task) {
    this.isChatOpen.set(false);
    this.isEditing.set(true);
    if (this.todo().some(t => t.id === task.id)) this.originalColumn = 'todo';
    else if (this.inProgress().some(t => t.id === task.id)) this.originalColumn = 'inProgress';
    else if (this.review().some(t => t.id === task.id)) this.originalColumn = 'review';
    else if (this.done().some(t => t.id === task.id)) this.originalColumn = 'done';

    this.modalTask.set({ ...task });
    this.showModal.set(true);
  }

  closeModal() {
    this.isChatOpen.set(false);
    this.showModal.set(false);
  }

  async saveTask() {
    const taskData = this.modalTask();
    if (!taskData.title.trim()) {
      this.toastService.show('Task title is required.', 'error');
      return;
    }

    try {
      this.isLoading.set(true);
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
    const desc = (form.elements.namedItem('projDesc') as HTMLTextAreaElement).value;

    const success = await this.projectState.createNewProject(nameEn, nameAr, desc);
    if (success) {
      form.reset();
    }
  }
}






