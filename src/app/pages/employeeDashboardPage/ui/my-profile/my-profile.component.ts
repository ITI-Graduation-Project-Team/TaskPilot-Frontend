import {
  Component, ChangeDetectionStrategy, signal, computed, inject, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { apiClient } from '../../../../shared/api/axios.instance';
import { ToastService } from '../../../../shared/services/toast.service';
import {
  ProfileService,
  SkillDetails,
  mapSkillLevelToFrontend,
  mapSeniorityLevelToFrontend,
  mapSkillLevelToBackend,
  mapSeniorityLevelToBackend
} from '../../../../shared/api/profile.service';

interface Skill {
  name: string;
  level: string;
  yearsOfExperience: number;
  isPrimary: boolean;
}

interface EmployeeProfile {
  firstName: string;
  lastName: string;
  firstNameAr?: string;
  lastNameAr?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  latestCvUrl?: string;
  email: string;
  jobTitle: string;
  seniorityLevel: string;
  totalYearsOfExperience: number;
  skills: Skill[];
  companyName?: string;
}

@Component({
  selector: 'app-my-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <section class="space-y-6 animate-[fadeUp_0.35s_ease_both] pb-10 relative">

      @if (loading()) {
        <!-- Profile Skeleton -->
        <div class="rounded-3xl border p-6 space-y-5" style="background: var(--surface); border-color: var(--border);">
          <div class="flex items-center gap-5">
            <div class="w-20 h-20 rounded-2xl shimmer shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-5 w-48 rounded-lg shimmer"></div>
              <div class="h-3.5 w-32 rounded-lg shimmer"></div>
              <div class="h-3 w-24 rounded-lg shimmer"></div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-4">
            @for (i of [1,2,3]; track i) {
              <div class="h-16 rounded-2xl shimmer"></div>
            }
          </div>
        </div>

      } @else if (profile(); as p) {
        <!-- ── HERO PROFILE CARD ── -->
        <div class="relative rounded-[2rem] border overflow-hidden shadow-sm animate-[fadeUp_0.3s_ease_both]"
             style="background: var(--surface); border-color: var(--border);">

          <!-- Premium Gradient Header Strip -->
          <div class="absolute inset-x-0 top-0 h-32 opacity-20 pointer-events-none" 
               style="background: linear-gradient(to bottom, var(--primary), transparent);"></div>

          <div class="relative px-6 sm:px-10 pt-10 pb-8 flex flex-col md:flex-row items-center md:items-start gap-8">
            
            <!-- Glowing Avatar -->
            <div class="relative shrink-0 group">
              <div class="absolute -inset-1 rounded-[2rem] blur-md opacity-30 group-hover:opacity-60 transition-opacity duration-500" 
                   style="background: var(--primary);"></div>
              <div class="relative w-28 h-28 rounded-[2rem] flex items-center justify-center font-extrabold text-3xl text-white shadow-xl transition-transform duration-500 group-hover:scale-105 overflow-hidden"
                   style="background: linear-gradient(135deg, var(--primary), var(--secondary, var(--primary-hover))); border: 2px solid var(--surface);">
                @if (p.avatarUrl) {
                  <img [src]="p.avatarUrl" alt="Avatar" class="w-full h-full object-cover" />
                } @else {
                  {{ initials() }}
                }
              </div>
              <div class="absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 flex items-center justify-center"
                   style="background: var(--success); border-color: var(--surface);" title="Online">
              </div>
            </div>

            <!-- Profile Details -->
            <div class="flex-1 text-center md:text-start space-y-1">
              <div class="flex flex-col md:flex-row items-center gap-3 mb-1">
                <h2 class="text-3xl font-extrabold font-display tracking-tight" style="color: var(--text-primary);">
                  {{ p.firstName }} {{ p.lastName }}
                </h2>
                <!-- Seniority Badge -->
                <span class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase shadow-sm"
                      [style.background]="getSeniorityBg(p.seniorityLevel)"
                      [style.color]="getSeniorityColor(p.seniorityLevel)">
                  {{ p.seniorityLevel }}
                </span>
              </div>
              
              <p class="text-base font-semibold" style="color: var(--primary);">
                {{ p.jobTitle || ('employee.profile.noJobTitle' | translate) }}
              </p>
              
              <div class="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-sm font-medium" style="color: var(--text-secondary);">
                <div class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"/></svg>
                  {{ p.email }}
                </div>
                @if (p.phoneNumber) {
                  <div class="flex items-center gap-1.5">
                    <svg class="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {{ p.phoneNumber }}
                  </div>
                }
                @if (p.companyName) {
                  <div class="flex items-center gap-1.5">
                    <svg class="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    {{ p.companyName }}
                  </div>
                }
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              @if (p.latestCvUrl) {
                <a [href]="p.latestCvUrl" target="_blank"
                   class="px-4 py-2.5 bg-background border border-border text-primary font-bold text-sm rounded-xl hover:bg-primary/5 transition-colors flex items-center gap-2">
                   <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                   View CV
                </a>
              }
              <button (click)="openEditModal()"
                      class="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-md shadow-primary/20 transition-transform active:scale-95 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Edit Profile
              </button>
            </div>
          </div>

          <!-- Stat pills row -->
          <div class="px-6 sm:px-10 pb-10">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <!-- Total Years -->
              <div class="relative overflow-hidden rounded-2xl p-5 border group transition-all duration-300 hover:shadow-md"
                   style="background: var(--sidebar); border-color: var(--border);">
                <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                  <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm1-8h4v2h-6V7h2v5z"/></svg>
                </div>
                <p class="text-xs font-bold uppercase tracking-widest mb-2" style="color: var(--text-secondary);">
                  {{ 'employee.profile.yearsExp' | translate }}
                </p>
                <div class="flex items-baseline gap-1">
                  <span class="text-3xl font-extrabold font-display" style="color: var(--primary);">
                    {{ p.totalYearsOfExperience }}
                  </span>
                  <span class="text-sm font-bold" style="color: var(--text-secondary);">
                    {{ 'employee.profile.years' | translate }}
                  </span>
                </div>
              </div>

              <!-- Skills count -->
              <div class="relative overflow-hidden rounded-2xl p-5 border group transition-all duration-300 hover:shadow-md"
                   style="background: var(--sidebar); border-color: var(--border);">
                <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                  <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <p class="text-xs font-bold uppercase tracking-widest mb-2" style="color: var(--text-secondary);">
                  {{ 'employee.profile.skills' | translate }}
                </p>
                <div class="flex items-baseline gap-1">
                  <span class="text-3xl font-extrabold font-display" style="color: var(--text-primary);">
                    {{ p.skills.length }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── SKILLS SECTION ── -->
        <div class="rounded-[2rem] border p-8 shadow-sm" style="background: var(--surface); border-color: var(--border);">
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
              </div>
              <h3 class="text-xl font-extrabold font-display" style="color: var(--text-primary);">
                {{ 'employee.profile.skillsTitle' | translate }}
              </h3>
            </div>
            <span class="text-xs font-extrabold px-3 py-1.5 rounded-full border shadow-sm"
                  style="background: var(--background); border-color: var(--border); color: var(--text-secondary);">
              {{ p.skills.length }} {{ 'employee.profile.skills' | translate }}
            </span>
          </div>

          @if (p.skills.length === 0) {
            <div class="flex flex-col items-center justify-center py-16 text-center bg-background rounded-3xl border border-dashed" style="border-color: var(--border);">
              <svg class="w-12 h-12 mb-4 opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm1-8h4v2h-6V7h2v5z"/></svg>
              <p class="text-sm font-bold" style="color: var(--text-secondary);">
                {{ 'employee.profile.noSkills' | translate }}
              </p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (skill of p.skills; track skill.name; let i = $index) {
                <div class="group flex items-center p-4 rounded-2xl border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-[fadeUp_0.3s_ease_both]"
                     [style.animation-delay]="(i * 50) + 'ms'"
                     style="background: var(--background); border-color: var(--border);">
                  
                  <!-- Left icon/years -->
                  <div class="flex flex-col items-center justify-center w-14 h-14 rounded-xl shrink-0 border me-4"
                       style="background: var(--surface); border-color: var(--border);">
                    <span class="text-base font-extrabold" style="color: var(--primary);">{{ skill.yearsOfExperience }}</span>
                    <span class="text-[9px] font-bold uppercase tracking-wider" style="color: var(--text-secondary);">Yrs</span>
                  </div>

                  <!-- Center Content -->
                  <div class="flex-1 min-w-0 flex flex-col justify-center">
                    <div class="flex items-center gap-2 mb-1.5">
                      <span class="text-sm font-bold truncate" style="color: var(--text-primary);">
                        {{ skill.name }}
                      </span>
                      @if (skill.isPrimary) {
                        <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" style="color: var(--warning);" title="Primary Skill">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      }
                    </div>
                    
                    <!-- Progress bar -->
                    <div class="h-1.5 w-full rounded-full overflow-hidden" style="background: var(--border);">
                      <div class="h-full rounded-full transition-all duration-1000 ease-out"
                           [style.width]="getSkillWidth(skill.level)"
                           [style.background]="getSkillLevelColor(skill.level)">
                      </div>
                    </div>
                  </div>

                  <!-- Level Badge -->
                  <div class="ms-4 shrink-0">
                    <span class="text-[10px] font-extrabold px-2.5 py-1 rounded-full border shadow-sm"
                          [style.background]="getSkillLevelBg(skill.level)"
                          [style.color]="getSkillLevelColor(skill.level)"
                          [style.border-color]="getSkillLevelBorder(skill.level)">
                      {{ skill.level }}
                    </span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

      } @else {
        <!-- Error/no data state -->
        <div class="flex flex-col items-center justify-center py-20 rounded-3xl border"
             style="background: var(--surface); border-color: var(--border);">
          <svg class="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
               style="color: var(--text-secondary);">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <p class="font-bold text-sm" style="color: var(--text-secondary);">
            {{ 'employee.profile.loadError' | translate }}
          </p>
        </div>
      }

      <!-- ── EDIT PROFILE MODAL ── -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div class="bg-surface border border-border w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col">
            
            <div class="flex items-center justify-between p-5 border-b border-border shrink-0">
              <h3 class="text-xl font-extrabold text-text-primary">{{ 'PROFILE.UPDATE_SETTINGS' | translate }}</h3>
              <button (click)="closeModal()" class="p-1 text-text-secondary hover:text-text-primary hover:bg-border rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
              
              <!-- Avatar Upload -->
              <div class="flex flex-col sm:flex-row items-center gap-5 bg-background p-4 rounded-xl border border-border">
                <div class="w-20 h-20 rounded-full border border-border overflow-hidden bg-surface shrink-0 relative group">
                  @if (avatarPreview()) {
                    <img [src]="avatarPreview()" alt="Avatar Preview" class="w-full h-full object-cover" />
                  } @else if (profile()?.avatarUrl && !deleteAvatarSignal()) {
                    <img [src]="profile()?.avatarUrl" alt="Current Avatar" class="w-full h-full object-cover" />
                  } @else {
                    <div class="w-full h-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">{{ initials() }}</div>
                  }
                  
                  <label class="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <input type="file" class="hidden" accept="image/png, image/jpeg, image/webp" (change)="onAvatarSelected($event)" />
                  </label>
                </div>
                <div>
                  <h4 class="font-bold text-text-primary text-sm">Profile Picture</h4>
                  <p class="text-xs text-text-secondary mt-1">Upload a new avatar (JPEG, PNG). Max size 2MB.</p>
                  @if (avatarFile()) {
                    <p class="text-xs text-primary font-medium mt-1">Selected: {{ avatarFile()?.name }}</p>
                  }
                  
                  <div class="mt-2 flex items-center gap-3">
                    <button (click)="removeAvatar()" class="text-xs font-semibold text-danger hover:text-danger/80 transition-colors flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Remove Avatar
                    </button>
                  </div>
                </div>
              </div>

              <!-- Personal Info -->
              <div class="space-y-4">
                <h4 class="font-bold text-text-primary text-sm border-b border-border pb-2 uppercase tracking-wider">Personal Info</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-text-secondary mb-1">First Name (English)</label>
                    <input type="text" [(ngModel)]="editForm().firstNameEn" class="w-full px-3 py-2 text-sm border border-border bg-background text-text-primary rounded-lg focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-text-secondary mb-1">Last Name (English)</label>
                    <input type="text" [(ngModel)]="editForm().lastNameEn" class="w-full px-3 py-2 text-sm border border-border bg-background text-text-primary rounded-lg focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-text-secondary mb-1">الاسم الأول (عربي)</label>
                    <input type="text" [(ngModel)]="editForm().firstNameAr" class="w-full px-3 py-2 text-sm border border-border bg-background text-text-primary rounded-lg focus:border-primary outline-none dir-rtl" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-text-secondary mb-1">الاسم الأخير (عربي)</label>
                    <input type="text" [(ngModel)]="editForm().lastNameAr" class="w-full px-3 py-2 text-sm border border-border bg-background text-text-primary rounded-lg focus:border-primary outline-none dir-rtl" />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="block text-xs font-semibold text-text-secondary mb-1">Phone Number</label>
                    <input type="tel" [(ngModel)]="editForm().phoneNumber" class="w-full px-3 py-2 text-sm border border-border bg-background text-text-primary rounded-lg focus:border-primary outline-none" placeholder="+1234567890" />
                  </div>
                </div>
              </div>

              <!-- Professional Info -->
              <div class="space-y-4">
                <h4 class="font-bold text-text-primary text-sm border-b border-border pb-2 uppercase tracking-wider">Professional Info</h4>
                
                <!-- Proactive Validation Warning -->
                <div class="bg-warning/10 border-l-4 border-warning p-4 rounded-r-lg mb-4">
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h5 class="text-sm font-bold text-warning-foreground">{{ 'PROFILE.VALIDATION_WARNING_TITLE' | translate }}</h5>
                      <p class="text-xs text-warning-foreground/80 mt-1">
                        {{ 'PROFILE.VALIDATION_WARNING_BODY' | translate }}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-text-secondary mb-1">{{ 'PROFILE.JOB_TITLE' | translate }}</label>
                  <input type="text" [(ngModel)]="editForm().jobTitle" class="w-full px-3 py-2 text-sm border border-border bg-background text-text-primary rounded-lg focus:border-primary outline-none" />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-text-secondary mb-1">{{ 'PROFILE.SENIORITY' | translate }}</label>
                    <select [(ngModel)]="editForm().seniorityLevel" class="w-full px-3 py-2 text-sm border border-border bg-background text-text-primary rounded-lg focus:border-primary outline-none">
                      <option value="Junior">{{ 'PROFILE.LEVELS.JUNIOR' | translate }}</option>
                      <option value="MidLevel">{{ 'PROFILE.LEVELS.MID' | translate }}</option>
                      <option value="Senior">{{ 'PROFILE.LEVELS.SENIOR' | translate }}</option>
                      <option value="Lead">{{ 'PROFILE.LEVELS.LEAD' | translate }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-text-secondary mb-1">{{ 'PROFILE.YEARS_EXP' | translate }}</label>
                    <input type="number" min="0" [(ngModel)]="editForm().totalYearsOfExperience" class="w-full px-3 py-2 text-sm border border-border bg-background text-text-primary rounded-lg focus:border-primary outline-none" />
                  </div>
                </div>
              </div>

              <!-- CV Upload -->
              <div class="space-y-4">
                <h4 class="font-bold text-text-primary text-sm border-b border-border pb-2 uppercase tracking-wider">Resume / CV</h4>
                <div class="flex items-center justify-center w-full">
                  <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-xl cursor-pointer bg-background hover:bg-surface transition-colors relative">
                    <div class="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg class="w-8 h-8 text-primary/70 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      <p class="mb-1 text-sm text-text-secondary"><span class="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                      <p class="text-xs text-text-secondary">PDF files only (Max 10MB)</p>
                    </div>
                    <input type="file" class="hidden" accept="application/pdf" (change)="onCvSelected($event)" />
                    
                    @if (cvExtractionLoading()) {
                      <div class="absolute inset-0 bg-background/95 flex flex-col items-center justify-center rounded-xl p-4 text-center z-10 border border-primary/50 shadow-sm">
                        <svg class="animate-spin h-8 w-8 text-primary mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p class="text-sm font-bold text-primary">Extracting Skills via AI...</p>
                      </div>
                    } @else if (cvFile()) {
                      <div class="absolute inset-0 bg-background/95 flex flex-col items-center justify-center rounded-xl p-4 text-center border border-success/30 shadow-sm">
                        <svg class="w-8 h-8 text-success mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p class="text-sm font-bold text-text-primary truncate w-full px-4">{{ cvFile()?.name }}</p>
                        <p class="text-xs text-text-secondary mt-1">Ready to upload</p>
                      </div>
                    }
                  </label>
                </div>
              </div>

              <!-- Extracted Skills Review -->
              @if (extractedSkills().length > 0) {
                <div class="space-y-4 pt-4 border-t border-border mt-6 animate-fade-in">


                  <div class="flex items-center justify-between border-b border-border pb-2">
                    <h4 class="font-bold text-text-primary text-sm uppercase tracking-wider">AI Extracted Skills</h4>
                    <span class="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">{{ extractedSkills().length }} Found</span>
                  </div>
                  <div class="bg-surface border border-border rounded-xl p-4 shadow-sm">
                    <div class="flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pe-2">
                      @for (skill of extractedSkills(); track skill.name; let i = $index) {
                        <div class="flex flex-wrap items-center gap-3 p-3 bg-background border border-border rounded-lg group hover:border-primary/30 transition-colors">
                          
                          <!-- Primary Star -->
                          <button (click)="setPrimaryExtractedSkill(i)" class="shrink-0 transition-colors" [title]="skill.isPrimary ? 'Primary Skill' : 'Set as Primary'">
                            <svg class="w-5 h-5" [ngClass]="skill.isPrimary ? 'text-warning' : 'text-text-secondary opacity-30 hover:opacity-100'" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          </button>
                          
                          <!-- Name -->
                          <span class="text-sm font-bold flex-1 min-w-[120px] text-text-primary">{{ skill.name }}</span>
                          
                          <!-- Level -->
                          <select [(ngModel)]="skill.level" class="text-xs px-2 py-1.5 border border-border bg-surface text-text-primary rounded-md outline-none focus:border-primary">
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Expert">Expert</option>
                          </select>
                          
                          <!-- Years -->
                          <div class="flex items-center gap-1 border border-border rounded-md bg-surface px-2 py-1.5">
                            <input type="number" min="0" [(ngModel)]="skill.yearsOfExperience" class="w-10 text-xs bg-transparent outline-none text-center text-text-primary" />
                            <span class="text-[10px] uppercase text-text-secondary font-bold">Yrs</span>
                          </div>

                          <!-- Remove -->
                          <button (click)="removeExtractedSkill(i)" class="text-text-secondary hover:text-danger p-1 rounded-md transition-colors shrink-0">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      }
                    </div>
                    
                    <!-- Add Skill -->
                    <div class="mt-4 flex gap-2 pt-4 border-t border-border/50">
                      <input type="text" [(ngModel)]="newSkill" (keyup.enter)="addExtractedSkill()" placeholder="Add missing skill manually..." class="flex-1 px-3 py-2 text-sm border border-border bg-background text-text-primary rounded-lg focus:border-primary outline-none" />
                      <button (click)="addExtractedSkill()" class="px-4 py-2 bg-background border border-border text-text-secondary hover:text-text-primary hover:bg-surface text-sm font-bold rounded-lg transition-colors flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              }

            </div>

            <div class="flex items-center justify-end space-x-3 p-5 border-t border-border shrink-0 bg-surface rounded-b-2xl">
              <button (click)="closeModal()" class="px-4 py-2 text-sm font-semibold border border-border text-text-secondary hover:text-text-primary rounded-xl transition-colors">
                {{ 'MODALS.CANCEL' | translate }}
              </button>
              <button (click)="saveProfile()" [disabled]="isSaving()" class="px-6 py-2 text-sm font-bold bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                @if (isSaving()) {
                  <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Saving...
                } @else {
                  {{ 'MODALS.SAVE_CHANGES' | translate }}
                }
              </button>
            </div>
          </div>
        </div>
      }

    </section>
  `,
  styles: [`
    :host { display: block; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--tw-colors-border); border-radius: 20px; }
    .dir-rtl { direction: rtl; }
  `]
})
export class MyProfileComponent implements OnInit {
  private tr = inject(TranslateService);
  private toastService = inject(ToastService);
  private profileService = inject(ProfileService);

  loading     = signal(true);
  isSaving    = signal(false);
  profile     = signal<EmployeeProfile | null>(null);

  showModal   = signal(false);
  editForm = signal({
    firstNameEn: '',
    lastNameEn: '',
    firstNameAr: '',
    lastNameAr: '',
    phoneNumber: '',
    jobTitle: '',
    seniorityLevel: 'MidLevel',
    totalYearsOfExperience: 0
  });

  avatarFile = signal<File | null>(null);
  avatarPreview = signal<string | null>(null);
  deleteAvatarSignal = signal(false);
  cvFile = signal<File | null>(null);
  cvExtractionLoading = signal(false);
  extractedSkills = signal<SkillDetails[]>([]);
  newSkill = signal<string>('');

  initials = computed(() => {
    const p = this.profile();
    if (!p) return 'E';
    return `${p.firstName.charAt(0)}${p.lastName.charAt(0)}`.toUpperCase();
  });

  ngOnInit() { this.loadProfile(); }

  private async loadProfile() {
    try {
      const { data } = await apiClient.get<any>('/employees/profile');
      const raw = data.data ?? data;
      if (!raw) { this.loading.set(false); return; }

      this.profile.set({
        firstName: raw.firstName ?? '',
        lastName:  raw.lastName ?? '',
        firstNameAr: raw.firstNameAr ?? '',
        lastNameAr:  raw.lastNameAr ?? '',
        phoneNumber: raw.phoneNumber ?? '',
        avatarUrl: raw.avatarUrl,
        latestCvUrl: raw.latestCvUrl,
        email:     raw.email ?? '',
        jobTitle:  raw.jobTitle ?? '',
        companyName: raw.companyName ?? '',
        seniorityLevel: mapSeniorityLevelToFrontend(raw.seniorityLevel ?? 2),
        totalYearsOfExperience:  raw.totalYearsOfExperience ?? 0,
        skills: (raw.skills ?? []).map((s: any, index: number) => {
          if (typeof s === 'string') {
            return {
              name: s,
              level: 'Intermediate',
              yearsOfExperience: raw.totalYearsOfExperience ?? 1,
              isPrimary: index === 0
            };
          }
          return {
            name:                s.name ?? '',
            level:               mapSkillLevelToFrontend(s.level ?? 1),
            yearsOfExperience:   s.yearsOfExperience ?? 0,
            isPrimary:           s.isPrimary ?? false,
          };
        }),
      });
    } catch (e) {
      console.warn('[MyProfile] Failed to load profile:', e);
    } finally {
      this.loading.set(false);
    }
  }

  openEditModal() {
    const p = this.profile();
    if (p) {
      this.editForm.set({
        firstNameEn: p.firstName || '',
        lastNameEn: p.lastName || '',
        firstNameAr: p.firstNameAr || '',
        lastNameAr: p.lastNameAr || '',
        phoneNumber: p.phoneNumber || '',
        jobTitle: p.jobTitle || '',
        seniorityLevel: p.seniorityLevel || 'MidLevel',
        totalYearsOfExperience: p.totalYearsOfExperience || 0
      });
      this.avatarFile.set(null);
      this.avatarPreview.set(null);
      this.cvFile.set(null);
      
      this.showModal.set(true);
    }
  }

  closeModal() {
    if (!this.isSaving()) {
      this.showModal.set(false);
      this.avatarFile.set(null);
      this.avatarPreview.set(null);
      this.deleteAvatarSignal.set(false);
      this.cvFile.set(null);
      this.extractedSkills.set([]);
      this.cvExtractionLoading.set(false);
    }
  }

  onAvatarSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.toastService.show('Avatar size must be less than 2MB', 'error');
        return;
      }
      this.avatarFile.set(file);
      this.deleteAvatarSignal.set(false);
      const reader = new FileReader();
      reader.onload = () => this.avatarPreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  removeAvatar() {
    this.avatarFile.set(null);
    this.avatarPreview.set(null);
    this.deleteAvatarSignal.set(true);
  }

  onCvSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        this.toastService.show('Please upload a valid PDF file.', 'error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        this.toastService.show('CV size must be less than 10MB', 'error');
        return;
      }
      this.cvFile.set(file);

      // Trigger AI Extraction
      this.cvExtractionLoading.set(true);
      this.extractedSkills.set([]);
      
      this.profileService.uploadCV(file).subscribe({
        next: (res) => {
          this.cvExtractionLoading.set(false);
          if (res.succeeded && res.data) {
            // Overwrite form fields only if they are currently empty or default
            this.editForm.update(current => ({
              ...current,
              jobTitle: current.jobTitle || (res.data.jobTitle ?? ''),
              seniorityLevel: current.seniorityLevel === 'MidLevel' ? mapSeniorityLevelToFrontend(res.data.seniorityLevel) : current.seniorityLevel,
              totalYearsOfExperience: current.totalYearsOfExperience === 0 ? (res.data.totalYearsOfExperience ?? 0) : current.totalYearsOfExperience
            }));

            let mapped = (res.data.skills || []).map((s: any) => ({
              name: s.name,
              level: mapSkillLevelToFrontend(s.level),
              yearsOfExperience: s.yearsOfExperience || 1,
              confidenceScore: s.confidenceScore || 1.0,
              isPrimary: s.isPrimary || false
            }));

            // Ensure exactly one primary skill is selected
            if (mapped.length > 0) {
              const primaryCount = mapped.filter((s: any) => s.isPrimary).length;
              if (primaryCount !== 1) {
                mapped.forEach((s: any) => s.isPrimary = false);
                mapped[0].isPrimary = true;
              }
            }
            
            this.extractedSkills.set(mapped);
            this.toastService.show('🎉 CV Extracted Successfully! Please review your skills below.', 'success');
          } else {
            this.toastService.show(res.message || 'CV Extraction Failed.', 'error');
          }
        },
        error: (err) => {
          this.cvExtractionLoading.set(false);
          this.toastService.show('CV Extraction Failed. Please try again.', 'error');
          console.error(err);
        }
      });
    }
  }

  // ── Extracted Skills Actions ──
  removeExtractedSkill(index: number) {
    this.extractedSkills.update(current => {
      const wasPrimary = current[index].isPrimary;
      const newSkills = [...current];
      newSkills.splice(index, 1);
      if (wasPrimary && newSkills.length > 0) {
        newSkills[0].isPrimary = true;
      }
      return newSkills;
    });
  }

  addExtractedSkill() {
    const skillName = this.newSkill().trim();
    if (skillName) {
      this.extractedSkills.update(current => {
        if (!current.some(s => s.name.toLowerCase() === skillName.toLowerCase())) {
          const isFirst = current.length === 0;
          const newSkillDetail: SkillDetails = {
            name: skillName,
            level: 'Intermediate',
            yearsOfExperience: 1,
            confidenceScore: 1.0,
            isPrimary: isFirst
          };
          return [...current, newSkillDetail];
        }
        return current;
      });
      this.newSkill.set('');
    }
  }

  setPrimaryExtractedSkill(index: number) {
    this.extractedSkills.update(current => {
      return current.map((s, i) => ({ ...s, isPrimary: i === index }));
    });
  }

  async saveProfile() {
    const form = this.editForm();
    if (!form.firstNameEn.trim() || !form.lastNameEn.trim()) {
      this.toastService.show('English First and Last names are required.', 'error');
      return;
    }

    try {
      this.isSaving.set(true);
      
      // Step 1: If a new CV was uploaded and extracted, confirm the skills first
      if (this.cvFile() && this.extractedSkills().length > 0) {
        const confirmData = {
          jobTitle: form.jobTitle,
          seniorityLevel: mapSeniorityLevelToBackend(form.seniorityLevel),
          totalYearsOfExperience: form.totalYearsOfExperience,
          skills: this.extractedSkills().map(s => ({
            name: s.name,
            level: mapSkillLevelToBackend(s.level),
            yearsOfExperience: s.yearsOfExperience || 1,
            isPrimary: s.isPrimary || false
          }))
        };

        try {
          await new Promise<void>((resolve, reject) => {
            this.profileService.confirmProfile(confirmData).subscribe({
              next: () => resolve(),
              error: (err) => reject(err)
            });
          });
        } catch (err) {
          this.isSaving.set(false);
          this.toastService.show('Failed to confirm extracted skills. Please try again.', 'error');
          return;
        }
      }

      // Step 2: Upload CV file and save personal info
      const formData = new FormData();
      formData.append('FirstNameEn', form.firstNameEn.trim());
      formData.append('LastNameEn', form.lastNameEn.trim());
      
      if (form.firstNameAr) formData.append('FirstNameAr', form.firstNameAr.trim());
      if (form.lastNameAr) formData.append('LastNameAr', form.lastNameAr.trim());
      if (form.phoneNumber) formData.append('PhoneNumber', form.phoneNumber.trim());
      
      formData.append('JobTitle', form.jobTitle.trim());
      formData.append('SeniorityLevel', mapSeniorityLevelToBackend(form.seniorityLevel).toString());
      formData.append('TotalYearsOfExperience', form.totalYearsOfExperience.toString());

      if (this.avatarFile()) {
        formData.append('Avatar', this.avatarFile()!);
      }
      if (this.deleteAvatarSignal()) {
        formData.append('DeleteAvatar', 'true');
      }
      
      if (this.cvFile()) {
        formData.append('CvFile', this.cvFile()!);
      }

      const response = await apiClient.put('/employees/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.succeeded) {
        this.toastService.show('🎉 Profile updated successfully!', 'success');
        this.closeModal();
        await this.loadProfile();
      } else {
        this.toastService.show(response.data.message || 'Failed to update profile details.', 'error');
      }

    } catch (err) {
      console.error('Failed to update profile settings:', err);
      this.toastService.show('Failed to update profile details.', 'error');
    } finally {
      this.isSaving.set(false);
    }
  }

  // ── Style helpers ────────────────────────────
  getSeniorityColor(level: string): string {
    const m: Record<string, string> = {
      Junior: '#22C55E', MidLevel: '#3B82F6', Senior: '#6366F1', Lead: '#8B5CF6'
    };
    return m[level] ?? '#94A3B8';
  }

  getSeniorityBg(level: string): string {
    const m: Record<string, string> = {
      Junior: 'rgba(34,197,94,0.12)',
      MidLevel: 'rgba(59,130,246,0.12)',
      Senior: 'rgba(99,102,241,0.12)',
      Lead: 'rgba(139,92,246,0.12)',
    };
    return m[level] ?? 'rgba(148,163,184,0.12)';
  }

  getSkillLevelColor(level: string): string {
    const m: Record<string, string> = {
      Beginner: '#94A3B8', Intermediate: '#3B82F6', Advanced: '#6366F1', Expert: '#8B5CF6'
    };
    return m[level] ?? '#94A3B8';
  }

  getSkillLevelBg(level: string): string {
    const m: Record<string, string> = {
      Beginner: 'rgba(148,163,184,0.12)',
      Intermediate: 'rgba(59,130,246,0.12)',
      Advanced: 'rgba(99,102,241,0.12)',
      Expert: 'rgba(139,92,246,0.12)',
    };
    return m[level] ?? 'rgba(148,163,184,0.12)';
  }

  getSkillLevelBorder(level: string): string {
    const m: Record<string, string> = {
      Beginner: 'rgba(148,163,184,0.3)',
      Intermediate: 'rgba(59,130,246,0.3)',
      Advanced: 'rgba(99,102,241,0.3)',
      Expert: 'rgba(139,92,246,0.3)',
    };
    return m[level] ?? 'rgba(148,163,184,0.3)';
  }

  getSkillWidth(level: string): string {
    const m: Record<string, string> = {
      Beginner: '25%', Intermediate: '55%', Advanced: '80%', Expert: '100%'
    };
    return m[level] ?? '50%';
  }
}
