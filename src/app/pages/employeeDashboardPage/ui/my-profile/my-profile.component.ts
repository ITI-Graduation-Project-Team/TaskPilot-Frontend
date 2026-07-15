import {
  Component, ChangeDetectionStrategy, signal, computed, inject, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { apiClient } from '../../../../shared/api/axios.instance';
import {
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
    <section class="space-y-6 animate-[fadeUp_0.35s_ease_both]">

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
              <div class="relative w-28 h-28 rounded-[2rem] flex items-center justify-center font-extrabold text-3xl text-white shadow-xl transition-transform duration-500 group-hover:scale-105"
                   style="background: linear-gradient(135deg, var(--primary), var(--secondary, var(--primary-hover))); border: 2px solid var(--surface);">
                {{ initials() }}
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
                  <svg class="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  {{ p.email }}
                </div>
                @if (p.companyName) {
                  <div class="flex items-center gap-1.5">
                    <svg class="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    {{ p.companyName }}
                  </div>
                }
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-3 shrink-0">
              <!-- Edit is intentionally removed; profile setup happens at onboarding -->
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

    </section>
  `,
  styles: `:host { display: block; }`
})
export class MyProfileComponent implements OnInit {
  private tr = inject(TranslateService);

  loading     = signal(true);
  profile     = signal<EmployeeProfile | null>(null);

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
