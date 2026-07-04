import { Component, ChangeDetectionStrategy, signal, OnInit, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardComponent } from '../../../../widgets/taskBoard';
import { BacklogViewComponent } from '../backlog-view/backlog-view.component';
import { ProfileViewComponent } from '../profile-view/profile-view.component';
import { TeamViewComponent } from '../team-view/team-view.component';
import { AiChatModalComponent } from '../ai-chat-modal/ai-chat-modal.component';
import { DraftReviewModalComponent } from '../draft-review-modal/draft-review-modal.component';
import { apiClient } from '../../../../shared/api/axios.instance';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../shared/api/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, 
    RouterLink,
    BoardComponent, 
    BacklogViewComponent, 
    ProfileViewComponent, 
    TeamViewComponent,
    AiChatModalComponent,
    DraftReviewModalComponent
  ],
  template: `
    <div class="min-h-screen bg-background text-text-primary flex transition-colors duration-200 pb-16 md:pb-0">
      
      <!-- Desktop Sidebar Navigation -->
      <aside class="w-64 bg-sidebar border-r border-border hidden md:flex flex-col p-6 transition-colors duration-200 shrink-0">
        <!-- Logo -->
        <div class="flex items-center gap-2.5 mb-8">
          <div class="flex items-center justify-center w-9 h-9 bg-primary rounded-xl text-white shadow-md shadow-primary/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 11l3 3L22 4" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <span class="text-xl font-bold tracking-tight text-text-primary">TaskPilot</span>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 space-y-1.5">
          <a (click)="currentTab.set('sprint')"
             [ngClass]="currentTab() === 'sprint' ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-primary/5 font-medium'"
             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            Active Sprint
          </a>
          <a (click)="currentTab.set('backlog')"
             [ngClass]="currentTab() === 'backlog' ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-primary/5 font-medium'"
             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Backlog
          </a>
          @if (projectState.isProjectManager()) {
            <a (click)="currentTab.set('team')"
               [ngClass]="currentTab() === 'team' ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-primary/5 font-medium'"
               class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
              <svg class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              Project Team
            </a>
          }
          <a (click)="currentTab.set('profile')"
             [ngClass]="currentTab() === 'profile' ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-primary/5 font-medium'"
             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            My Profile
          </a>
        </nav>

        <!-- Footer / Profile Quick view & Dark mode -->
        <div class="border-t border-border pt-6 mt-6 space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-text-secondary uppercase">Theme</span>
            <button (click)="toggleDarkMode()" 
                    class="w-10 h-6 bg-border dark:bg-primary rounded-full relative flex items-center p-1 transition-all duration-300">
              <div class="w-4 h-4 bg-white rounded-full shadow transition-all duration-300 transform"
                   [ngClass]="isDark() ? 'translate-x-4' : 'translate-x-0'"></div>
            </button>
          </div>

          <div (click)="currentTab.set('profile')" class="cursor-pointer flex items-center gap-3 bg-surface border border-border p-3.5 rounded-xl transition-all duration-250 hover:border-primary/40 hover:shadow-sm">
            <div class="w-9 h-9 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0">
              {{ userInitial() }}
            </div>
            <div class="min-w-0">
              <h4 class="text-xs font-extrabold text-text-primary truncate">{{ userName() }}</h4>
              <p class="text-[10px] text-text-secondary truncate">{{ userJobTitle() }}</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Dashboard Panel -->
      <div class="flex-1 flex flex-col min-w-0">
        
        <!-- Header -->
        <header class="h-16 border-b border-border bg-surface flex items-center justify-between px-6 md:px-8 transition-colors duration-200 shrink-0">
          <div class="flex items-center gap-3">
            <h1 class="text-lg font-extrabold text-text-primary">
              @if (currentTab() === 'sprint') { Active Sprint }
              @else if (currentTab() === 'backlog') { Product Backlog }
              @else if (currentTab() === 'team') { Team Management }
              @else { My Profile }
            </h1>
            @if (currentTab() === 'sprint') {
              <span class="px-2.5 py-0.5 text-xs font-semibold bg-success/15 text-success rounded-full">
                {{ activeSprintName() }}
              </span>
            }
          </div>

          <div class="flex items-center gap-4">
            <!-- Project selector for Project Manager / Employee -->
            @if (projectState.projects().length > 0) {
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-text-secondary uppercase hidden md:inline">Project:</span>
                <select [value]="projectState.selectedProjectId()" 
                        (change)="onProjectSelect($event)" 
                        class="bg-background border border-border text-sm font-semibold rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                  @for (p of projectState.projects(); track p.id) {
                    <option [value]="p.id">{{ p.name }}</option>
                  }
                </select>
                @if (projectState.isProjectManager()) {
                  <button (click)="isCreateProjectModalOpen.set(true)"
                          title="Create New Project"
                          class="p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all flex items-center justify-center">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                  </button>
                }
              </div>
            } @else if (projectState.isProjectManager()) {
              <button (click)="isCreateProjectModalOpen.set(true)"
                      class="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                Create Project
              </button>
            }

            <!-- Subscription button -->
            <a routerLink="/subscription"
               class="px-4 py-2 bg-surface hover:bg-primary/10 border border-border text-text-primary text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
              Subscription
            </a>

            <!-- Logout button -->
            <button (click)="logout()"
                    class="px-4 py-2 bg-surface hover:bg-error/10 border border-border text-error text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              Logout
            </button>

            <!-- Dark mode toggle -->
            <button (click)="toggleDarkMode()" class="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-border transition-colors">
              @if (isDark()) {
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.364l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              }
            </button>

            <span class="text-sm font-semibold text-text-secondary hidden sm:inline">{{ currentDate }}</span>
          </div>
        </header>

        <!-- Main Content Area -->
        <main class="flex-1 overflow-y-auto p-6 md:p-8">
          @if (currentTab() === 'sprint') {
            <app-board></app-board>
          } @else if (currentTab() === 'backlog') {
            <app-backlog-view></app-backlog-view>
          } @else if (currentTab() === 'team') {
            <app-team-view></app-team-view>
          } @else if (currentTab() === 'profile') {
            <app-profile-view></app-profile-view>
          }
        </main>
      </div>

      <!-- Mobile Bottom Navigation Bar -->
      <div class="fixed bottom-4 left-4 right-4 z-40 bg-surface/75 backdrop-blur-xl border border-border flex items-center justify-around py-2.5 md:hidden rounded-2xl shadow-xl transition-all duration-300">
        
        <!-- Sprint Tab -->
        <button (click)="currentTab.set('sprint')" 
                class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
                [ngClass]="currentTab() === 'sprint' ? 'text-primary scale-105' : 'text-text-secondary'">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
          </svg>
          <span class="text-[9px] font-bold">Sprint</span>
        </button>

        <!-- Backlog Tab -->
        <button (click)="currentTab.set('backlog')" 
                class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
                [ngClass]="currentTab() === 'backlog' ? 'text-primary scale-105' : 'text-text-secondary'">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span class="text-[9px] font-bold">Backlog</span>
        </button>

        <!-- Mobile Team Tab -->
        @if (projectState.isProjectManager()) {
          <button (click)="currentTab.set('team')" 
                  class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
                  [ngClass]="currentTab() === 'team' ? 'text-primary scale-105' : 'text-text-secondary'">
            <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            <span class="text-[9px] font-bold">Team</span>
          </button>
        }

        <!-- Profile Tab -->
        <button (click)="currentTab.set('profile')" 
                class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
                [ngClass]="currentTab() === 'profile' ? 'text-primary scale-105' : 'text-text-secondary'">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span class="text-[9px] font-bold">Profile</span>
        </button>
      </div>

    </div>

    <!-- Create Project Modal Choice / Manual Form -->
    @if (isCreateProjectModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]">
        <div class="bg-surface border border-border rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-5 animate-[scaleUp_0.25s_ease_both]">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-text-primary">Create New Project</h3>
            <button (click)="isCreateProjectModalOpen.set(false); showManualForm.set(false)" class="p-1.5 text-text-secondary hover:bg-border rounded-full transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          @if (!showManualForm()) {
            <!-- Selector Options -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <!-- AI Option -->
              <button (click)="isCreateProjectModalOpen.set(false); isAiChatOpen.set(true)"
                      class="flex flex-col items-center text-center p-6 bg-sidebar border border-border rounded-2xl hover:border-primary/50 transition-all hover:shadow-md group">
                <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <svg class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <h4 class="text-sm font-bold text-text-primary">AI Requirements Flow</h4>
                <p class="text-[11px] text-text-secondary mt-1">Chat with AI to define requirements, analyze scopes, and build structured backlogs automatically.</p>
              </button>

              <!-- Manual Option -->
              <button (click)="showManualForm.set(true)"
                      class="flex flex-col items-center text-center p-6 bg-sidebar border border-border rounded-2xl hover:border-primary/50 transition-all hover:shadow-md group">
                <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </div>
                <h4 class="text-sm font-bold text-text-primary">Manual Configuration</h4>
                <p class="text-[11px] text-text-secondary mt-1">Directly fill names and description forms to construct your workspace manually.</p>
              </button>
            </div>
          } @else {
            <form (submit)="onCreateProjectSubmit($event)" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Project Name (English)</label>
                <input type="text" name="projNameEn" required placeholder="e.g. Mobile Application" 
                       class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
              </div>
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">اسم المشروع (عربي)</label>
                <input type="text" name="projNameAr" required placeholder="مثال: تطبيق الجوال" dir="rtl"
                       class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
              </div>
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Description</label>
                <textarea name="projDesc" placeholder="Brief details about the project scope..." rows="3" required
                          class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"></textarea>
              </div>

              <div class="flex justify-end gap-3 pt-3">
                <button type="button" (click)="showManualForm.set(false)" class="px-4 py-2.5 border border-border rounded-xl hover:bg-border font-semibold text-sm transition-colors">
                  Back
                </button>
                <button type="submit" class="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-md transition-all">
                  Create Project
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    }

    <!-- AI Requirement Chat modal -->
    @if (isAiChatOpen()) {
      <app-ai-chat-modal (close)="onAiChatClose()" (draftGenerated)="onDraftGenerated($event)"></app-ai-chat-modal>
    }

    <!-- Project Draft Review modal -->
    @if (isDraftReviewOpen()) {
      <app-draft-review-modal [draft]="aiDraft()" [chatId]="chatId()" (close)="isDraftReviewOpen.set(false)" (projectSaved)="onProjectSaved()"></app-draft-review-modal>
    }
  `
})
export class DashboardComponent implements OnInit {
  isDark = signal(false);
  currentDate = '';
  userName = signal('Guest User');
  userJobTitle = signal('');
  userInitial = computed(() => this.userName().trim().charAt(0).toUpperCase() || 'U');

  // Active navigation tab signal
  currentTab = signal<'sprint' | 'backlog' | 'team' | 'profile'>('sprint');

  // Active Sprint badge details
  activeSprintName = signal('No Active Sprint');

  isCreateProjectModalOpen = signal(false);
  showManualForm = signal(false);

  // AI Project creation signals
  isAiChatOpen = signal(false);
  isDraftReviewOpen = signal(false);
  aiDraft = signal<any>(null);
  chatId = signal<string>('');

  public projectState = inject(ProjectStateService);
  private authService = inject(AuthService);

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
  }

  ngOnInit() {
    this.currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('selectedTheme');
      if (savedTheme) {
        const isDarkTheme = savedTheme === 'dark';
        this.isDark.set(isDarkTheme);
        if (isDarkTheme) {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light-mode');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light-mode');
        }
      }
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
        this.activeSprintName.set(`${sprintData.titleEn} Active`);
      } else {
        this.activeSprintName.set('No Active Sprint');
      }
    } catch (e) {
      console.warn('Failed to load active sprint info:', e);
      this.activeSprintName.set('No Active Sprint');
    }
  }

  onProjectSelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.projectState.setSelectedProject(select.value);
  }

  onAiChatClose() {
    this.isAiChatOpen.set(false);
  }

  onDraftGenerated(event: { draft: any, chatId: string }) {
    this.isAiChatOpen.set(false);
    this.aiDraft.set(event.draft);
    this.chatId.set(event.chatId);
    this.isDraftReviewOpen.set(true);
  }

  onProjectSaved() {
    this.isDraftReviewOpen.set(false);
  }

  async onCreateProjectSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const nameEn = (form.elements.namedItem('projNameEn') as HTMLInputElement).value;
    const nameAr = (form.elements.namedItem('projNameAr') as HTMLInputElement).value;
    const desc = (form.elements.namedItem('projDesc') as HTMLTextAreaElement).value;

    const success = await this.projectState.createNewProject(nameEn, nameAr, desc);
    if (success) {
      this.isCreateProjectModalOpen.set(false);
      this.showManualForm.set(false);
      form.reset();
    }
  }

  toggleDarkMode() {
    this.isDark.update(v => !v);
    if (this.isDark()) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('selectedTheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('selectedTheme', 'light');
    }
  }
}