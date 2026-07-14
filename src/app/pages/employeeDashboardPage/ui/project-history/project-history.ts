import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ProjectStateService } from '../../../../shared/services/project-state.service';

@Component({
  selector: 'app-project-history',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-extrabold text-[var(--text-primary)]">Project History</h2>
      </div>

      @if (projectState.loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (i of [1,2,3]; track i) {
            <div class="h-48 rounded-3xl bg-[var(--surface)] border border-[var(--border)] animate-pulse"></div>
          }
        </div>
      } @else if (historicalProjects().length === 0) {
        <div class="flex flex-col items-center justify-center p-12 text-center bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-sm animate-[fadeUp_0.4s_ease_both]">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
               style="background: rgba(107,114,128,0.1);">
            <svg class="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-extrabold text-[var(--text-primary)] mb-2">No historical projects</h3>
          <p class="text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm">
            You haven't completed any projects yet. When a project you're assigned to is closed or completed, it will appear here.
          </p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (p of historicalProjects(); track p.id) {
            <div class="group relative flex flex-col p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] 
                        hover:shadow-lg transition-all duration-300 opacity-80 hover:opacity-100 grayscale hover:grayscale-0">
              
              <div class="absolute top-5 right-5">
                <span class="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-gray-600 bg-gray-100 rounded-full dark:bg-gray-800 dark:text-gray-300">
                  {{ p.status }}
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
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ProjectHistory {
  projectState = inject(ProjectStateService);

  historicalProjects = computed(() => {
    return this.projectState.projects().filter((p: any) => p.status === 'Completed' || p.status === 'Closed' || p.status === 'Archived');
  });

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
