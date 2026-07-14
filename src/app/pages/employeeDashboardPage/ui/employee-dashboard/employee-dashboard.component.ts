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
import { BoardComponent } from '../../../../widgets/taskBoard/ui/board/board.component';
import { CurrentProjects } from '../current-projects/current-projects';
import { ProjectHistory } from '../project-history/project-history';
import { MyProfileComponent } from '../my-profile/my-profile.component';
import { CalendarViewComponent } from '../../../dashboardPage/ui/calendar-view/calendar-view.component';

type EmployeeTab = 'sprint' | 'current-projects' | 'project-history' | 'profile' | 'calendar';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslatePipe,
    BoardComponent,
    CurrentProjects,
    ProjectHistory,
    MyProfileComponent,
    CalendarViewComponent,
  ],
  template: `
    <div
      class="min-h-screen flex transition-colors duration-300 font-dashboard"
      style="background: var(--background); color: var(--text-primary);"
      [attr.dir]="isRtl() ? 'rtl' : 'ltr'"
    >

      <!-- ══════════════════════════════════════════
           DESKTOP SIDEBAR — Glassmorphism
      ══════════════════════════════════════════ -->
      <aside class="w-64 hidden md:flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto
                    glass-sidebar transition-all duration-300 pb-4">

        <!-- Logo Block -->
        <div class="p-5 pb-3">
          <div class="flex flex-col gap-2 p-4 rounded-2xl border transition-all duration-200 hover:shadow-md"
               style="background: var(--surface); border-color: var(--border);">
            <img
              [src]="isDark() ? '/TaskPilotDarkMode.svg' : '/TaskPilotLogo.svg'"
              alt="TaskPilot"
              class="h-8 mx-auto transition-transform hover:scale-105"
            />

            <!-- Company Badge -->
            @if (projectState.companyName()) {
              <div class="text-center">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                             text-[10px] font-extrabold tracking-wide max-w-full truncate
                             border border-primary/20"
                      style="background: rgba(59,91,219,0.1); color: var(--primary);"
                      [title]="projectState.companyName()">
                  <!-- Building icon -->
                  <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                  {{ projectState.companyName() }}
                </span>
              </div>
            }

            <!-- Active project chip -->
            @if (projectState.selectedProject(); as sp) {
              <div class="pt-2 border-t flex items-center gap-2" style="border-color: var(--border);">
                <svg class="w-3 h-3 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                     style="color: var(--text-secondary);">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                </svg>
                <span class="text-[10px] font-bold truncate"
                      style="color: var(--text-secondary);"
                      [title]="sp.nameEn">
                  {{ sp.nameEn }}
                </span>
              </div>
            }
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 px-3 space-y-0.5">

          @if (projectState.selectedProject()?.status !== 'Completed' && projectState.selectedProject()?.status !== 'Archived') {
            <!-- Active Sprint -->
            <button
              (click)="activeTab.set('sprint')"
              class="group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm"
              [class.nav-item-active]="activeTab() === 'sprint'"
              [style.color]="activeTab() !== 'sprint' ? 'var(--text-secondary)' : ''"
            >
              <svg class="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"/>
              </svg>
              <span class="flex-1 text-start">{{ 'employee.nav.sprintBoard' | translate }}</span>
              <!-- Live pulse when sprint is active -->
              @if (activeTab() === 'sprint' && hasActiveSprint()) {
                <span class="w-2 h-2 rounded-full bg-success animate-pulse-dot shrink-0"
                      style="background: var(--success);"></span>
              }
            </button>
          }

          <!-- Current Projects -->
          <button
            (click)="activeTab.set('current-projects')"
            class="group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm"
            [class.nav-item-active]="activeTab() === 'current-projects'"
            [style.color]="activeTab() !== 'current-projects' ? 'var(--text-secondary)' : ''"
          >
            <svg class="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
            </svg>
            <span class="text-start">{{ 'employee.nav.currentProjects' | translate }}</span>
          </button>

          <!-- Project History -->
          <button
            (click)="activeTab.set('project-history')"
            class="group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm"
            [class.nav-item-active]="activeTab() === 'project-history'"
            [style.color]="activeTab() !== 'project-history' ? 'var(--text-secondary)' : ''"
          >
            <svg class="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-start">{{ 'employee.nav.projectHistory' | translate }}</span>
          </button>

          <!-- Calendar -->
          <button
            (click)="activeTab.set('calendar')"
            class="group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm"
            [class.nav-item-active]="activeTab() === 'calendar'"
            [style.color]="activeTab() !== 'calendar' ? 'var(--text-secondary)' : ''"
          >
            <svg class="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <span class="text-start">{{ 'calendar.title' | translate }}</span>
          </button>

          <!-- My Profile -->
          <button
            (click)="activeTab.set('profile')"
            class="group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm"
            [class.nav-item-active]="activeTab() === 'profile'"
            [style.color]="activeTab() !== 'profile' ? 'var(--text-secondary)' : ''"
          >
            <svg class="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <span class="text-start">{{ 'employee.nav.myProfile' | translate }}</span>
          </button>

          <!-- Project Switcher (if multiple projects) -->
          @if (projectState.projects().length > 1) {
            <div class="pt-3 mt-2 border-t" style="border-color: var(--border);">
              <p class="px-4 mb-2 text-[10px] font-extrabold uppercase tracking-widest"
                 style="color: var(--text-secondary);">
                {{ 'employee.nav.myProjects' | translate }}
              </p>
              @for (p of projectState.projects(); track p.id) {
                <button
                  (click)="selectProject(p.id)"
                  class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm"
                  [class.bg-primary/10]="p.id === projectState.selectedProjectId()"
                  [style.color]="p.id === projectState.selectedProjectId() ? 'var(--primary)' : 'var(--text-secondary)'"
                >
                  <div class="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white text-[10px] font-extrabold"
                       [style.background]="getProjectColor(p.id)">
                    {{ (p.nameEn || '?')[0].toUpperCase() }}
                  </div>
                  <span class="text-start truncate flex-1 text-xs font-semibold">{{ p.nameEn }}</span>
                  @if (p.id === projectState.selectedProjectId()) {
                    <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                  }
                </button>
              }
            </div>
          }
        </nav>

        <!-- Sidebar Footer — User Card & Actions -->
        <div class="px-3 pt-3 border-t mt-3 space-y-2" style="border-color: var(--border);">
          <button
            (click)="activeTab.set('profile')"
            class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 group"
            style="background: var(--surface); border-color: var(--border);"
          >
            <!-- Gradient avatar -->
            <div class="w-9 h-9 rounded-full flex items-center justify-center font-extrabold
                        text-sm text-white shrink-0 shadow-sm"
                 [style.background]="avatarGradient()">
              {{ userInitial() }}
            </div>
            <div class="min-w-0 flex-1 text-start">
              <p class="text-xs font-extrabold truncate transition-colors duration-200"
                 style="color: var(--text-primary);">{{ userName() }}</p>
              <p class="text-[10px] truncate mt-0.5" style="color: var(--text-secondary);">
                {{ userJobTitle() || ('employee.sidebar.employee' | translate) }}
              </p>
            </div>
            <!-- Online indicator -->
            <div class="w-2 h-2 rounded-full shrink-0" style="background: var(--success);"></div>
          </button>
          
          <button
            (click)="logout()"
            class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 group hover:bg-error/10"
            style="background: transparent; border-color: var(--border); color: var(--error);"
          >
            <div class="w-9 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </div>
            <span class="text-xs font-extrabold flex-1 text-start">{{ 'employee.header.logout' | translate }}</span>
          </button>
        </div>
      </aside>

      <!-- ══════════════════════════════════════════
           MAIN PANEL
      ══════════════════════════════════════════ -->
      <div class="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">

        <!-- ── STICKY HEADER ── -->
        <header class="h-16 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-30
                        border-b backdrop-blur-md transition-colors duration-200"
                style="background: rgba(var(--surface-rgb, 255,255,255), 0.9);
                       border-color: var(--border);
                       background-color: color-mix(in srgb, var(--surface) 90%, transparent);">

          <!-- Left: Mobile logo + Page title -->
          <div class="flex items-center gap-3 min-w-0">
            <div class="md:hidden shrink-0">
              <img
                [src]="isDark() ? '/TaskPilotLogoOnly1.svg' : '/TaskPilotLogoOnly.svg'"
                alt="TaskPilot" class="h-7"
              />
            </div>
            <div class="min-w-0">
              <h1 class="text-base font-extrabold font-display truncate"
                  style="color: var(--text-primary);">
                {{ pageTitle() }}
              </h1>
              <!-- Sprint badge -->
              @if (activeTab() === 'sprint' && activeSprintLabel()) {
                <p class="text-[10px] font-bold hidden sm:block"
                   style="color: var(--primary);">
                  {{ activeSprintLabel() }}
                </p>
              }
            </div>
          </div>

          <!-- Right: Toolbar -->
          <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">

            <!-- Project switcher pill (mobile) -->
            @if (projectState.projects().length > 0 && activeTab() !== 'profile') {
              <div class="relative">
                <button
                  (click)="isProjectDropdownOpen.update(v => !v)"
                  class="sm:flex hidden items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold
                         transition-all duration-200 focus:outline-none focus:ring-2 max-w-[160px]"
                  style="background: var(--background); border-color: var(--border);
                         color: var(--text-primary); --tw-ring-color: var(--primary);"
                >
                  <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                       style="color: var(--primary);">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                  </svg>
                  <span class="truncate flex-1 text-start">
                    {{ projectState.selectedProject()?.nameEn || ('employee.header.selectProject' | translate) }}
                  </span>
                  <svg class="w-3 h-3 ms-auto shrink-0 transition-transform duration-200"
                       [class.rotate-180]="isProjectDropdownOpen()"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24"
                       style="color: var(--text-secondary);">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                @if (isProjectDropdownOpen()) {
                  <div class="fixed inset-0 z-40" (click)="isProjectDropdownOpen.set(false)"></div>
                  <div class="absolute end-0 top-full mt-2 z-50 rounded-2xl border shadow-2xl
                               overflow-hidden min-w-[200px] animate-[fadeDown_0.15s_ease_both]"
                       style="background: var(--surface); border-color: var(--border);">
                    <div class="px-3 py-2 border-b" style="border-color: var(--border);">
                      <p class="text-[10px] font-bold uppercase tracking-widest"
                         style="color: var(--text-secondary);">
                        {{ 'employee.header.yourProjects' | translate }}
                      </p>
                    </div>
                    <div class="py-1 max-h-56 overflow-y-auto">
                      @for (p of projectState.projects(); track p.id) {
                        <button
                          (click)="selectProject(p.id)"
                          class="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-start
                                 transition-colors hover:bg-primary/5"
                          [class.bg-primary/8]="p.id === projectState.selectedProjectId()"
                        >
                          <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                                      text-white text-xs font-bold"
                               [style.background]="getProjectColor(p.id)">
                            {{ (p.nameEn || '?')[0].toUpperCase() }}
                          </div>
                          <span class="font-medium truncate flex-1" style="color: var(--text-primary);">
                            {{ p.nameEn }}
                          </span>
                          @if (p.id === projectState.selectedProjectId()) {
                            <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"
                                 style="color: var(--primary);">
                              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                            </svg>
                          }
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Language Switcher -->
            <div class="flex items-center gap-0.5 p-1 rounded-xl border"
                 style="background: var(--background); border-color: var(--border);">
              <button
                (click)="setLanguage('en')"
                class="px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all duration-200"
                [style.background]="currentLang() === 'en' ? 'var(--primary)' : 'transparent'"
                [style.color]="currentLang() === 'en' ? '#fff' : 'var(--text-secondary)'"
              >EN</button>
              <button
                (click)="setLanguage('ar')"
                class="px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all duration-200"
                [style.background]="currentLang() === 'ar' ? 'var(--primary)' : 'transparent'"
                [style.color]="currentLang() === 'ar' ? '#fff' : 'var(--text-secondary)'"
              >AR</button>
            </div>

            <!-- Dark / Light Toggle -->
            <button
              (click)="toggleTheme()"
              class="p-2 rounded-xl transition-all duration-200"
              style="color: var(--text-secondary);"
              [title]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              @if (isDark()) {
                <!-- Sun icon -->
                <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.364l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              } @else {
                <!-- Moon icon -->
                <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
              }
            </button>

            <!-- Logout -->
            <button
              (click)="logout()"
              class="p-2 rounded-xl transition-all duration-200"
              style="color: var(--error);"
              [title]="'employee.header.logout' | translate"
            >
              <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- ── MAIN CONTENT ── -->
        <main class="flex-1 overflow-y-auto p-4 md:p-6 xl:p-8">

          @if (projectState.loading()) {
            <!-- Loading skeleton -->
            <div class="flex items-center justify-center h-64">
              <div class="flex flex-col items-center gap-4">
                <div class="w-10 h-10 rounded-full border-4 border-t-primary animate-spin"
                     style="border-color: var(--border); border-top-color: var(--primary);"></div>
                <p class="text-sm font-semibold" style="color: var(--text-secondary);">
                  {{ 'employee.loading' | translate }}
                </p>
              </div>
            </div>

          } @else if (projectState.projects().length === 0) {
            <!-- No project assigned -->
            <div class="flex items-center justify-center h-full min-h-[50vh]">
              <div class="text-center max-w-md p-8 rounded-3xl border shadow-sm animate-[fadeUp_0.4s_ease_both]"
                   style="background: var(--surface); border-color: var(--border);">
                <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                     style="background: rgba(245,158,11,0.1);">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                       style="color: var(--warning);">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <h3 class="text-xl font-extrabold mb-2" style="color: var(--text-primary);">
                  {{ 'employee.noProject.title' | translate }}
                </h3>
                <p class="text-sm leading-6" style="color: var(--text-secondary);">
                  {{ 'employee.noProject.description' | translate }}
                </p>
              </div>
            </div>

          } @else {
            <!-- Tab content -->
            @if (activeTab() === 'sprint') {
              <div class="animate-[fadeUp_0.3s_ease_both]">
                <app-board></app-board>
              </div>

            } @else if (activeTab() === 'calendar') {
              <div class="animate-[fadeUp_0.3s_ease_both] h-[calc(100vh-140px)]">
                <app-calendar-view [isPM]="false"></app-calendar-view>
              </div>

            } @else if (activeTab() === 'current-projects') {
              <div class="animate-[fadeUp_0.3s_ease_both]">
                <app-current-projects (viewBoard)="activeTab.set('sprint')"></app-current-projects>
              </div>

            } @else if (activeTab() === 'project-history') {
              <div class="animate-[fadeUp_0.3s_ease_both]">
                <app-project-history></app-project-history>
              </div>

            } @else if (activeTab() === 'profile') {
              <div class="animate-[fadeUp_0.3s_ease_both]">
                <app-my-profile></app-my-profile>
              </div>
            }
          }
        </main>
      </div>

      <!-- ══════════════════════════════════════════
           MOBILE BOTTOM NAVIGATION
      ══════════════════════════════════════════ -->
      <div class="fixed bottom-3 start-3 end-3 z-40 md:hidden">
        <div class="border rounded-2xl shadow-2xl flex items-center justify-around py-2 px-1
                    backdrop-blur-xl"
             style="background: color-mix(in srgb, var(--surface) 80%, transparent);
                    border-color: var(--border);">

          <!-- Sprint Board -->
          <button
            (click)="activeTab.set('sprint')"
            class="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 relative"
            [class.mobile-tab-active]="activeTab() === 'sprint'"
            [style.color]="activeTab() !== 'sprint' ? 'var(--text-secondary)' : ''"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"/>
            </svg>
            <span class="text-[9px] font-bold">{{ 'employee.nav.sprint' | translate }}</span>
          </button>

          <!-- Current Projects -->
          <button
            (click)="activeTab.set('current-projects')"
            class="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 relative"
            [class.mobile-tab-active]="activeTab() === 'current-projects'"
            [style.color]="activeTab() !== 'current-projects' ? 'var(--text-secondary)' : ''"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
            </svg>
            <span class="text-[9px] font-bold">{{ 'employee.nav.current' | translate }}</span>
          </button>

          <!-- Project History -->
          <button
            (click)="activeTab.set('project-history')"
            class="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 relative"
            [class.mobile-tab-active]="activeTab() === 'project-history'"
            [style.color]="activeTab() !== 'project-history' ? 'var(--text-secondary)' : ''"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
               <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-[9px] font-bold">{{ 'employee.nav.history' | translate }}</span>
          </button>

          <!-- My Profile -->
          <button
            (click)="activeTab.set('profile')"
            class="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 relative"
            [class.mobile-tab-active]="activeTab() === 'profile'"
            [style.color]="activeTab() !== 'profile' ? 'var(--text-secondary)' : ''"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <span class="text-[9px] font-bold">{{ 'employee.nav.profile' | translate }}</span>
          </button>
        </div>
      </div>

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

  ngOnInit() {
    // Restore persisted language
    const saved = (localStorage.getItem('app_lang') ?? 'en') as 'en' | 'ar';
    this.currentLang.set(saved);
    this.tr.use(saved);
    this.applyDirection(saved);

    // Restore persisted tab
    const savedTab = localStorage.getItem('employee_tab') as EmployeeTab | null;
    if (savedTab && ['sprint', 'current-projects', 'project-history', 'profile', 'calendar'].includes(savedTab)) {
      this.activeTab.set(savedTab);
    }

    this.loadUserProfile();
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
