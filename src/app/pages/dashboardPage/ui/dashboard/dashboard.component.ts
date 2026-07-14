import { Component, ChangeDetectionStrategy, signal, OnInit, computed, inject, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardComponent } from '../../../../widgets/taskBoard';
import { BacklogViewComponent } from '../backlog-view/backlog-view.component';
import { ProfileViewComponent } from '../profile-view/profile-view.component';
import { TeamViewComponent } from '../team-view/team-view.component';
import { AiChatModalComponent } from '../ai-chat-modal/ai-chat-modal.component';
import { DraftReviewModalComponent } from '../draft-review-modal/draft-review-modal.component';
import { TechStackAdvisorModalComponent } from '../tech-stack-advisor-modal/tech-stack-advisor-modal.component';
import { ProjectHubComponent } from '../project-hub/project-hub.component';
import { SprintPlanningViewComponent } from '../sprint-planning-view/sprint-planning-view.component';
import { ProjectStats } from '../project-card/project-card.component';
import { ProjectHistoryModalComponent } from '../project-history-modal/project-history-modal.component';

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
    TechStackAdvisorModalComponent,
    ProjectHubComponent,
    ProjectHistoryModalComponent,
    SprintPlanningViewComponent
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
                <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider truncate" [title]="sp.nameEn">
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
            <!-- Sprint Planning tab (PM only) -->
            <a (click)="currentTab.set('sprint-planning')"
               [class.bg-primary/10]="currentTab() === 'sprint-planning'"
               [class.text-primary]="currentTab() === 'sprint-planning'"
               [class.font-bold]="currentTab() === 'sprint-planning'"
               [class.shadow-sm]="currentTab() === 'sprint-planning'"
               [class.text-text-secondary]="currentTab() !== 'sprint-planning'"
               [class.hover:text-text-primary]="currentTab() !== 'sprint-planning'"
               [class.hover:bg-primary/5]="currentTab() !== 'sprint-planning'"
               [class.font-medium]="currentTab() !== 'sprint-planning'"
               class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
              <svg class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Sprint Planning
              <span class="ml-auto text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">AI</span>
            </a>
          }

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
              } @else if (currentTab() === 'create-project') {
                Create Project
              } @else if (currentTab() === 'profile') {
                My Profile
              } @else if (currentTab() === 'sprint-planning') {
                @if (projectState.isProjectManager()) {
                  <span class="text-text-secondary hover:text-text-primary cursor-pointer transition-colors" (click)="currentTab.set('projects')">All Projects</span>
                  <span class="text-text-secondary font-light">/</span>
                }
                <span class="truncate max-w-[200px]">{{ projectState.selectedProject()?.nameEn || 'Workspace' }}</span>
                <span class="text-text-secondary font-light">/</span>
                Sprint Planning
              } @else {
                <!-- Breadcrumbs inside project tabs -->
                @if (projectState.isProjectManager()) {
                  <span class="text-text-secondary hover:text-text-primary cursor-pointer transition-colors" (click)="currentTab.set('projects')">All Projects</span>
                  <span class="text-text-secondary font-light">/</span>
                }
                <span class="truncate max-w-[200px]">{{ projectState.selectedProject()?.nameEn || 'Workspace' }}</span>
              }
            </h1>
            
            @if (projectState.selectedProject()?.status === 'Completed') {
              <span class="px-2.5 py-0.5 text-xs font-semibold bg-blue-500/15 text-blue-600 rounded-full font-mono uppercase tracking-wider">
                Completed
              </span>
            } @else if (projectState.selectedProject()?.status === 'Archived') {
              <span class="px-2.5 py-0.5 text-xs font-semibold bg-slate-500/15 text-slate-600 rounded-full font-mono uppercase tracking-wider">
                Archived
              </span>
            } @else if (currentTab() === 'sprint') {
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
              <button (click)="openCreateProjectPage()"
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
            <app-board></app-board>
          } @else if (currentTab() === 'sprint-planning') {
            <app-sprint-planning-view 
              (sprintConfirmed)="currentTab.set('sprint'); loadActiveSprint(projectState.selectedProjectId()!)">
            </app-sprint-planning-view>
          } @else if (currentTab() === 'backlog') {
            <app-backlog-view></app-backlog-view>
          } @else if (currentTab() === 'team') {
            <app-team-view></app-team-view>
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
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
          </svg>
          <span class="text-[9px] font-bold">Sprint</span>
        </button>

        <!-- Sprint Planning Tab (Mobile PM) -->
        @if (projectState.isProjectManager()) {
          <button (click)="currentTab.set('sprint-planning')"
                  class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
                  [class.text-primary]="currentTab() === 'sprint-planning'"
                  [class.scale-105]="currentTab() === 'sprint-planning'"
                  [class.text-text-secondary]="currentTab() !== 'sprint-planning'">
            <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <span class="text-[9px] font-bold">Planning</span>
          </button>
        }

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

    @if (isTechStackAdvisorOpen() && advisorProjectId()) {
      <app-tech-stack-advisor-modal [projectId]="advisorProjectId()!" (close)="onTechStackAdvisorClose()" (completed)="onTechStackAdvisorCompleted($event)"></app-tech-stack-advisor-modal>
    }

    <!-- Project Draft Review modal -->
    @if (isDraftReviewOpen()) {
      <app-draft-review-modal [draft]="aiDraft()" [chatId]="chatId()" (close)="isDraftReviewOpen.set(false)" (projectSaved)="onProjectSaved()"></app-draft-review-modal>
    }

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

  currentTab = signal<'projects' | 'create-project' | 'sprint' | 'sprint-planning' | 'backlog' | 'team' | 'profile'>('sprint');

  // Active Sprint badge details
  activeSprintName = signal('No Active Sprint');

  showManualForm = signal(false);
  isProjectDropdownOpen = signal(false);

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
}