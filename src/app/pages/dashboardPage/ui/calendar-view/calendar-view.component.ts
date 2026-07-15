import { Component, ChangeDetectionStrategy, signal, computed, effect, inject, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CalendarService, CalendarTask } from '../../../../shared/services/calendar.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { TasksService, TaskItemStatus } from '../../../../shared/api/tasks.service';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: CalendarTask[];
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DragDropModule, TranslatePipe],
  template: `
    <div class="flex flex-col h-full bg-background text-text-primary p-4 md:p-8 font-dashboard transition-colors duration-200" [dir]="isAr() ? 'rtl' : 'ltr'">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 relative">
        <div class="relative z-10">
          <h2 class="text-3xl font-extrabold font-display bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-secondary tracking-tight">
            {{ 'calendar.title' | translate }}
          </h2>
          <div class="flex items-center gap-3 mt-1.5">
            <div class="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
            <p class="text-text-secondary text-sm font-medium tracking-wide uppercase">
               {{ currentMonthName() }} {{ currentYear() }}
            </p>
          </div>
        </div>
        
        <div class="flex items-center gap-1 bg-surface/80 backdrop-blur-md border border-border/60 p-1.5 rounded-2xl shadow-sm z-10">
          <button (click)="previousMonth()" class="p-2 hover:bg-background text-text-secondary hover:text-primary rounded-xl transition-all hover:-translate-x-0.5 active:scale-95">
            <svg class="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
          </button>
          
          <button (click)="goToToday()" 
                  class="px-5 py-2 text-sm font-extrabold rounded-xl transition-all duration-300 flex items-center gap-2"
                  [class.bg-gradient-to-r]="isNotCurrentMonth()"
                  [class.from-primary]="isNotCurrentMonth()"
                  [class.to-indigo-500]="isNotCurrentMonth()"
                  [class.text-white]="isNotCurrentMonth()"
                  [class.shadow-[0_0_20px_rgba(var(--color-primary),0.3)]]="isNotCurrentMonth()"
                  [class.hover:scale-105]="isNotCurrentMonth()"
                  [class.hover:shadow-[0_0_25px_rgba(var(--color-primary),0.5)]]="isNotCurrentMonth()"
                  [class.active:scale-95]="isNotCurrentMonth()"
                  [class.bg-primary/10]="!isNotCurrentMonth()"
                  [class.text-primary]="!isNotCurrentMonth()"
                  [class.opacity-60]="!isNotCurrentMonth()"
                  [class.cursor-default]="!isNotCurrentMonth()"
                  [disabled]="!isNotCurrentMonth()">
            @if (isNotCurrentMonth()) {
              <span class="relative flex h-2.5 w-2.5 mr-1">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
            }
            {{ isAr() ? 'اليوم' : 'Today' }}
          </button>

          <button (click)="nextMonth()" class="p-2 hover:bg-background text-text-secondary hover:text-primary rounded-xl transition-all hover:translate-x-0.5 active:scale-95">
            <svg class="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      <!-- Workload Summary (PM Only) -->
      @if (isPM() && calendarService.workload().length > 0) {
        <div class="mb-6 bg-surface border border-border rounded-2xl p-4 shadow-sm animate-[fadeIn_0.3s_ease]">
          <h3 class="text-sm font-bold mb-3 text-text-secondary uppercase tracking-wider">{{ 'calendar.workload' | translate }}</h3>
          <div class="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
            @for (w of calendarService.workload(); track w.employeeId) {
              <div class="min-w-[140px] flex items-center gap-3 bg-background border border-border rounded-xl p-3 hover:border-primary/40 transition-colors">
                <div class="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                  {{ w.employeeName.charAt(0) }}
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-bold truncate">{{ w.employeeName }}</p>
                  <p class="text-[10px] text-text-secondary truncate">{{ w.taskCount }} {{ 'calendar.tasksCount' | translate }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Legend -->
      <div class="flex flex-wrap items-center gap-4 mb-4 text-[11px] md:text-xs font-bold text-text-secondary px-2">
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded bg-[#3b82f6]"></div> {{ isAr() ? 'معينة' : 'Assigned' }}</div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded bg-[#22c55e]"></div> {{ isAr() ? 'شخصية' : 'Personal' }}</div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded bg-[#a855f7]"></div> {{ isAr() ? 'اجتماع' : 'Meeting' }}</div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded bg-[#f97316]"></div> {{ isAr() ? 'أخرى' : 'Other' }}</div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded bg-[#94a3b8]"></div> {{ isAr() ? 'مكتملة' : 'Done' }}</div>
      </div>

      <!-- Calendar Grid -->
      <div class="flex-1 bg-surface border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-0 animate-[fadeIn_0.4s_ease]">
        
        <!-- Days Header -->
        <div class="grid grid-cols-7 border-b border-border bg-sidebar/50">
          @for (day of weekDays; track day) {
            <div class="py-3 text-center text-xs font-bold text-text-secondary uppercase tracking-wider">
              {{ 'calendar.days.' + day | translate }}
            </div>
          }
        </div>

        <!-- Days Grid -->
        <div class="flex-1 min-h-0 grid grid-cols-7 auto-rows-fr" 
             cdkDropListGroup>
          @for (day of calendarDays(); track day.date.toISOString(); let idx = $index) {
            <div 
              class="border-b border-r border-border/50 p-1 md:p-2 flex flex-col transition-colors min-h-0"
              [class.bg-background]="!day.isCurrentMonth"
              [class.opacity-60]="!day.isCurrentMonth"
              [class.bg-primary/5]="day.isToday"
              [class.cursor-pointer]="!isPM()"
              [class.hover:bg-primary/5]="!isPM()"
              cdkDropList
              [cdkDropListData]="day.tasks"
              (click)="!isPM() ? openCreateTaskModal(day.date, $event) : null"
              (cdkDropListDropped)="drop($event, day.date)">
              
              <div class="flex justify-between items-start mb-1">
                <button class="text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-transform hover:scale-110 hover:bg-black/5"
                        [class.bg-primary]="day.isToday"
                        [class.text-white]="day.isToday"
                        [class.hover:bg-primary/90]="day.isToday"
                        [class.text-text-primary]="day.isCurrentMonth && !day.isToday"
                        [class.text-text-secondary]="!day.isCurrentMonth"
                        (click)="$event.stopPropagation(); openDayEventsModal(day)">
                  {{ day.date.getDate() }}
                </button>
              </div>

              <!-- Tasks -->
              <div class="flex-1 flex flex-wrap gap-1.5 overflow-y-auto custom-scrollbar min-h-0 pr-0.5 items-start content-start mt-1">
                @for (task of day.tasks; track task.id) {
                  <div 
                    cdkDrag
                    [cdkDragDisabled]="!isPM()"
                    [cdkDragData]="task"
                    class="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shadow-sm hover:scale-150 transition-transform"
                    [class.cursor-grab]="isPM()"
                    [class.cursor-pointer]="!isPM()"
                    [class.opacity-50]="task.status === 'Done'"
                    [style.background]="getTaskColor(task)"
                    (mouseenter)="onTaskMouseEnter(task, $event)"
                    (mouseleave)="onTaskMouseLeave()"
                    (click)="!isPM() ? openEditModal(task, $event) : null">
                    
                    <div *cdkDragPreview class="bg-primary text-white text-[10px] p-2 rounded-lg shadow-xl opacity-90 z-50">
                       {{ isAr() ? (task.titleAr || task.titleEn) : (task.titleEn || task.titleAr) }}
                    </div>
                  </div>
                }
              </div>
              
            </div>
          }
        </div>
      </div>

      <!-- Day Events Modal -->
      @if (showDayEventsModal() && selectedDayEvents()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center animate-[fadeIn_0.2s_ease_both]">
          <div class="absolute inset-0 bg-brandNavy/60 backdrop-blur-sm" (click)="closeDayEventsModal()"></div>
          
          <div class="relative bg-surface border border-border w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl shadow-2xl animate-[scaleUp_0.2s_ease_both]">
            <div class="p-6 border-b border-border/50 flex justify-between items-center shrink-0">
              <h3 class="text-xl font-bold font-display">
                {{ selectedDayEvents()!.date.toLocaleDateString(isAr() ? 'ar-EG' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }}
              </h3>
              <button (click)="closeDayEventsModal()" class="p-2 text-text-secondary hover:text-text-primary hover:bg-black/5 rounded-full transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div class="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-3 flex-1 min-h-0">
              @for (task of selectedDayEvents()!.tasks; track task.id) {
                <div 
                  class="p-4 rounded-xl border shadow-sm transition-all relative flex flex-col gap-2 bg-background hover:border-primary/30"
                  [class.border-border]="task.status !== 'Done'"
                  [class.opacity-70]="task.status === 'Done'"
                  [style.border-left]="'4px solid ' + getTaskColor(task)"
                  (click)="!isPM() ? closeDayEventsModal() : null; openEditModal(task, $event)"
                  [class.cursor-pointer]="!isPM()"
                  [class.hover:shadow-md]="!isPM()">
                  
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex items-start gap-2 font-bold text-sm text-text-primary">
                      @if (task.status === 'Done') {
                        <svg class="w-4 h-4 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                        </svg>
                      } @else {
                        <div class="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-extrabold shrink-0 uppercase"
                             [style.background]="getTaskColor(task) + '20'"
                             [style.color]="getTaskColor(task)">
                          {{ (isAr() ? (task.titleAr || task.titleEn) : (task.titleEn || task.titleAr))?.charAt(0) || 'T' }}
                        </div>
                      }
                      <span [class.line-through]="task.status === 'Done'" [class.text-text-secondary]="task.status === 'Done'" [class.mt-0.5]="task.status !== 'Done'">
                        {{ isAr() ? (task.titleAr || task.titleEn) : (task.titleEn || task.titleAr) }}
                      </span>
                    </div>
                    
                    <span class="text-[10px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap"
                          [style.background]="getTaskColor(task) + '20'"
                          [style.color]="getTaskColor(task)">
                      {{ task.eventType || 'Task' }}
                    </span>
                  </div>
                  
                  @if (task.descriptionEn || task.descriptionAr) {
                    <p class="text-xs text-text-secondary leading-relaxed mt-1">
                      {{ isAr() ? (task.descriptionAr || task.descriptionEn) : (task.descriptionEn || task.descriptionAr) }}
                    </p>
                  }
                  
                  @if (isMultiDay(task)) {
                    <div class="text-[10px] text-text-secondary mt-1 font-bold bg-black/5 self-start px-2 py-1 rounded-md">
                      {{ formatMultiDay(task) }}
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Create Personal Task Modal -->
      @if (showCreateModal()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center animate-[fadeIn_0.2s_ease_both]">
          <div class="absolute inset-0 bg-brandNavy/60 backdrop-blur-sm" (click)="closeCreateModal()"></div>
          
          <div class="relative bg-surface border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 animate-[scaleUp_0.2s_ease_both]">
            <h3 class="text-xl font-bold mb-4 font-display">Add Personal Task</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold text-text-secondary mb-1">Title *</label>
                <input type="text" [(ngModel)]="newTask().title" 
                       class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                       placeholder="e.g. Prepare for meeting">
              </div>

              <div>
                <label class="block text-sm font-bold text-text-secondary mb-1">Description</label>
                <textarea [(ngModel)]="newTask().description" rows="2"
                       class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors resize-none custom-scrollbar"
                       placeholder="Task details..."></textarea>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-bold text-text-secondary mb-1">Start</label>
                  <input type="datetime-local" [(ngModel)]="newTask().startDateTime" 
                         class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors">
                </div>
                
                <div>
                  <label class="block text-sm font-bold text-text-secondary mb-1">End</label>
                  <input type="datetime-local" [(ngModel)]="newTask().endDateTime" 
                         class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors">
                </div>
              </div>

              <div class="mt-4">
                <label class="block text-sm font-bold text-text-secondary mb-1">Priority</label>
                <select [(ngModel)]="newTask().priority" 
                        class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
            
            <div class="flex items-center justify-end gap-3 mt-8">
              <button (click)="closeCreateModal()" 
                      class="px-4 py-2 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors">
                Cancel
              </button>
              <button (click)="saveNewTask()" 
                      [disabled]="!newTask().title"
                      class="px-6 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Save Task
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Edit Personal Task Modal -->
      @if (showEditModal() && editingTask()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center animate-[fadeIn_0.2s_ease_both]">
          <div class="absolute inset-0 bg-brandNavy/60 backdrop-blur-sm" (click)="closeEditModal()"></div>
          
          <div class="relative bg-surface border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 animate-[scaleUp_0.2s_ease_both]">
            <h3 class="text-xl font-bold mb-4 font-display">Edit Task</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold text-text-secondary mb-1">Title *</label>
                <input type="text" [(ngModel)]="editingTask()!.title" 
                       class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                       placeholder="e.g. Prepare for meeting">
              </div>

              <div>
                <label class="block text-sm font-bold text-text-secondary mb-1">Description</label>
                <textarea [(ngModel)]="editingTask()!.description" rows="2"
                       class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors resize-none custom-scrollbar"
                       placeholder="Task details..."></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-bold text-text-secondary mb-1">Start</label>
                  <input type="datetime-local" [(ngModel)]="editingTask()!.startDateTime" 
                         class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors">
                </div>
                
                <div>
                  <label class="block text-sm font-bold text-text-secondary mb-1">End</label>
                  <input type="datetime-local" [(ngModel)]="editingTask()!.endDateTime" 
                         class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label class="block text-sm font-bold text-text-secondary mb-1">Priority</label>
                  <select [(ngModel)]="editingTask()!.priority" 
                          class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-bold text-text-secondary mb-1">Status</label>
                  <select [(ngModel)]="editingTask()!.status" 
                          class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors">
                    <option value="ToDo">To Do</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="flex items-center justify-between mt-8 pt-4 border-t border-border/50">
              <button (click)="deleteEditedTask()" 
                      class="px-4 py-2 text-sm font-bold text-error hover:bg-error/10 transition-colors rounded-xl">
                Delete
              </button>
              <div class="flex items-center gap-2">
                <button (click)="closeEditModal()" 
                        class="px-4 py-2 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors">
                  Cancel
                </button>
                <button (click)="saveEditedTask()" 
                        [disabled]="!editingTask()!.title"
                        class="px-6 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Custom Hover Tooltip Card -->
      @if (hoveredTask(); as hover) {
        <div class="fixed z-[120] -translate-x-1/2 -translate-y-full pb-3 animate-[fadeIn_0.15s_ease_both] pointer-events-auto"
             [style.left.px]="hover.x" [style.top.px]="hover.y"
             (mouseenter)="onTooltipMouseEnter()"
             (mouseleave)="onTooltipMouseLeave()">
          <div class="w-72 md:w-80 bg-surface rounded-2xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.2)] border border-border p-5 flex flex-col gap-4 relative">
             <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-surface border-b border-r border-border rotate-45"></div>
             
             <div class="flex items-start gap-3 relative z-10">
                <div class="flex flex-col items-center justify-center w-11 h-12 bg-background border border-border rounded-xl overflow-hidden shadow-sm shrink-0">
                   <div class="bg-error w-full text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-wider">
                      {{ getMonthStr(hover.task.startDate) }}
                   </div>
                   <div class="text-text-primary text-sm font-extrabold pb-0.5">
                      {{ getDayStr(hover.task.startDate) }}
                   </div>
                </div>
                
                <div class="flex-1 min-w-0 pt-0.5">
                   <h4 class="font-bold text-text-primary text-sm md:text-base truncate">
                     {{ isAr() ? (hover.task.titleAr || hover.task.titleEn) : (hover.task.titleEn || hover.task.titleAr) }}
                   </h4>
                   <p class="text-text-secondary text-[11px] truncate mt-0.5 flex items-center gap-1.5 font-medium">
                      <span class="w-2 h-2 rounded-full inline-block" [style.background]="getTaskColor(hover.task)"></span>
                      {{ hover.task.eventType || 'Task' }} • {{ hover.task.priority || 'Medium' }}
                   </p>
                </div>
             </div>

             @if (hover.task.descriptionEn || hover.task.descriptionAr) {
               <div class="flex flex-col gap-1.5 relative z-10">
                 <span class="text-[11px] font-bold text-text-primary">{{ isAr() ? 'الملاحظات' : 'Notes' }}</span>
                 <div class="bg-background rounded-xl p-3 text-xs text-text-secondary border border-border/50 leading-relaxed max-h-24 overflow-y-auto custom-scrollbar">
                   {{ isAr() ? (hover.task.descriptionAr || hover.task.descriptionEn) : (hover.task.descriptionEn || hover.task.descriptionAr) }}
                 </div>
               </div>
             }

             @if (!isPM()) {
               <div class="flex items-center gap-3 mt-1 pt-4 border-t border-border/50 relative z-10">
                 <button (click)="openEditModal(hover.task, $event); hoveredTask.set(null)" class="flex-1 py-1.5 text-xs font-bold text-text-primary bg-background hover:bg-black/5 border border-border rounded-xl transition-colors flex justify-center items-center gap-1.5">
                   <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg> 
                   {{ isAr() ? 'تعديل' : 'Edit' }}
                 </button>
                 <button (click)="$event.stopPropagation(); deleteTask(hover.task.id); hoveredTask.set(null)" class="flex-1 py-1.5 text-xs font-bold text-error bg-error/5 hover:bg-error/10 border border-error/20 rounded-xl transition-colors flex justify-center items-center gap-1.5">
                   <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> 
                   {{ isAr() ? 'حذف' : 'Delete' }}
                 </button>
               </div>
             }
          </div>
        </div>
      }
    </div>

    <!-- Beautiful Actual Hours Prompt Modal -->
    @if (showHoursPrompt()) {
      <div class="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease_both]">
        <div class="bg-surface border border-border w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col space-y-4 animate-[scaleUp_0.2s_ease_both]">
          <div class="flex items-center gap-3 text-primary">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-extrabold text-text-primary">Log Actual Hours</h3>
              <p class="text-xs text-text-secondary">Task Completion</p>
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-xs text-text-secondary leading-relaxed">
              Please enter the actual hours spent to complete this task. This is required by the system.
            </p>
            
            <div class="relative mt-2">
              <input type="number" [(ngModel)]="hoursPromptValue" min="0.1" step="0.5" autofocus
                     class="w-full px-3.5 py-2.5 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary transition-all duration-200 text-sm font-bold"
                     placeholder="e.g. 4.5" />
              <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary">hours</span>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-2 pt-2 border-t border-border/50">
            <button (click)="cancelHoursPrompt()" class="px-4 py-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button (click)="submitHoursPrompt()" 
                    [disabled]="hoursPromptValue() === null || hoursPromptValue()! <= 0"
                    class="px-5 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/10">
              Complete Task
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(150, 150, 150, 0.3);
      border-radius: 4px;
    }
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 8px;
      box-shadow: 0 5px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .cdk-drag-placeholder {
      opacity: 0;
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .cdk-drop-list-dragging .cdk-drag {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class CalendarViewComponent implements OnInit {
  isPM = input<boolean>(false);

  calendarService: CalendarService = inject(CalendarService);
  themeService = inject(ThemeService);
  translate = inject(TranslateService);
  projectState = inject(ProjectStateService);
  tasksService = inject(TasksService);

  currentDate = signal(new Date());

  weekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  monthsKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  showCreateModal = signal(false);
  selectedDate = signal<Date | null>(null);
  newTask = signal({
    title: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
    priority: 'Low'
  });

  showEditModal = signal(false);
  editingTask = signal<{
    id: string;
    title: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
    priority: string;
    status: string;
    eventType: string;
  } | null>(null);

  showDayEventsModal = signal(false);
  selectedDayEvents = signal<CalendarDay | null>(null);

  showHoursPrompt = signal(false);
  hoursPromptValue = signal<number | null>(null);
  private hoursPromptResolve: ((val: number | null) => void) | null = null;

  promptActualHours(): Promise<number | null> {
    this.hoursPromptValue.set(null);
    this.showHoursPrompt.set(true);
    return new Promise(resolve => {
      this.hoursPromptResolve = resolve;
    });
  }

  submitHoursPrompt() {
    const val = this.hoursPromptValue();
    this.showHoursPrompt.set(false);
    this.hoursPromptResolve?.(val);
    this.hoursPromptResolve = null;
  }

  cancelHoursPrompt() {
    this.showHoursPrompt.set(false);
    this.hoursPromptResolve?.(null);
    this.hoursPromptResolve = null;
  }

  hoveredTask = signal<{ task: CalendarTask, x: number, y: number } | null>(null);
  hoverTimeout: any;

  onTaskMouseEnter(task: CalendarTask, event: MouseEvent) {
    clearTimeout(this.hoverTimeout);
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.hoveredTask.set({ task, x: rect.left + rect.width / 2, y: rect.top });
  }

  onTaskMouseLeave() {
    this.hoverTimeout = setTimeout(() => {
      this.hoveredTask.set(null);
    }, 150);
  }

  onTooltipMouseEnter() {
    clearTimeout(this.hoverTimeout);
  }

  onTooltipMouseLeave() {
    this.hoveredTask.set(null);
  }

  getMonthStr(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(this.translate.currentLang() === 'ar' ? 'ar-EG' : 'en-US', { month: 'short' });
  }

  getDayStr(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).getDate().toString();
  }

  isAr = computed(() => this.translate.currentLang() === 'ar');

  currentMonthName = computed(() => {
    const m = this.currentDate().getMonth();
    return this.translate.instant('calendar.months.' + this.monthsKeys[m]);
  });

  currentYear = computed(() => this.currentDate().getFullYear());

  isNotCurrentMonth = computed(() => {
    const d = this.currentDate();
    const today = new Date();
    return d.getMonth() !== today.getMonth() || d.getFullYear() !== today.getFullYear();
  });

  calendarDays = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const prevMonthDays = startingDayOfWeek;
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDate - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: d.getTime() === today.getTime(),
        tasks: this.getTasksForDate(d)
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: d.getTime() === today.getTime(),
        tasks: this.getTasksForDate(d)
      });
    }

    const totalCells = days.length > 35 ? 42 : 35;
    const nextMonthDays = totalCells - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: d.getTime() === today.getTime(),
        tasks: this.getTasksForDate(d)
      });
    }

    return days;
  });

  constructor() {
    effect(() => {
      const d = this.currentDate();
      const start = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString();
      const end = new Date(d.getFullYear(), d.getMonth() + 2, 0).toISOString();
      this.calendarService.loadTasks(start, end);
    });

    effect(() => {
      if (this.isPM()) {
        this.calendarService.loadWorkload();
      }
    });
  }

  ngOnInit() { }

  getTasksForDate(date: Date): CalendarTask[] {
    const tasks = this.calendarService.tasks();
    return tasks.filter(t => {
      if (t.isHidden) return false;
      if (!t.startDate) return false;
      const start = new Date(t.startDate);
      const end = t.endDate ? new Date(t.endDate) : new Date(t.startDate);

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const target = new Date(date);
      target.setHours(0, 0, 0, 0);

      return target >= start && target <= end;
    });
  }

  getTaskColor(task: CalendarTask): string {
    if (task.status === 'Done') return '#94a3b8'; // slate-400

    if (task.eventType) {
      const type = task.eventType.toLowerCase();
      if (type.includes('assigned')) {
        return '#3b82f6'; // blue-500
      }
      if (type.includes('personal')) {
        return '#22c55e'; // green-500
      }
      if (type.includes('meeting')) {
        return '#a855f7'; // purple-500
      }
    }

    return '#f97316'; // orange-500 for Others / fallback
  }

  previousMonth() {
    this.currentDate.update(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth() {
    this.currentDate.update(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  goToToday() {
    this.currentDate.set(new Date());
  }

  async deleteTask(taskId: string) {
    await this.calendarService.deleteTask(taskId);
  }

  openCreateTaskModal(date: Date, event: Event) {
    if (this.isPM()) return;
    event.stopPropagation();
    if ((event.target as HTMLElement).closest('.group')) {
      return;
    }

    const formatDateTimeLocal = (d: Date) => {
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    const startDate = new Date(date);
    startDate.setHours(9, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(10, 0, 0, 0);

    this.selectedDate.set(date);
    this.newTask.set({ title: '', description: '', startDateTime: formatDateTimeLocal(startDate), endDateTime: formatDateTimeLocal(endDate), priority: 'Low' });
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.selectedDate.set(null);
  }

  async saveNewTask() {
    if (!this.selectedDate() || !this.newTask().title) return;

    const startDate = new Date(this.newTask().startDateTime);
    const endDate = new Date(this.newTask().endDateTime);

    let durationInMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    if (durationInMinutes < 0) {
      durationInMinutes += 24 * 60; // Just in case it's negative
    }

    const dto = {
      title: this.newTask().title,
      description: this.newTask().description,
      startDate: startDate.toISOString(),
      durationInMinutes: durationInMinutes,
      eventType: 'PersonalTask',
      priority: this.newTask().priority
    };

    const success = await this.calendarService.createTask(dto);
    if (success) {
      this.closeCreateModal();
      const d = this.currentDate();
      const start = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString();
      const end = new Date(d.getFullYear(), d.getMonth() + 2, 0).toISOString();
      this.calendarService.loadTasks(start, end);
    }
  }

  async drop(event: CdkDragDrop<CalendarTask[]>, targetDate: Date) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      const newStartStr = targetDate.toISOString();

      let newEndStr = newStartStr;
      if (task.startDate && task.endDate) {
        const oldStart = new Date(task.startDate).getTime();
        const oldEnd = new Date(task.endDate).getTime();
        const duration = oldEnd - oldStart;
        newEndStr = new Date(targetDate.getTime() + duration).toISOString();
      }

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      const success = await this.calendarService.rescheduleTask(task.id, newStartStr, newEndStr);
      if (!success) {
        transferArrayItem(
          event.container.data,
          event.previousContainer.data,
          event.currentIndex,
          event.previousIndex,
        );
      }
    }
  }

  isMultiDay(task: CalendarTask): boolean {
    if (!task.startDate || !task.endDate) return false;
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    return start.toDateString() !== end.toDateString();
  }

  formatMultiDay(task: CalendarTask): string {
    if (!task.startDate || !task.endDate) return '';
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString(undefined, opts)} - ${end.toLocaleDateString(undefined, opts)}`;
  }

  openEditModal(task: CalendarTask, event: Event) {
    if (this.isPM()) return;
    event.stopPropagation();

    // Format for datetime-local: YYYY-MM-DDThh:mm
    const formatDateTimeLocal = (dateString: string) => {
      const d = new Date(dateString);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    let st = '';
    let et = '';
    if (task.startDate) st = formatDateTimeLocal(task.startDate);
    if (task.endDate) et = formatDateTimeLocal(task.endDate);

    this.editingTask.set({
      id: task.id,
      title: task.titleEn || task.titleAr || '',
      description: task.descriptionEn || task.descriptionAr || '',
      startDateTime: st,
      endDateTime: et,
      priority: task.priority || 'Low',
      status: task.status || 'ToDo',
      eventType: task.eventType || 'PersonalTask'
    });
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.editingTask.set(null);
  }

  async saveEditedTask() {
    const task = this.editingTask();
    if (!task) return;

    const start = new Date(task.startDateTime);
    const end = new Date(task.endDateTime);
    let durationInMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    if (durationInMinutes < 0) {
      durationInMinutes += 24 * 60;
    }

    const updatePayload = {
      title: task.title,
      description: task.description,
      startDate: start.toISOString(),
      durationInMinutes: durationInMinutes,
      eventType: task.eventType,
      priority: task.priority,
      status: task.status,
      _endDate: end.toISOString()
    };

    try {
      if (task.eventType === 'WorkspaceTask') {
        const statusEnum = this.mapStatusToEnum(task.status);
        let actualHours: number | undefined = undefined;
        if (statusEnum === TaskItemStatus.Done) {
          const val = await this.promptActualHours();
          if (val === null) {
            return;
          }
          actualHours = val;
        }
        await this.tasksService.updateTaskStatus(task.id, statusEnum, actualHours);
      } else {
        await this.calendarService.updateTask(task.id, updatePayload);
      }

      this.closeEditModal();

      // Reload calendar tasks
      const d = this.currentDate();
      const startStr = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString();
      const endStr = new Date(d.getFullYear(), d.getMonth() + 2, 0).toISOString();
      await this.calendarService.loadTasks(startStr, endStr);
    } catch (err) {
      console.error('Error saving task:', err);
    }
  }

  private mapStatusToEnum(status: string): TaskItemStatus {
    if (status === 'InProgress') return TaskItemStatus.InProgress;
    if (status === 'Review') return TaskItemStatus.Review;
    if (status === 'Done') return TaskItemStatus.Done;
    return TaskItemStatus.ToDo;
  }

  async deleteEditedTask() {
    const task = this.editingTask();
    if (!task) return;

    const success = await this.calendarService.deleteTask(task.id);
    if (success) {
      this.closeEditModal();
    }
  }

  openDayEventsModal(day: CalendarDay) {
    this.selectedDayEvents.set(day);
    this.showDayEventsModal.set(true);
  }

  closeDayEventsModal() {
    this.showDayEventsModal.set(false);
    this.selectedDayEvents.set(null);
  }
}
