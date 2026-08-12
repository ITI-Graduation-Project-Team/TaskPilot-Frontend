import { Component, ChangeDetectionStrategy, signal, input, computed, inject, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectInfo, ProjectStateService } from '../../../../shared/services/project-state.service';
import { ProjectCardComponent, ProjectStats } from '../project-card/project-card.component';
import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-project-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ProjectCardComponent, TranslatePipe],
  template: `
    <div class="space-y-6 flex flex-col h-full min-h-[calc(100vh-12rem)]">
      <!-- Search & Filters -->
      @if (projects().length > 0) {
        <div class="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-surface border border-border p-4 rounded-2xl shadow-sm">
          
          <!-- Tabs -->
          <div class="flex bg-background border border-border p-1 rounded-xl overflow-x-auto custom-scrollbar shrink-0">
            <button (click)="onTabChange('active')" 
                    [class.bg-surface]="activeTab() === 'active'" [class.shadow-sm]="activeTab() === 'active'" [class.text-text-primary]="activeTab() === 'active'" [class.text-text-secondary]="activeTab() !== 'active'" 
                    class="px-5 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap min-w-[100px]">{{ 'PROJECT_HUB.ACTIVE_DRAFT' | translate }}</button>
            <button (click)="onTabChange('completed')" 
                    [class.bg-surface]="activeTab() === 'completed'" [class.shadow-sm]="activeTab() === 'completed'" [class.text-text-primary]="activeTab() === 'completed'" [class.text-text-secondary]="activeTab() !== 'completed'" 
                    class="px-5 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap min-w-[100px]">{{ 'PROJECT_HUB.COMPLETED' | translate }}</button>
            <button (click)="onTabChange('archived')" 
                    [class.bg-surface]="activeTab() === 'archived'" [class.shadow-sm]="activeTab() === 'archived'" [class.text-text-primary]="activeTab() === 'archived'" [class.text-text-secondary]="activeTab() !== 'archived'" 
                    class="px-5 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap min-w-[100px]">{{ 'PROJECT_HUB.ARCHIVED' | translate }}</button>
          </div>

          <div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-1 justify-end">
            <div class="relative flex-1 sm:max-w-[280px]">
              <span class="absolute top-1/2 left-3.5 -translate-y-1/2 text-text-secondary pointer-events-none">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </span>
              <input type="text" 
                     [ngModel]="searchQuery()" 
                     (ngModelChange)="onSearchChange($event)"
                     [placeholder]="'PROJECT_HUB.SEARCH_PLACEHOLDER' | translate" 
                     class="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-text-secondary/70" />
            </div>
            
            <button (click)="router.navigate(['/dashboard', 'create-project'])" 
                    class="bg-primary hover:bg-primary-hover text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              <span>{{ 'PROJECT_HUB.NEW_PROJECT' | translate }}</span>
            </button>
          </div>
        </div>
      }

      <!-- Projects Grid -->
      @if (paginatedProjects().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          @for (p of paginatedProjects(); track p.id) {
            <app-project-card 
              [project]="p"
              [stats]="getStatsForProject(p.id)"
              (deleteProject)="onDeleteProject(p.id)">
            </app-project-card>
          }
        </div>
        
        <!-- Pagination Controls -->
        <div class="flex items-center justify-between px-6 py-4 !mt-auto border border-border bg-surface rounded-2xl shadow-sm"
          *ngIf="totalProjects() > 0">
          <div class="text-sm font-medium text-text-secondary hidden sm:block">
            Page <span class="font-bold text-text-primary">{{ currentPage() }}</span> of <span class="font-bold text-text-primary">{{ totalPages() }}</span>
          </div>
          
          <div class="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
            <button (click)="prevPage()" [disabled]="currentPage() === 1"
              class="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold text-text-secondary hover:bg-background hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all">
              <svg class="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" /></svg>
              <span>Prev</span>
            </button>
            
            <div class="flex items-center gap-1 px-2">
              @for (page of pageNumbers(); track page) {
                @if (page === -1) {
                  <span class="px-2 py-1 text-text-secondary font-medium tracking-widest">...</span>
                } @else {
                  <button (click)="goToPage(page)"
                    [class.bg-primary]="currentPage() === page"
                    [class.text-white]="currentPage() === page"
                    [class.shadow-md]="currentPage() === page"
                    [class.shadow-primary/20]="currentPage() === page"
                    [class.text-text-secondary]="currentPage() !== page"
                    [class.hover:bg-background]="currentPage() !== page"
                    [class.hover:text-text-primary]="currentPage() !== page"
                    class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all">
                    {{ page }}
                  </button>
                }
              }
            </div>

            <button (click)="nextPage()" [disabled]="currentPage() === totalPages()"
              class="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold text-text-secondary hover:bg-background hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all">
              <span>Next</span>
              <svg class="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      } @else if (totalProjects() > 0) {
        <!-- Search query matches nothing -->
        <div class="flex flex-col items-center justify-center p-12 bg-surface border border-border rounded-3xl text-center shadow-sm animate-[fadeIn_0.2s_ease_both]">
          <div class="w-16 h-16 rounded-2xl bg-sidebar flex items-center justify-center text-text-secondary/60 mb-4 animate-bounce">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <h3 class="text-base font-extrabold text-text-primary font-display">{{ 'PROJECT_HUB.NO_MATCHING' | translate }}</h3>
          <p class="text-xs text-text-secondary max-w-sm mt-1 mb-4">{{ 'PROJECT_HUB.NO_MATCHING_DESC' | translate: { query: searchQuery() } }}</p>
          <button (click)="onSearchChange('')" class="text-xs text-primary font-bold hover:underline">{{ 'PROJECT_HUB.CLEAR_SEARCH' | translate }}</button>
        </div>
      } @else {
        <!-- Empty State -->
        <div class="flex flex-col items-center justify-center py-20 px-6 bg-surface border border-border rounded-3xl text-center shadow-sm max-w-2xl mx-auto space-y-6 animate-[fadeIn_0.25s_ease_both]">
          <div class="w-20 h-20 rounded-3xl bg-primary/5 text-primary flex items-center justify-center animate-pulse">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
          </div>
          
          <div class="space-y-2">
            <h2 class="text-xl font-extrabold text-text-primary tracking-tight font-display">{{ 'PROJECT_HUB.NO_PROJECTS' | translate }}</h2>
            <p class="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
              {{ 'PROJECT_HUB.NO_PROJECTS_DESC' | translate }}
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <button (click)="dashboardService.openAiProjectFlow()" 
                    class="bg-primary hover:bg-primary-hover text-white text-sm font-bold px-5 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group">
              <svg class="w-4 h-4 animate-pulse text-yellow-300" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span>{{ 'PROJECT_HUB.GENERATE_WITH_AI' | translate }}</span>
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class ProjectHubComponent implements OnInit {
  router = inject(Router);
  dashboardService = inject(DashboardService);
  projectState = inject(ProjectStateService);
  toastService = inject(ToastService);
  confirmDialog = inject(ConfirmDialogService);

  projects = computed(() => this.projectState.projects());
  projectStatsMap = computed(() => this.dashboardService.projectStatsMap());

  searchQuery = signal('');
  activeTab = signal<'active' | 'completed' | 'archived'>('active');



  paginatedProjects = signal<ProjectInfo[]>([]);
  totalProjects = signal<number>(0);
  currentPage = signal<number>(1);
  pageSize = signal<number>(6);
  isLoading = signal<boolean>(false);

  Math = Math;
  totalPages = computed(() => Math.ceil(this.totalProjects() / this.pageSize()));
  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        pages.push(current - 1);
        pages.push(current);
        pages.push(current + 1);
        pages.push(-1);
        pages.push(total);
      }
    }
    return pages;
  });

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.loadPaginatedProjects();
    }
  }

  ngOnInit() {
    this.loadPaginatedProjects();
  }

  async loadPaginatedProjects() {
    this.isLoading.set(true);
    const { projects, totalCount } = await this.projectState.loadProjectsPaged(this.currentPage(), this.pageSize());

    // Apply local filters (tab and search)
    // Wait, backend doesn't filter by status or search. For now we will just load paged and apply client-side filter to the current page.
    // Ideally, the backend should handle filtering too. Let's just use it as is for the page.
    let filtered = projects;

    const tab = this.activeTab();
    const query = this.searchQuery().toLowerCase().trim();

    if (tab === 'active') {
      filtered = filtered.filter(p => p.status === 'Active' || p.status === 'Draft' || !p.status);
    } else if (tab === 'completed') {
      filtered = filtered.filter(p => p.status === 'Completed');
    } else if (tab === 'archived') {
      filtered = filtered.filter(p => p.status === 'Archived');
    }

    if (query) {
      filtered = filtered.filter(p =>
        (p.nameEn || '').toLowerCase().includes(query) ||
        (p.nameAr || '').toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query)
      );
    }

    this.paginatedProjects.set(filtered);
    this.totalProjects.set(totalCount);
    this.isLoading.set(false);
  }

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.currentPage.set(1);
    this.loadPaginatedProjects();
  }

  onTabChange(tab: 'active' | 'completed' | 'archived') {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadPaginatedProjects();
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadPaginatedProjects();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadPaginatedProjects();
    }
  }

  getStatsForProject(projectId: string): ProjectStats | null {
    return this.projectStatsMap().get(projectId) || null;
  }

  onDeleteProject(projectId: string) {
    this.confirmDialog.confirm({
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? This will permanently remove all sprints, backlog items, and team assignments.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      type: 'danger'
    }).then(async (confirmed) => {
      if (confirmed) {
        const success = await this.projectState.deleteProject(projectId);
        if (success) {
          this.toastService.show('Project deleted successfully', 'success');
        } else {
          this.toastService.show('Failed to delete project. Please try again.', 'error');
        }
      }
    });
  }
}
