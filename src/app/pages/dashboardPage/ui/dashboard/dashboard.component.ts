import { Component, ChangeDetectionStrategy, signal, OnInit, computed, inject, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardComponent } from '../../../../widgets/taskBoard/ui/board/board.component';
import { BacklogViewComponent } from '../backlog-view/backlog-view.component';
import { ProfileViewComponent } from '../profile-view/profile-view.component';
import { TeamViewComponent } from '../team-view/team-view.component';
import { AiChatModalComponent } from '../ai-chat-modal/ai-chat-modal.component';
import { DraftReviewModalComponent } from '../draft-review-modal/draft-review-modal.component';
import { TechStackAdvisorModalComponent } from '../tech-stack-advisor-modal/tech-stack-advisor-modal.component';
import { ProjectHubComponent } from '../project-hub/project-hub.component';
import { SprintPlanningViewComponent } from '../sprint-planning-view/sprint-planning-view.component';
import { OrganizationViewComponent } from '../../../../features/organization/ui/organization-view/organization-view.component';
import { ProjectStats } from '../project-card/project-card.component';
import { ProjectHistoryModalComponent } from '../project-history-modal/project-history-modal.component';
import { SprintListComponent } from '../../../../features/sprintList/sprint-list.component';
import { SprintListItem } from '../../../../shared/api/sprint-planning.service';
import { NotificationBellComponent } from '../../../../shared/ui/notification-bell/notification-bell';
import { SidebarWidgetComponent } from '../../../../widgets/sidebar/ui/sidebar/sidebar.component';
import { HeaderWidgetComponent } from '../../../../widgets/header/ui/header/header.component';
import { MobileNavWidgetComponent } from '../../../../widgets/mobile-nav/ui/mobile-nav/mobile-nav.component';

import { apiClient } from '../../../../shared/api/axios.instance';
import { ProjectStateService, ProjectInfo } from '../../../../shared/services/project-state.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../../shared/api/auth.service';
import { SprintPlanningService } from '../../../../shared/api/sprint-planning.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    BoardComponent,
    BacklogViewComponent,
    ProfileViewComponent,
    TeamViewComponent,
    AiChatModalComponent,
    DraftReviewModalComponent,
    TechStackAdvisorModalComponent,
    ProjectHubComponent,
    SprintPlanningViewComponent,
    OrganizationViewComponent,
    ProjectHistoryModalComponent,
    SprintListComponent,
    NotificationBellComponent,
    SidebarWidgetComponent,
    HeaderWidgetComponent,
    MobileNavWidgetComponent
  ],
  template: `
    <div class="min-h-screen bg-background text-text-primary flex transition-colors duration-200 pb-16 md:pb-0 font-dashboard">
      
      <!-- Desktop Sidebar Navigation -->
      <app-sidebar-widget
        [isDark]="isDark()"
        [companyName]="projectState.companyName()"
        [selectedProject]="projectState.selectedProject()"
        [currentTab]="currentTab()"
        [isProjectManager]="projectState.isProjectManager()"
        [userInitial]="userInitial()"
        [userName]="userName()"
        [userJobTitle]="userJobTitle()"
        (tabChange)="currentTab.set($event)">
      </app-sidebar-widget>

      <!-- Main Dashboard Panel -->
      <div class="flex-1 flex flex-col min-w-0">
        
        <!-- Header -->
        <app-header-widget
          [currentTab]="currentTab()"
          [isProjectManager]="projectState.isProjectManager()"
          [selectedProject]="projectState.selectedProject()"
          [activeSprintName]="activeSprintName()"
          [projects]="projectState.projects()"
          [isDark]="isDark()"
          [currentDate]="currentDate"
          (tabChange)="currentTab.set($event)"
          (selectProject)="selectProject($event)"
          (onCreateProject)="openCreateProjectPage()"
          (onLogout)="logout()"
          (onToggleDarkMode)="toggleDarkMode()">
        </app-header-widget>

        <!-- Main Content Area -->
        <main class="flex-1 overflow-y-auto p-6 md:p-8">
          @if (currentTab() === 'projects') {
            <app-project-hub
              [projects]="projectState.projects()"
              [projectStatsMap]="projectStatsMap()"
              (createProject)="openCreateProjectPage()"
              (createProjectWithAi)="openAiProjectFlow()"
              (selectSprint)="goToProject($event, 'sprint')"
              (selectBacklog)="goToProject($event, 'backlog')"
              (editProject)="openEditProjectModal($event)"
              (deleteProject)="deleteProject($event)"
              (toggleProjectStatus)="onToggleProjectStatus($event)">
            </app-project-hub>
          } @else if (currentTab() === 'create-project') {
            <section class="mx-auto max-w-6xl animate-[fadeIn_0.22s_ease_both]">
              <div class="grid gap-5 border-b border-border/70 pb-7 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                <div>
                  <button type="button" (click)="currentTab.set('projects')" class="mb-4 inline-flex items-center gap-2 text-xs font-extrabold text-text-secondary transition-colors hover:text-primary">
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
                @if (isAiChatOpen()) {
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
                      <label class="space-y-2 text-xs font-extrabold uppercase tracking-wider text-text-secondary">Project name EN<input type="text" name="projNameEn" required placeholder="e.g. Mobile Application" class="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text-primary outline-none transition-all focus:ring-2 focus:ring-primary/20"></label>
                      <label class="space-y-2 text-xs font-extrabold uppercase tracking-wider text-text-secondary">Project name AR<input type="text" name="projNameAr" required placeholder="&#1605;&#1579;&#1575;&#1604;: &#1578;&#1591;&#1576;&#1610;&#1602; &#1575;&#1604;&#1580;&#1608;&#1575;&#1604;" dir="rtl" class="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text-primary outline-none transition-all focus:ring-2 focus:ring-primary/20"></label>
                      <label class="space-y-2 text-xs font-extrabold uppercase tracking-wider text-text-secondary">Description EN<textarea name="projDescEn" required rows="7" placeholder="What will this project deliver?" class="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition-all focus:ring-2 focus:ring-primary/20"></textarea></label>
                      <label class="space-y-2 text-xs font-extrabold uppercase tracking-wider text-text-secondary">Description AR<textarea name="projDescAr" required rows="7" placeholder="&#1605;&#1575; &#1575;&#1604;&#1584;&#1610; &#1587;&#1610;&#1602;&#1583;&#1605;&#1607; &#1607;&#1584;&#1575; &#1575;&#1604;&#1605;&#1588;&#1585;&#1608;&#1593;&#1567;" dir="rtl" class="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition-all focus:ring-2 focus:ring-primary/20"></textarea></label>
                    </div>
                    <div class="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-5">
                      <button type="button" (click)="currentTab.set('projects')" class="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-text-secondary transition-colors hover:bg-sidebar hover:text-text-primary">Cancel</button>
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
          } @else if (currentTab() === 'sprint') {
            @if (selectedSprintId()) {
              <app-board 
                [overrideSprintId]="selectedSprintId()"
                [overrideSprintStatus]="selectedSprintStatus()"
                (backToSprints)="onBackToSprints()"
                (sprintStatusChanged)="onSprintStatusChanged()">
              </app-board>
            } @else {
              <app-sprint-list
                [projectId]="projectState.selectedProjectId()!"
                [sprints]="cachedSprints()"
                [isLoading]="isSprintsLoading()"
                (viewBoard)="onViewBoard($event)">
              </app-sprint-list>
            }
          } @else if (currentTab() === 'sprint-planning') {
            <app-sprint-planning-view 
              (sprintConfirmed)="currentTab.set('sprint'); loadActiveSprint(projectState.selectedProjectId()!)">
            </app-sprint-planning-view>
          } @else if (currentTab() === 'backlog') {
            <app-backlog-view></app-backlog-view>
          } @else if (currentTab() === 'team') {
            <app-team-view></app-team-view>
          } @else if (currentTab() === 'organization') {
            <app-organization-view></app-organization-view>
          } @else if (currentTab() === 'profile') {
            <app-profile-view></app-profile-view>
          }
        </main>
        
        <!-- Floating AI Chat Button -->
        <button (click)="isAiChatOpen.set(true)"
                class="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center hover:scale-110 transition-transform duration-300 z-50 group">
          <svg class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
          <!-- Tooltip -->
          <span class="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-sidebar border border-border text-text-primary text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">
            Ask AI Assistant
          </span>
        </button>

        <!-- AI Chat Modal (Floating mode) -->
        @if (isAiChatOpen()) {
          <app-ai-chat-modal 
            [embedded]="false" 
            (close)="onAiChatClose()" 
            (draftGenerated)="onDraftGenerated($event)">
          </app-ai-chat-modal>
        }
      </div>

      <app-mobile-nav-widget
        [currentTab]="currentTab()"
        [isProjectManager]="projectState.isProjectManager()"
        (tabChange)="currentTab.set($event)">
      </app-mobile-nav-widget>

    </div>

    <!-- Edit Project Modal -->
    @if (isEditProjectModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]">
        <div class="bg-surface border border-border rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-5 animate-[scaleUp_0.25s_ease_both]">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-text-primary font-display">Edit Project Details</h3>
            <button (click)="isEditProjectModalOpen.set(false)" class="p-1.5 text-text-secondary hover:bg-sidebar rounded-full transition-colors focus:outline-none">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form (submit)="onEditProjectSubmit($event)" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Project Name (English)</label>
                <input type="text" [(ngModel)]="editNameEn" name="editNameEn" required placeholder="e.g. Mobile Application" 
                       class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
              </div>
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">اسم المشروع (عربي)</label>
                <input type="text" [(ngModel)]="editNameAr" name="editNameAr" required placeholder="مثال: تطبيق الجوال" dir="rtl"
                       class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Description (English)</label>
                <textarea [(ngModel)]="editDescEn" name="editDescEn" placeholder="English details..." rows="3" required
                          class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"></textarea>
              </div>
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">الوصف (عربي)</label>
                <textarea [(ngModel)]="editDescAr" name="editDescAr" placeholder="تفاصيل باللغة العربية..." rows="3" required dir="rtl"
                          class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"></textarea>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-3">
              <button type="button" (click)="isEditProjectModalOpen.set(false)" class="px-4 py-2.5 border border-border rounded-xl hover:bg-sidebar font-semibold text-sm transition-colors">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-md transition-all">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- AI Requirement Chat modal -->

    <!-- Project History Modal -->
    @if (isHistoryModalOpen() && selectedHistoryProject()) {
      <app-project-history-modal 
        [projectId]="selectedHistoryProject()!.id"
        [projectName]="selectedHistoryProject()!.nameEn || 'Project'"
        [currentStatus]="selectedHistoryProject()!.status"
        (close)="closeHistoryModal()"
        (actionCompleted)="onHistoryActionCompleted()">
      </app-project-history-modal>
    }
  `,
  styles: `
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `
})
export class DashboardComponent implements OnInit {
  themeService = inject(ThemeService);
  get isDark() { return this.themeService.isDark; }
  currentDate = '';
  userName = signal('Guest User');
  userJobTitle = signal('');
  userInitial = computed(() => this.userName().trim().charAt(0).toUpperCase() || 'U');

  // Active navigation tab signal
  currentTab = signal<'projects' | 'create-project' | 'sprint' | 'sprint-planning' | 'backlog' | 'team' | 'profile' | 'organization'>('sprint');

  // Component state
  activeSprintName = signal('No Active Sprint');
  showManualForm = signal(false);
  isProjectDropdownOpen = signal(false);
  
  selectedSprintId = signal<string | null>(null);
  selectedSprintStatus = signal<string | null>(null);
  cachedSprints = signal<SprintListItem[]>([]);
  isSprintsLoading = signal(true);

  // Status History Modal state
  isHistoryModalOpen = signal(false);
  selectedHistoryProject = signal<{id: string, nameEn: string, status: string} | null>(null);

  // Edit Project properties
  isEditProjectModalOpen = signal(false);
  selectedEditProjectId = signal('');
  editNameEn = '';
  editNameAr = '';
  editDescEn = '';
  editDescAr = '';

  // Eager project statistics Map
  projectStatsMap = signal<Map<string, ProjectStats>>(new Map());

  // AI Project creation signals
  isAiChatOpen = signal(false);
  isDraftReviewOpen = signal(false);
  aiDraft = signal<any>(null);
  chatId = signal<string>('');
  isTechStackAdvisorOpen = signal(false);
  advisorProjectId = signal<string | null>(null);

  public projectState = inject(ProjectStateService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sprintService = inject(SprintPlanningService);

  logout(): void {
    this.authService.logout();
  }

  constructor() {

    // Reactively update sprint name whenever selected project ID changes
    effect(() => {
      const projId = this.projectState.selectedProjectId();
      if (projId) {
        this.loadActiveSprint(projId);
      } else {
        this.activeSprintName.set('No Active Sprint');
      }
    });

    // Eagerly load all project statistics when the "projects" tab is selected
    effect(() => {
      const tab = this.currentTab();
      const projects = this.projectState.projects();
      if (tab === 'projects' && projects.length > 0) {
        untracked(() => {
          this.loadAllProjectStats();
        });
      }
    });

    // If a PM has no projects, default to the create-project tab and open AI chat automatically
    effect(() => {
      const isPM = this.projectState.isProjectManager();
      const projCount = this.projectState.projects().length;
      const initialized = !this.projectState.loading();
      if (initialized && isPM && projCount === 0) {
        untracked(() => {
          this.currentTab.set('create-project');
          this.isAiChatOpen.set(true);
          this.showManualForm.set(false);
        });
      }
    });

    effect(() => {
      const projectId = this.projectState.selectedProjectId();
      untracked(() => {
        const returnSprintId = this.route.snapshot.queryParamMap.get('sprintId');
        const returnSprintStatus = this.route.snapshot.queryParamMap.get('sprintStatus');

        if (projectId && returnSprintId) {
          this.selectedSprintId.set(returnSprintId);
          this.selectedSprintStatus.set(returnSprintStatus || 'Planned');
        } else {
          this.selectedSprintId.set(null);
          this.selectedSprintStatus.set(null);
        }
        this.loadSprints();
      });
    });
  }

  ngOnInit() {
    this.currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (typeof localStorage !== 'undefined') {
      const storedName = localStorage.getItem('userFullName');
      if (storedName) {
        this.userName.set(storedName);
      }
    }

    this.loadUserProfile();
  }

  async loadUserProfile() {
    try {
      const { data } = await apiClient.get<any>('/employees/profile');
      const profileData = data.data || data;
      if (profileData) {
        this.userName.set(`${profileData.firstName} ${profileData.lastName}`);
        this.userJobTitle.set(profileData.jobTitle || '');
      }
    } catch (e) {
      console.warn('Failed to load profile details for sidebar:', e);
    }
  }

  async loadActiveSprint(projectId: string) {
    try {
      const { data } = await apiClient.get<any>(`/projects/${projectId}/sprints/active`);
      const sprintData = data.data;
      if (sprintData) {
        this.activeSprintName.set(`${sprintData.titleEn || sprintData.title || ''} Active`);
      } else {
        this.activeSprintName.set('No Active Sprint');
      }
    } catch (e) {
      console.warn('Failed to load active sprint info:', e);
      this.activeSprintName.set('No Active Sprint');
    }
  }

  async loadAllProjectStats() {
    const projects = this.projectState.projects();
    const currentMap = new Map(this.projectStatsMap());

    // Set initial loading state keys
    let updated = false;
    for (const p of projects) {
      if (!currentMap.has(p.id)) {
        currentMap.set(p.id, { activeSprint: 'Loading...', memberCount: 0, taskCount: 0, loading: true });
        updated = true;
      }
    }
    if (updated) {
      this.projectStatsMap.set(currentMap);
    }

    // Fire API requests in parallel using Promise.allSettled
    const promises = projects.map(async (p) => {
      const stats: ProjectStats = { activeSprint: 'No Active Sprint', memberCount: 0, taskCount: 0, loading: false };

      try {
        const [sprintRes, employeesRes, backlogRes] = await Promise.allSettled([
          apiClient.get<any>(`/projects/${p.id}/sprints/active`),
          apiClient.get<any>(`/projects/${p.id}/employees`),
          apiClient.get<any>(`/projects/${p.id}/backlog`)
        ]);

        if (sprintRes.status === 'fulfilled' && sprintRes.value.data?.data) {
          const sprintData = sprintRes.value.data.data;
          stats.activeSprint = `${sprintData.titleEn || sprintData.title || ''} Active`;
        }
        if (employeesRes.status === 'fulfilled' && employeesRes.value.data?.data) {
          stats.memberCount = employeesRes.value.data.data.length || 0;
        }
        if (backlogRes.status === 'fulfilled' && backlogRes.value.data?.data) {
          const stories = backlogRes.value.data.data.userStories || [];
          let totalTasks = 0;
          for (const story of stories) {
            totalTasks += (story.tasks || []).length;
          }
          stats.taskCount = totalTasks;
        }
      } catch (err) {
        console.warn('Failed to load stats for project:', p.id, err);
      }

      return { id: p.id, stats };
    });

    const results = await Promise.all(promises);
    const newMap = new Map(this.projectStatsMap());
    for (const res of results) {
      newMap.set(res.id, res.stats);
    }
    this.projectStatsMap.set(newMap);
  }

  onProjectSelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.projectState.setSelectedProject(select.value);
  }

  openCreateProjectPage() {
    this.showManualForm.set(false);
    this.currentTab.set('create-project');
  }

  openAiProjectFlow() {
    this.showManualForm.set(false);
    this.currentTab.set('create-project');
    this.isAiChatOpen.set(true);
  }

  onAiChatClose() {
    this.isAiChatOpen.set(false);
  }

  async onDraftGenerated(event: { projectId: string; draft: any; chatId: string }) {
    this.isAiChatOpen.set(false);
    this.aiDraft.set(event.draft);
    this.chatId.set(event.chatId);
    this.advisorProjectId.set(event.projectId);
    this.isTechStackAdvisorOpen.set(true);
    await this.projectState.loadProjects();
    this.projectState.setSelectedProject(event.projectId);
  }

  onTechStackAdvisorClose() {
    this.isTechStackAdvisorOpen.set(false);
    this.advisorProjectId.set(null);
  }

  async onTechStackAdvisorCompleted(projectId: string) {
    this.isTechStackAdvisorOpen.set(false);
    this.advisorProjectId.set(null);
    await this.projectState.loadProjects();
    this.projectState.setSelectedProject(projectId);
    this.currentTab.set('backlog');
    this.loadAllProjectStats();
  }

  onProjectSaved() {
    this.isDraftReviewOpen.set(false);
    this.projectState.loadProjects();
  }

  async onCreateProjectSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const nameEn = (form.elements.namedItem('projNameEn') as HTMLInputElement).value;
    const nameAr = (form.elements.namedItem('projNameAr') as HTMLInputElement).value;
    const descEn = (form.elements.namedItem('projDescEn') as HTMLTextAreaElement).value;
    const descAr = (form.elements.namedItem('projDescAr') as HTMLTextAreaElement).value;

    const success = await this.projectState.createNewProject(nameEn, nameAr, descEn, descAr);
    if (success) {
      this.showManualForm.set(false);
      this.currentTab.set('projects');
      form.reset();
      this.loadAllProjectStats();
    }
  }

  openEditProjectModal(projectId: string) {
    const proj = this.projectState.projects().find(p => p.id === projectId);
    if (proj) {
      this.selectedEditProjectId.set(projectId);
      this.editNameEn = proj.nameEn || '';
      this.editNameAr = proj.nameAr || '';
      this.editDescEn = proj.descriptionEn || proj.description || '';
      this.editDescAr = proj.descriptionAr || proj.description || '';
      this.isEditProjectModalOpen.set(true);
    }
  }

  async onEditProjectSubmit(event: Event) {
    event.preventDefault();
    const success = await this.projectState.updateProject(
      this.selectedEditProjectId(),
      this.editNameEn,
      this.editNameAr,
      this.editDescEn,
      this.editDescAr
    );
    if (success) {
      this.isEditProjectModalOpen.set(false);
      this.loadAllProjectStats();
    }
  }

  async deleteProject(projectId: string) {
    const proj = this.projectState.projects().find(p => p.id === projectId);
    if (proj) {
      const confirmed = await this.confirmDialog.confirm({
        title: 'Delete Project',
        message: `Are you sure you want to delete "${proj.nameEn}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        type: 'danger'
      });
      if (confirmed) {
        await this.onDeleteProject(projectId);
      }
    }
  }

  async onDeleteProject(projectId: string) {
    const success = await this.projectState.deleteProject(projectId);
    if (success) {
      this.toastService.show('Project deleted successfully', 'success');
      this.loadAllProjectStats();
    } else {
      this.toastService.show('Failed to delete project. Please try again.', 'error');
    }
  }

  async onToggleProjectStatus(projectId: string) {
    const p = this.projectState.projects().find(x => x.id === projectId);
    if (p) {
      this.selectedHistoryProject.set({
        id: p.id,
        nameEn: p.nameEn || 'Project',
        status: p.status || 'Active'
      });
      this.isHistoryModalOpen.set(true);
    }
  }

  closeHistoryModal() {
    this.isHistoryModalOpen.set(false);
    this.selectedHistoryProject.set(null);
  }

  onHistoryActionCompleted() {
    this.closeHistoryModal();
    this.toastService.show('Project status updated successfully', 'success');
    this.loadAllProjectStats();
  }

  goToProject(projectId: string, tab: 'sprint' | 'backlog') {
    this.projectState.setSelectedProject(projectId);
    this.currentTab.set(tab);
  }

  selectProject(id: string) {
    this.projectState.setSelectedProject(id);
    this.isProjectDropdownOpen.set(false);
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

  toggleDarkMode() {
    this.themeService.toggle();
  }

  onViewBoard(event: { sprintId: string; sprintStatus: string }): void {
    this.selectedSprintId.set(event.sprintId);
    this.selectedSprintStatus.set(event.sprintStatus);
  }

  onBackToSprints(): void {
    this.selectedSprintId.set(null);
    this.selectedSprintStatus.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sprintId: null,
        sprintStatus: null
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    this.loadSprints();
  }

  async loadSprints(): Promise<void> {
    const projectId = this.projectState.selectedProjectId();
    if (!projectId) return;
    this.isSprintsLoading.set(true);
    const sprints = await this.sprintService.getAllSprints(projectId);
    this.cachedSprints.set(sprints);
    this.isSprintsLoading.set(false);
  }

  async onSprintStatusChanged(): Promise<void> {
    await this.loadSprints();
    // Find the updated status for the currently viewed sprint
    const currentId = this.selectedSprintId();
    if (currentId) {
      const updated = this.cachedSprints().find(
        s => s.sprintId === currentId
      );
      if (updated) {
        this.selectedSprintStatus.set(updated.status);
      }
    }
  }
}
