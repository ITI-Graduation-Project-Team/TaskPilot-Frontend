import { Component, ChangeDetectionStrategy, signal, inject, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiRequirementsService, GeneratedProjectDTO } from '../../../../shared/api/ai-requirements.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { extractApiError } from '../../../../shared/api/auth.api';

@Component({
  selector: 'app-draft-review-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div [class.fixed]="!embedded" [class.inset-0]="!embedded" [class.z-50]="!embedded" [class.flex]="!embedded" [class.items-center]="!embedded" [class.justify-center]="!embedded" [class.p-4]="!embedded" [class.bg-black/60]="!embedded" [class.backdrop-blur-sm]="!embedded" [class.animate-[fadeIn_0.2s_ease_both]]="!embedded">
      <div class="bg-surface border border-border rounded-3xl w-full flex flex-col shadow-2xl overflow-hidden" [class.max-w-4xl]="!embedded" [class.h-[85vh]]="!embedded" [class.animate-[scaleUp_0.25s_ease_both]]="!embedded">
        
        <!-- Header -->
        <div class="p-5 border-b border-border bg-sidebar flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
              <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-text-primary">Review Generated Project Draft</h3>
              <p class="text-xs text-text-secondary">Inspect and refine milestones, tech stack, and scope before confirming.</p>
            </div>
          </div>
          <button (click)="close.emit()" class="p-2 hover:bg-border rounded-full transition-colors text-text-secondary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Editor Tabs/Form Area -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Basic Meta Info -->
          <div class="bg-sidebar border border-border p-5 rounded-2xl space-y-4">
            <h4 class="text-sm font-bold text-text-primary border-b border-border pb-2">Project Details</h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase">Project Name (English)</label>
                <input type="text" [(ngModel)]="draft.nameEn" required
                       class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
              </div>
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase">اسم المشروع (عربي)</label>
                <input type="text" [(ngModel)]="draft.nameAr" required dir="rtl"
                       class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase">Tech Stack</label>
                <input type="text" [(ngModel)]="draft.techStack" required placeholder="e.g. Angular, Node.js"
                       class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
              </div>
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase">Platform Targets</label>
                <input type="text" [(ngModel)]="draft.platformTargets" required placeholder="e.g. Web, Mobile"
                       class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
              </div>
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase">Project Type</label>
                <input type="text" [(ngModel)]="draft.projectType" required placeholder="e.g. Fitness Tracking"
                       class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase">Description (English)</label>
                <textarea [(ngModel)]="draft.descriptionEn" rows="3" required
                          class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"></textarea>
              </div>
              <div>
                <label class="block text-xs font-bold text-text-secondary mb-1.5 uppercase">الوصف (عربي)</label>
                <textarea [(ngModel)]="draft.descriptionAr" rows="3" required dir="rtl"
                          class="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"></textarea>
              </div>
            </div>
          </div>

          <!-- Milestones & User Stories preview -->
          <div class="space-y-4">
            <h4 class="text-sm font-bold text-text-primary flex items-center gap-2">
              <span>Milestones, User Stories & Tasks</span>
              <span class="text-xs bg-emerald-500/10 text-emerald-500 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/25">AI Suggested</span>
            </h4>

            @for (milestone of draft.milestones; track milestone.titleEn; let mIdx = $index) {
              <div class="border border-border rounded-2xl overflow-hidden bg-sidebar">
                <div class="p-4 bg-background border-b border-border flex items-center justify-between">
                  <div class="flex items-center gap-3 flex-1">
                    <span class="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-lg">M{{ mIdx + 1 }}</span>
                    <input type="text" [(ngModel)]="milestone.titleEn" 
                           class="bg-transparent font-bold text-sm text-text-primary outline-none focus:border-b focus:border-primary pb-0.5 flex-1">
                  </div>
                </div>

                <div class="p-4 space-y-4">
                  @for (story of milestone.userStories; track story.titleEn; let sIdx = $index) {
                    <div class="pl-4 border-l-2 border-primary/20 space-y-2">
                      <div class="flex items-center gap-2">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-primary">User Story:</span>
                        <input type="text" [(ngModel)]="story.titleEn" 
                               class="bg-transparent text-sm font-semibold text-text-primary outline-none focus:border-b focus:border-primary pb-0.5 flex-1">
                      </div>

                      <!-- Tasks -->
                      <div class="pl-4 space-y-1.5">
                        @for (task of story.tasks; track task.titleEn) {
                          <div class="flex items-center gap-2 text-xs text-text-secondary bg-background/50 p-2 rounded-lg border border-border/50">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <input type="text" [(ngModel)]="task.titleEn" 
                                   class="bg-transparent text-xs text-text-secondary outline-none focus:border-b focus:border-primary pb-0.5 flex-1">
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

        </div>

        <!-- Footer -->
        <div class="p-5 border-t border-border bg-sidebar shrink-0 flex items-center justify-end gap-3">
          <button (click)="close.emit()" class="px-5 py-2.5 border border-border text-text-secondary hover:text-text-primary rounded-xl font-semibold transition-all">
            Cancel
          </button>
          <button (click)="onConfirmSave()" 
                  [disabled]="isSaving()"
                  class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
            @if (isSaving()) {
              <div class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              Persisting Workspace...
            } @else {
              Confirm & Save Project
            }
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
export class DraftReviewModalComponent implements OnInit {
  @Input() draft!: GeneratedProjectDTO;
  @Input() chatId!: string;
  @Input() embedded: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() projectSaved = new EventEmitter<void>();

  private aiRequirements = inject(AiRequirementsService);
  private projectState = inject(ProjectStateService);
  private toastService = inject(ToastService);

  isSaving = signal(false);

  ngOnInit() {
  }

  async onConfirmSave() {
    this.isSaving.set(true);
    try {
      // Force reload projects reactively
      await this.projectState.loadProjects();
      
      this.projectSaved.emit();
    } catch (e) {
      console.error(e);
      this.toastService.show(extractApiError(e) || 'Failed to save project. Ensure the backend is running and details are valid.', 'error');
    } finally {
      this.isSaving.set(false);
    }
  }
}
