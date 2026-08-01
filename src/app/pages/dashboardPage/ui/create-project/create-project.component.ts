import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { AiChatModalComponent } from '../ai-chat-modal/ai-chat-modal.component';
import { TechStackAdvisorModalComponent } from '../tech-stack-advisor-modal/tech-stack-advisor-modal.component';
import { TranslatePipe } from '@ngx-translate/core';
import { AiRequirementsService } from '../../../../shared/api/ai-requirements.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-create-project',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AiChatModalComponent,
    TechStackAdvisorModalComponent,
    TranslatePipe
  ],
  styles: [`
    :host { 
      display: block;
      height: 100%;
      position: relative;
    }
  `],
  template: `
    <!-- ─── LANDING: choose creation mode ─── -->
    @if (!isLocalAiChatOpen()) {
      <section class="mx-auto max-w-6xl w-full" style="animation: fadeIn 0.25s ease both;">

        <style>@keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }</style>

        <!-- Header row -->
        <div class="border-b border-border/70 pb-7">
          <button type="button" (click)="goBack()"
                  class="mb-4 inline-flex items-center gap-2 text-xs font-extrabold text-text-secondary transition-colors hover:text-primary">
            <svg class="h-4 w-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
            </svg>
            {{ 'CREATE_PROJECT.BACK_TO_PROJECTS' | translate }}
          </button>
          <p class="text-[11px] font-extrabold uppercase tracking-[0.24em] text-primary">
            {{ 'CREATE_PROJECT.NEW_WORKSPACE' | translate }}
          </p>
          <h2 class="mt-2 text-3xl font-extrabold tracking-tight text-text-primary font-display">
            {{ 'CREATE_PROJECT.TITLE' | translate }}
          </h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
            {{ 'CREATE_PROJECT.SUBTITLE' | translate }}
          </p>
        </div>

        <!-- Cards -->
        <div class="mt-7 md:mt-8">
          <div class="grid gap-6 lg:grid-cols-[1fr_380px]">

            <!-- AI Flow card -->
            <button type="button" (click)="openAiProjectFlow()"
                    class="group min-h-[360px] rounded-3xl border border-primary/25 bg-surface p-8 text-start shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer">

              <!-- Icon with animated ring -->
              <div class="relative flex h-14 w-14 items-center justify-center">
                <div class="absolute inset-0 rounded-2xl bg-primary/10 transition-all group-hover:bg-primary/15 group-hover:scale-110"></div>
                <div class="absolute inset-0 rounded-2xl ring-2 ring-primary/0 transition-all group-hover:ring-primary/25 group-hover:scale-110"></div>
                <svg class="relative h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>

              <h3 class="mt-6 text-2xl font-extrabold text-text-primary font-display">
                {{ 'CREATE_PROJECT.BUILD_CHAT' | translate }}
              </h3>
              <p class="mt-3 max-w-xl text-sm leading-7 text-text-secondary">
                {{ 'CREATE_PROJECT.BUILD_DESC' | translate }}
              </p>

              <!-- Feature chips -->
              <div class="mt-8 grid gap-3 sm:grid-cols-2">
                @for (chip of featureChips; track chip) {
                  <div class="flex items-center gap-2 rounded-2xl border border-border bg-sidebar px-4 py-3 text-xs font-bold text-text-primary transition-colors group-hover:border-primary/20">
                    <span class="text-primary">✦</span> {{ chip | translate }}
                  </div>
                }
              </div>

              <!-- CTA -->
              <span class="mt-8 inline-flex items-center gap-2.5 rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-white shadow-md transition-all group-hover:bg-primary-hover group-hover:shadow-lg group-hover:shadow-primary/30 group-hover:gap-4">
                {{ 'CREATE_PROJECT.START_AI_FLOW' | translate }}
                <svg class="h-4 w-4 rtl:rotate-180 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </span>
            </button>

            <!-- Best-for sidebar -->
            <aside class="rounded-3xl border border-border bg-sidebar p-6 shadow-sm text-start">
              <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-text-secondary">
                {{ 'CREATE_PROJECT.BEST_FOR' | translate }}
              </p>
              <div class="mt-5 space-y-3">
                @for (item of bestForItems; track item.title) {
                  <div class="group/card rounded-2xl bg-surface p-4 border border-transparent transition-all hover:border-primary/15 hover:shadow-sm">
                    <p class="text-sm font-extrabold text-text-primary">{{ item.title | translate }}</p>
                    <p class="mt-1 text-xs leading-5 text-text-secondary">{{ item.desc | translate }}</p>
                  </div>
                }
              </div>
            </aside>
          </div>
        </div>
      </section>
    }

    <!-- ─── FULL-PAGE CHAT ─── -->
    @if (isLocalAiChatOpen()) {
      <div class="absolute -inset-6 md:-inset-8 z-10 bg-background flex flex-col overflow-hidden" style="animation: fadeIn 0.2s ease both;">
        <app-ai-chat-modal
          [embedded]="false"
          (close)="onAiChatClose()"
          (draftGenerated)="onDraftGenerated($event)">
        </app-ai-chat-modal>
      </div>
    }

    <!-- ─── FULL-PAGE TECH STACK ADVISOR ─── -->
    @if (isTechStackAdvisorOpen() && advisorProjectId()) {
      <div class="absolute -inset-6 md:-inset-8 z-10 bg-background flex flex-col overflow-hidden" style="animation: fadeIn 0.2s ease both;">
        <app-tech-stack-advisor-modal
          class="flex-1 overflow-hidden"
          [embedded]="true"
          [projectId]="advisorProjectId()!"
          (close)="onTechStackAdvisorClose()"
          (completed)="onTechStackAdvisorCompleted($event)">
        </app-tech-stack-advisor-modal>
      </div>
    }

  `
})
export class CreateProjectComponent {
  public dashboardService = inject(DashboardService);
  private projectState = inject(ProjectStateService);
  private router = inject(Router);
  private aiRequirements = inject(AiRequirementsService);
  private toastService = inject(ToastService);

  isLocalAiChatOpen = signal(false);
  isTechStackAdvisorOpen = signal(false);
  advisorProjectId = signal<string | null>(null);
  aiDraft = signal<any>(null);
  chatId = signal<string>('');

  readonly featureChips = [
    'CREATE_PROJECT.REQ_INTERVIEW',
    'CREATE_PROJECT.PROJ_SAVED',
    'CREATE_PROJECT.TECH_ADVISOR',
    'CREATE_PROJECT.BACKLOG_GEN',
  ];

  readonly bestForItems = [
    { title: 'CREATE_PROJECT.UNCLEAR_SCOPE', desc: 'CREATE_PROJECT.UNCLEAR_DESC' },
    { title: 'CREATE_PROJECT.BACKLOG_GEN_TITLE', desc: 'CREATE_PROJECT.BACKLOG_GEN_DESC' },
    { title: 'CREATE_PROJECT.TEAM_HANDOFF', desc: 'CREATE_PROJECT.TEAM_HANDOFF_DESC' },
  ];

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

  async onTechStackAdvisorClose() {
    this.isTechStackAdvisorOpen.set(false);
    await this.confirmAndSaveProject();
  }

  async onTechStackAdvisorCompleted(projectId: string) {
    this.isTechStackAdvisorOpen.set(false);
    await this.confirmAndSaveProject();
  }

  async confirmAndSaveProject() {
    const draft = this.aiDraft();
    if (!draft) {
      this.projectState.loadProjects();
      this.router.navigate(['/dashboard', 'backlog']);
      return;
    }

    try {
      const existingIds = this.projectState.projects().map(p => p.id);

      await this.projectState.loadProjects();

      const newProject = this.projectState.projects().find(p => !existingIds.includes(p.id));
      if (newProject) {
        this.projectState.setSelectedProject(newProject.id);
      }

      this.router.navigate(['/dashboard', 'backlog']);
    } catch (e) {
      console.error(e);
      this.toastService.show('Failed to save project details. Redirecting...', 'error');
      this.projectState.loadProjects();
      this.router.navigate(['/dashboard', 'backlog']);
    }
  }
}
