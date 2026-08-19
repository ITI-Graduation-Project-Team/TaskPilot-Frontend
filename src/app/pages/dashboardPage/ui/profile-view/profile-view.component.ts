import { Component, ChangeDetectionStrategy, signal, inject, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiClient } from '../../../../shared/api/axios.instance';
import {
  mapSeniorityLevelToBackend,
  mapSeniorityLevelToFrontend,
  mapSkillLevelToBackend
} from '../../../../shared/api/profile.service';

interface EmployeeProfile {
  id: string;
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
  isEmployee: boolean;
  skills: string[];
}

@Component({
  selector: 'app-profile-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="space-y-6 max-w-3xl mx-auto pb-10">
      
      @if (isLoading()) {
        <div class="flex items-center justify-center p-12 bg-surface border border-border rounded-2xl shadow-sm">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            <span class="text-sm font-semibold text-text-secondary">{{ 'PROFILE.LOADING' | translate }}</span>
          </div>
        </div>
      } @else {
        
        <!-- Single Unified Profile Card -->
        <div class="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden transition-colors duration-200">
          
          <!-- Header Section -->
          <div class="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div class="flex flex-col sm:flex-row items-center gap-6">
              <div class="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-extrabold shadow-sm overflow-hidden border-2 border-border bg-background relative group">
                @if (profile()?.avatarUrl) {
                  <img [src]="profile()?.avatarUrl" alt="Avatar" class="w-full h-full object-cover" />
                } @else {
                  <div class="w-full h-full bg-gradient-to-br from-primary/15 to-primary/5 text-primary flex items-center justify-center">{{ userInitial() }}</div>
                }
              </div>
              <div class="text-center sm:text-left space-y-1.5">
                <h2 class="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">{{ profile()?.firstName }} {{ profile()?.lastName }}</h2>
                <p class="text-primary text-sm font-bold">{{ profile()?.jobTitle || ('PROFILE.TEAM_MEMBER' | translate) }}</p>
                <div class="flex items-center gap-2.5 justify-center sm:justify-start pt-2 flex-wrap">
                  <span class="px-3 py-1 text-[11px] font-extrabold tracking-widest uppercase bg-primary/10 text-primary border border-primary/20 rounded-full shadow-sm">
                    {{ profile()?.seniorityLevel }}
                  </span>
                  <span class="px-3 py-1 text-xs font-semibold bg-background text-text-secondary border border-border rounded-full flex items-center gap-1.5 shadow-sm">
                    <svg class="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"/></svg>
                    {{ profile()?.email }}
                  </span>
                  @if (profile()?.phoneNumber) {
                    <span class="px-3 py-1 text-xs font-semibold bg-background text-text-secondary border border-border rounded-full flex items-center gap-1.5 shadow-sm">
                      <svg class="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {{ profile()?.phoneNumber }}
                    </span>
                  }
                </div>
              </div>
            </div>
            
            <button (click)="openEditModal()" 
                    class="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl
                           shadow-md shadow-primary/20 transition-all duration-200 active:scale-95 text-sm whitespace-nowrap flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              {{ 'PROFILE.EDIT_PROFILE' | translate }}
            </button>
          </div>

          <!-- Divider -->
          <div class="h-px bg-border/60 mx-6 sm:mx-8"></div>

          <!-- Details Section -->
          <div class="px-6 sm:px-8 pb-8 pt-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
              
              <!-- Core Info -->
              <div class="space-y-5">
                <div class="flex items-center gap-3 pb-2 border-b border-border/40">
                  <div class="p-2 rounded-xl bg-primary/10 text-primary">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </div>
                  <h3 class="font-extrabold text-text-primary text-sm uppercase tracking-widest">{{ 'PROFILE.JOB_EXPERIENCE' | translate }}</h3>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                  <!-- Job Title Box -->
                  <div class="p-4 rounded-2xl bg-background border border-border/60 shadow-sm flex flex-col justify-center">
                    <span class="block text-[10px] uppercase font-extrabold tracking-wider text-text-secondary mb-1.5">{{ 'PROFILE.JOB_TITLE' | translate }}</span>
                    <span class="text-text-primary font-bold text-sm">{{ profile()?.jobTitle || ('PROFILE.NA' | translate) }}</span>
                  </div>

                  <!-- Seniority Box -->
                  <div class="p-4 rounded-2xl bg-background border border-border/60 shadow-sm flex flex-col justify-center">
                    <span class="block text-[10px] uppercase font-extrabold tracking-wider text-text-secondary mb-1.5">{{ 'PROFILE.SENIORITY' | translate }}</span>
                    <span class="text-primary font-bold text-sm">{{ profile()?.seniorityLevel || ('PROFILE.NA' | translate) }}</span>
                  </div>

                  @if (profile()?.isEmployee) {
                    <!-- Exp Years Box -->
                    <div class="p-4 rounded-2xl bg-background border border-border/60 shadow-sm flex flex-col justify-center">
                      <span class="block text-[10px] uppercase font-extrabold tracking-wider text-text-secondary mb-1.5">{{ 'PROFILE.EXPERIENCE_YEARS' | translate }}</span>
                      <span class="text-text-primary font-bold text-sm">{{ profile()?.totalYearsOfExperience || 0 }} {{ 'PROFILE.YEARS' | translate }}</span>
                    </div>

                    <!-- CV Box -->
                    <div class="p-4 rounded-2xl bg-background border border-border/60 shadow-sm flex flex-col justify-center">
                      <span class="block text-[10px] uppercase font-extrabold tracking-wider text-text-secondary mb-1.5">CV / Resume</span>
                      @if (profile()?.latestCvUrl) {
                        <a [href]="profile()?.latestCvUrl" target="_blank" class="inline-flex items-center gap-1.5 text-primary hover:text-primary-hover font-bold text-sm transition-colors w-fit">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          View CV
                        </a>
                      } @else {
                        <span class="text-text-secondary italic text-xs font-medium">Not uploaded</span>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Skills Card -->
              @if (profile()?.isEmployee) {
                <div class="space-y-5">
                  <div class="flex items-center gap-3 pb-2 border-b border-border/40">
                    <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    </div>
                    <h3 class="font-extrabold text-text-primary text-sm uppercase tracking-widest">{{ 'PROFILE.SKILLS' | translate }}</h3>
                  </div>
                  
                  <div class="flex flex-wrap gap-2.5 pt-1">
                    @for (skill of profile()?.skills; track skill) {
                      <span class="px-4 py-2 text-xs font-bold bg-background text-text-primary border border-border/60 rounded-xl shadow-sm hover:border-primary hover:text-primary transition-colors cursor-default">
                        {{ skill }}
                      </span>
                    } @empty {
                      <div class="w-full py-8 flex flex-col items-center justify-center text-center bg-background rounded-2xl border border-dashed border-border/80">
                        <svg class="w-10 h-10 text-text-secondary/30 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                        <span class="text-sm text-text-secondary font-medium">{{ 'PROFILE.NO_SKILLS' | translate }}</span>
                      </div>
                    }
                  </div>
                </div>
              }

            </div>
          </div>
        </div>
      }
    </div>

    <!-- Edit Profile Modal Overlay -->
    <div #profileModalPortal>
      @if (showModal()) {
      <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
        <div class="bg-surface border border-border w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col">
          <!-- Modal Header -->
          <div class="flex items-center justify-between p-5 border-b border-border shrink-0">
            <h3 class="text-xl font-extrabold text-text-primary">{{ 'PROFILE.UPDATE_SETTINGS' | translate }}</h3>
            <button (click)="closeModal()" class="p-1 text-text-secondary hover:text-text-primary hover:bg-border rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Modal Body (Scrollable) -->
          <div class="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
            
            <!-- Avatar Section -->
            <div class="flex flex-col sm:flex-row items-center gap-5 bg-background p-4 rounded-xl border border-border">
              <div class="w-20 h-20 rounded-full border border-border overflow-hidden bg-surface shrink-0 relative group">
                @if (avatarPreview()) {
                  <img [src]="avatarPreview()" alt="Avatar Preview" class="w-full h-full object-cover" />
                } @else if (profile()?.avatarUrl) {
                  <img [src]="profile()?.avatarUrl" alt="Current Avatar" class="w-full h-full object-cover" />
                } @else {
                  <div class="w-full h-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">{{ userInitial() }}</div>
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

            <!-- Personal Info Section -->
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

            <!-- Professional Info Section -->
            <div class="space-y-4">
              <h4 class="font-bold text-text-primary text-sm border-b border-border pb-2 uppercase tracking-wider">Professional Info</h4>
              
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
                @if (profile()?.isEmployee) {
                  <div>
                    <label class="block text-xs font-semibold text-text-secondary mb-1">{{ 'PROFILE.YEARS_EXP' | translate }}</label>
                    <input type="number" min="0" [(ngModel)]="editForm().totalYearsOfExperience" class="w-full px-3 py-2 text-sm border border-border bg-background text-text-primary rounded-lg focus:border-primary outline-none" />
                  </div>
                }
              </div>
            </div>

            <!-- CV Upload Section -->
            @if (profile()?.isEmployee) {
              <div class="space-y-4">
                <h4 class="font-bold text-text-primary text-sm border-b border-border pb-2 uppercase tracking-wider">Resume / CV</h4>
                <div class="flex items-center justify-center w-full">
                  <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-xl cursor-pointer bg-background hover:bg-surface transition-colors relative">
                    <input type="file" class="hidden" accept="application/pdf" (change)="onCvSelected($event)" />
                    
                    @if (cvFile()) {
                      <div class="absolute inset-0 bg-surface flex flex-col items-center justify-center rounded-xl p-4 text-center border-2 border-success/30 shadow-sm transition-all group">
                        <button (click)="removeCv($event)" class="absolute top-2 right-2 p-1.5 bg-background text-text-secondary hover:text-danger hover:bg-danger/10 rounded-full transition-colors opacity-0 group-hover:opacity-100 shadow-sm border border-border" title="Remove file">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div class="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-2">
                           <svg class="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <p class="text-sm font-bold text-text-primary truncate w-full px-4">{{ cvFile()?.name }}</p>
                        <p class="text-xs text-success font-semibold mt-1">File attached successfully</p>
                      </div>
                    } @else {
                      <div class="flex flex-col items-center justify-center w-full h-full">
                        <svg class="w-8 h-8 text-primary/70 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <p class="mb-1 text-sm text-text-secondary"><span class="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                        <p class="text-xs text-text-secondary">PDF files only (Max 10MB)</p>
                      </div>
                    }
                  </label>
                </div>
              </div>
            }

          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end space-x-3 p-5 border-t border-border shrink-0 bg-surface rounded-b-2xl">
            <button (click)="closeModal()" class="px-4 py-2 text-sm font-semibold border border-border text-text-secondary hover:text-text-primary rounded-xl transition-colors">
              {{ 'MODALS.CANCEL' | translate }}
            </button>
            <button (click)="saveProfile()" [disabled]="isSaving()" class="relative overflow-hidden px-6 py-2 text-sm font-bold bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md shadow-primary/20 transition-all disabled:opacity-80 disabled:cursor-wait flex items-center justify-center gap-2 min-w-[140px]">
              @if (isSaving()) {
                <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
                <div class="flex items-center gap-2 z-10">
                  <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Saving...
                </div>
              } @else {
                {{ 'MODALS.SAVE_CHANGES' | translate }}
              }
            </button>
          </div>
        </div>
      </div>
      }
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--tw-colors-border); border-radius: 20px; }
    .dir-rtl { direction: rtl; }
  `]
})
export class ProfileViewComponent implements OnInit, AfterViewInit, OnDestroy {
  isLoading = signal(true);
  isSaving = signal(false);
  profile = signal<EmployeeProfile | null>(null);
  userInitial = signal('U');
  private toastService = inject(ToastService);

  // Modal Signals
  showModal = signal(false);
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

  @ViewChild('profileModalPortal') private profileModalPortal?: ElementRef<HTMLElement>;

  async ngOnInit() {
    try {
      this.isLoading.set(true);
      await this.loadProfile();
    } catch (e) {
      console.error('Error loading employee profile page:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  ngAfterViewInit() {
    if (this.profileModalPortal && typeof document !== 'undefined') {
      document.body.appendChild(this.profileModalPortal.nativeElement);
    }
  }

  ngOnDestroy() {
    if (this.profileModalPortal && typeof document !== 'undefined') {
      if (this.profileModalPortal.nativeElement.parentNode) {
        this.profileModalPortal.nativeElement.parentNode.removeChild(this.profileModalPortal.nativeElement);
      }
    }
  }

  private async loadProfile() {
    const { data } = await apiClient.get<any>('/employees/profile');
    if (data.succeeded && data.data) {
      this.profile.set(data.data);
      const name = `${data.data.firstName} ${data.data.lastName}`;
      this.userInitial.set(name.trim().charAt(0).toUpperCase() || 'U');
    } else {
      this.profile.set(data);
      const name = `${data.firstName || ''} ${data.lastName || ''}`;
      this.userInitial.set(name.trim().charAt(0).toUpperCase() || 'U');
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
        seniorityLevel: mapSeniorityLevelToFrontend(p.seniorityLevel),
        totalYearsOfExperience: p.totalYearsOfExperience || 0
      });
      // Reset files
      this.avatarFile.set(null);
      this.avatarPreview.set(null);
      this.deleteAvatarSignal.set(false);
      this.cvFile.set(null);

      this.showModal.set(true);
    }
  }

  closeModal() {
    this.showModal.set(false);
    this.avatarFile.set(null);
    this.avatarPreview.set(null);
    this.deleteAvatarSignal.set(false);
    this.cvFile.set(null);
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
    }
  }

  removeCv(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.cvFile.set(null);
  }

  async saveProfile() {
    const form = this.editForm();
    if (!form.firstNameEn.trim() || !form.lastNameEn.trim()) {
      this.toastService.show('English First and Last names are required.', 'error');
      return;
    }

    try {
      this.isSaving.set(true);

      // Build FormData for PUT /employees/profile
      const formData = new FormData();
      formData.append('FirstNameEn', form.firstNameEn.trim());
      formData.append('LastNameEn', form.lastNameEn.trim());
      formData.append('FirstNameAr', form.firstNameAr.trim());
      formData.append('LastNameAr', form.lastNameAr.trim());

      if (form.phoneNumber) {
        formData.append('PhoneNumber', form.phoneNumber.trim());
      }
      if (form.jobTitle) {
        formData.append('JobTitle', form.jobTitle.trim());
      }

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
}

