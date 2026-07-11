import { Component, ChangeDetectionStrategy, signal, computed, effect, inject, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, DragDropModule, TranslatePipe],
  template: `
    <div class="flex flex-col h-full bg-background text-text-primary p-4 md:p-8 font-dashboard transition-colors duration-200" [dir]="isAr() ? 'rtl' : 'ltr'">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 class="text-2xl font-extrabold font-display">{{ 'calendar.title' | translate }}</h2>
          <p class="text-text-secondary text-sm mt-1">
             {{ currentMonthName() }} {{ currentYear() }}
          </p>
        </div>
        
        <div class="flex items-center gap-2 bg-surface border border-border p-1 rounded-xl shadow-sm">
          <button (click)="previousMonth()" class="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">
            <svg class="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button (click)="goToToday()" class="px-4 py-1.5 text-sm font-bold hover:bg-primary/5 rounded-lg transition-colors">
            {{ isAr() ? 'اليوم' : 'Today' }}
          </button>
          <button (click)="nextMonth()" class="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">
            <svg class="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
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
        <div class="flex-1 grid grid-cols-7 grid-rows-5 md:grid-rows-auto auto-rows-[1fr]" 
             cdkDropListGroup>
          @for (day of calendarDays(); track day.date.toISOString(); let idx = $index) {
            <div 
              class="border-b border-r border-border/50 p-1 md:p-2 flex flex-col transition-colors"
              [class.bg-background]="!day.isCurrentMonth"
              [class.opacity-60]="!day.isCurrentMonth"
              [class.bg-primary/5]="day.isToday"
              cdkDropList
              [cdkDropListData]="day.tasks"
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
                    class="text-[10px] md:text-xs p-1.5 rounded-md font-medium truncate shadow-sm border border-black/5 hover:brightness-110 hover:-translate-y-0.5 transition-all select-none group"
                    [class.cursor-grab]="isPM()"
                    [class.cursor-default]="!isPM()"
                    [style.background]="getProjectColor(task.projectId)"
                    [style.color]="'#ffffff'">
                    
                    <div class="flex items-center gap-1">
                      <span class="truncate">{{ isAr() ? (task.titleAr || task.titleEn) : (task.titleEn || task.titleAr) }}</span>
                    </div>

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
  isPM = input(false);
  
  calendarService = inject(CalendarService);
  themeService = inject(ThemeService);
  translate = inject(TranslateService);
  projectState = inject(ProjectStateService);

  currentDate = signal(new Date());
  
  weekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  monthsKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  isAr = computed(() => this.translate.currentLang() === 'ar');

  currentMonthName = computed(() => {
    const m = this.currentDate().getMonth();
    return this.translate.instant('calendar.months.' + this.monthsKeys[m]);
  });

  currentYear = computed(() => this.currentDate().getFullYear());

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
    today.setHours(0,0,0,0);
    
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

  ngOnInit() {}

  getTasksForDate(date: Date): CalendarTask[] {
    const tasks = this.calendarService.tasks();
    return tasks.filter(t => {
      if (!t.startDate) return false;
      const start = new Date(t.startDate);
      const end = t.endDate ? new Date(t.endDate) : new Date(t.startDate);
      
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      const target = new Date(date);
      target.setHours(0,0,0,0);
      
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

  previousMonth() {
    this.currentDate.update(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth() {
    this.currentDate.update(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  goToToday() {
    this.currentDate.set(new Date());
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
}
