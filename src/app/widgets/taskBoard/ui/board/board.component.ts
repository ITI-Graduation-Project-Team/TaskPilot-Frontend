import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  hours: number;
  type: 'Feature' | 'Bug' | 'Refactor';
}

@Component({
  selector: 'app-board',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="space-y-6">
      
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
          <h2 class="text-2xl font-bold text-text-primary">Sprint Active Workspace</h2>
          <p class="text-text-secondary text-sm">Drag and drop tasks to update their current progress state.</p>
        </div>
        
        <button (click)="openAddModal()" 
                class="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl
                       shadow-md shadow-primary/20 transition-all duration-200 hover:-translate-y-px active:translate-y-0">
          + Add Custom Task
        </button>
      </div>

      <!-- Kanban columns -->
      <div cdkDropListGroup class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        <!-- Column template -->
        <!-- TO DO -->
        <div class="flex flex-col bg-sidebar border border-border rounded-2xl p-4 min-h-[500px]">
          <div class="flex items-center justify-between mb-4 px-1">
            <span class="text-sm font-bold text-text-primary uppercase tracking-wider">To Do</span>
            <span class="px-2 py-0.5 text-xs font-semibold bg-gray-200 dark:bg-border text-text-secondary rounded-full">{{ todo().length }}</span>
          </div>
          
          <div cdkDropList
               [cdkDropListData]="todo()"
               (cdkDropListDropped)="drop($event)"
               class="flex-1 space-y-3 p-1 rounded-lg">
            @for (task of todo(); track task.id) {
              <div cdkDrag class="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-200">
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
                No tasks to do
              </div>
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
               [cdkDropListData]="inProgress()"
               (cdkDropListDropped)="drop($event)"
               class="flex-1 space-y-3 p-1 rounded-lg">
            @for (task of inProgress(); track task.id) {
              <div cdkDrag class="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-200">
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
                Drop tasks here to start
              </div>
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
               [cdkDropListData]="review()"
               (cdkDropListDropped)="drop($event)"
               class="flex-1 space-y-3 p-1 rounded-lg">
            @for (task of review(); track task.id) {
              <div cdkDrag class="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-200">
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
                Drop tasks for validation
              </div>
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
               [cdkDropListData]="done()"
               (cdkDropListDropped)="drop($event)"
               class="flex-1 space-y-3 p-1 rounded-lg">
            @for (task of done(); track task.id) {
              <div cdkDrag class="bg-surface border border-border p-4 rounded-xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-200">
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
                No completed tasks yet
              </div>
            }
          </div>
        </div>

      </div>
    </div>

    <!-- Edit/Add Task Modal Overlay -->
    @if (showModal()) {
      <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-surface border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-border">
            <h3 class="text-lg font-bold text-text-primary">
              {{ isEditing() ? 'Modify Task Details' : 'Create Custom Task' }}
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
              <input type="text" [(ngModel)]="modalTask().title" 
                     class="w-full px-3.5 py-2 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary transition-all duration-200" />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">Description</label>
              <textarea [(ngModel)]="modalTask().description" rows="3"
                        class="w-full px-3.5 py-2 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary transition-all duration-200"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">Priority</label>
                <select [(ngModel)]="modalTask().priority" 
                        class="w-full px-3.5 py-2 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary transition-all duration-200">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">Type</label>
                <select [(ngModel)]="modalTask().type" 
                        class="w-full px-3.5 py-2 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary transition-all duration-200">
                  <option value="Feature">Feature</option>
                  <option value="Bug">Bug</option>
                  <option value="Refactor">Refactor</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">Estimation (Hours)</label>
              <input type="number" [(ngModel)]="modalTask().hours" 
                     class="w-full px-3.5 py-2 border border-border bg-background text-text-primary rounded-xl outline-none focus:border-primary transition-all duration-200" />
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            @if (isEditing()) {
              <button (click)="deleteTask()" class="px-4 py-2 text-error hover:bg-error/10 font-semibold rounded-xl mr-auto">
                Delete Task
              </button>
            }
            <button (click)="closeModal()" class="px-4 py-2 border border-border text-text-secondary hover:text-text-primary rounded-xl">
              Cancel
            </button>
            <button (click)="saveTask()" class="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-md shadow-primary/10">
              Save changes
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class BoardComponent {
  
  // Lists of tasks inside signals
  todo = signal<Task[]>([
    {
      id: 'task-1',
      title: 'Integrate Stripe Payment Gateway',
      description: 'Connect checkout API, configure webhook handlers, and test payments in sandbox.',
      priority: 'High',
      hours: 8,
      type: 'Feature'
    },
    {
      id: 'task-2',
      title: 'Create Dashboard Components',
      description: 'Design key performance indicator metrics and responsive layouts.',
      priority: 'Medium',
      hours: 5,
      type: 'Feature'
    }
  ]);

  inProgress = signal<Task[]>([
    {
      id: 'task-3',
      title: 'Extract CV Skills using LLM',
      description: 'Implement backend service parser with Semantic Kernel invoking CheapModel for high accuracy extraction.',
      priority: 'High',
      hours: 12,
      type: 'Feature'
    }
  ]);

  review = signal<Task[]>([
    {
      id: 'task-4',
      title: 'Fix confirmation token bleed',
      description: 'Delay autofocus programmatically using setTimeout to prevent events bleeding across boxes.',
      priority: 'High',
      hours: 3,
      type: 'Bug'
    }
  ]);

  done = signal<Task[]>([
    {
      id: 'task-5',
      title: 'Configure Google Identity OAuth',
      description: 'Configure Developer Console credentials and connect sign-in button overlay components.',
      priority: 'Low',
      hours: 4,
      type: 'Feature'
    }
  ]);

  // Total counter
  totalTasksCount = computed(() => {
    return this.todo().length + this.inProgress().length + this.review().length + this.done().length;
  });

  // Modal control states
  showModal = signal(false);
  isEditing = signal(false);
  
  // Task payload inside modal
  modalTask = signal<Task>({
    id: '',
    title: '',
    description: '',
    priority: 'Medium',
    hours: 4,
    type: 'Feature'
  });

  // Keep track of which column the task originally belongs to when editing
  private originalColumn: 'todo' | 'inProgress' | 'review' | 'done' = 'todo';

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    // Signals need to trigger updates by re-assigning values so Angular detects updates
    this.todo.set([...this.todo()]);
    this.inProgress.set([...this.inProgress()]);
    this.review.set([...this.review()]);
    this.done.set([...this.done()]);
  }

  openAddModal() {
    this.isEditing.set(false);
    this.modalTask.set({
      id: 'task-' + Math.random().toString(36).substr(2, 9),
      title: '',
      description: '',
      priority: 'Medium',
      hours: 4,
      type: 'Feature'
    });
    this.showModal.set(true);
  }

  openEditModal(task: Task) {
    this.isEditing.set(true);
    // Find where the task belongs to track its original column
    if (this.todo().some(t => t.id === task.id)) this.originalColumn = 'todo';
    else if (this.inProgress().some(t => t.id === task.id)) this.originalColumn = 'inProgress';
    else if (this.review().some(t => t.id === task.id)) this.originalColumn = 'review';
    else if (this.done().some(t => t.id === task.id)) this.originalColumn = 'done';

    // Clone task to prevent direct reactive editing in input fields
    this.modalTask.set({ ...task });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveTask() {
    const taskData = this.modalTask();
    if (!taskData.title.trim()) {
      alert('Task title is required.');
      return;
    }

    if (this.isEditing()) {
      // Modify existing task in the correct list
      this.updateTaskInColumn(this.originalColumn, taskData);
    } else {
      // Add as new task to TODO list
      this.todo.update(current => [...current, taskData]);
    }
    this.closeModal();
  }

  deleteTask() {
    if (confirm('Are you sure you want to delete this task?')) {
      const taskId = this.modalTask().id;
      this.todo.set(this.todo().filter(t => t.id !== taskId));
      this.inProgress.set(this.inProgress().filter(t => t.id !== taskId));
      this.review.set(this.review().filter(t => t.id !== taskId));
      this.done.set(this.done().filter(t => t.id !== taskId));
      this.closeModal();
    }
  }

  private updateTaskInColumn(col: 'todo' | 'inProgress' | 'review' | 'done', updatedTask: Task) {
    const updateFn = (list: Task[]) => list.map(t => t.id === updatedTask.id ? updatedTask : t);
    
    if (col === 'todo') this.todo.update(updateFn);
    else if (col === 'inProgress') this.inProgress.update(updateFn);
    else if (col === 'review') this.review.update(updateFn);
    else if (col === 'done') this.done.update(updateFn);
  }
}