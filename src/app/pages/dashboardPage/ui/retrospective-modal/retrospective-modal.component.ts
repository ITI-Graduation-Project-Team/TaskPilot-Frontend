import { Component, ChangeDetectionStrategy, signal, inject, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SprintPlanningService, SprintRetroDto } from '../../../../shared/api/sprint-planning.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { extractApiError } from '../../../../shared/api/auth.api';

@Component({
  selector: 'app-retrospective-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]"
         [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      <div class="bg-surface border border-border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-[scaleUp_0.25s_ease_both]">
        
        <!-- Header -->
        <div class="p-5 border-b border-border bg-sidebar flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-text-primary">
                {{ currentLang === 'ar' ? 'محلل الأداء الختامي للسبرنت' : 'Sprint Retrospective Analyzer' }}
              </h3>
              <p class="text-xs text-text-secondary">
                {{ currentLang === 'ar' ? 'تقرير ذكاء اصطناعي يلخص أداء الفريق، العقبات، والانطباع العام.' : 'AI feedback report summarizing team performance, delays, and sentiment.' }}
              </p>
            </div>
          </div>
          <button (click)="close.emit()" class="p-2 hover:bg-background rounded-full transition-colors text-text-secondary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          @if (isLoading()) {
            <div class="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div class="w-8 h-8 rounded-full border-3 border-primary border-t-transparent animate-spin"></div>
              <span class="text-xs font-semibold text-text-secondary">
                {{ currentLang === 'ar' ? 'يقوم الذكاء الاصطناعي بتحليل الأداء حالياً...' : 'AI is running analytical retrospect engines...' }}
              </span>
            </div>
          } @else if (!retro()) {
            <div class="flex flex-col items-center justify-center py-10 text-center space-y-4 bg-sidebar border border-border p-6 rounded-2xl">
              <svg class="w-12 h-12 text-text-secondary opacity-30 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <div class="space-y-1">
                <p class="text-sm font-bold text-text-primary">
                  {{ currentLang === 'ar' ? 'لا يوجد تقرير مراجعة بعد' : 'No retrospective generated yet' }}
                </p>
                <p class="text-xs text-text-secondary max-w-sm">
                  {{ currentLang === 'ar' 
                      ? 'لم يتم إنشاء تقرير المراجعة الختامية لهذا السبرنت المنتهي بعد.' 
                      : 'No retrospective generated yet for this completed sprint.' 
                  }}
                </p>
              </div>
              
              @if (projectState.isProjectManager()) {
                <button (click)="generateReport()" class="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all">
                  {{ currentLang === 'ar' ? 'إنشاء تقرير المراجعة بالذكاء الاصطناعي' : 'Generate AI Retrospective Report' }}
                </button>
              } @else {
                <p class="text-xs text-warning font-semibold bg-warning/10 px-3 py-1.5 rounded-lg border border-warning/20">
                  {{ currentLang === 'ar' 
                      ? 'يرجى الانتظار حتى يقوم مدير المشروع بإنشاء التقرير.' 
                      : 'Please wait until the Project Manager generates the report.' 
                  }}
                </p>
              }
            </div>
          } @else {
            
            <!-- Retro Details Grid -->
            <div class="space-y-4">
              <!-- KPI Row -->
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-primary/5 border border-primary/10 p-4 rounded-2xl text-center">
                  <span class="text-xs text-primary font-bold uppercase tracking-wider block">
                    {{ currentLang === 'ar' ? 'معدل الإنجاز' : 'Completion Rate' }}
                  </span>
                  <span class="text-text-primary text-2xl font-black mt-1 block">
                    {{ retro()?.completionRate | number:'1.0-2' }}%
                  </span>
                </div>
                <div class="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl text-center">
                  <span class="text-xs text-emerald-500 font-bold uppercase tracking-wider block">
                    {{ currentLang === 'ar' ? 'دقة التقدير' : 'Estimation Accuracy' }}
                  </span>
                  <span class="text-text-primary text-2xl font-black mt-1 block">
                    {{ retro()?.estimationAccuracy | number:'1.0-2' }}%
                  </span>
                </div>
              </div>

              <!-- Content Cards -->
              <div class="space-y-3 overflow-y-auto max-h-[40vh] pr-1">
                <div class="p-4 bg-sidebar border border-border rounded-2xl">
                  <h4 class="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1.5">
                    {{ currentLang === 'ar' ? 'ما تم إنجازه بنجاح' : 'What went well' }}
                  </h4>
                  <p class="text-xs text-text-primary leading-relaxed">
                    {{ currentLang === 'ar' ? retro()?.whatWentWellAr : retro()?.whatWentWellEn }}
                  </p>
                </div>

                <div class="p-4 bg-sidebar border border-border rounded-2xl">
                  <h4 class="text-xs font-bold text-error uppercase tracking-wider mb-1.5">
                    {{ currentLang === 'ar' ? 'التحديات والعقبات' : 'Challenges & Blockers' }}
                  </h4>
                  <p class="text-xs text-text-primary leading-relaxed">
                    {{ currentLang === 'ar' ? retro()?.challengesAr : retro()?.challengesEn }}
                  </p>
                </div>

                <div class="p-4 bg-sidebar border border-border rounded-2xl">
                  <h4 class="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1.5">
                    {{ currentLang === 'ar' ? 'خطوات العمل القادمة' : 'Action Items' }}
                  </h4>
                  <p class="text-xs text-text-primary leading-relaxed">
                    {{ currentLang === 'ar' ? retro()?.actionItemsAr : retro()?.actionItemsEn }}
                  </p>
                </div>

                <div class="p-4 bg-sidebar border border-border rounded-2xl">
                  <h4 class="text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                    {{ currentLang === 'ar' ? 'ملخص انطباع الفريق' : 'Team Sentiment Summary' }}
                  </h4>
                  <p class="text-xs text-text-primary leading-relaxed font-medium italic">
                    "{{ currentLang === 'ar' ? retro()?.teamSentimentSummaryAr : retro()?.teamSentimentSummaryEn }}"
                  </p>
                </div>
              </div>

            </div>
          }
        </div>

        <!-- Footer -->
        <div class="p-5 border-t border-border bg-sidebar flex items-center justify-end shrink-0">
          <button (click)="close.emit()" class="px-5 py-2 bg-background border border-border hover:bg-sidebar text-text-primary font-semibold rounded-xl text-xs transition-colors">
            {{ currentLang === 'ar' ? 'إغلاق' : 'Close' }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class RetrospectiveModalComponent implements OnInit {
  @Input() sprintId!: string;
  @Output() close = new EventEmitter<void>();

  private sprintService = inject(SprintPlanningService);
  private toastService = inject(ToastService);
  public projectState = inject(ProjectStateService);

  retro = signal<SprintRetroDto | null>(null);
  isLoading = signal(false);

  get currentLang(): string {
    return localStorage?.getItem('app_lang') || 'en';
  }

  async ngOnInit() {
    await this.loadRetrospective();
  }

  async loadRetrospective() {
    this.isLoading.set(true);
    try {
      const res = await this.sprintService.getRetrospective(this.sprintId);
      this.retro.set(res.data || res || null);
    } catch (e) {
      console.warn('No existing retro report found.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async generateReport() {
    this.isLoading.set(true);
    try {
      const res = await this.sprintService.generateRetrospective(this.sprintId);
      this.retro.set(res.data || res || null);
      this.toastService.show(
        this.currentLang === 'ar' ? '🎉 تم إنشاء التقرير الختامي بنجاح!' : '🎉 Retrospective report generated successfully!',
        'success'
      );
    } catch (e: any) {
      console.error(e);
      const apiError = extractApiError(e);
      const fallbackMsg = this.currentLang === 'ar' ? 'فشل إنشاء تقرير التحليل الختامي.' : 'Failed to generate retrospective analysis. Check backend server logs.';
      this.toastService.show(apiError || fallbackMsg, 'error');
    } finally {
      this.isLoading.set(false);
    }
  }
}
