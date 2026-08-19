import { Component, ChangeDetectionStrategy, signal, computed, effect, inject, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CalendarService, CalendarTask } from '../../../../shared/services/calendar.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import { ToastService } from '../../../../shared/services/toast.service';
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
              class="border-b border-r border-border/50 p-1 md:p-2 flex flex-col transition-all min-h-0 relative"
              [class.bg-background]="!day.isCurrentMonth"
              [class.opacity-60]="!day.isCurrentMonth"
              [class.bg-surface-alt/30]="isPastDate(day.date) && day.isCurrentMonth && !day.isToday"
              [class.bg-primary/5]="day.isToday"
              [class.cursor-pointer]="!isPM() && !isPastDate(day.date)"
              [class.hover:bg-primary/5]="!isPM() && !isPastDate(day.date)"
              [title]="!isPM() && isPastDate(day.date) ? (isAr() ? 'لا يمكن إضافة مهام في تواريخ سابقة' : 'Cannot add tasks on past dates') : ''"
              cdkDropList
              [cdkDropListData]="day.tasks"
              (click)="!isPM() && !isPastDate(day.date) ? openCreateTaskModal(day.date, $event) : null"
              (cdkDropListDropped)="drop($event, day.date)">
              
              <!-- Date Header -->
              <div class="flex justify-between items-center mb-0.5">
                <button class="text-xs md:text-sm font-bold w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full transition-transform hover:scale-110 hover:bg-black/5"
                        [class.bg-primary]="day.isToday"
                        [class.text-white]="day.isToday"
                        [class.hover:bg-primary/90]="day.isToday"
                        [class.text-text-primary]="day.isCurrentMonth && !day.isToday"
                        [class.text-text-secondary]="!day.isCurrentMonth || (isPastDate(day.date) && !day.isToday)"
                        (click)="$event.stopPropagation(); openDayEventsModal(day)">
                  {{ day.date.getDate() }}
                </button>
              </div>

              <!-- Perfectly Centralized Balls / Dots (Positioned slightly higher) -->
              <div class="flex-1 flex items-start justify-center pb-1 md:pb-2 gap-1.5 min-h-0 overflow-hidden px-1">
                @if (day.tasks.length <= 4) {
                  @for (task of day.tasks; track task.id) {
                    <div 
                      cdkDrag
                      [cdkDragDisabled]="!isPM() || isPastTask(task)"
                      [cdkDragData]="task"
                      class="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shadow-sm hover:scale-150 transition-all duration-150 shrink-0 ring-1 ring-black/10 dark:ring-white/10"
                      [class.cursor-grab]="isPM() && !isPastTask(task)"
                      [class.cursor-pointer]="!isPM()"
                      [class.opacity-50]="task.status === 'Done'"
                      [style.backgroundColor]="getTaskColor(task)"
                      (mouseenter)="onTaskMouseEnter(task, $event)"
                      (mouseleave)="onTaskMouseLeave()"
                      (click)="$event.stopPropagation(); !isPM() ? openEditModal(task, $event) : null">
                      
                      <div *cdkDragPreview class="bg-surface border border-border text-text-primary text-xs font-bold p-2.5 rounded-xl shadow-2xl z-50 flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full" [style.backgroundColor]="getTaskColor(task)"></span>
                        <span>{{ isAr() ? (task.titleAr || task.titleEn) : (task.titleEn || task.titleAr) }}</span>
                      </div>
                    </div>
                  }
                } @else {
                  @for (task of day.tasks.slice(0, 3); track task.id) {
                    <div 
                      cdkDrag
                      [cdkDragDisabled]="!isPM() || isPastTask(task)"
                      [cdkDragData]="task"
                      class="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shadow-sm hover:scale-150 transition-all duration-150 shrink-0 ring-1 ring-black/10 dark:ring-white/10"
                      [class.cursor-grab]="isPM() && !isPastTask(task)"
                      [class.cursor-pointer]="!isPM()"
                      [class.opacity-50]="task.status === 'Done'"
                      [style.backgroundColor]="getTaskColor(task)"
                      (mouseenter)="onTaskMouseEnter(task, $event)"
                      (mouseleave)="onTaskMouseLeave()"
                      (click)="$event.stopPropagation(); !isPM() ? openEditModal(task, $event) : null">
                      
                      <div *cdkDragPreview class="bg-surface border border-border text-text-primary text-xs font-bold p-2.5 rounded-xl shadow-2xl z-50 flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full" [style.backgroundColor]="getTaskColor(task)"></span>
                        <span>{{ isAr() ? (task.titleAr || task.titleEn) : (task.titleEn || task.titleAr) }}</span>
                      </div>
                    </div>
                  }
                  
                  <button 
                    (click)="$event.stopPropagation(); openDayEventsModal(day)"
                    class="relative -top-0.5  text-[10px] font-extrabold px-1.5 -top-0.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all hover:scale-105 active:scale-95 shrink-0">
                    +{{ day.tasks.length - 3 }}
                  </button>
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
              <div>
                <h3 class="text-xl font-bold font-display">
                  {{ selectedDayEvents()!.date.toLocaleDateString(isAr() ? 'ar-EG' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }}
                </h3>
                @if (isPastDate(selectedDayEvents()!.date)) {
                  <span class="text-xs font-semibold text-text-secondary flex items-center gap-1 mt-0.5">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    {{ isAr() ? 'تاريخ سابق (للعرض فقط)' : 'Past Date (Read-Only)' }}
                  </span>
                }
              </div>
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
                    
                    <div class="flex items-center gap-1.5">
                      @if (isPastTask(task)) {
                        <span class="text-[9px] px-2 py-0.5 rounded-full font-bold bg-surface-alt text-text-secondary border border-border">
                          {{ isAr() ? 'سابق' : 'Past' }}
                        </span>
                      }
                      <span class="text-[10px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap"
                            [style.background]="getTaskColor(task) + '20'"
                            [style.color]="getTaskColor(task)">
                        {{ task.eventType || 'Task' }}
                      </span>
                    </div>
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
            <h3 class="text-xl font-bold mb-4 font-display">{{ isAr() ? 'إضافة مهمة شخصية' : 'Add Personal Task' }}</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold text-text-secondary mb-1">{{ isAr() ? 'العنوان *' : 'Title *' }}</label>
                <input type="text" [(ngModel)]="newTask().title" 
                       class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                       [placeholder]="isAr() ? 'مثال: التحضير للاجتماع' : 'e.g. Prepare for meeting'">
              </div>

              <div>
                <label class="block text-sm font-bold text-text-secondary mb-1">{{ isAr() ? 'الوصف' : 'Description' }}</label>
                <textarea [(ngModel)]="newTask().description" rows="2"
                       class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors resize-none custom-scrollbar"
                       [placeholder]="isAr() ? 'تفاصيل المهمة...' : 'Task details...'"></textarea>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-bold text-text-secondary mb-1">{{ isAr() ? 'البداية' : 'Start' }}</label>
                  <input type="datetime-local" [(ngModel)]="newTask().startDateTime" 
                         [min]="minDateTime()"
                         class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors">
                </div>
                
                <div>
                  <label class="block text-sm font-bold text-text-secondary mb-1">{{ isAr() ? 'النهاية' : 'End' }}</label>
                  <input type="datetime-local" [(ngModel)]="newTask().endDateTime" 
                         [min]="minDateTime()"
                         class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors">
                </div>
              </div>

              <div class="mt-4">
                <label class="block text-sm font-bold text-text-secondary mb-1">{{ isAr() ? 'الأولوية' : 'Priority' }}</label>
                <select [(ngModel)]="newTask().priority" 
                        class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors">
                  <option value="Low">{{ isAr() ? 'منخفضة' : 'Low' }}</option>
                  <option value="Medium">{{ isAr() ? 'متوسطة' : 'Medium' }}</option>
                  <option value="High">{{ isAr() ? 'عالية' : 'High' }}</option>
                </select>
              </div>
            </div>
            
            <div class="flex items-center justify-end gap-3 mt-8">
              <button (click)="closeCreateModal()" 
                      class="px-4 py-2 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors">
                {{ isAr() ? 'إلغاء' : 'Cancel' }}
              </button>
              <button (click)="saveNewTask()" 
                      [disabled]="!newTask().title"
                      class="px-6 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {{ isAr() ? 'حفظ المهمة' : 'Save Task' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Edit / View Personal Task Modal -->
      @if (showEditModal() && editingTask()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center animate-[fadeIn_0.2s_ease_both]">
          <div class="absolute inset-0 bg-brandNavy/60 backdrop-blur-sm" (click)="closeEditModal()"></div>
          
          <div class="relative bg-surface border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 animate-[scaleUp_0.2s_ease_both]">
            @if (isSaving()) {
              <div class="absolute inset-0 bg-surface/50 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-2xl">
                <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            }
            
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-bold font-display">
                {{ isEditingPastTask() ? (isAr() ? 'تفاصيل المهمة (للعرض فقط)' : 'Task Details (Read-Only)') : (isAr() ? 'تعديل المهمة' : 'Edit Task') }}
              </h3>
              @if (isEditingPastTask()) {
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {{ isAr() ? 'مهمة سابقة' : 'Past Task' }}
                </span>
              }
            </div>

            @if (isEditingPastTask()) {
              <div class="flex items-center gap-2.5 p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-medium">
                <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{{ isAr() ? 'هذه المهمة في تاريخ سابق ولا يمكن تعديلها أو حذفها' : 'This task is in the past and cannot be edited or deleted.' }}</span>
              </div>
            }
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold text-text-secondary mb-1">{{ isAr() ? 'العنوان *' : 'Title *' }}</label>
                <input type="text" [(ngModel)]="editingTask()!.title" 
                       [disabled]="isEditingPastTask() || editingTask()!.eventType !== 'PersonalTask'"
                       class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:bg-surface-alt"
                       [placeholder]="isAr() ? 'مثال: التحضير للاجتماع' : 'e.g. Prepare for meeting'">
              </div>

              <div>
                <label class="block text-sm font-bold text-text-secondary mb-1">{{ isAr() ? 'الوصف' : 'Description' }}</label>
                <textarea [(ngModel)]="editingTask()!.description" rows="2"
                       [disabled]="isEditingPastTask() || editingTask()!.eventType !== 'PersonalTask'"
                       class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors resize-none custom-scrollbar disabled:opacity-60 disabled:bg-surface-alt"
                       [placeholder]="isAr() ? 'تفاصيل المهمة...' : 'Task details...'"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-bold text-text-secondary mb-1">{{ isAr() ? 'البداية' : 'Start' }}</label>
                  <input type="datetime-local" [(ngModel)]="editingTask()!.startDateTime" 
                         [disabled]="isEditingPastTask() || editingTask()!.eventType !== 'PersonalTask'"
                         class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:bg-surface-alt">
                </div>
                
                <div>
                  <label class="block text-sm font-bold text-text-secondary mb-1">{{ isAr() ? 'النهاية' : 'End' }}</label>
                  <input type="datetime-local" [(ngModel)]="editingTask()!.endDateTime" 
                         [disabled]="isEditingPastTask() || editingTask()!.eventType !== 'PersonalTask'"
                         class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:bg-surface-alt">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label class="block text-sm font-bold text-text-secondary mb-1">{{ isAr() ? 'الأولوية' : 'Priority' }}</label>
                  <select [(ngModel)]="editingTask()!.priority" 
                          [disabled]="isEditingPastTask() || editingTask()!.eventType !== 'PersonalTask'"
                          class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:bg-surface-alt">
                    <option value="Low">{{ isAr() ? 'منخفضة' : 'Low' }}</option>
                    <option value="Medium">{{ isAr() ? 'متوسطة' : 'Medium' }}</option>
                    <option value="High">{{ isAr() ? 'عالية' : 'High' }}</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-bold text-text-secondary mb-1">{{ isAr() ? 'الحالة' : 'Status' }}</label>
                  <select [(ngModel)]="editingTask()!.status" 
                          [disabled]="isEditingPastTask() || isStatusLockedForReview()"
                          class="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:bg-surface-alt">
                    <option value="ToDo">{{ isAr() ? 'قيد الانتظار' : 'To Do' }}</option>
                    <option value="InProgress">{{ isAr() ? 'قيد التنفيذ' : 'In Progress' }}</option>
                    @if (isPM() || editingTask()!.eventType === 'PersonalTask' || editingTask()!.originalStatus === 'InProgress' || editingTask()!.originalStatus === 'Review') {
                      <option value="Review">{{ isAr() ? 'مراجعة (طلب اعتماد)' : 'In Review (Submit)' }}</option>
                    }
                    @if (isPM() || editingTask()!.eventType === 'PersonalTask' || editingTask()!.originalStatus === 'Done') {
                      <option value="Done">{{ isAr() ? 'مكتملة' : 'Done' }}</option>
                    }
                  </select>

                  @if (editingTask()!.eventType === 'AssignedTask' && !isPM()) {
                    @if (editingTask()!.originalStatus === 'Review') {
                      <p class="text-[11px] text-amber-500 font-medium mt-1.5 flex items-center gap-1">
                        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {{ isAr() ? 'المهمة قيد المراجعة وتنتظر موافقة مدير المشروع.' : 'Task is in Review awaiting Project Manager approval.' }}
                      </p>
                    } @else if (editingTask()!.originalStatus === 'Done') {
                      <p class="text-[11px] text-emerald-500 font-medium mt-1.5 flex items-center gap-1">
                        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        {{ isAr() ? 'تم اعتماد هذه المهمة واكتمالها.' : 'This task is approved and completed.' }}
                      </p>
                    } @else if (editingTask()!.originalStatus === 'ToDo') {
                      <p class="text-[11px] text-sky-500 font-medium mt-1.5 flex items-center gap-1">
                        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {{ isAr() ? 'يجب بدء المهمة (قيد التنفيذ) أولاً قبل إرسالها للمراجعة.' : 'Task must be In Progress first before submitting for Review.' }}
                      </p>
                    } @else if (editingTask()!.originalStatus === 'InProgress') {
                      <p class="text-[11px] text-indigo-500 font-medium mt-1.5 flex items-center gap-1">
                        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {{ isAr() ? 'نقل المهمة إلى "مراجعة" يرسلها لمدير المشروع للاعتماد.' : 'Moving to "Review" submits task to PM for approval.' }}
                      </p>
                    }
                  }
                </div>
              </div>
            </div>
            
            <div class="flex items-center justify-between mt-8 pt-4 border-t border-border/50">
              @if (!isEditingPastTask() && editingTask()!.eventType === 'PersonalTask') {
                <button (click)="deleteEditedTask()" 
                        class="px-4 py-2 text-sm font-bold text-error hover:bg-error/10 transition-colors rounded-xl">
                  {{ isAr() ? 'حذف' : 'Delete' }}
                </button>
              } @else {
                <div></div>
              }
              <div class="flex items-center gap-2">
                @if (isEditingPastTask()) {
                  <button (click)="closeEditModal()" 
                          class="px-6 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
                    {{ isAr() ? 'إغلاق' : 'Close' }}
                  </button>
                } @else {
                  <button (click)="closeEditModal()" 
                          class="px-4 py-2 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors">
                    {{ isAr() ? 'إلغاء' : 'Cancel' }}
                  </button>
                  <button (click)="saveEditedTask()" 
                          [disabled]="!editingTask()!.title"
                          class="px-6 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ isAr() ? 'حفظ' : 'Save' }}
                  </button>
                }
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
                 @if (isPastTask(hover.task)) {
                   <button (click)="openEditModal(hover.task, $event); hoveredTask.set(null)" class="flex-1 py-1.5 text-xs font-bold text-text-primary bg-background hover:bg-black/5 border border-border rounded-xl transition-colors flex justify-center items-center gap-1.5">
                     <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> 
                     {{ isAr() ? 'عرض التفاصيل' : 'View Details' }}
                   </button>
                 } @else {
                   <button (click)="openEditModal(hover.task, $event); hoveredTask.set(null)" class="flex-1 py-1.5 text-xs font-bold text-text-primary bg-background hover:bg-black/5 border border-border rounded-xl transition-colors flex justify-center items-center gap-1.5">
                     <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg> 
                     {{ isAr() ? 'تعديل' : 'Edit' }}
                   </button>
                   @if (hover.task.eventType === 'PersonalTask') {
                     <button (click)="$event.stopPropagation(); deleteTask(hover.task.id); hoveredTask.set(null)" class="flex-1 py-1.5 text-xs font-bold text-error bg-error/5 hover:bg-error/10 border border-error/20 rounded-xl transition-colors flex justify-center items-center gap-1.5">
                       <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> 
                       {{ isAr() ? 'حذف' : 'Delete' }}
                     </button>
                   }
                 }
               </div>
             }
           </div>
        </div>
      }
    </div>

    <!-- Beautiful Actual Hours Prompt Modal -->

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
  toastService = inject(ToastService);

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
    originalStatus: string;
    eventType: string;
  } | null>(null);
  isSaving = signal(false);

  showDayEventsModal = signal(false);
  selectedDayEvents = signal<CalendarDay | null>(null);

  isEditingPastTask = computed(() => this.isPastTask(this.editingTask()));

  isStatusLockedForReview = computed(() => {
    const task = this.editingTask();
    if (!task) return false;
    return task.eventType === 'AssignedTask' && !this.isPM() && (task.originalStatus === 'Review' || task.originalStatus === 'Done');
  });

  toLocalInputString(dateInput: string | Date): string {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  parseLocalInputToIso(localStr: string): string {
    if (!localStr) return new Date().toISOString();
    const [datePart, timePart] = localStr.split('T');
    if (!datePart) return new Date().toISOString();
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = (timePart || '00:00').split(':').map(Number);
    const d = new Date(year, month - 1, day, hours || 0, minutes || 0, 0);
    return d.toISOString();
  }

  minDateTime = computed(() => {
    return this.toLocalInputString(new Date());
  });

  isPastDate(date: Date): boolean {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    return target < todayStart;
  }

  isPastTask(task?: CalendarTask | { startDateTime?: string; startDate?: string; endDateTime?: string; endDate?: string } | null): boolean {
    if (!task) return false;
    const dateStr = (task as any).endDate || (task as any).endDateTime || (task as any).startDate || (task as any).startDateTime;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const taskDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return taskDay < todayStart;
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
      this.translate.currentLang();
      const d = this.currentDate();
      const start = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString();
      const end = new Date(d.getFullYear(), d.getMonth() + 2, 0).toISOString();
      this.calendarService.loadTasks(start, end);
    });

    effect(() => {
      this.translate.currentLang();
      if (this.isPM()) {
        this.calendarService.loadWorkload();
      }
    });
  }

  ngOnInit() { }

  getTasksForDate(date: Date): CalendarTask[] {
    const tasks = this.calendarService.tasks();
    const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

    return tasks.filter(t => {
      if (t.isHidden) return false;
      if (!t.startDate) return false;
      const start = new Date(t.startDate);
      const end = t.endDate ? new Date(t.endDate) : new Date(t.startDate);

      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

      return targetDay >= startDay && targetDay <= endDay;
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
    const task = this.calendarService.tasks().find(t => t.id === taskId);
    if (task && this.isPastTask(task)) {
      this.toastService.show(
        this.isAr() ? 'لا يمكن حذف مهمة سابقة' : 'Cannot delete a past task',
        'warning'
      );
      return;
    }
    await this.calendarService.deleteTask(taskId);
  }

  openCreateTaskModal(date: Date, event: Event) {
    if (this.isPM()) return;
    if (this.isPastDate(date)) {
      this.toastService.show(
        this.isAr() ? 'لا يمكن إضافة مهام في تاريخ سابق' : 'Cannot add tasks to a past date',
        'warning'
      );
      return;
    }
    event.stopPropagation();
    if ((event.target as HTMLElement).closest('.group') || (event.target as HTMLElement).closest('.group\\/task')) {
      return;
    }

    const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0);
    const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 0, 0);

    this.selectedDate.set(date);
    this.newTask.set({
      title: '',
      description: '',
      startDateTime: this.toLocalInputString(startDate),
      endDateTime: this.toLocalInputString(endDate),
      priority: 'Low'
    });
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
    this.selectedDate.set(null);
  }

  async saveNewTask() {
    if (!this.selectedDate() || !this.newTask().title) return;

    const startIso = this.parseLocalInputToIso(this.newTask().startDateTime);
    const endIso = this.parseLocalInputToIso(this.newTask().endDateTime);
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    if (startDate.getTime() < todayStart) {
      this.toastService.show(
        this.isAr() ? 'لا يمكن إنشاء مهمة في تاريخ سابق' : 'Cannot create a task on a past date',
        'error'
      );
      return;
    }

    let durationInMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    if (durationInMinutes < 0) {
      durationInMinutes += 24 * 60;
    }

    const dto = {
      title: this.newTask().title,
      description: this.newTask().description,
      startDate: startIso,
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
    if (this.isPastDate(targetDate)) {
      this.toastService.show(
        this.isAr() ? 'لا يمكن نقل المهام إلى تاريخ سابق' : 'Cannot reschedule tasks to a past date',
        'warning'
      );
      return;
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      if (this.isPastTask(task)) {
        this.toastService.show(
          this.isAr() ? 'لا يمكن نقل المهام السابقة' : 'Cannot move past tasks',
          'warning'
        );
        return;
      }

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

    let st = '';
    let et = '';
    if (task.startDate) st = this.toLocalInputString(task.startDate);
    if (task.endDate) et = this.toLocalInputString(task.endDate);

    this.editingTask.set({
      id: task.id,
      title: this.isAr() ? (task.titleAr || task.titleEn || '') : (task.titleEn || task.titleAr || ''),
      description: this.isAr() ? (task.descriptionAr || task.descriptionEn || '') : (task.descriptionEn || task.descriptionAr || ''),
      startDateTime: st,
      endDateTime: et,
      priority: task.priority || 'Low',
      status: task.status || 'ToDo',
      originalStatus: task.status || 'ToDo',
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

    if (this.isPastTask(task)) {
      this.toastService.show(
        this.isAr() ? 'لا يمكن تعديل مهمة سابقة' : 'Cannot edit a past task',
        'warning'
      );
      return;
    }

    if (task.eventType === 'AssignedTask' && !this.isPM()) {
      if (task.originalStatus === 'Review' && task.status !== 'Review') {
        this.toastService.show(
          this.isAr() ? 'المهمة قيد المراجعة ولا يمكن تغييرها إلا بواسطة مدير المشروع' : 'Task is under review and can only be changed by the Project Manager',
          'warning'
        );
        return;
      }
      if (task.originalStatus === 'ToDo' && task.status === 'Review') {
        this.toastService.show(
          this.isAr() ? 'لا يمكن نقل المهمة للمراجعة مباشرة؛ يجب أن تكون قيد التنفيذ أولاً' : 'Task cannot be moved to Review directly; it must be In Progress first',
          'warning'
        );
        return;
      }
      if (task.status === 'Done' && task.originalStatus !== 'Done') {
        this.toastService.show(
          this.isAr() ? 'لا يمكن إكمال المهمة مباشرة؛ يرجى نقلها إلى مراجعة ليعتمدها مدير المشروع' : 'Cannot mark task as Done directly; please submit to Review for PM approval',
          'warning'
        );
        return;
      }
    }

    this.isSaving.set(true);
    try {
      const startIso = this.parseLocalInputToIso(task.startDateTime);
      const endIso = this.parseLocalInputToIso(task.endDateTime);
      const start = new Date(startIso);
      const end = new Date(endIso);

      let durationInMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      if (durationInMinutes < 0) {
        durationInMinutes += 24 * 60;
      }

      const updatePayload = {
        title: task.title,
        description: task.description,
        startDate: startIso,
        durationInMinutes: durationInMinutes,
        eventType: task.eventType,
        priority: task.priority,
        status: task.status,
        _endDate: endIso
      };

      if (task.eventType === 'AssignedTask') {
        const statusEnum = this.mapStatusToEnum(task.status);
        const rawTask = task as any;
        const possibleTaskId = rawTask.taskId || rawTask.SprintTaskId || rawTask.referenceId || rawTask.affectedTaskId || task.id;

        try {
          const sprintResponse = await this.tasksService.updateTaskStatus(possibleTaskId, statusEnum);
          if (statusEnum === TaskItemStatus.Done && sprintResponse?.actualHours !== undefined) {
            rawTask.actualHours = sprintResponse.actualHours;
          }
          this.toastService.show(
            this.isAr() ? 'تم تحديث حالة المهمة بنجاح' : 'Task status updated successfully',
            'success'
          );
        } catch (err: any) {
          if (err?.response?.status === 404 || err?.status === 404 || err?.message?.includes('404')) {
            const pId = rawTask.projectId || this.projectState.selectedProjectId();
            if (pId) {
              const myTasks = await this.tasksService.getMyTasks(pId);
              const matchingTask = myTasks?.tasks?.find(t =>
                t.titleEn === task.title || t.titleEn === rawTask.titleEn ||
                t.titleAr === task.title || t.titleAr === rawTask.titleAr
              );

              if (matchingTask && matchingTask.taskId) {
                const sprintResponse = await this.tasksService.updateTaskStatus(matchingTask.taskId, statusEnum);
                if (statusEnum === TaskItemStatus.Done && sprintResponse?.actualHours !== undefined) {
                  rawTask.actualHours = sprintResponse.actualHours;
                }
                this.toastService.show(
                  this.isAr() ? 'تم تحديث حالة المهمة بنجاح' : 'Task status updated successfully',
                  'success'
                );
              } else {
                throw err;
              }
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }

        // Optimistically update calendar local state for AssignedTask
        this.calendarService.tasks.update(currentTasks =>
          currentTasks.map(t => t.id === task.id ? { ...t, status: task.status } : t)
        );
      } else {
        const response = await this.calendarService.updateTask(task.id, updatePayload);
        if (response && response.actualHours !== undefined && updatePayload.status === 'Done') {
          const rawTask = task as any;
          rawTask.actualHours = response.actualHours;
        }
      }

      this.closeEditModal();

      // Reload calendar tasks
      const d = this.currentDate();
      const startStr = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString();
      const endStr = new Date(d.getFullYear(), d.getMonth() + 2, 0).toISOString();
      await this.calendarService.loadTasks(startStr, endStr);
    } catch (err) {
      console.error('Error saving task:', err);
    } finally {
      this.isSaving.set(false);
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

    if (this.isPastTask(task)) {
      this.toastService.show(
        this.isAr() ? 'لا يمكن حذف مهمة سابقة' : 'Cannot delete a past task',
        'warning'
      );
      return;
    }

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
