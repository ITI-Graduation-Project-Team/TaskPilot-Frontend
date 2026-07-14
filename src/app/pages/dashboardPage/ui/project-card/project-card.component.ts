import { Component, ChangeDetectionStrategy, signal, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectInfo } from '../../../../shared/services/project-state.service';

export interface ProjectStats {
  activeSprint: string;
  memberCount: number;
  taskCount: number;
  loading: boolean;
}

@Component({
  selector: 'app-project-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    'class': 'block bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group relative',
    '[style.box-shadow]': 'isHovered() ? shadowColor() : "none"',
    '(mouseenter)': 'isHovered.set(true)',
    '(mouseleave)': 'isHovered.set(false)'
  },
  template: `
    <!-- Top accent bar -->
    <div class="h-1.5 w-full" [style.background]="accentColor()"></div>
    
    <div class="p-6 flex flex-col h-full min-h-[220px]">
      <!-- Title & Menu -->
      <div class="flex items-start justify-between gap-3 mb-2">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shrink-0"
               [style.background]="accentColor()">
            {{ (project().nameEn || '?')[0].toUpperCase() }}
          </div>
          <h3 class="text-base font-extrabold text-text-primary truncate font-display">
            {{ project().nameEn }}
          </h3>
        </div>

        <!-- Settings menu -->
        <div class="relative shrink-0">
          <button (click)="toggleMenu($event)" 
                  class="p-1.5 hover:bg-sidebar rounded-lg text-text-secondary hover:text-text-primary transition-colors focus:outline-none">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
            </svg>
          </button>
          
          @if (isMenuOpen()) {
            <!-- Backdrop -->
            <div class="fixed inset-0 z-40" (click)="closeMenu($event)"></div>
            <div class="absolute right-0 mt-1 z-50 w-32 bg-surface border border-border rounded-xl shadow-xl overflow-hidden py-1 animate-[fadeDown_0.12s_ease_both]">
              <button (click)="onEdit($event)" class="w-full text-left px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-sidebar transition-colors flex items-center gap-2">
                <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                Edit Project
              </button>
              <button (click)="onToggleStatus($event)" class="w-full text-left px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-sidebar transition-colors flex items-center gap-2">
                <svg class="w-3.5 h-3.5 text-text-secondary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View Status & History
              </button>
              <button (click)="onDelete($event)" class="w-full text-left px-3.5 py-2 text-xs font-semibold text-error hover:bg-error/5 transition-colors flex items-center gap-2 border-t border-border mt-1 pt-2">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                Delete
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Description -->
      <p class="text-xs text-text-secondary line-clamp-2 leading-relaxed mb-6 flex-grow">
        {{ project().description || 'No description provided.' }}
      </p>

      <!-- Stats / Skeletons -->
      @if (stats() && !stats()?.loading) {
        <div class="space-y-4">
          <!-- Status / Active Sprint pill -->
          <div class="flex items-center">
            @if (project().status === 'Completed') {
              <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                Completed
              </div>
            } @else if (project().status === 'Archived') {
              <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-600 border border-slate-500/20">
                Archived
              </div>
            } @else {
              @if (stats()?.activeSprint && stats()?.activeSprint !== 'No Active Sprint') {
                <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-success/10 text-success border border-success/20">
                  <span class="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                  {{ stats()?.activeSprint }}
                </div>
              } @else {
                <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-text-secondary/10 text-text-secondary border border-border">
                  No Active Sprint
                </div>
              }
            }
          </div>

          <!-- Bottom stats row -->
          <div class="flex items-center justify-between pt-2 border-t border-border/60">
            <div class="flex gap-4">
              <!-- Members Count -->
              <div class="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors">
                <svg class="w-4 h-4 text-text-secondary/80" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                <span class="text-xs font-bold font-mono">{{ stats()?.memberCount ?? 0 }}</span>
                <span class="text-[10px] text-text-secondary uppercase font-semibold">Members</span>
              </div>

              <!-- Tasks Count -->
              <div class="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors">
                <svg class="w-4 h-4 text-text-secondary/80" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
                <span class="text-xs font-bold font-mono">{{ stats()?.taskCount ?? 0 }}</span>
                <span class="text-[10px] text-text-secondary uppercase font-semibold">Tasks</span>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <!-- Skeleton loading state -->
        <div class="space-y-4 animate-pulse">
          <div class="h-6 w-28 bg-border rounded-lg"></div>
          <div class="flex items-center justify-between pt-2 border-t border-border/60">
            <div class="flex gap-4">
              <div class="h-4 w-12 bg-border rounded"></div>
              <div class="h-4 w-12 bg-border rounded"></div>
            </div>
          </div>
        </div>
      }

      <!-- Actions -->
      <div class="grid grid-cols-2 gap-2 mt-5">
        <button (click)="onSprintClick($event)" class="py-2 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 group/btn">
          <span>Sprint Board</span>
          <svg class="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
        <button (click)="onBacklogClick($event)" class="py-2 px-3 bg-sidebar hover:bg-primary/10 border border-border hover:border-primary/20 text-text-primary text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5">
          <span>Backlog</span>
        </button>
      </div>
    </div>
  `
})
export class ProjectCardComponent {
  project = input.required<ProjectInfo>();
  stats = input<ProjectStats | null>(null);

  isHovered = signal(false);
  isMenuOpen = signal(false);

  selectSprint = output<string>();
  selectBacklog = output<string>();
  editProject = output<string>();
  deleteProject = output<string>();
  toggleStatus = output<string>();

  accentColor = computed(() => {
    const colors = [
      'linear-gradient(135deg,#6366f1,#8b5cf6)',
      'linear-gradient(135deg,#3b82f6,#06b6d4)',
      'linear-gradient(135deg,#10b981,#059669)',
      'linear-gradient(135deg,#f59e0b,#ef4444)',
      'linear-gradient(135deg,#ec4899,#8b5cf6)',
    ];
    let hash = 0;
    const id = this.project().id || '';
    for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
    return colors[hash % colors.length];
  });

  shadowColor = computed(() => {
    const colors = [
      '0 10px 25px -5px rgba(99, 102, 241, 0.15), 0 8px 10px -6px rgba(139, 92, 246, 0.15)',
      '0 10px 25px -5px rgba(59, 130, 246, 0.15), 0 8px 10px -6px rgba(6, 182, 212, 0.15)',
      '0 10px 25px -5px rgba(16, 185, 129, 0.15), 0 8px 10px -6px rgba(5, 150, 105, 0.15)',
      '0 10px 25px -5px rgba(245, 158, 11, 0.15), 0 8px 10px -6px rgba(239, 68, 68, 0.15)',
      '0 10px 25px -5px rgba(236, 72, 153, 0.15), 0 8px 10px -6px rgba(139, 92, 246, 0.15)',
    ];
    let hash = 0;
    const id = this.project().id || '';
    for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
    return colors[hash % colors.length];
  });

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen.update(v => !v);
  }

  closeMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen.set(false);
  }

  onEdit(event: Event) {
    event.stopPropagation();
    this.editProject.emit(this.project().id);
    this.isMenuOpen.set(false);
  }

  onDelete(event: Event) {
    event.stopPropagation();
    this.deleteProject.emit(this.project().id);
    this.isMenuOpen.set(false);
  }

  onToggleStatus(event: Event) {
    event.stopPropagation();
    this.toggleStatus.emit(this.project().id);
    this.isMenuOpen.set(false);
  }

  onSprintClick(event: Event) {
    event.stopPropagation();
    this.selectSprint.emit(this.project().id);
  }

  onBacklogClick(event: Event) {
    event.stopPropagation();
    this.selectBacklog.emit(this.project().id);
  }
}
