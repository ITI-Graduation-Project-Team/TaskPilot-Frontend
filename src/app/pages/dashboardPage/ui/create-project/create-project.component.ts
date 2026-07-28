import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { apiClient } from '../../../../shared/api/axios.instance';
import { AiChatModalComponent } from '../ai-chat-modal/ai-chat-modal.component';
import { TechStackAdvisorModalComponent } from '../tech-stack-advisor-modal/tech-stack-advisor-modal.component';
import { DraftReviewModalComponent } from '../draft-review-modal/draft-review-modal.component';

@Component({
  selector: 'app-create-project',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    AiChatModalComponent,
    TechStackAdvisorModalComponent,
    DraftReviewModalComponent
  ],
  template: `
    <section class="mx-auto max-w-6xl animate-[fadeIn_0.22s_ease_both]">
      <div class="grid gap-5 border-b border-border/70 pb-7 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <div>
          <button type="button" (click)="goBack()" class="mb-4 inline-flex items-center gap-2 text-xs font-extrabold text-text-secondary transition-colors hover:text-primary">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
            Back to projects
          </button>
          <p class="text-[11px] font-extrabold uppercase tracking-[0.24em] text-primary">New workspace</p>
          <h2 class="mt-2 text-3xl font-extrabold tracking-tight text-text-primary font-display">Create a project your team can actually run</h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">Start with AI when requirements are still fuzzy, or use manual setup when you already know the project name and scope. Either path lands in the same project workspace.</p>
        </div>
        <div class="mt-1 flex w-full rounded-2xl border border-border bg-surface p-1 shadow-sm sm:w-auto xl:justify-self-end">
          <button type="button" (click)="showManualForm.set(false)" class="flex-1 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all sm:flex-none"
                  [class.bg-primary]="!showManualForm()" [class.text-white]="!showManualForm()" [class.text-text-secondary]="showManualForm()">AI assisted</button>
          <button type="button" (click)="showManualForm.set(true)" class="flex-1 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all sm:flex-none"
                  [class.bg-primary]="showManualForm()" [class.text-white]="showManualForm()" [class.text-text-secondary]="!showManualForm()">Manual setup</button>
        </div>
      </div>

      <div class="mt-7 md:mt-8">
      @if (!showManualForm()) {
        @if (dashboardService.isAiChatOpen()) {
          <app-ai-chat-modal [embedded]="true" (close)="onAiChatClose()" (draftGenerated)="onDraftGenerated($event)"></app-ai-chat-modal>
        } @else if (isTechStackAdvisorOpen() && advisorProjectId()) {
          <app-tech-stack-advisor-modal [embedded]="true" [projectId]="advisorProjectId()!" (close)="onTechStackAdvisorClose()" (completed)="onTechStackAdvisorCompleted($event)"></app-tech-stack-advisor-modal>
        } @else if (isDraftReviewOpen()) {
          <app-draft-review-modal [embedded]="true" [draft]="aiDraft()" [chatId]="chatId()" (close)="isDraftReviewOpen.set(false)" (projectSaved)="onProjectSaved()"></app-draft-review-modal>
        } @else {
        <div class="grid gap-6 lg:grid-cols-[1fr_380px]">
          <button type="button" (click)="openAiProjectFlow()" class="group min-h-[360px] rounded-3xl border border-primary/25 bg-surface p-8 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
              <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <h3 class="mt-6 text-2xl font-extrabold text-text-primary font-display">Build from requirements chat</h3>
            <p class="mt-3 max-w-xl text-sm leading-7 text-text-secondary">Use the AI flow to clarify scope, finalize the project, review tech stack recommendations, and generate the initial backlog with WBS.</p>
            <div class="mt-8 grid gap-3 sm:grid-cols-2">
              @for (step of ['Requirements interview', 'Project draft saved', 'Tech stack advisor', 'Backlog generated']; track step) {
                <div class="rounded-2xl border border-border bg-sidebar px-4 py-3 text-xs font-bold text-text-primary">{{ step }}</div>
              }
            </div>
            <span class="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-white shadow-md transition-colors group-hover:bg-primary-hover">
              Start AI flow
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </span>
          </button>

          <aside class="rounded-3xl border border-border bg-sidebar p-6 shadow-sm">
            <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-text-secondary">Best for</p>
            <div class="mt-5 space-y-4">
              <div class="rounded-2xl bg-surface p-4"><p class="text-sm font-extrabold text-text-primary">Unclear scope</p><p class="mt-1 text-xs leading-5 text-text-secondary">Let the assistant ask clarifying questions before the project exists.</p></div>
              <div class="rounded-2xl bg-surface p-4"><p class="text-sm font-extrabold text-text-primary">Backlog generation</p><p class="mt-1 text-xs leading-5 text-text-secondary">Tech Stack Advisor runs before WBS so tasks match the chosen architecture.</p></div>
              <div class="rounded-2xl bg-surface p-4"><p class="text-sm font-extrabold text-text-primary">Team handoff</p><p class="mt-1 text-xs leading-5 text-text-secondary">The final project opens directly into a backlog your team can refine.</p></div>
            </div>
          </aside>
        </div>
        }
      } @else {
        <form (submit)="onCreateProjectSubmit($event)" class="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
            <div class="grid gap-5 md:grid-cols-2">
              <label class="space-y-2 text-xs font-extrabold uppercase tracking-wider text-text-secondary">Project name EN<input type="text" [(ngModel)]="newProjectNameEn" name="projNameEn" required placeholder="e.g. Mobile Application" class="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text-primary outline-none transition-all focus:ring-2 focus:ring-primary/20"></label>
              <label class="space-y-2 text-xs font-extrabold uppercase tracking-wider text-text-secondary">Project name AR<input type="text" [(ngModel)]="newProjectNameAr" name="projNameAr" required placeholder="&#1605;&#1579;&#1575;&#1604;: &#1578;&#1591;&#1576;&#1610;&#1602; &#1575;&#1604;&#1580;&#1608;&#1575;&#1604;" dir="rtl" class="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text-primary outline-none transition-all focus:ring-2 focus:ring-primary/20"></label>
              <label class="space-y-2 text-xs font-extrabold uppercase tracking-wider text-text-secondary">Description EN<textarea [(ngModel)]="newProjectDescEn" name="projDescEn" required rows="7" placeholder="What will this project deliver?" class="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition-all focus:ring-2 focus:ring-primary/20"></textarea></label>
              <label class="space-y-2 text-xs font-extrabold uppercase tracking-wider text-text-secondary">Description AR<textarea [(ngModel)]="newProjectDescAr" name="projDescAr" required rows="7" placeholder="&#1605;&#1575; &#1575;&#1604;&#1584;&#1610; &#1587;&#1610;&#1602;&#1583;&#1605;&#1607; &#1607;&#1584;&#1575; &#1575;&#1604;&#1605;&#1588;&#1585;&#1608;&#1593;&#1567;" dir="rtl" class="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition-all focus:ring-2 focus:ring-primary/20"></textarea></label>
            </div>
            <div class="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-5">
              <button type="button" (click)="goBack()" class="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-text-secondary transition-colors hover:bg-sidebar hover:text-text-primary">Cancel</button>
              <button type="submit" class="rounded-xl bg-primary px-6 py-2.5 text-sm font-extrabold text-white shadow-md transition-colors hover:bg-primary-hover">Create project</button>
            </div>
          </div>

          <aside class="rounded-3xl border border-border bg-sidebar p-6 shadow-sm">
            <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Manual setup</p>
            <h3 class="mt-2 text-lg font-extrabold text-text-primary">Keep it lean</h3>
            <p class="mt-2 text-sm leading-6 text-text-secondary">Manual projects start empty. After creation, assign team members, confirm stack when needed, and build the backlog from the Backlog tab.</p>
            <div class="mt-5 space-y-3 text-xs font-semibold text-text-secondary">
              <p class="rounded-2xl bg-surface p-3">Bilingual names and descriptions are stored separately.</p>
              <p class="rounded-2xl bg-surface p-3">No WBS is generated until you ask for it.</p>
              <p class="rounded-2xl bg-surface p-3">You can switch to the AI path before submitting.</p>
            </div>
          </aside>
        </form>
      }
      </div>
    </section>
  `
})
export class CreateProjectComponent {
  public dashboardService = inject(DashboardService);
  private projectState = inject(ProjectStateService);
  private router = inject(Router);

  showManualForm = signal(false);

  newProjectNameEn = '';
  newProjectNameAr = '';
  newProjectDescEn = '';
  newProjectDescAr = '';

  isTechStackAdvisorOpen = signal(false);
  advisorProjectId = signal<string | null>(null);
  isDraftReviewOpen = signal(false);
  aiDraft = signal<any>(null);
  chatId = signal<string>('');

  goBack() {
    this.router.navigate(['/dashboard', 'projects']);
  }

  openAiProjectFlow() {
    this.showManualForm.set(false);
    this.dashboardService.isAiChatOpen.set(true);
  }

  onAiChatClose() {
    this.dashboardService.isAiChatOpen.set(false);
  }

  async onDraftGenerated(event: { projectId: string; draft: any; chatId: string }) {
    this.dashboardService.isAiChatOpen.set(false);
    this.aiDraft.set(event.draft);
    this.chatId.set(event.chatId);
    this.advisorProjectId.set(event.projectId);
    this.isTechStackAdvisorOpen.set(true);
  }

  onTechStackAdvisorClose() {
    this.isTechStackAdvisorOpen.set(false);
    this.isDraftReviewOpen.set(true);
  }

  onTechStackAdvisorCompleted(projectId: string) {
    this.isTechStackAdvisorOpen.set(false);
    this.isDraftReviewOpen.set(true);
  }

  onProjectSaved() {
    this.isDraftReviewOpen.set(false);
    this.projectState.loadProjects();
    this.router.navigate(['/dashboard', 'projects']);
  }

  async onCreateProjectSubmit(event: Event) {
    event.preventDefault();
    if (!this.newProjectNameEn || !this.newProjectNameAr) return;

    try {
      const { data } = await apiClient.post<any>('/projects', {
        nameEn: this.newProjectNameEn,
        nameAr: this.newProjectNameAr,
        description: this.newProjectDescEn,
        descriptionAr: this.newProjectDescAr,
        status: 'Draft'
      });
      if (data.data?.id) {
        this.projectState.loadProjects();
        this.projectState.setSelectedProject(data.data.id);
        this.newProjectNameEn = '';
        this.newProjectNameAr = '';
        this.newProjectDescEn = '';
        this.newProjectDescAr = '';
        this.showManualForm.set(false);
        this.router.navigate(['/dashboard', 'projects']);
      }
    } catch (e) {
      console.warn('Failed to create project:', e);
    }
  }
}
