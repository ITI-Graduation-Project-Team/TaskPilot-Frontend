import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, EventEmitter, Input, OnInit, Output, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiRequirementsService } from '../../../../shared/api/ai-requirements.service';
import { RecommendedStackDto, TechStackService, TechStackSuggestionDto } from '../../../../shared/api/tech-stack.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';

const PLATFORM_OPTIONS = ['Web', 'Mobile', 'Desktop', 'API'];
const PROJECT_TYPE_OPTIONS = ['ERP', 'SaaS', 'MobileApp', 'API', 'Portal', 'Other'];

type StackChoice = 'primary' | 'ideal' | 'custom';

@Component({
  selector: 'app-tech-stack-advisor-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-[fadeIn_0.18s_ease_both]">
      <section class="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl animate-[scaleUp_0.22s_ease_both]" role="dialog" aria-modal="true" aria-labelledby="tech-stack-title">
        <header class="shrink-0 border-b border-border bg-sidebar px-6 py-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-primary">Architecture gate</p>
              <h2 id="tech-stack-title" class="mt-1 text-xl font-extrabold text-text-primary font-display">Review tech stack before backlog generation</h2>
              <p class="mt-1 max-w-2xl text-sm text-text-secondary">Confirm the implementation stack first so generated user stories and tasks use the right technologies.</p>
            </div>
            <button type="button" (click)="close.emit()" class="rounded-full p-2 text-text-secondary transition-colors hover:bg-border hover:text-text-primary" aria-label="Close tech stack advisor">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="mt-5 grid grid-cols-4 gap-2 text-xs font-bold text-text-secondary">
            @for (step of flowSteps; track step; let index = $index) {
              <div class="flex items-center gap-2 rounded-xl border px-3 py-2"
                   [class.border-primary]="index <= 2"
                   [class.bg-primary-foreground]="index <= 2"
                   [class.text-primary]="index <= 2"
                   [class.border-border]="index > 2">
                <span class="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">{{ index + 1 }}</span>
                <span class="truncate">{{ step }}</span>
              </div>
            }
          </div>
        </header>

        <main class="flex-1 overflow-y-auto p-6">
          @if (isLoading()) {
            <div class="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center">
              <div class="h-10 w-10 rounded-full border-4 border-primary/15 border-t-primary animate-spin"></div>
              <p class="text-sm font-bold text-text-primary">Analyzing requirements and team skills...</p>
              <p class="max-w-sm text-xs text-text-secondary">The advisor is comparing the practical team-ready stack with the ideal architecture target.</p>
            </div>
          } @else if (errorMessage()) {
            <div class="flex min-h-[360px] flex-col items-center justify-center gap-4 text-center">
              <div class="rounded-2xl border border-error/25 bg-error/10 px-5 py-4 text-error">
                <p class="text-sm font-bold">Tech stack suggestion failed</p>
                <p class="mt-1 text-xs">{{ errorMessage() }}</p>
              </div>
              <button type="button" (click)="loadSuggestion()" class="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-hover">Try again</button>
            </div>
          } @else if (suggestion(); as suggestionData) {
            <div class="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <button type="button" (click)="selectStack('primary')" class="rounded-2xl border p-5 text-left transition-all hover:border-primary/60 hover:shadow-md"
                      [class.border-primary]="selectedChoice() === 'primary'"
                      [class.bg-primary-foreground]="selectedChoice() === 'primary'"
                      [class.border-border]="selectedChoice() !== 'primary'">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-600">Primary stack</p>
                    <h3 class="mt-1 text-base font-extrabold text-text-primary">Team-ready recommendation</h3>
                  </div>
                  @if (selectedChoice() === 'primary') {
                    <span class="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-white">Selected</span>
                  }
                </div>
                <p class="mt-3 text-sm leading-6 text-text-secondary">{{ suggestionData.primaryStack.reasoning }}</p>
                <div class="mt-4 flex flex-wrap gap-2">
                  @for (tech of suggestionData.primaryStack.techStack; track tech) {
                    <span class="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">{{ tech }}</span>
                  }
                </div>
              </button>

              <button type="button" (click)="selectStack('ideal')" class="rounded-2xl border p-5 text-left transition-all hover:border-primary/60 hover:shadow-md"
                      [class.border-primary]="selectedChoice() === 'ideal'"
                      [class.bg-primary-foreground]="selectedChoice() === 'ideal'"
                      [class.border-border]="selectedChoice() !== 'ideal'">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-indigo-600">Ideal stack</p>
                    <h3 class="mt-1 text-base font-extrabold text-text-primary">Architecture target</h3>
                  </div>
                  @if (selectedChoice() === 'ideal') {
                    <span class="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-white">Selected</span>
                  }
                </div>
                <p class="mt-3 text-sm leading-6 text-text-secondary">{{ suggestionData.idealStack.reasoning }}</p>
                <div class="mt-4 flex flex-wrap gap-2">
                  @for (tech of suggestionData.idealStack.techStack; track tech) {
                    <span class="rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">{{ tech }}</span>
                  }
                </div>
              </button>
            </div>

            <section class="mt-5 rounded-2xl border border-border bg-sidebar p-5">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary">Confirmed stack</p>
                  <h3 class="mt-1 text-base font-extrabold text-text-primary">Tune what the WBS agent will use</h3>
                </div>
                <button type="button" (click)="selectedChoice.set('custom')" class="rounded-xl border border-border px-3 py-2 text-xs font-bold text-text-secondary transition-colors hover:bg-background hover:text-text-primary">Edit as custom</button>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                @for (tech of selectedTechStack(); track tech) {
                  <span class="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background px-3 py-1.5 text-xs font-bold text-text-primary">
                    {{ tech }}
                    <button type="button" (click)="removeTech(tech)" class="text-text-secondary transition-colors hover:text-error" [attr.aria-label]="'Remove ' + tech">x</button>
                  </span>
                }
              </div>

              <form (submit)="addTech($event)" class="mt-4 flex flex-col gap-2 sm:flex-row">
                <input type="text" name="newTech" [value]="newTechInput()" (input)="newTechInput.set(newTechField.value)" #newTechField placeholder="Add technology, e.g. Redis 7"
                       class="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20">
                <button type="submit" class="rounded-xl bg-text-primary px-4 py-2.5 text-xs font-bold text-background transition-opacity hover:opacity-90">Add technology</button>
              </form>

              <div class="mt-5 border-t border-border/60 pt-5 space-y-4">
                <div>
                  <h4 class="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">Project Metadata & Description</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[10px] font-extrabold text-text-secondary uppercase mb-1">Project Name (English)</label>
                      <input type="text" [value]="projectNameEn()" (input)="projectNameEn.set(nameEnField.value)" #nameEnField
                             class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold">
                    </div>
                    <div>
                      <label class="block text-[10px] font-extrabold text-text-secondary uppercase mb-1">اسم المشروع (عربي)</label>
                      <input type="text" [value]="projectNameAr()" (input)="projectNameAr.set(nameArField.value)" #nameArField dir="rtl"
                             class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold text-right">
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[10px] font-extrabold text-text-secondary uppercase mb-1">Description (English)</label>
                    <textarea [value]="descriptionEn()" (input)="descriptionEn.set(descEnField.value)" #descEnField rows="3"
                              class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all font-medium"></textarea>
                  </div>
                  <div>
                    <label class="block text-[10px] font-extrabold text-text-secondary uppercase mb-1">الوصف (عربي)</label>
                    <textarea [value]="descriptionAr()" (input)="descriptionAr.set(descArField.value)" #descArField rows="3" dir="rtl"
                              class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all font-medium text-right"></textarea>
                  </div>
                </div>
              </div>

              <div class="mt-5 grid gap-4 lg:grid-cols-2">
                <div>
                  <label class="mb-2 block text-xs font-extrabold uppercase tracking-wider text-text-secondary">Platform targets</label>
                  <div class="flex flex-wrap gap-2">
                    @for (platform of platformOptions; track platform) {
                      <button type="button" (click)="togglePlatform(platform)" class="rounded-xl border px-3 py-2 text-xs font-bold transition-all"
                              [class.border-primary]="selectedPlatforms().includes(platform)"
                              [class.bg-primary]="selectedPlatforms().includes(platform)"
                              [class.text-white]="selectedPlatforms().includes(platform)"
                              [class.border-border]="!selectedPlatforms().includes(platform)"
                              [class.text-text-secondary]="!selectedPlatforms().includes(platform)">
                        {{ platform }}
                      </button>
                    }
                  </div>
                </div>

                <div>
                  <label class="mb-2 block text-xs font-extrabold uppercase tracking-wider text-text-secondary" for="projectType">Project type</label>
                  <select id="projectType" [ngModel]="selectedProjectType()" (ngModelChange)="selectedProjectType.set($event)" name="projectType"
                          class="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-primary/20">
                    @for (type of projectTypeOptions; track type) {
                      <option [value]="type">{{ type }}</option>
                    }
                  </select>
                </div>
              </div>
            </section>

            @if (suggestionData.gapAnalysis.length > 0) {
              <section class="mt-5 rounded-2xl border border-warning/25 bg-warning/10 p-5">
                <p class="text-xs font-extrabold uppercase tracking-[0.18em] text-warning">Gap analysis</p>
                <div class="mt-3 grid gap-2 md:grid-cols-2">
                  @for (gap of suggestionData.gapAnalysis; track gap) {
                    <p class="rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-text-primary">{{ gap }}</p>
                  }
                </div>
              </section>
            }
          }
        </main>

        <footer class="shrink-0 border-t border-border bg-sidebar px-6 py-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-xs text-text-secondary">Confirming saves the stack, then generates the product backlog with this technology context.</p>
            <div class="flex justify-end gap-3">
              <button type="button" (click)="close.emit()" [disabled]="isConfirming()" class="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-text-secondary transition-colors hover:bg-background disabled:opacity-50">Cancel</button>
              <button type="button" (click)="confirmAndGenerate()" [disabled]="isConfirmDisabled()" class="inline-flex min-w-[190px] items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-colors hover:bg-primary-hover disabled:opacity-50">
                @if (isConfirming()) {
                  <span class="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  Generating backlog...
                } @else {
                  Confirm and generate
                }
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  `,
  styles: `
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { transform: scale(0.97); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `,
})
export class TechStackAdvisorModalComponent implements OnInit {
  @Input({ required: true }) projectId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() completed = new EventEmitter<string>();

  private techStackService = inject(TechStackService);
  private aiRequirements = inject(AiRequirementsService);
  private toastService = inject(ToastService);
  private projectState = inject(ProjectStateService);

  readonly platformOptions = PLATFORM_OPTIONS;
  readonly projectTypeOptions = PROJECT_TYPE_OPTIONS;
  readonly flowSteps = ['Requirements', 'Tech stack', 'Backlog', 'Review'];

  suggestion = signal<TechStackSuggestionDto | null>(null);
  selectedChoice = signal<StackChoice>('primary');
  selectedTechStack = signal<string[]>([]);
  selectedPlatforms = signal<string[]>([]);
  selectedProjectType = signal('Other');
  newTechInput = signal('');
  isLoading = signal(false);
  isConfirming = signal(false);
  errorMessage = signal('');

  projectNameEn = signal('');
  projectNameAr = signal('');
  descriptionEn = signal('');
  descriptionAr = signal('');

  isConfirmDisabled = computed(() =>
    this.isLoading() ||
    this.isConfirming() ||
    this.selectedTechStack().length === 0 ||
    this.selectedPlatforms().length === 0 ||
    !this.selectedProjectType() ||
    !this.projectNameEn().trim() ||
    !this.projectNameAr().trim()
  );

  ngOnInit() {
    this.loadSuggestion();
  }

  async loadSuggestion() {
    if (!this.projectId) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const suggestion = await this.techStackService.suggest(this.projectId);
      this.suggestion.set(suggestion);
      this.applyStack(suggestion.primaryStack, 'primary');
      this.selectedPlatforms.set(suggestion.platformTargets?.length ? [...suggestion.platformTargets] : ['Web']);
      this.selectedProjectType.set(suggestion.projectType || 'Other');

      // Load initial metadata from projects state
      const project = this.projectState.projects().find(p => p.id === this.projectId);
      if (project) {
        this.projectNameEn.set(project.nameEn || project.name || '');
        this.projectNameAr.set(project.nameAr || '');
        this.descriptionEn.set(project.descriptionEn || project.description || 'Provide project description...');
        this.descriptionAr.set(project.descriptionAr || 'اكتب وصفاً للمشروع...');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.response?.data?.error?.message || error?.message || 'Please check the backend logs and try again.';
      this.errorMessage.set(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  selectStack(choice: StackChoice) {
    const suggestion = this.suggestion();
    if (!suggestion) return;

    if (choice === 'primary') this.applyStack(suggestion.primaryStack, choice);
    if (choice === 'ideal') this.applyStack(suggestion.idealStack, choice);
  }

  private applyStack(stack: RecommendedStackDto, choice: StackChoice) {
    this.selectedChoice.set(choice);
    this.selectedTechStack.set([...new Set(stack.techStack || [])]);
  }

  addTech(event: Event) {
    event.preventDefault();
    const value = this.newTechInput().trim();
    if (!value) return;

    this.selectedChoice.set('custom');
    this.selectedTechStack.update(stack => stack.includes(value) ? stack : [...stack, value]);
    this.newTechInput.set('');
  }

  removeTech(tech: string) {
    this.selectedChoice.set('custom');
    this.selectedTechStack.update(stack => stack.filter(item => item !== tech));
  }

  togglePlatform(platform: string) {
    this.selectedPlatforms.update(platforms =>
      platforms.includes(platform)
        ? platforms.filter(item => item !== platform)
        : [...platforms, platform]
    );
  }

  async confirmAndGenerate() {
    if (this.isConfirmDisabled()) return;

    this.isConfirming.set(true);
    try {
      // 1. Update project names and descriptions in backend
      await this.projectState.updateProject(
        this.projectId,
        this.projectNameEn(),
        this.projectNameAr(),
        this.descriptionEn(),
        this.descriptionAr()
      );

      // 2. Confirm approved tech stack and platforms
      await this.techStackService.confirm(this.projectId, {
        techStack: this.selectedTechStack(),
        platformTargets: this.selectedPlatforms(),
        projectType: this.selectedProjectType(),
      });

      // 3. Generate WBS backlog items
      await this.aiRequirements.generateWbs(this.projectId);
      
      this.toastService.show('Tech stack confirmed and backlog generated successfully.', 'success');
      this.completed.emit(this.projectId);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.response?.data?.error?.message || error?.message || 'Please check the backend logs and try again.';
      this.toastService.show(`Backlog generation failed: ${message}`, 'error');
    } finally {
      this.isConfirming.set(false);
    }
  }
}