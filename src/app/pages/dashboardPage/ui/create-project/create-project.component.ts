import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { AiChatModalComponent } from '../ai-chat-modal/ai-chat-modal.component';
import { TechStackAdvisorModalComponent } from '../tech-stack-advisor-modal/tech-stack-advisor-modal.component';
import { DraftReviewModalComponent } from '../draft-review-modal/draft-review-modal.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-create-project',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AiChatModalComponent,
    TechStackAdvisorModalComponent,
    DraftReviewModalComponent,
    TranslatePipe
  ],
  template: `
    <section class="mx-auto max-w-6xl animate-[fadeIn_0.22s_ease_both]">
      <div class="grid gap-5 border-b border-border/70 pb-7 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <div>
          <button type="button" (click)="goBack()" class="mb-4 inline-flex items-center gap-2 text-xs font-extrabold text-text-secondary transition-colors hover:text-primary">
            <svg class="h-4 w-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
            {{ 'CREATE_PROJECT.BACK_TO_PROJECTS' | translate }}
          </button>
          <p class="text-[11px] font-extrabold uppercase tracking-[0.24em] text-primary">{{ 'CREATE_PROJECT.NEW_WORKSPACE' | translate }}</p>
          <h2 class="mt-2 text-3xl font-extrabold tracking-tight text-text-primary font-display">{{ 'CREATE_PROJECT.TITLE' | translate }}</h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">{{ 'CREATE_PROJECT.SUBTITLE' | translate }}</p>
        </div>
      </div>

      <div class="mt-7 md:mt-8">
        <div class="grid gap-6 lg:grid-cols-[1fr_380px]">
          <button type="button" (click)="openAiProjectFlow()" class="group min-h-[360px] rounded-3xl border border-primary/25 bg-surface p-8 text-start shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
              <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <h3 class="mt-6 text-2xl font-extrabold text-text-primary font-display">{{ 'CREATE_PROJECT.BUILD_CHAT' | translate }}</h3>
            <p class="mt-3 max-w-xl text-sm leading-7 text-text-secondary">{{ 'CREATE_PROJECT.BUILD_DESC' | translate }}</p>
            <div class="mt-8 grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-border bg-sidebar px-4 py-3 text-xs font-bold text-text-primary">{{ 'CREATE_PROJECT.REQ_INTERVIEW' | translate }}</div>
                <div class="rounded-2xl border border-border bg-sidebar px-4 py-3 text-xs font-bold text-text-primary">{{ 'CREATE_PROJECT.PROJ_SAVED' | translate }}</div>
                <div class="rounded-2xl border border-border bg-sidebar px-4 py-3 text-xs font-bold text-text-primary">{{ 'CREATE_PROJECT.TECH_ADVISOR' | translate }}</div>
                <div class="rounded-2xl border border-border bg-sidebar px-4 py-3 text-xs font-bold text-text-primary">{{ 'CREATE_PROJECT.BACKLOG_GEN' | translate }}</div>
            </div>
            <span class="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-white shadow-md transition-colors group-hover:bg-primary-hover">
              {{ 'CREATE_PROJECT.START_AI_FLOW' | translate }}
              <svg class="h-4 w-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </span>
          </button>

          <aside class="rounded-3xl border border-border bg-sidebar p-6 shadow-sm text-start">
            <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-text-secondary">{{ 'CREATE_PROJECT.BEST_FOR' | translate }}</p>
            <div class="mt-5 space-y-4">
              <div class="rounded-2xl bg-surface p-4"><p class="text-sm font-extrabold text-text-primary">{{ 'CREATE_PROJECT.UNCLEAR_SCOPE' | translate }}</p><p class="mt-1 text-xs leading-5 text-text-secondary">{{ 'CREATE_PROJECT.UNCLEAR_DESC' | translate }}</p></div>
              <div class="rounded-2xl bg-surface p-4"><p class="text-sm font-extrabold text-text-primary">{{ 'CREATE_PROJECT.BACKLOG_GEN_TITLE' | translate }}</p><p class="mt-1 text-xs leading-5 text-text-secondary">{{ 'CREATE_PROJECT.BACKLOG_GEN_DESC' | translate }}</p></div>
              <div class="rounded-2xl bg-surface p-4"><p class="text-sm font-extrabold text-text-primary">{{ 'CREATE_PROJECT.TEAM_HANDOFF' | translate }}</p><p class="mt-1 text-xs leading-5 text-text-secondary">{{ 'CREATE_PROJECT.TEAM_HANDOFF_DESC' | translate }}</p></div>
            </div>
          </aside>
        </div>
      </div>
    </section>

    @if (isLocalAiChatOpen()) {
      <app-ai-chat-modal (close)="onAiChatClose()" (draftGenerated)="onDraftGenerated($event)"></app-ai-chat-modal>
    }
    @if (isTechStackAdvisorOpen() && advisorProjectId()) {
      <app-tech-stack-advisor-modal [projectId]="advisorProjectId()!" (close)="onTechStackAdvisorClose()" (completed)="onTechStackAdvisorCompleted($event)"></app-tech-stack-advisor-modal>
    }
    @if (isDraftReviewOpen()) {
      <app-draft-review-modal [draft]="aiDraft()" [chatId]="chatId()" (close)="isDraftReviewOpen.set(false)" (projectSaved)="onProjectSaved()"></app-draft-review-modal>
    }
  `
})
export class CreateProjectComponent {
  public dashboardService = inject(DashboardService);
  private projectState = inject(ProjectStateService);
  private router = inject(Router);

  isLocalAiChatOpen = signal(false);
  isTechStackAdvisorOpen = signal(false);
  advisorProjectId = signal<string | null>(null);
  isDraftReviewOpen = signal(false);
  aiDraft = signal<any>(null);
  chatId = signal<string>('');

  goBack() {
    this.router.navigate(['/dashboard', 'projects']);
  }

  openAiProjectFlow() {
    this.isLocalAiChatOpen.set(true);
  }

  onAiChatClose() {
    this.isLocalAiChatOpen.set(false);
  }

  async onDraftGenerated(event: { projectId: string; draft: any; chatId: string }) {
    this.isLocalAiChatOpen.set(false);
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
}
