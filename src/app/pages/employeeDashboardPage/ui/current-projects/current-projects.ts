import { Component, inject, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ProjectStateService } from '../../../../shared/services/project-state.service';

@Component({
  selector: 'app-current-projects',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-extrabold text-[var(--text-primary)]">{{ 'employee.projects.current' | translate }}</h2>
      </div>

      @if (projectState.loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (i of [1,2,3,4]; track i) {
            <div class="h-48 rounded-3xl bg-[var(--surface)] border border-[var(--border)] animate-pulse"></div>
          }
        </div>
      } @else if (currentProjects().length === 0) {
        <div class="flex flex-col items-center justify-center p-12 text-center bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-sm animate-[fadeUp_0.4s_ease_both]">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
               style="background: rgba(59,130,246,0.1);">
            <svg class="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 class="text-xl font-extrabold text-[var(--text-primary)] mb-2">{{ 'employee.projects.noActiveTitle' | translate }}</h3>
          <p class="text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm">
            {{ 'employee.projects.noActiveDesc' | translate }}
          </p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (p of currentProjects(); track p.id) {
            <div class="group relative flex flex-col p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] 
                        hover:shadow-xl hover:border-[var(--primary)] transition-all duration-300 transform hover:-translate-y-1">
              
              <div class="absolute top-5 right-5">
                <span class="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-green-700 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-400">
                  {{ 'employee.projects.inProgress' | translate }}
                </span>
              </div>

              <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold mb-5 shadow-sm transition-transform group-hover:scale-105"
                   [style.background]="getProjectColor(p.id)">
                {{ (p.nameEn || p.name || '?')[0].toUpperCase() }}
              </div>
              
              <h3 class="text-lg font-extrabold text-[var(--text-primary)] truncate mb-1.5" [title]="p.nameEn || p.name">
                {{ p.nameEn || p.name }}
              </h3>
              
              <p class="text-sm text-[var(--text-secondary)] line-clamp-2 mb-6 flex-1 leading-relaxed">
                {{ p.descriptionEn || p.description || ('employee.projects.noDescription' | translate) }}
              </p>
              
              <div class="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border)]">
                <button (click)="selectProject(p.id)"
                        class="text-sm font-extrabold text-[var(--primary)] group-hover:text-[var(--primary-hover)] transition-colors flex items-center gap-1.5 focus:outline-none">
                  View Board
                  <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class CurrentProjects {
  projectState = inject(ProjectStateService);

  @Output() viewBoard = new EventEmitter<string>();

  currentProjects = computed(() => {
    return this.projectState.projects().filter((p: any) => p.status !== 'Completed' && p.status !== 'Closed' && p.status !== 'Archived');
  });

  selectProject(id: string) {
    this.projectState.setSelectedProject(id);
    this.viewBoard.emit(id);
  }

  getProjectColor(id: string): string {
    const colors = [
      'linear-gradient(135deg,#6366f1,#8b5cf6)',
      'linear-gradient(135deg,#3b82f6,#06b6d4)',
      'linear-gradient(135deg,#10b981,#059669)',
      'linear-gradient(135deg,#f59e0b,#ef4444)',
      'linear-gradient(135deg,#ec4899,#8b5cf6)',
    ];
    let h = 0;
    for (let i = 0; i < (id || '').length; i++) h += id.charCodeAt(i);
    return colors[h % colors.length];
  }
}
