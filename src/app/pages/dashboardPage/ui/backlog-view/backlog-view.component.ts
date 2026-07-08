import { Component, ChangeDetectionStrategy, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BacklogService, BacklogDto, UserStoryDto } from '../../../../shared/api/backlog.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { AiRequirementsService } from '../../../../shared/api/ai-requirements.service';
import { SprintPlanningModalComponent } from '../sprint-planning-modal/sprint-planning-modal.component';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-backlog-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SprintPlanningModalComponent],
  template: `
    <div class="space-y-6">
      
      @if (projectState.loading() || isLoading()) {
        <div class="flex items-center justify-center p-12 bg-surface border border-border rounded-2xl shadow-sm">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            <span class="text-sm font-semibold text-text-secondary">Loading backlog...</span>
          </div>
        </div>
      } @else if (projectState.isProjectManager() && projectState.projects().length === 0) {
        <!-- PM First Project Creation Screen -->
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
      } @else if (!isAssigned()) {
        <!-- Warning for unassigned employees -->
        <div class="bg-surface border border-warning/30 p-8 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto my-12 transition-colors duration-200">
          <div class="w-16 h-16 bg-warning/10 text-warning rounded-2xl flex items-center justify-center shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-text-primary">No Project Assigned</h3>
            <p class="text-text-secondary text-sm mt-2 max-w-md">
              Please contact your Project Manager or Admin to assign you to a project to view the backlog.
            </p>
          </div>
        </div>
      } @else {
        
        <!-- Header Actions -->
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-2xl font-bold text-text-primary">Product Backlog</h2>
            <p class="text-text-secondary text-sm">Sprint User Stories & Task Breakdown structure.</p>
          </div>

          <div class="flex items-center gap-3">
            @if (projectState.isProjectManager() && backlog()?.userStories?.length) {
              <button (click)="isSprintPlanningModalOpen.set(true)" 
                      class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl
                             shadow-md shadow-indigo-500/10 transition-all duration-200 hover:-translate-y-px active:translate-y-0 flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                AI Sprint Planner
              </button>
            }

            @if (projectState.isProjectManager()) {
              <button (click)="isStoryModalOpen.set(true)" 
                      class="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl
                             shadow-md shadow-primary/20 transition-all duration-200 hover:-translate-y-px active:translate-y-0 flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                Add User Story
              </button>
            }
          </div>
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
            <div class="bg-surface border border-border p-12 text-center rounded-2xl flex flex-col items-center justify-center space-y-4">
              <svg class="w-12 h-12 text-text-secondary opacity-40 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
              <div class="space-y-1">
                <h4 class="text-base font-bold text-text-primary">Empty Product Backlog</h4>
                <p class="text-xs text-text-secondary max-w-sm mx-auto">There are no user stories in this project yet. You can write them manually, or use AI WBS Generator to automatically build a breakdown structure.</p>
              </div>
              
              @if (projectState.isProjectManager()) {
                <div class="flex items-center gap-3 justify-center">
                  <button (click)="isStoryModalOpen.set(true)" class="px-4 py-2 border border-border rounded-xl text-xs font-bold hover:bg-border transition-colors">
                    Add Story Manually
                  </button>
                  <button (click)="generateWbs()" 
                          [disabled]="isGeneratingWbs()"
                          class="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50">
                    @if (isGeneratingWbs()) {
                      <div class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      Generating Backlog...
                    } @else {
                      🤖 Generate WBS with AI
                    }
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    <!-- Add User Story Modal -->
    @if (isStoryModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]">
        <div class="bg-surface border border-border rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-[scaleUp_0.25s_ease_both]">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-text-primary">Add New User Story</h3>
            <button (click)="isStoryModalOpen.set(false)" class="p-1.5 text-text-secondary hover:bg-border rounded-full transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form (submit)="onAddUserStory($event)" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase">Title / Name</label>
              <input type="text" name="storyTitle" required placeholder="e.g. As a user, I want to authenticate via Google" 
                     class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
            </div>
            <div>
              <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase">Description / Details</label>
              <textarea name="storyDesc" placeholder="Provide detailed acceptance criteria or description..." rows="4" required
                        class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"></textarea>
            </div>
            <div>
              <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase">Priority</label>
              <select name="storyPriority" class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                <option value="Low">Low</option>
                <option value="Medium" selected>Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div class="flex justify-end gap-3 pt-3">
              <button type="button" (click)="isStoryModalOpen.set(false)" class="px-4 py-2.5 border border-border rounded-xl hover:bg-border font-semibold text-sm transition-colors">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-md transition-all">
                Add Story
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- AI Sprint Planning Modal -->
    @if (isSprintPlanningModalOpen()) {
      <app-sprint-planning-modal (close)="onSprintPlanningModalClose()" (sprintConfirmed)="fetchBacklog(projectState.selectedProjectId()!)"></app-sprint-planning-modal>
    }
  `
})
export class BacklogViewComponent implements OnInit {
  private backlogService = inject(BacklogService);
  private aiRequirementsService = inject(AiRequirementsService);
  public projectState = inject(ProjectStateService);
  private toastService = inject(ToastService);

  isLoading = signal(false);
  isAssigned = signal(false);
  backlog = signal<BacklogDto | null>(null);
  isStoryModalOpen = signal(false);
  isSprintPlanningModalOpen = signal(false);
  isGeneratingWbs = signal(false);

  constructor() {
    // Automatically trigger reload when the active selected project changes
    effect(() => {
      const projId = this.projectState.selectedProjectId();
      if (projId) {
        this.fetchBacklog(projId);
      } else {
        this.backlog.set(null);
        this.isAssigned.set(false);
      }
    });
  }

  ngOnInit() {}

  async fetchBacklog(projectId: string) {
    this.isLoading.set(true);
    this.isAssigned.set(true);
    try {
      const data = await this.backlogService.getBacklog(projectId);
      this.backlog.set(data);
    } catch (e) {
      console.error('Failed to fetch backlog:', e);
      this.backlog.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  onSprintPlanningModalClose() {
    this.isSprintPlanningModalOpen.set(false);
  }

  async generateWbs() {
    const projId = this.projectState.selectedProjectId();
    if (!projId) return;

    this.isGeneratingWbs.set(true);
    try {
      await this.aiRequirementsService.generateWbs(projId);
      this.toastService.show('✅ AI WBS user stories and task items generated successfully!', 'success');
      await this.fetchBacklog(projId);
    } catch (e) {
      console.error(e);
      this.toastService.show('Failed to generate WBS. Check backend API logs.', 'error');
    } finally {
      this.isGeneratingWbs.set(false);
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

  async onAddUserStory(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const title = (form.elements.namedItem('storyTitle') as HTMLInputElement).value;
    const desc = (form.elements.namedItem('storyDesc') as HTMLTextAreaElement).value;
    const priority = (form.elements.namedItem('storyPriority') as HTMLSelectElement).value;
    
    const projId = this.projectState.selectedProjectId();
    if (!projId) return;

    try {
      this.isLoading.set(true);
      await this.backlogService.createUserStory(projId, title, desc, priority);
      this.isStoryModalOpen.set(false);
      // Reload backlog
      await this.fetchBacklog(projId);
    } catch (e) {
      console.error('Failed to create user story:', e);
    } finally {
      this.isLoading.set(false);
    }
  }
}
