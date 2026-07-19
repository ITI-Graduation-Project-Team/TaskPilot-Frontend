import {
  Component, ChangeDetectionStrategy, signal, OnInit,
  computed, inject, effect, DOCUMENT
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../../../shared/services/theme.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { AuthService } from '../../../../shared/api/auth.service';
import { apiClient } from '../../../../shared/api/axios.instance';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { EmployeeSidebarWidgetComponent } from '../../../../widgets/employee-sidebar/ui/employee-sidebar/employee-sidebar.component';
import { EmployeeHeaderWidgetComponent } from '../../../../widgets/employee-header/ui/employee-header/employee-header.component';
import { EmployeeMobileNavWidgetComponent } from '../../../../widgets/employee-mobile-nav/ui/employee-mobile-nav/employee-mobile-nav.component';

type EmployeeTab = 'sprint' | 'current-projects' | 'project-history' | 'profile' | 'calendar';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    EmployeeSidebarWidgetComponent,
    EmployeeHeaderWidgetComponent,
    EmployeeMobileNavWidgetComponent
  ],
  template: `
    <div
      class="min-h-screen flex transition-colors duration-300 font-dashboard"
      style="background: var(--background); color: var(--text-primary);"
      [attr.dir]="isRtl() ? 'rtl' : 'ltr'"
    >

      <!-- ══════════════════════════════════════════
           DESKTOP SIDEBAR WIDGET
      ══════════════════════════════════════════ -->
      <app-employee-sidebar-widget
        [currentTab]="activeTab()"
        [hasActiveSprint]="hasActiveSprint()"
        [userName]="userName"
        [userJobTitle]="userJobTitle"
        [userInitial]="userInitial"
        [avatarGradient]="avatarGradient"
        (tabChange)="onTabChange($event)"
        (selectProject)="selectProject($event)"
      ></app-employee-sidebar-widget>

      <!-- ══════════════════════════════════════════
           MAIN PANEL
      ══════════════════════════════════════════ -->
      <div class="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">

        <!-- ── STICKY HEADER WIDGET ── -->
        <app-employee-header-widget
          [pageTitle]="pageTitle()"
          [currentLang]="currentLang()"
          [isDark]="isDark()"
          (setLanguage)="setLanguage($event)"
          (toggleTheme)="toggleTheme()"
          (logout)="logout()"
        ></app-employee-header-widget>

        <!-- ── MAIN CONTENT ── -->
        <main class="flex-1 overflow-y-auto p-4 md:p-6 xl:p-8">

          <!-- Tab content (Routed) -->
          <div class="animate-[fadeUp_0.3s_ease_both] h-full">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      <!-- ══════════════════════════════════════════
           MOBILE BOTTOM NAVIGATION WIDGET
      ══════════════════════════════════════════ -->
      <app-employee-mobile-nav-widget
        [currentTab]="activeTab()"
        (tabChange)="onTabChange($event)"
      ></app-employee-mobile-nav-widget>
    </div>
  `,
  styles: `:host { display: block; }`
})
export class EmployeeDashboardComponent implements OnInit {
  private doc = inject(DOCUMENT);
  private theme = inject(ThemeService);
  private auth = inject(AuthService);
  private tr = inject(TranslateService);
  projectState = inject(ProjectStateService);

  // ── Signals ─────────────────────────────────
  activeTab = signal<EmployeeTab>('sprint');
  currentLang = signal<'en' | 'ar'>('en');
  userName = signal('');
  userJobTitle = signal('');
  activeSprintLabel = signal('');
  hasActiveSprint = signal(false);
  isProjectDropdownOpen = signal(false);


  // ── Computed ────────────────────────────────
  isDark = this.theme.isDark;
  isRtl = computed(() => this.currentLang() === 'ar');
  userInitial = computed(() => this.userName().trim().charAt(0).toUpperCase() || 'E');

  avatarGradient = computed(() => {
    const gradients = [
      'linear-gradient(135deg,#3B5BDB,#7C9CF5)',
      'linear-gradient(135deg,#6366F1,#8B5CF6)',
      'linear-gradient(135deg,#0EA5E9,#3B5BDB)',
      'linear-gradient(135deg,#10B981,#0EA5E9)',
      'linear-gradient(135deg,#EC4899,#6366F1)',
    ];
    const name = this.userName();
    let h = 0;
    for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
    return gradients[h % gradients.length];
  });

  pageTitle = computed(() => {
    const tab = this.activeTab();
    if (tab === 'sprint') return this.tr.instant('employee.pages.sprintBoard');
    if (tab === 'current-projects') return this.tr.instant('employee.pages.currentProjects');
    if (tab === 'project-history') return this.tr.instant('employee.pages.projectHistory');
    if (tab === 'calendar') return this.tr.instant('calendar.title');
    return this.tr.instant('employee.pages.myProfile');
  });

  // ── Lifecycle ───────────────────────────────
  constructor() {
    // Reload sprint info when selected project changes
    effect(() => {
      const id = this.projectState.selectedProjectId();
      if (id) this.loadActiveSprint(id);
    });

    // Apply RTL whenever language changes
    effect(() => {
      this.applyDirection(this.currentLang());
    });
  }

  private router = inject(Router);

  ngOnInit() {
    // Restore persisted language
    const saved = (localStorage.getItem('app_lang') ?? 'en') as 'en' | 'ar';
    this.currentLang.set(saved);
    this.tr.use(saved);
    this.applyDirection(saved);

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;
        if (url.includes('sprint')) this.activeTab.set('sprint');
        else if (url.includes('current-projects')) this.activeTab.set('current-projects');
        else if (url.includes('project-history')) this.activeTab.set('project-history');
        else if (url.includes('profile')) this.activeTab.set('profile');
        else if (url.includes('calendar')) this.activeTab.set('calendar');
      }
    });

    this.loadUserProfile();
  }

  onTabChange(tab: EmployeeTab) {
    this.activeTab.set(tab);
    this.router.navigate(['/employee-dashboard', tab]);
  }

  // ── Methods ─────────────────────────────────

  setLanguage(lang: 'en' | 'ar') {
    this.currentLang.set(lang);
    localStorage.setItem('app_lang', lang);
    this.tr.use(lang);
    this.applyDirection(lang);
  }

  private applyDirection(lang: 'en' | 'ar') {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    this.doc.documentElement.setAttribute('dir', dir);
    this.doc.documentElement.setAttribute('lang', lang);
  }

  toggleTheme() {
    this.theme.toggle();
  }

  logout() {
    this.auth.logout();
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
    let h = 0;
    for (let i = 0; i < (id || '').length; i++) h += id.charCodeAt(i);
    return colors[h % colors.length];
  }

  private async loadUserProfile() {
    try {
      const { data } = await apiClient.get<any>('/employees/profile');
      const p = data.data ?? data;
      if (p) {
        this.userName.set(`${p.firstName ?? ''} ${p.lastName ?? ''}`.trim());
        this.userJobTitle.set(p.jobTitle ?? '');
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('userFullName', this.userName());
        }
      }
    } catch {
      const stored = localStorage.getItem('userFullName');
      if (stored) this.userName.set(stored);
    }
  }

  private async loadActiveSprint(projectId: string) {
    try {
      const { data } = await apiClient.get<any>(`/projects/${projectId}/sprints/active`);
      const s = data.data;
      if (s) {
        this.activeSprintLabel.set(s.titleEn ?? s.title ?? '');
        this.hasActiveSprint.set(true);
      } else {
        this.activeSprintLabel.set('');
        this.hasActiveSprint.set(false);
      }
    } catch {
      this.activeSprintLabel.set('');
      this.hasActiveSprint.set(false);
    }
  }
}
