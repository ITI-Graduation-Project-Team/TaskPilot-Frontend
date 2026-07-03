import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BacklogService, BacklogDto, UserStoryDto, TaskItemDto } from '../../../../shared/api/backlog.service';
import { getUserIdFromToken } from '../../../../shared/lib/auth/cookie.helper';
import { apiClient } from '../../../../shared/api/axios.instance';

@Component({
  selector: 'app-backlog-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      
      @if (isLoading()) {
        <div class="flex items-center justify-center p-12 bg-surface border border-border rounded-2xl shadow-sm">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            <span class="text-sm font-semibold text-text-secondary">Loading backlog...</span>
          </div>
        </div>
      } @else if (!isAssigned()) {
        <div class="bg-surface border border-warning/30 p-8 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto my-12 transition-colors duration-200">
          <div class="w-16 h-16 bg-warning/10 text-warning rounded-2xl flex items-center justify-center shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-text-primary">No Project Backlog</h3>
            <p class="text-text-secondary text-sm mt-2 max-w-md">
              Please contact your administrator to be assigned to a project in order to access the product backlog.
            </p>
          </div>
        </div>
      } @else {
        
        <div>
          <h2 class="text-2xl font-bold text-text-primary">Product Backlog</h2>
          <p class="text-text-secondary text-sm">Sprint User Stories & Task Breakdown structure.</p>
        </div>

        <div class="space-y-4">
          @for (story of backlog()?.userStories; track story.id) {
            <div class="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden transition-colors duration-200">
              <!-- Story Header -->
              <div class="p-5 bg-sidebar border-b border-border flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded">User Story</span>
                    <h3 class="font-bold text-text-primary text-[17px]">{{ story.titleEn }}</h3>
                  </div>
                  <p class="text-text-secondary text-xs mt-1">{{ story.descriptionEn }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-1 text-xs font-semibold bg-gray-200 dark:bg-border text-text-secondary rounded-full">
                    {{ story.tasks.length }} Tasks
                  </span>
                </div>
              </div>

              <!-- Task List -->
              <div class="p-4 divide-y divide-border">
                @for (task of story.tasks; track task.id) {
                  <div class="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="space-y-1 max-w-xl">
                      <div class="flex items-center gap-2 flex-wrap">
                        <h4 class="font-bold text-text-primary text-sm">{{ task.titleEn }}</h4>
                        <span class="px-1.5 py-0.5 text-[9px] font-bold bg-slate-200 dark:bg-border text-text-secondary rounded uppercase">
                          {{ task.status }}
                        </span>
                      </div>
                      <p class="text-text-secondary text-xs line-clamp-1">{{ task.descriptionEn }}</p>
                    </div>
                    <div class="flex items-center gap-4 text-xs font-semibold shrink-0">
                      <span class="flex items-center gap-1 text-text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {{ task.estimatedHours }}h
                      </span>
                      <span class="px-2 py-0.5 text-[10px] font-bold rounded"
                            [ngClass]="{
                              'bg-error/10 text-error': task.priority === 'High' || task.priority === '2',
                              'bg-warning/10 text-warning': task.priority === 'Medium' || task.priority === '1',
                              'bg-primary/10 text-primary': task.priority === 'Low' || task.priority === '0'
                            }">
                        {{ task.priority }}
                      </span>
                    </div>
                  </div>
                } @empty {
                  <div class="text-center py-6 text-xs text-text-secondary">
                    No tasks assigned to this user story.
                  </div>
                }
              </div>
            </div>
          } @empty {
            <div class="bg-surface border border-border p-12 text-center rounded-2xl text-text-secondary">
              No user stories found in the product backlog.
            </div>
          }
        </div>
      }
    </div>
  `
})
export class BacklogViewComponent implements OnInit {
  private backlogService = inject(BacklogService);

  isLoading = signal(true);
  isAssigned = signal(false);
  backlog = signal<BacklogDto | null>(null);

  async ngOnInit() {
    try {
      this.isLoading.set(true);
      await this.loadBacklog();
    } catch (e) {
      console.error('Error loading backlog page:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadBacklog() {
    const currentUserId = getUserIdFromToken();
    if (!currentUserId) return;

    const projects = await this.backlogService.getProjects();
    let assignedProject = null;

    for (const p of projects) {
      try {
        const teamResponse = await apiClient.get<any>(`/Projects/${p.id}/employees`);
        const employeesList = teamResponse.data?.data || [];
        if (employeesList.some((e: any) => e.employeeId === currentUserId)) {
          assignedProject = p;
          break;
        }
      } catch (e) {
        console.warn('Failed to check project membership for backlog view:', e);
      }
    }

    if (!assignedProject) {
      this.isAssigned.set(false);
      return;
    }

    this.isAssigned.set(true);
    const data = await this.backlogService.getBacklog(assignedProject.id);
    this.backlog.set(data);
  }
}
