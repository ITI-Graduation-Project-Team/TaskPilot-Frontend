import { Component, ChangeDetectionStrategy, signal, OnInit, computed, inject, effect, untracked } from '@angular/core';
import { filter } from 'rxjs/operators';
import { CommonModule, DOCUMENT } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
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
import { Router, ActivatedRoute, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { apiClient } from '../../../../shared/api/axios.instance';
import { ProjectStateService, ProjectInfo } from '../../../../shared/services/project-state.service';
import { ThemeService } from '../../../../shared/services/theme.service';
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
    CommonModule, RouterOutlet,
    FormsModule,
    AiChatModalComponent,
    SidebarWidgetComponent,
    HeaderWidgetComponent,
    ProjectHistoryModalComponent,
    MobileNavWidgetComponent
  ],
  template: `
    <div [attr.dir]="isRtl() ? 'rtl' : 'ltr'" 
         class="min-h-screen bg-background text-text-primary flex transition-colors duration-200 pb-16 md:pb-0 font-dashboard">
      
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
        (tabChange)="setTab($event)">
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
          [currentLang]="currentLang()"
          (setLanguage)="setLanguage($event)"
          (tabChange)="setTab($event)"
          (selectProject)="selectProject($event)"
          (onCreateProject)="openCreateProjectPage()"
          (onLogout)="logout()"
          (onToggleDarkMode)="toggleDarkMode()">
        </app-header-widget>

        <!-- Main Content Area -->
        <main class="flex-1 overflow-y-auto p-6 md:p-8">
          <router-outlet></router-outlet>
        </main>
        


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
        (tabChange)="setTab($event)">
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

  setTab(tab: string) {
    this.router.navigate(['/dashboard', tab]);
  }

  themeService = inject(ThemeService);
  currentDate = '';
  userName = signal('Guest User');
  userJobTitle = signal('');
  activeSprintName = signal('Loading...');
  currentLang = signal<'en' | 'ar'>('en');

  isDark = this.themeService.isDark;
  isRtl = computed(() => this.currentLang() === 'ar');
  userInitial = computed(() => this.userName().trim().charAt(0).toUpperCase() || 'E');

  // Active navigation tab signal
  currentTab = signal<'projects' | 'create-project' | 'sprint' | 'sprint-planning' | 'backlog' | 'team' | 'profile' | 'organization'>('sprint');

  // Component state
  showManualForm = signal(false);
  isProjectDropdownOpen = signal(false);

  selectedSprintId = signal<string | null>(null);
  selectedSprintStatus = signal<string | null>(null);
  cachedSprints = signal<SprintListItem[]>([]);
  isSprintsLoading = signal(true);

  // Status History Modal state
  isHistoryModalOpen = signal(false);
  selectedHistoryProject = signal<{ id: string, nameEn: string, status: string } | null>(null);

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
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private tr = inject(TranslateService);
  private doc = inject(DOCUMENT);
  private confirmDialog = inject(ConfirmDialogService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sprintService = inject(SprintPlanningService);

  logout(): void {
    this.auth.logout();
  }

  constructor() {
    effect(() => {
      if (this.projectState.selectedProjectId()) {
        untracked(() => {
          this.loadActiveSprint(this.projectState.selectedProjectId()!);
        });
      }
    });

    effect(() => {
      const lang = this.currentLang();
      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      this.doc.documentElement.setAttribute('dir', dir);
      this.doc.documentElement.setAttribute('lang', lang);
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
          this.setTab('create-project');
          this.isAiChatOpen.set(true);
          this.showManualForm.set(false);
        });
      }
    });

    effect(() => {
      const projectId = this.projectState.selectedProjectId();
      untracked(() => {
        const returnSprintId = this.route.snapshot.queryParamMap.get('sprintId') as string;
        const returnSprintStatus = this.route.snapshot.queryParamMap.get('status') as string;

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
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: any) => {
      const urlSegments = event.urlAfterRedirects.split('/');
      const tab = urlSegments[urlSegments.length - 1];
      if (['projects', 'create-project', 'sprint', 'sprint-planning', 'backlog', 'team', 'profile', 'organization'].includes(tab)) {
        this.currentTab.set(tab as any);
      }
    });
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
      
      const savedLang = localStorage.getItem('app_lang') as 'en' | 'ar' | null;
      if (savedLang) {
        this.currentLang.set(savedLang);
        this.tr.use(savedLang);
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
    this.setTab('create-project');
  }

  openAiProjectFlow() {
    this.showManualForm.set(false);
    this.setTab('create-project');
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
    this.setTab('backlog');
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
      this.setTab('projects');
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
      this.toast.show('Project deleted successfully', 'success');
      this.loadAllProjectStats();
    } else {
      this.toast.show('Failed to delete project. Please try again.', 'error');
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
    this.toast.show('Project status updated successfully', 'success');
    this.loadAllProjectStats();
  }

  goToProject(projectId: string, tab: 'sprint' | 'backlog') {
    this.projectState.setSelectedProject(projectId);
    this.setTab(tab);
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

  setLanguage(lang: 'en' | 'ar') {
    this.currentLang.set(lang);
    localStorage.setItem('app_lang', lang);
    this.tr.use(lang);
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
