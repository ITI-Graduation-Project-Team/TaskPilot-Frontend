import { Component, ChangeDetectionStrategy, signal, OnInit, computed, inject, effect, untracked, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { AiChatModalComponent } from '../ai-chat-modal/ai-chat-modal.component';
import { DraftReviewModalComponent } from '../draft-review-modal/draft-review-modal.component';
import { TechStackAdvisorModalComponent } from '../tech-stack-advisor-modal/tech-stack-advisor-modal.component';
import { ProjectHubComponent } from '../project-hub/project-hub.component';
import { ProjectStats } from '../project-card/project-card.component';
import { SprintPlanningViewComponent } from '../sprint-planning-view/sprint-planning-view.component';
import { SettingsViewComponent } from '../settings-view/settings-view.component';
import { OrganizationViewComponent } from '../../../../features/organization/ui/organization-view/organization-view.component';
import { ProjectHistoryModalComponent } from '../project-history-modal/project-history-modal.component';
import { SprintListItem } from '../../../../shared/api/sprint-planning.service';
import { NotificationBellComponent } from '../../../../shared/ui/notification-bell/notification-bell';

import { apiClient } from '../../../../shared/api/axios.instance';
import { ProjectStateService, ProjectInfo } from '../../../../shared/services/project-state.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import { ActivatedRoute, RouterLink, Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../../shared/api/auth.service';
import { SprintPlanningService } from '../../../../shared/api/sprint-planning.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { DashboardService } from '../../services/dashboard.service';
import { SprintListComponent } from '../../../../features/sprintList/sprint-list.component';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    AiChatModalComponent,
    NotificationBellComponent,
    ProjectHistoryModalComponent,
    SprintListComponent,
    SettingsViewComponent,
    TranslatePipe
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
                <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider truncate" [title]="getSprintName(sp)">
                  📁 {{ getSprintName(sp) }}
                </span>
                <button (click)="currentTab.set('projects')" class="text-[10px] text-primary font-bold hover:underline shrink-0">
                  {{ 'SIDEBAR.SWITCH' | translate }}
                </button>
              </div>
            }
          }
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 space-y-1.5">
          <!-- All Projects Tab (PM only) -->
          @if (projectState.isProjectManager()) {
            <a routerLink="/dashboard/projects" routerLinkActive="bg-primary/10 text-primary font-bold shadow-sm" #rlaProj="routerLinkActive"
               [class.text-text-secondary]="!rlaProj.isActive"
               [class.hover:text-text-primary]="!rlaProj.isActive"
               [class.hover:bg-primary/5]="!rlaProj.isActive"
               [class.font-medium]="!rlaProj.isActive"
               class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
              <svg class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              {{ 'SIDEBAR.ALL_PROJECTS' | translate }}
            </a>
          }

          <a routerLink="/dashboard/sprint" routerLinkActive="bg-primary/10 text-primary font-bold shadow-sm" #rlaSprint="routerLinkActive"
             [class.text-text-secondary]="!rlaSprint.isActive"
             [class.hover:text-text-primary]="!rlaSprint.isActive"
             [class.hover:bg-primary/5]="!rlaSprint.isActive"
             [class.font-medium]="!rlaSprint.isActive"
             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            {{ 'SIDEBAR.SPRINTS' | translate }}
          </a>
          <a routerLink="/dashboard/backlog" routerLinkActive="bg-primary/10 text-primary font-bold shadow-sm" #rlaBacklog="routerLinkActive"
             [class.text-text-secondary]="!rlaBacklog.isActive"
             [class.hover:text-text-primary]="!rlaBacklog.isActive"
             [class.hover:bg-primary/5]="!rlaBacklog.isActive"
             [class.font-medium]="!rlaBacklog.isActive"
             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {{ 'SIDEBAR.BACKLOG' | translate }}
          </a>
          @if (projectState.isProjectManager()) {
            <!-- Sprint Planning tab (PM only) -->
            <a routerLink="/dashboard/sprint-planning" routerLinkActive="bg-primary/10 text-primary font-bold shadow-sm" #rlaSprintPlan="routerLinkActive"
               [class.text-text-secondary]="!rlaSprintPlan.isActive"
               [class.hover:text-text-primary]="!rlaSprintPlan.isActive"
               [class.hover:bg-primary/5]="!rlaSprintPlan.isActive"
               [class.font-medium]="!rlaSprintPlan.isActive"
               class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
              <svg class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              {{ 'SIDEBAR.SPRINT_PLANNING' | translate }}
              <span class="ml-auto text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">AI</span>
            </a>
          }

          <!-- Retrospective Tab -->
          <a routerLink="/dashboard/retrospective" routerLinkActive="bg-primary/10 text-primary font-bold shadow-sm" #rlaRetro="routerLinkActive"
             [class.text-text-secondary]="!rlaRetro.isActive"
             [class.hover:text-text-primary]="!rlaRetro.isActive"
             [class.hover:bg-primary/5]="!rlaRetro.isActive"
             [class.font-medium]="!rlaRetro.isActive"
             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
            <svg class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {{ currentLang() === 'ar' ? 'المراجعة الختامية' : 'Retrospective' }}
            <span class="ml-auto text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">AI</span>
          </a>



          @if (projectState.isProjectManager()) {
            <a routerLink="/dashboard/team" routerLinkActive="bg-primary/10 text-primary font-bold shadow-sm" #rlaTeam="routerLinkActive"
               [class.text-text-secondary]="!rlaTeam.isActive"
               [class.hover:text-text-primary]="!rlaTeam.isActive"
               [class.hover:bg-primary/5]="!rlaTeam.isActive"
               [class.font-medium]="!rlaTeam.isActive"
               class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
              <svg class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              {{ 'SIDEBAR.PROJECT_TEAM' | translate }}
            </a>

            <!-- Project Policies Tab -->
            <a routerLink="/dashboard/project-policies" routerLinkActive="bg-primary/10 text-primary font-bold shadow-sm" #rlaProjPol="routerLinkActive"
               [class.text-text-secondary]="!rlaProjPol.isActive"
               [class.hover:text-text-primary]="!rlaProjPol.isActive"
               [class.hover:bg-primary/5]="!rlaProjPol.isActive"
               [class.font-medium]="!rlaProjPol.isActive"
               class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
              <svg class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {{ 'SIDEBAR.PROJECT_POLICIES' | translate }}
              <span class="ml-auto text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">AI</span>
            </a>
          } 
          <!-- Employees Tab (PM only) -->
          @if (projectState.isProjectManager()) {
            <a routerLink="/dashboard/employees" routerLinkActive="bg-primary/10 text-primary font-bold shadow-sm" #rlaEmp="routerLinkActive"
               [class.text-text-secondary]="!rlaEmp.isActive"
               [class.hover:text-text-primary]="!rlaEmp.isActive"
               [class.hover:bg-primary/5]="!rlaEmp.isActive"
               [class.font-medium]="!rlaEmp.isActive"
               class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
              <svg class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {{ 'SIDEBAR.EMPLOYEES' | translate }}
            </a>
          }
          <!-- Organization Hub / Company Policies Tab -->
          <a routerLink="/dashboard/organization" routerLinkActive="bg-primary/10 text-primary font-bold shadow-sm" #rlaOrg="routerLinkActive"
             [class.text-text-secondary]="!rlaOrg.isActive"
             [class.hover:text-text-primary]="!rlaOrg.isActive"
             [class.hover:bg-primary/5]="!rlaOrg.isActive"
             [class.font-medium]="!rlaOrg.isActive"
             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
            <svg class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            @if (projectState.isProjectManager()) {
              {{ currentLang() === 'ar' ? 'مركز المؤسسة' : 'Organization Hub' }}
            } @else {
              {{ currentLang() === 'ar' ? 'سياسات الشركة' : 'Company Policies' }}
            }
          </a>


          <a routerLink="/dashboard/profile" routerLinkActive="bg-primary/10 text-primary font-bold shadow-sm" #rlaProfile="routerLinkActive"
             [class.text-text-secondary]="!rlaProfile.isActive"
             [class.hover:text-text-primary]="!rlaProfile.isActive"
             [class.hover:bg-primary/5]="!rlaProfile.isActive"
             [class.font-medium]="!rlaProfile.isActive"

             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {{ 'SIDEBAR.MY_PROFILE' | translate }}
          </a>

          <!-- Settings Tab -->
          <a routerLink="/dashboard/settings" routerLinkActive="bg-primary/10 text-primary font-bold shadow-sm" #rlaSettings="routerLinkActive"
             [class.text-text-secondary]="!rlaSettings.isActive"
             [class.hover:text-text-primary]="!rlaSettings.isActive"
             [class.hover:bg-primary/5]="!rlaSettings.isActive"
             [class.font-medium]="!rlaSettings.isActive"
             class="group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-0.5">
            <svg class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {{ 'SIDEBAR.SETTINGS' | translate }}
          </a>
        </nav>

        <!-- Footer / Profile Quick view & Dark mode -->
        <div class="border-t border-border pt-6 mt-6 space-y-4">
          <div routerLink="/dashboard/profile" class="cursor-pointer flex items-center gap-3 bg-surface border border-border p-3.5 rounded-xl transition-all duration-250 hover:border-primary/40 hover:shadow-sm">
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
                {{ 'HEADER.PROJECTS_HUB' | translate }}
              } @else if (currentTab() === 'create-project') {
                {{ 'HEADER.CREATE_PROJECT' | translate }}
              } @else if (currentTab() === 'profile') {
                {{ 'HEADER.MY_PROFILE' | translate }}
              } @else if (currentTab() === 'sprint-planning') {
                @if (projectState.isProjectManager()) {
                  <span class="text-text-secondary hover:text-text-primary cursor-pointer transition-colors" (click)="currentTab.set('projects')">{{ 'HEADER.ALL_PROJECTS' | translate }}</span>
                  <span class="text-text-secondary font-light">/</span>
                }
                <span class="truncate max-w-[200px]">{{ getProjectName(projectState.selectedProject()) || ('HEADER.WORKSPACE' | translate) }}</span>
                <span class="text-text-secondary font-light">/</span>
                {{ 'HEADER.SPRINT_PLANNING' | translate }}
              } @else if (currentTab() === 'retrospective') {
                @if (projectState.isProjectManager()) {
                  <span class="text-text-secondary hover:text-text-primary cursor-pointer transition-colors" (click)="currentTab.set('projects')">{{ 'HEADER.ALL_PROJECTS' | translate }}</span>
                  <span class="text-text-secondary font-light">/</span>
                }
                <span class="truncate max-w-[200px]">{{ getProjectName(projectState.selectedProject()) || ('HEADER.WORKSPACE' | translate) }}</span>
                <span class="text-text-secondary font-light">/</span>
                {{ currentLang() === 'ar' ? 'المراجعة الختامية' : 'Retrospective' }}
              } @else if (currentTab() === 'organization') {
                @if (projectState.isProjectManager()) { Organization Hub } @else { Company Policies }
              } @else if (currentTab() === 'employees') {
                {{ 'EMPLOYEES.TITLE' | translate }}
              } @else if (currentTab() === 'settings') {
                {{ 'SIDEBAR.SETTINGS' | translate }}
            } @else if (currentTab() === 'project-policies') {
                @if (projectState.isProjectManager()) {
                    <span
                        class="text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                        (click)="currentTab.set('projects')">
                        {{ 'HEADER.ALL_PROJECTS' | translate }}
                    </span>
                    <span class="text-text-secondary font-light">/</span>
                }

                <span class="truncate max-w-[200px]">
                    {{ getProjectName(projectState.selectedProject()) || ('HEADER.WORKSPACE' | translate) }}
                </span>

                <span class="text-text-secondary font-light">/</span>

                Project Policies
              } @else {
                <!-- Breadcrumbs inside project tabs -->
                @if (projectState.isProjectManager()) {
                  <span class="text-text-secondary hover:text-text-primary cursor-pointer transition-colors" (click)="currentTab.set('projects')">{{ 'HEADER.ALL_PROJECTS' | translate }}</span>
                  <span class="text-text-secondary font-light">/</span>
                }
                <span class="truncate max-w-[200px]">{{ getProjectName(projectState.selectedProject()) || ('HEADER.WORKSPACE' | translate) }}</span>
              }
            </h1>
            
            @if (projectState.selectedProject()?.status === 'Completed') {
              <span class="px-2.5 py-0.5 text-xs font-semibold bg-blue-500/15 text-blue-600 rounded-full font-mono uppercase tracking-wider">
                {{ 'HEADER.COMPLETED' | translate }}
              </span>
            } @else if (projectState.selectedProject()?.status === 'Archived') {
              <span class="px-2.5 py-0.5 text-xs font-semibold bg-slate-500/15 text-slate-600 rounded-full font-mono uppercase tracking-wider">
                {{ 'HEADER.ARCHIVED' | translate }}
              </span>
            }
          </div>

          <div class="flex items-center gap-4">
            <!-- Project selector context dropdown (only shown inside project tabs) -->
            @if (currentTab() !== 'projects' && currentTab() !== 'profile' && currentTab() !== 'organization' && currentTab() !== 'employees' && projectState.projects().length > 0) {
              <div class="flex items-center gap-2">
                <!-- Custom Project Dropdown -->
                <div class="relative">
                  <button (click)="isProjectDropdownOpen.update(v => !v)"
                          class="flex items-center gap-2 px-3 py-1.5 bg-background border border-border hover:border-primary/40 rounded-xl text-xs font-bold text-text-primary transition-all duration-200 hover:bg-sidebar focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px] group">
                    <svg class="w-3.5 h-3.5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                    </svg>
                    <span class="truncate max-w-[100px]">
                      {{ getProjectName(projectState.selectedProject()) || ('HEADER.SELECT_PROJECT' | translate) }}
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
                        <p class="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{{ 'HEADER.YOUR_PROJECTS' | translate }}</p>
                      </div>
                      <div class="py-1 max-h-60 overflow-y-auto">
                        @for (p of projectState.projects(); track p.id) {
                          <button (click)="selectProject(p.id)"
                                  class="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-sidebar transition-colors"
                                  [class.bg-primary/8]="p.id === projectState.selectedProjectId()">
                            <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
                                 [style.background]="getProjectColor(p.id)">
                              {{ (getProjectName(p) || '?')[0].toUpperCase() }}
                            </div>
                            <span class="font-medium text-text-primary truncate">{{ getProjectName(p) }}</span>
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
                {{ 'HEADER.CREATE_PROJECT_BTN' | translate }}
              </button>
            }

            <!-- Notification Bell -->
            <app-notification-bell />

            <!-- Subscription button -->
            <a routerLink="/subscription"
               class="px-4 py-2 bg-surface hover:bg-primary/10 border border-border text-text-primary text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
              {{ 'HEADER.SUBSCRIPTION' | translate }}
            </a>

            <!-- Logout button -->
            <button (click)="logout()"
                    class="px-4 py-2 bg-surface hover:bg-error/10 border border-border text-error text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              {{ 'HEADER.LOGOUT' | translate }}
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
          <router-outlet></router-outlet>
        </main>
        


        <!-- AI Chat Modal (Floating mode) -->
        @if (dashboardService.isAiChatOpen()) {
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
          <a routerLink="/dashboard/projects" routerLinkActive="text-primary scale-105" #rlaProjM="routerLinkActive"
             [class.text-text-secondary]="!rlaProjM.isActive"
             class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200">
            <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <span class="text-[9px] font-bold">{{ 'SIDEBAR.PROJECTS' | translate }}</span>
          </a>
        }

        <!-- Sprint Tab -->
        <a routerLink="/dashboard/sprint" routerLinkActive="text-primary scale-105" #rlaSprintM="routerLinkActive"
           [class.text-text-secondary]="!rlaSprintM.isActive"
           class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
          </svg>
          <span class="text-[9px] font-bold">{{ 'SIDEBAR.SPRINT' | translate }}</span>
        </a>

        <!-- Sprint Planning (Mobile PM only) -->
        @if (projectState.isProjectManager()) {
          <a routerLink="/dashboard/sprint-planning" routerLinkActive="text-primary scale-105" #rlaSprintPlanM="routerLinkActive"
             [class.text-text-secondary]="!rlaSprintPlanM.isActive"
             class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 relative">
            <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <span class="text-[9px] font-bold">{{ 'SIDEBAR.PLANNING' | translate }}</span>
            <span class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          </a>
        }

        <!-- Backlog Tab -->
        <a routerLink="/dashboard/backlog" routerLinkActive="text-primary scale-105" #rlaBacklogM="routerLinkActive"
           [class.text-text-secondary]="!rlaBacklogM.isActive"
           class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span class="text-[9px] font-bold">{{ 'SIDEBAR.BACKLOG_SHORT' | translate }}</span>
        </a>

        <!-- Mobile Team Tab -->
        @if (projectState.isProjectManager()) {
          <a routerLink="/dashboard/team" routerLinkActive="text-primary scale-105" #rlaTeamM="routerLinkActive"
             [class.text-text-secondary]="!rlaTeamM.isActive"
             class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200">
            <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            <span class="text-[9px] font-bold">{{ 'SIDEBAR.TEAM' | translate }}</span>
          </a>

          <!-- Mobile Project Policies Tab -->
          <a routerLink="/dashboard/project-policies" routerLinkActive="text-primary scale-105" #rlaProjPolM="routerLinkActive"
             [class.text-text-secondary]="!rlaProjPolM.isActive"
             class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 relative">
            <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span class="text-[9px] font-bold">AI Policies</span>
          </a>
        }

        <!-- Mobile Employees Tab -->
        @if (projectState.isProjectManager()) {
          <a routerLink="/dashboard/employees" routerLinkActive="text-primary scale-105" #rlaEmpM="routerLinkActive"
             [class.text-text-secondary]="!rlaEmpM.isActive"
             class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200">
            <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <span class="text-[9px] font-bold">{{ 'SIDEBAR.EMPLOYEES' | translate }}</span>
          </a>
        }

        <!-- Profile Tab -->
        <a routerLink="/dashboard/profile" routerLinkActive="text-primary scale-105" #rlaProfileM="routerLinkActive"
           [class.text-text-secondary]="!rlaProfileM.isActive"
           class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span class="text-[9px] font-bold">{{ 'SIDEBAR.PROFILE' | translate }}</span>
        </a>

        <!-- Settings Tab (Mobile) -->
        <a routerLink="/dashboard/settings" routerLinkActive="text-primary scale-105" #rlaSettingsM="routerLinkActive"
           [class.text-text-secondary]="!rlaSettingsM.isActive"
           class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200">
          <svg class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="text-[9px] font-bold">{{ 'SIDEBAR.SETTINGS' | translate }}</span>
        </a>
      </div>

    </div>

    <!-- Edit Project Modal -->
    @if (dashboardService.isEditProjectModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]">
        <div class="bg-surface border border-border rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-5 animate-[scaleUp_0.25s_ease_both]">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-text-primary font-display">{{ 'MODALS.EDIT_PROJECT_TITLE' | translate }}</h3>
            <button (click)="dashboardService.isEditProjectModalOpen.set(false)" class="p-1.5 text-text-secondary hover:bg-sidebar rounded-full transition-colors focus:outline-none">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form (submit)="onEditProjectSubmit($event)" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">{{ 'MODALS.PROJ_NAME_EN' | translate }}</label>
                <input type="text" [(ngModel)]="editNameEn" name="editNameEn" required placeholder="e.g. Mobile Application" 
                       class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
              </div>
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider text-right">{{ 'MODALS.PROJ_NAME_AR' | translate }}</label>
                <input type="text" [(ngModel)]="editNameAr" name="editNameAr" required placeholder="مثال: تطبيق الجوال" dir="rtl"
                       class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-right">
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider">{{ 'MODALS.PROJ_DESC_EN' | translate }}</label>
                <textarea [(ngModel)]="editDescEn" name="editDescEn" placeholder="English details..." rows="3" required
                          class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"></textarea>
              </div>
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider text-right">{{ 'MODALS.PROJ_DESC_AR' | translate }}</label>
                <textarea [(ngModel)]="editDescAr" name="editDescAr" placeholder="تفاصيل باللغة العربية..." rows="3" required dir="rtl"
                          class="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all text-right"></textarea>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-3">
              <button type="button" (click)="dashboardService.isEditProjectModalOpen.set(false)" class="px-4 py-2.5 border border-border rounded-xl hover:bg-sidebar font-semibold text-sm transition-colors">
                {{ 'MODALS.CANCEL' | translate }}
              </button>
              <button type="submit" class="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-md transition-all">
                {{ 'MODALS.SAVE_CHANGES' | translate }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Project History Modal -->
    @if (dashboardService.isHistoryModalOpen() && dashboardService.selectedHistoryProject()) {
      <app-project-history-modal 
        [projectId]="dashboardService.selectedHistoryProject()!.id"
        [projectName]="getProjectName(dashboardService.selectedHistoryProject()) || 'Project'"
        [currentStatus]="dashboardService.selectedHistoryProject()!.status"
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

  private doc = inject(DOCUMENT);
  private tr = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  currentLang = signal<'en' | 'ar'>('en');

  // Active navigation tab signal
  currentTab = signal<'projects' | 'create-project' | 'sprint' | 'sprint-planning' | 'retrospective' | 'backlog' | 'team' | 'profile' | 'organization' | 'settings' | 'employees' | 'project-policies'>('sprint');

  // Component state

  isProjectDropdownOpen = signal(false);

  // Eager project statistics Map
  projectStatsMap = signal<Map<string, ProjectStats>>(new Map());

  // Edit Project properties
  editNameEn = '';
  editNameAr = '';
  editDescEn = '';
  editDescAr = '';


  // AI Project creation signals


  public dashboardService = inject(DashboardService);
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
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      // Extract the last segment of the dashboard route
      const segments = url.split('?')[0].split('/');
      let tab = segments.pop() || 'projects';
      if (tab === 'dashboard') tab = 'projects';

      this.currentTab.set(tab as any);
    });



    // If a PM has no projects, default to the create-project tab and open AI chat automatically
    effect(() => {
      const isPM = this.projectState.isProjectManager();
      const projCount = this.projectState.projects().length;
      const initialized = !this.projectState.loading();
      if (initialized && isPM && projCount === 0) {
        untracked(() => {
          this.router.navigate(['/dashboard', 'create-project']);
        });
      }
    });

    // Populate edit modal fields when opened from a child routed component
    effect(() => {
      const isOpen = this.dashboardService.isEditProjectModalOpen();
      const projectId = this.dashboardService.selectedEditProjectId();
      if (isOpen && projectId) {
        untracked(() => {
          const proj = this.projectState.projects().find(p => p.id === projectId);
          if (proj) {
            this.editNameEn = proj.nameEn || '';
            this.editNameAr = proj.nameAr || '';
            this.editDescEn = proj.descriptionEn || proj.description || '';
            this.editDescAr = proj.descriptionAr || proj.description || '';
            this.cdr.markForCheck();
          }
        });
      }
    });
  }
  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const tab = params.get('tab');
      if (tab && ['projects', 'create-project', 'sprint', 'sprint-planning', 'retrospective', 'backlog', 'team', 'profile', 'employees'].includes(tab)) {
        this.currentTab.set(tab as any);
      }
    });

    const savedLang = localStorage.getItem('app_lang') as 'en' | 'ar';
    if (savedLang) {
      this.currentLang.set(savedLang);
      this.applyDirection(savedLang);
    }

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
      const profileData = await this.projectState.getProfile();
      if (profileData) {
        this.userName.set(`${profileData.firstName} ${profileData.lastName}`);
        this.userJobTitle.set(profileData.jobTitle || '');
      }
    } catch (e) {
      console.warn('Failed to load profile details for sidebar:', e);
    }
  }


  onProjectSelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.projectState.setSelectedProject(select.value);
  }

  openCreateProjectPage() {
    this.router.navigate(['/dashboard', 'create-project']);
  }

  onAiChatClose() {
    this.dashboardService.isAiChatOpen.set(false);
  }

  async onDraftGenerated(event: { projectId: string; draft: any; chatId: string }) {
    this.dashboardService.isAiChatOpen.set(false);
    await this.projectState.loadProjects();
    this.projectState.setSelectedProject(event.projectId);
  }

  onTechStackAdvisorClose() {
    this.dashboardService.advisorProjectId.set(null);
  }

  async onTechStackAdvisorCompleted(projectId: string) {
    try {
      this.dashboardService.isTechStackAdvisorOpen.set(false);
      this.dashboardService.advisorProjectId.set(null);
      await this.projectState.loadProjects();
      this.projectState.setSelectedProject(projectId);
      this.toastService.show('Project created successfully', 'success');
    } catch (e) {
      console.warn('Error during tech stack completion:', e);
      this.toastService.show('Error finalizing project setup', 'error');
    } finally {
      this.currentTab.set('projects');
    }
  }

  onProjectSaved() {
    this.dashboardService.isDraftReviewOpen.set(false);
    this.projectState.loadProjects();
  }



  async onEditProjectSubmit(event: Event) {
    event.preventDefault();
    const projectId = this.dashboardService.selectedEditProjectId();
    if (!projectId) return;

    const success = await this.projectState.updateProject(
      projectId,
      this.editNameEn,
      this.editNameAr,
      this.editDescEn,
      this.editDescAr
    );
    if (success) {
      this.dashboardService.isEditProjectModalOpen.set(false);
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
    } else {
      this.toastService.show('Failed to delete project. Please try again.', 'error');
    }
  }

  async onToggleProjectStatus(projectId: string) {
    const p = this.projectState.projects().find(x => x.id === projectId);
    if (p) {
      this.dashboardService.selectedHistoryProject.set({
        id: p.id,
        nameEn: p.nameEn || 'Project',
        nameAr: p.nameAr,
        status: p.status || 'Active'
      });
      this.dashboardService.isHistoryModalOpen.set(true);
    }
  }

  closeHistoryModal() {
    this.dashboardService.isHistoryModalOpen.set(false);
    this.dashboardService.selectedHistoryProject.set(null);
  }

  onHistoryActionCompleted() {
    this.closeHistoryModal();
    this.toastService.show('Project status updated successfully', 'success');
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



  setLanguage(lang: 'en' | 'ar') {
    this.currentLang.set(lang);
    localStorage.setItem('app_lang', lang);
    this.tr.use(lang);
    this.applyDirection(lang);
  }

  toggleLanguage() {
    this.setLanguage(this.currentLang() === 'en' ? 'ar' : 'en');
  }

  getProjectName(p: any): string {
    if (!p) return '';
    return this.currentLang() === 'ar' ? (p.nameAr || p.nameEn || p.name) : (p.nameEn || p.nameAr || p.name);
  }

  getSprintName(sp: any): string {
    if (!sp) return '';
    return this.currentLang() === 'ar' ? (sp.titleAr || sp.nameAr || sp.titleEn || sp.nameEn || sp.name) : (sp.titleEn || sp.nameEn || sp.titleAr || sp.nameAr || sp.name);
  }

  private applyDirection(lang: 'en' | 'ar') {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    this.doc.documentElement.setAttribute('dir', dir);
    this.doc.documentElement.setAttribute('lang', lang);
  }
}

