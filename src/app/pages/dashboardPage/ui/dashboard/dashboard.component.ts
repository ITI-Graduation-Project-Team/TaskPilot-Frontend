import { Component, ChangeDetectionStrategy, signal, OnInit, computed, inject, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardComponent } from '../../../../widgets/taskBoard';
import { BacklogViewComponent } from '../backlog-view/backlog-view.component';
import { ProfileViewComponent } from '../profile-view/profile-view.component';
import { TeamViewComponent } from '../team-view/team-view.component';
import { AiChatModalComponent } from '../ai-chat-modal/ai-chat-modal.component';
import { DraftReviewModalComponent } from '../draft-review-modal/draft-review-modal.component';
import { ProjectHubComponent } from '../project-hub/project-hub.component';
import { ProjectStats } from '../project-card/project-card.component';
import { apiClient } from '../../../../shared/api/axios.instance';
import { ProjectStateService, ProjectInfo } from '../../../../shared/services/project-state.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../shared/api/auth.service';
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
    ProjectHubComponent
  ],
  template: `
    <div class="min-h-screen bg-background text-text-primary flex transition-colors duration-200 pb-16 md:pb-0 font-dashboard">
      
      <!-- Desktop Sidebar Navigation -->
      <aside class="w-64 bg-sidebar border-r border-border hidden md:flex flex-col p-6 transition-colors duration-200 shrink-0">
        <!-- Logo -->
        <div class="flex flex-col gap-2 mb-8 bg-white dark:bg-[#020114] p-4 rounded-2xl border border-border/40 shadow-sm transition-all duration-200">
          <img [src]="isDark() ? '/TaskPilotDarkMode.svg' : '/TaskPilotLogo.svg'" alt="TaskPilot Logo" class="h-8 transition-transform hover:scale-105 mx-auto" />
          
          <!-- Company Name Badge -->
          @if (projectState.companyName()) {
            <div class="text-center mt-0.5">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/15 tracking-wide max-w-full truncate" [title]="projectState.companyName()">
                🏢 {{ projectState.companyName() }}
              </span>
            </div>
          }

          <!-- Selected Project Sidebar Header Context -->
          @if (projectState.selectedProject(); as sp) {
            @if (currentTab() !== 'projects') {
              <div class="mt-2 pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider truncate max-w-[130px]" [title]="sp.nameEn">
                  📁 {{ sp.nameEn }}
                </span>
                <button (click)="currentTab.set('projects')" class="text-[10px] text-primary font-bold hover:underline shrink-0">
                  Switch
                </button>
              </div>
            }
          }
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 space-y-1.5">
          <!-- All Projects Tab (PM only) -->
          @if (projectState.isProjectManager()) {
            <a (click)="currentTab.set('projects')"
               [class.bg-primary/10]="currentTab() === 'projects'"
               [class.text-primary]="currentTab() === 'projects'"
               [class.font-bold]="currentTab() === 'projects'"
               [class.shadow-sm]="currentTab() === 'projects'"
               [class.text-text-secondary]="currentTab() !== 'projects'"
               [class.hover:text-text-primary]="currentTab() !== 'projects'"
               [class.hover:bg-primary/5]="currentTab() !== 'projects'"
               [class.font-medium]="currentTab() !== 'projects'"
               class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
              <svg class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              All Projects
            </a>
          }

          <a (click)="currentTab.set('sprint')"
             [class.bg-primary/10]="currentTab() === 'sprint'"
             [class.text-primary]="currentTab() === 'sprint'"
             [class.font-bold]="currentTab() === 'sprint'"
             [class.shadow-sm]="currentTab() === 'sprint'"
             [class.text-text-secondary]="currentTab() !== 'sprint'"
             [class.hover:text-text-primary]="currentTab() !== 'sprint'"
             [class.hover:bg-primary/5]="currentTab() !== 'sprint'"
             [class.font-medium]="currentTab() !== 'sprint'"
             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            Active Sprint
          </a>
          <a (click)="currentTab.set('backlog')"
             [class.bg-primary/10]="currentTab() === 'backlog'"
             [class.text-primary]="currentTab() === 'backlog'"
             [class.font-bold]="currentTab() === 'backlog'"
             [class.shadow-sm]="currentTab() === 'backlog'"
             [class.text-text-secondary]="currentTab() !== 'backlog'"
             [class.hover:text-text-primary]="currentTab() !== 'backlog'"
             [class.hover:bg-primary/5]="currentTab() !== 'backlog'"
             [class.font-medium]="currentTab() !== 'backlog'"
             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Backlog
          </a>
          @if (projectState.isProjectManager()) {
            <a (click)="currentTab.set('team')"
               [class.bg-primary/10]="currentTab() === 'team'"
               [class.text-primary]="currentTab() === 'team'"
               [class.font-bold]="currentTab() === 'team'"
               [class.shadow-sm]="currentTab() === 'team'"
               [class.text-text-secondary]="currentTab() !== 'team'"
               [class.hover:text-text-primary]="currentTab() !== 'team'"
               [class.hover:bg-primary/5]="currentTab() !== 'team'"
               [class.font-medium]="currentTab() !== 'team'"
               class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
              <svg class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              Project Team
            </a>
          }
          <a (click)="currentTab.set('profile')"
             [class.bg-primary/10]="currentTab() === 'profile'"
             [class.text-primary]="currentTab() === 'profile'"
             [class.font-bold]="currentTab() === 'profile'"
             [class.shadow-sm]="currentTab() === 'profile'"
             [class.text-text-secondary]="currentTab() !== 'profile'"
             [class.hover:text-text-primary]="currentTab() !== 'profile'"
             [class.hover:bg-primary/5]="currentTab() !== 'profile'"
             [class.font-medium]="currentTab() !== 'profile'"
             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            My Profile
          </a>
        </nav>

        <!-- Footer / Profile Quick view & Dark mode -->
        <div class="border-t border-border pt-6 mt-6 space-y-4">
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
            <h1 class="text-lg font-extrabold text-text-primary font-display flex items-center gap-1.5">
              @if (currentTab() === 'projects') {
                Projects Hub
              } @else if (currentTab() === 'profile') {
                My Profile
              } @else {
                <!-- Breadcrumbs inside project tabs -->
                @if (projectState.isProjectManager()) {
                  <span class="text-text-secondary hover:text-text-primary cursor-pointer transition-colors" (click)="currentTab.set('projects')">All Projects</span>
                  <span class="text-text-secondary font-light">/</span>
                }
                <span class="truncate max-w-[200px]">{{ projectState.selectedProject()?.nameEn || 'Workspace' }}</span>
              }
            </h1>
            
            @if (currentTab() === 'sprint') {
              <span class="px-2.5 py-0.5 text-xs font-semibold bg-success/15 text-success rounded-full font-mono">
                {{ activeSprintName() }}
              </span>
            }
          </div>

          <div class="flex items-center gap-4">
            <!-- Project selector context dropdown (only shown inside project tabs) -->
            @if (currentTab() !== 'projects' && currentTab() !== 'profile' && projectState.projects().length > 0) {
              <div class="flex items-center gap-2">
                <!-- Custom Project Dropdown -->
                <div class="relative">
                  <button (click)="isProjectDropdownOpen.update(v => !v)"
                          class="flex items-center gap-2 px-3 py-1.5 bg-background border border-border hover:border-primary/40 rounded-xl text-xs font-bold text-text-primary transition-all duration-200 hover:bg-sidebar focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px] group">
                    <svg class="w-3.5 h-3.5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                    </svg>
                    <span class="truncate max-w-[100px]">
                      {{ projectState.selectedProject()?.nameEn || 'Select Project' }}
                    </span>
                    <svg class="w-3 h-3 ml-auto text-text-secondary transition-transform duration-200 shrink-0"
                         [class.rotate-180]="isProjectDropdownOpen()"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  @if (isProjectDropdownOpen()) {
                    <!-- Backdrop -->
                    <div class="fixed inset-0 z-40" (click)="isProjectDropdownOpen.set(false)"></div>
                    <!-- Dropdown Panel -->
                    <div class="absolute right-0 top-full mt-2 z-50 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden min-w-[200px] animate-[fadeDown_0.15s_ease_both]">
                      <div class="px-3 py-2 border-b border-border">
                        <p class="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Your Projects</p>
                      </div>
                      <div class="py-1 max-h-60 overflow-y-auto">
                        @for (p of projectState.projects(); track p.id) {
                          <button (click)="selectProject(p.id)"
                                  class="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-sidebar transition-colors"
                                  [class.bg-primary/8]="p.id === projectState.selectedProjectId()">
                            <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
                                 [style.background]="getProjectColor(p.id)">
                              {{ (p.nameEn || p.name || '?')[0].toUpperCase() }}
                            </div>
                            <span class="font-medium text-text-primary truncate">{{ p.nameEn || p.name }}</span>
                            @if (p.id === projectState.selectedProjectId()) {
                              <svg class="w-4 h-4 text-primary ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                              </svg>
                            }
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Create project manual CTA (Header Projects Hub only) -->
            @if (currentTab() === 'projects') {
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
          @if (currentTab() === 'projects') {
            <app-project-hub
              [projects]="projectState.projects()"
              [projectStatsMap]="projectStatsMap()"
              (createProject)="isCreateProjectModalOpen.set(true)"
              (createProjectWithAi)="isCreateProjectModalOpen.set(false); isAiChatOpen.set(true)"
              (selectSprint)="goToProject($event, 'sprint')"
              (selectBacklog)="goToProject($event, 'backlog')"
              (editProject)="openEditProjectModal($event)"
              (deleteProject)="deleteProject($event)">
            </app-project-hub>
          } @else if (currentTab() === 'sprint') {
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
        
        <!-- Projects Hub Tab (Mobile PM) -->
        @if (projectState.isProjectManager()) {
          <button (click)="currentTab.set('projects')" 
                  class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
                  [class.text-primary]="currentTab() === 'projects'"
                  [class.scale-105]="currentTab() === 'projects'"
                  [class.text-text-secondary]="currentTab() !== 'projects'">
            <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <span class="text-[9px] font-bold">Projects</span>
          </button>
        }

        <!-- Sprint Tab -->
        <button (click)="currentTab.set('sprint')" 
                class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
                [class.text-primary]="currentTab() === 'sprint'"
                [class.scale-105]="currentTab() === 'sprint'"
                [class.text-text-secondary]="currentTab() !== 'sprint'">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
          </svg>
          <span class="text-[9px] font-bold">Sprint</span>
        </button>

        <!-- Backlog Tab -->
        <button (click)="currentTab.set('backlog')" 
                class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
                [class.text-primary]="currentTab() === 'backlog'"
                [class.scale-105]="currentTab() === 'backlog'"
                [class.text-text-secondary]="currentTab() !== 'backlog'">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span class="text-[9px] font-bold">Backlog</span>
        </button>

        <!-- Mobile Team Tab -->
        @if (projectState.isProjectManager()) {
          <button (click)="currentTab.set('team')" 
                  class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
                  [class.text-primary]="currentTab() === 'team'"
                  [class.scale-105]="currentTab() === 'team'"
                  [class.text-text-secondary]="currentTab() !== 'team'">
            <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            <span class="text-[9px] font-bold">Team</span>
          </button>
        }

        <!-- Profile Tab -->
        <button (click)="currentTab.set('profile')" 
                class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
                [class.text-primary]="currentTab() === 'profile'"
                [class.scale-105]="currentTab() === 'profile'"
                [class.text-text-secondary]="currentTab() !== 'profile'">
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
            <h3 class="text-lg font-bold text-text-primary font-display">Create New Project</h3>
            <button (click)="isCreateProjectModalOpen.set(false); showManualForm.set(false)" class="p-1.5 text-text-secondary hover:bg-sidebar rounded-full transition-colors focus:outline-none">
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
                <h4 class="text-sm font-bold text-text-primary font-display">AI Requirements Flow</h4>
                <p class="text-[11px] text-text-secondary mt-1">Chat with AI to define requirements, analyze scopes, and build structured backlogs automatically.</p>
              </button>

              <!-- Manual Option -->
              <button (click)="showManualForm.set(true)"
                      class="flex flex-col items-center text-center p-6 bg-sidebar border border-border rounded-2xl hover:border-primary/50 transition-all hover:shadow-md group">
                <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </div>
                <h4 class="text-sm font-bold text-text-primary font-display">Manual Configuration</h4>
                <p class="text-[11px] text-text-secondary mt-1">Directly fill names and description forms to construct your workspace manually.</p>
              </button>
            </div>
          } @else {
            <form (submit)="onCreateProjectSubmit($event)" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Description (English)</label>
                  <textarea name="projDescEn" placeholder="English details..." rows="3" required
                            class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"></textarea>
                </div>
                <div>
                  <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">الوصف (عربي)</label>
                  <textarea name="projDescAr" placeholder="تفاصيل باللغة العربية..." rows="3" required dir="rtl"
                            class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"></textarea>
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-3">
                <button type="button" (click)="showManualForm.set(false)" class="px-4 py-2.5 border border-border rounded-xl hover:bg-sidebar font-semibold text-sm transition-colors">
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
    @if (isAiChatOpen()) {
      <app-ai-chat-modal (close)="onAiChatClose()" (draftGenerated)="onDraftGenerated($event)"></app-ai-chat-modal>
    }

    <!-- Project Draft Review modal -->
    @if (isDraftReviewOpen()) {
      <app-draft-review-modal [draft]="aiDraft()" [chatId]="chatId()" (close)="isDraftReviewOpen.set(false)" (projectSaved)="onProjectSaved()"></app-draft-review-modal>
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
  currentTab = signal<'projects' | 'sprint' | 'backlog' | 'team' | 'profile'>('sprint');

  // Active Sprint badge details
  activeSprintName = signal('No Active Sprint');

  isCreateProjectModalOpen = signal(false);
  showManualForm = signal(false);
  isProjectDropdownOpen = signal(false);

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

  public projectState = inject(ProjectStateService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

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

    // If a PM has no projects, default to the projects hub tab to create one
    effect(() => {
      const isPM = this.projectState.isProjectManager();
      const projCount = this.projectState.projects().length;
      const initialized = !this.projectState.loading();
      if (initialized && isPM && projCount === 0) {
        this.currentTab.set('projects');
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

  onAiChatClose() {
    this.isAiChatOpen.set(false);
  }

  onDraftGenerated(event: { draft: any, chatId: string }) {
    this.isAiChatOpen.set(false);
    // Reload projects after new project generated by AI
    this.projectState.loadProjects();
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
      this.isCreateProjectModalOpen.set(false);
      this.showManualForm.set(false);
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
        const success = await this.projectState.deleteProject(projectId);
        if (success) {
          this.toastService.show(`Project "${proj.nameEn}" deleted successfully.`, 'success');
          this.loadAllProjectStats();
        } else {
          this.toastService.show('Failed to delete project. Please try again.', 'error');
        }
      }
    }
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
}