import { Component, ChangeDetectionStrategy, signal, computed, effect, inject, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CalendarService, CalendarTask } from '../../../../shared/services/calendar.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProjectStateService } from '../../../../shared/services/project-state.service';

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
                <span class="text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full transition-transform hover:scale-110 cursor-default"
                      [class.bg-primary]="day.isToday"
                      [class.text-white]="day.isToday"
                      [class.text-text-primary]="day.isCurrentMonth && !day.isToday"
                      [class.text-text-secondary]="!day.isCurrentMonth">
                  {{ day.date.getDate() }}
                </span>
              </div>

              <!-- Tasks -->
              <div class="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar min-h-[40px]">
                @for (task of day.tasks; track task.id) {
                  <div 
                    cdkDrag
                    [cdkDragDisabled]="!isPM()"
                    [cdkDragData]="task"
                    class="text-[10px] md:text-xs p-1.5 rounded-md font-medium truncate shadow-sm border border-black/5 hover:brightness-110 hover:-translate-y-0.5 transition-all select-none group relative"
                    [class.cursor-grab]="isPM()"
                    [class.cursor-default]="!isPM()"
                    [class.line-through]="task.status === 'Done'"
                    [class.opacity-60]="task.status === 'Done'"
                    [class.bg-surface-variant]="task.status === 'Done'"
                    [class.text-text-secondary]="task.status === 'Done'"
                    [class.text-text-secondary]="task.status === 'Done'"
                    [style.background]="getTaskColor(task)"
                    [style.color]="'#ffffff'"
                    [title]="(isAr() ? (task.titleAr || task.titleEn) : (task.titleEn || task.titleAr)) + (task.descriptionEn || task.descriptionAr ? '\n\n' + (isAr() ? (task.descriptionAr || task.descriptionEn) : (task.descriptionEn || task.descriptionAr)) : '')"
                    (click)="!isPM() ? openEditModal(task, $event) : null">
                    
                    <div class="flex items-center gap-1">
                      @if (task.status === 'Done') {
                        <svg class="w-3 h-3 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                        </svg>
                      }
                      <span class="truncate">{{ isAr() ? (task.titleAr || task.titleEn) : (task.titleEn || task.titleAr) }}</span>
                      
                      @if (task.status === 'Done') {
                        <button (click)="$event.stopPropagation(); deleteTask(task.id)" class="ml-auto opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-black/10 transition-all text-text-secondary">
                          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      }
                    </div>

                    @if (isMultiDay(task)) {
                      <div class="text-[8.5px] opacity-90 mt-0.5 truncate tracking-tight">{{ formatMultiDay(task) }}</div>
                    }

                    <div *cdkDragPreview class="bg-primary text-white text-xs p-2 rounded-lg shadow-xl opacity-90 z-50">
                       {{ isAr() ? (task.titleAr || task.titleEn) : (task.titleEn || task.titleAr) }}
                    </div>
                  </div>
                }
              </div>
              
            </div>
          }
        </div>
      </div>

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
    </div>
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

  getProjectColor(id: string): string {
    const colors = [
      'linear-gradient(135deg,#6366f1,#8b5cf6)',
      'linear-gradient(135deg,#3b82f6,#06b6d4)',
      'linear-gradient(135deg,#10b981,#059669)',
      'linear-gradient(135deg,#f59e0b,#ef4444)',
      'linear-gradient(135deg,#ec4899,#8b5cf6)',
    ];
    let hash = 0;
    for (let i = 0; i < (id || '').length; i++) hash += id.charCodeAt(i);
    return colors[hash % colors.length];
  }

  getTaskColor(task: CalendarTask): string {
    if (task.status === 'Done') return '#94a3b8';
    
    if (task.eventType) {
      const type = task.eventType.toLowerCase();
      if (type.includes('assigned')) {
        return 'linear-gradient(135deg,#3b82f6,#06b6d4)'; // Blue gradient
      }
      if (type.includes('personal')) {
        return 'linear-gradient(135deg,#10b981,#059669)'; // Green gradient
      }
      // For any other eventType, pick a consistent color
      const eventColors = [
        'linear-gradient(135deg,#f59e0b,#ef4444)', // Orange/Red
        'linear-gradient(135deg,#ec4899,#8b5cf6)', // Pink/Purple
        'linear-gradient(135deg,#6366f1,#8b5cf6)', // Indigo/Purple
      ];
      let hash = 0;
      for (let i = 0; i < task.eventType.length; i++) hash += task.eventType.charCodeAt(i);
      return eventColors[hash % eventColors.length];
    }
    
    return this.getProjectColor(task.projectId);
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
    await this.calendarService.updateTask(task.id, updatePayload);

    this.closeEditModal();
  }

  async deleteEditedTask() {
    const task = this.editingTask();
    if (!task) return;

    const success = await this.calendarService.deleteTask(task.id);
    if (success) {
      this.closeEditModal();
    }
  }

}
