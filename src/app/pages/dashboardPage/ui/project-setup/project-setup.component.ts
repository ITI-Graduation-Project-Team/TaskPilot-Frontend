import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BackgroundSetupStatus, RecommendedStackDto } from '../../../../shared/api/project-setup.api';
import { NotificationHubService } from '../../../../shared/services/notification-hub.service';
import { ProjectSetupStore } from '../../../../shared/services/project-setup.store';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { ToastService } from '../../../../shared/services/toast.service';

type StackChoice = 'primary' | 'ideal' | 'custom';

@Component({
  selector: 'app-project-setup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: { class: 'block min-h-full' },
  template: `
    <main class="mx-auto w-full max-w-6xl pb-12" aria-labelledby="setup-title">
      <a routerLink="/dashboard/projects"
         class="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
        <svg class="h-4 w-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Back to projects
      </a>

      <header class="relative overflow-hidden rounded-3xl border border-primary/20 bg-surface p-6 shadow-sm md:p-8">
        <div class="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden="true"></div>
        <div class="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="text-[11px] font-extrabold uppercase tracking-[0.24em] text-primary">Project flight plan</p>
            <h1 id="setup-title" class="mt-2 text-3xl font-extrabold tracking-tight text-text-primary font-display md:text-4xl">
              {{ store.setup()?.projectName || 'Preparing project setup' }}
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
              Lock the architecture, launch backlog generation, then continue elsewhere while TaskPilot finishes the background work.
            </p>
          </div>
          @if (store.setup(); as setup) {
            <span class="inline-flex min-h-10 items-center gap-2 self-start rounded-full border border-border bg-sidebar px-4 text-xs font-extrabold text-text-primary md:self-auto">
              <span class="h-2.5 w-2.5 rounded-full" [class.bg-success]="setup.overallStatus === 'Ready'" [class.bg-warning]="setup.overallStatus !== 'Ready'"></span>
              {{ overallLabel() }}
            </span>
          }
        </div>
      </header>

      @if (store.error()) {
        <div class="mt-5 flex items-start justify-between gap-4 rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error" role="alert">
          <p>{{ store.error() }}</p>
          <button type="button" (click)="refresh()" class="min-h-11 shrink-0 rounded-xl border border-error/30 px-4 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40">Retry</button>
        </div>
      }

      @if (store.loading() && !store.setup()) {
        <section class="mt-6 grid gap-4" aria-label="Loading project setup">
          @for (item of [1, 2, 3]; track item) {
            <div class="h-36 animate-pulse rounded-3xl border border-border bg-surface"></div>
          }
        </section>
      } @else if (store.setup(); as setup) {
        <ol class="setup-rail mt-6 grid gap-3 md:grid-cols-3" aria-label="Project setup progress">
          @for (step of steps(); track step.label; let index = $index) {
            <li class="relative flex min-h-20 items-center gap-3 rounded-2xl border bg-surface p-4"
                [class.border-primary]="step.state === 'active'"
                [class.border-success]="step.state === 'complete'"
                [class.border-error]="step.state === 'failed'"
                [class.border-border]="step.state === 'pending'">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-black"
                    [class.border-primary]="step.state === 'active'" [class.text-primary]="step.state === 'active'"
                    [class.border-success]="step.state === 'complete'" [class.text-success]="step.state === 'complete'"
                    [class.border-error]="step.state === 'failed'" [class.text-error]="step.state === 'failed'"
                    [class.border-border]="step.state === 'pending'" [class.text-text-secondary]="step.state === 'pending'">
                @if (step.state === 'complete') {
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                } @else { {{ index + 1 }} }
              </span>
              <div>
                <p class="font-extrabold text-text-primary">{{ step.label }}</p>
                <p class="mt-1 text-xs text-text-secondary">{{ step.detail }}</p>
              </div>
            </li>
          }
        </ol>

        <section class="mt-6 rounded-3xl border border-border bg-surface p-5 shadow-sm md:p-7" aria-labelledby="tech-heading">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary">Stage 01</p>
              <h2 id="tech-heading" class="mt-1 text-xl font-extrabold text-text-primary font-display">Choose the architecture</h2>
              <p class="mt-1 text-sm text-text-secondary">The recommendation is cached. Regenerate only when the requirements or delivery priorities changed.</p>
            </div>
            @if (setup.techStack.status !== 'Confirmed') {
              <button type="button" (click)="regenerate()" [disabled]="store.isBusy()"
                      class="min-h-11 rounded-xl border border-border px-4 text-sm font-bold text-text-secondary transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                Regenerate suggestion
              </button>
            }
          </div>

          @if (store.action() === 'suggesting' || store.action() === 'regenerating') {
            <div class="mt-6 flex min-h-32 items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5" role="status">
              <span class="h-9 w-9 shrink-0 animate-spin rounded-full border-4 border-primary/15 border-t-primary"></span>
              <div><p class="font-extrabold text-text-primary">Comparing architecture options</p><p class="mt-1 text-sm text-text-secondary">Requirements and available company skills are being evaluated.</p></div>
            </div>
          } @else if (setup.techStack.status === 'Confirmed') {
            <div class="mt-6 rounded-2xl border border-success/25 bg-success/5 p-5">
              <p class="text-sm font-extrabold text-success">Architecture confirmed</p>
              <div class="mt-3 flex flex-wrap gap-2">
                @for (tech of setup.techStack.confirmedStack; track tech) {
                  <span class="rounded-full border border-success/25 bg-surface px-3 py-1.5 text-xs font-bold text-text-primary">{{ tech }}</span>
                }
              </div>
              <p class="mt-3 text-xs text-text-secondary">{{ setup.techStack.projectType }} · {{ setup.techStack.platforms.join(' · ') }}</p>
            </div>
          } @else if (setup.techStack.suggestion; as suggestion) {
            <div class="mt-6 grid gap-4 lg:grid-cols-2">
              <button type="button" (click)="selectStack('primary', suggestion.primaryStack)" class="stack-option"
                      [class.stack-option--selected]="selectedChoice() === 'primary'" [attr.aria-pressed]="selectedChoice() === 'primary'">
                <span class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-success">Team ready</span>
                <strong class="mt-2 block text-base text-text-primary">Primary stack</strong>
                <span class="mt-2 block text-sm leading-6 text-text-secondary">{{ suggestion.primaryStack.reasoning }}</span>
              </button>
              <button type="button" (click)="selectStack('ideal', suggestion.idealStack)" class="stack-option"
                      [class.stack-option--selected]="selectedChoice() === 'ideal'" [attr.aria-pressed]="selectedChoice() === 'ideal'">
                <span class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary">Architecture target</span>
                <strong class="mt-2 block text-base text-text-primary">Ideal stack</strong>
                <span class="mt-2 block text-sm leading-6 text-text-secondary">{{ suggestion.idealStack.reasoning }}</span>
              </button>
            </div>

            @if (suggestion.gapAnalysis.length > 0) {
              <aside class="mt-5 overflow-hidden rounded-2xl border border-warning/30 bg-warning/10" aria-labelledby="gap-analysis-heading">
                <div class="flex flex-col gap-2 border-b border-warning/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-warning">Team readiness</p>
                    <h3 id="gap-analysis-heading" class="mt-1 text-base font-extrabold text-text-primary">Capability gaps to plan for</h3>
                  </div>
                  <span class="inline-flex min-h-8 w-fit items-center rounded-full border border-warning/30 bg-surface px-3 text-xs font-extrabold text-text-primary">
                    {{ suggestion.gapAnalysis.length }} {{ suggestion.gapAnalysis.length === 1 ? 'gap' : 'gaps' }}
                  </span>
                </div>
                <ul class="grid gap-px bg-warning/15 sm:grid-cols-2" aria-label="Skills and technologies missing from the current team">
                  @for (gap of suggestion.gapAnalysis; track gap) {
                    <li class="flex min-h-14 items-start gap-3 bg-surface/95 px-5 py-4 text-sm leading-5 text-text-primary">
                      <svg class="mt-0.5 h-4 w-4 shrink-0 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>
                      </svg>
                      <span>{{ gap }}</span>
                    </li>
                  }
                </ul>
                <p class="px-5 py-3 text-xs leading-5 text-text-secondary">
                  These gaps compare the ideal architecture with current team capabilities. You can still confirm a different stack below.
                </p>
              </aside>
            }

            <div class="mt-5 rounded-2xl border border-border bg-sidebar p-5">
              <h3 class="text-sm font-extrabold text-text-primary">Stack to confirm</h3>
              <div class="mt-3 flex flex-wrap gap-2">
                @for (tech of selectedTechStack(); track tech) {
                  <span class="inline-flex min-h-9 items-center gap-2 rounded-full border border-primary/25 bg-surface px-3 text-xs font-bold text-text-primary">
                    {{ tech }}
                    <button type="button" (click)="removeTech(tech)" class="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary hover:bg-error/10 hover:text-error" [attr.aria-label]="'Remove ' + tech">×</button>
                  </span>
                }
              </div>
              <form class="mt-4 flex flex-col gap-2 sm:flex-row" (submit)="addTech($event)">
                <label class="sr-only" for="new-tech">Add technology</label>
                <input id="new-tech" [value]="newTech()" (input)="newTech.set(asInput($event).value)" placeholder="Add technology, e.g. Redis 7"
                       class="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-4 text-base text-text-primary outline-none focus:ring-2 focus:ring-primary/30">
                <button type="submit" class="min-h-11 rounded-xl bg-text-primary px-5 text-sm font-extrabold text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">Add technology</button>
              </form>

              <div class="mt-5 grid gap-5 lg:grid-cols-2">
                <fieldset>
                  <legend class="text-xs font-extrabold uppercase tracking-wider text-text-secondary">Platform targets</legend>
                  <div class="mt-2 flex flex-wrap gap-2">
                    @for (platform of platformOptions; track platform) {
                      <button type="button" (click)="togglePlatform(platform)" class="min-h-11 rounded-xl border px-4 text-sm font-bold"
                              [class.border-primary]="selectedPlatforms().includes(platform)" [class.bg-primary]="selectedPlatforms().includes(platform)" [class.text-white]="selectedPlatforms().includes(platform)"
                              [class.border-border]="!selectedPlatforms().includes(platform)" [class.text-text-secondary]="!selectedPlatforms().includes(platform)"
                              [attr.aria-pressed]="selectedPlatforms().includes(platform)">{{ platform }}</button>
                    }
                  </div>
                </fieldset>
                <div>
                  <label for="project-type" class="text-xs font-extrabold uppercase tracking-wider text-text-secondary">Project type</label>
                  <select id="project-type" [value]="selectedProjectType()" (change)="selectedProjectType.set(asSelect($event).value)"
                          class="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-4 text-base text-text-primary outline-none focus:ring-2 focus:ring-primary/30">
                    @for (type of projectTypeOptions; track type) { <option [value]="type">{{ type }}</option> }
                  </select>
                </div>
              </div>

              <div class="mt-6 flex justify-end">
                <button type="button" (click)="confirmStack()" [disabled]="confirmDisabled()"
                        class="min-h-12 rounded-xl bg-primary px-6 text-sm font-extrabold text-white shadow-md transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                  {{ store.action() === 'confirming' ? 'Saving architecture…' : 'Confirm architecture' }}
                </button>
              </div>
            </div>
          } @else {
            <div class="mt-6 rounded-2xl border border-warning/30 bg-warning/10 p-5" role="alert">
              <p class="font-extrabold text-text-primary">The architecture suggestion is incomplete</p>
              <p class="mt-1 text-sm text-text-secondary">Regenerate the recommendation to continue project setup.</p>
            </div>
          }
        </section>

        <section class="mt-5 rounded-3xl border border-border bg-surface p-5 shadow-sm md:p-7" aria-labelledby="wbs-heading">
          <p class="text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary">Stage 02</p>
          <h2 id="wbs-heading" class="mt-1 text-xl font-extrabold text-text-primary font-display">Generate the work breakdown</h2>
          <p class="mt-1 text-sm text-text-secondary">This job creates stories and tasks in the background. It is safe to leave this page after launch.</p>

          @if (setup.wbs.status === 'Queued' || setup.wbs.status === 'Running') {
            <div class="mt-5 overflow-hidden rounded-2xl border border-primary/25 bg-primary/5 p-5" role="status" aria-live="polite">
              <div class="flex items-center gap-4"><span class="setup-pulse h-3 w-3 rounded-full bg-primary"></span><div><p class="font-extrabold text-text-primary">{{ setup.wbs.status === 'Queued' ? 'Waiting for a worker' : 'Building stories and tasks' }}</p><p class="mt-1 text-sm text-text-secondary">Attempt {{ setup.wbs.attemptCount || 1 }} · You can continue working elsewhere.</p></div></div>
              <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-primary/10"><span class="progress-sweep block h-full w-1/3 rounded-full bg-primary"></span></div>
            </div>
          } @else if (setup.wbs.status === 'Succeeded') {
            <div class="mt-5 flex flex-col gap-4 rounded-2xl border border-success/25 bg-success/5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p class="font-extrabold text-success">Backlog ready</p><p class="mt-1 text-sm text-text-secondary">{{ setup.wbs.itemsCreated }} stories · {{ setup.wbs.secondaryItemsCreated }} tasks</p></div>
              <button type="button" (click)="openBacklog()" class="min-h-11 rounded-xl bg-primary px-5 text-sm font-extrabold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">Open backlog</button>
            </div>
          } @else {
            @if (setup.wbs.error) { <p class="mt-4 rounded-xl bg-error/10 p-3 text-sm text-error" role="alert">{{ setup.wbs.error }}</p> }
            <div class="mt-5 flex justify-end">
              <button type="button" (click)="generateWbs()" [disabled]="setup.techStack.status !== 'Confirmed' || store.isBusy()"
                      class="min-h-12 rounded-xl bg-primary px-6 text-sm font-extrabold text-white shadow-md hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                {{ setup.wbs.status === 'Failed' ? 'Retry WBS generation' : 'Generate WBS' }}
              </button>
            </div>
          }
        </section>

        <section class="mt-5 rounded-3xl border border-border bg-surface p-5 shadow-sm md:p-7" aria-labelledby="skills-heading">
          <p class="text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary">Stage 03</p>
          <h2 id="skills-heading" class="mt-1 text-xl font-extrabold text-text-primary font-display">Map required skills</h2>
          <p class="mt-1 text-sm text-text-secondary">TaskPilot starts this automatically after the backlog is saved.</p>
          @if (setup.skills.status === 'Queued' || setup.skills.status === 'Running') {
            <p class="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm font-bold text-text-primary" role="status">Enriching technical tasks in the background…</p>
          } @else if (setup.skills.status === 'Succeeded') {
            <p class="mt-5 rounded-2xl border border-success/25 bg-success/5 p-4 text-sm font-bold text-success">Skill mapping complete for {{ setup.skills.itemsCreated }} tasks.</p>
          } @else if (setup.skills.status === 'Failed' || setup.skills.status === 'PartiallySucceeded') {
            <div class="mt-5 flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p class="text-sm text-text-primary">The backlog is usable, but some skill mappings need another attempt.</p>
              <button type="button" (click)="retrySkills()" [disabled]="store.isBusy()" class="min-h-11 rounded-xl border border-warning/40 px-4 text-sm font-extrabold text-text-primary disabled:opacity-50">Retry skill mapping</button>
            </div>
          }
        </section>
      }
    </main>
  `,
  styles: `
    .stack-option { min-height: 11rem; border: 1px solid var(--border); border-radius: 1rem; padding: 1.25rem; text-align: left; transition: border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease; }
    .stack-option:hover { border-color: color-mix(in srgb, var(--primary) 55%, transparent); }
    .stack-option--selected { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 7%, transparent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 12%, transparent); }
    .stack-option:focus-visible { outline: 2px solid color-mix(in srgb, var(--primary) 45%, transparent); outline-offset: 3px; }
    .setup-pulse { animation: setupPulse 1.6s ease-in-out infinite; }
    .progress-sweep { animation: progressSweep 1.8s ease-in-out infinite; }
    @keyframes setupPulse { 50% { opacity: .35; transform: scale(.75); } }
    @keyframes progressSweep { from { transform: translateX(-120%); } to { transform: translateX(360%); } }
    @media (prefers-reduced-motion: reduce) { .setup-pulse, .progress-sweep, .animate-spin, .animate-pulse { animation: none !important; } }
  `
})
export class ProjectSetupComponent implements OnInit, OnDestroy {
  readonly projectId = input.required<string>();
  readonly store = inject(ProjectSetupStore);
  private router = inject(Router);
  private projectState = inject(ProjectStateService);
  private notifications = inject(NotificationHubService);
  private toast = inject(ToastService);
  private initializedProject: string | null = null;

  readonly platformOptions = ['Web', 'Mobile', 'Desktop', 'API'];
  readonly projectTypeOptions = ['ERP', 'SaaS', 'MobileApp', 'API', 'Portal', 'Other'];
  readonly selectedChoice = signal<StackChoice>('primary');
  readonly selectedTechStack = signal<string[]>([]);
  readonly selectedPlatforms = signal<string[]>([]);
  readonly selectedProjectType = signal('Other');
  readonly newTech = signal('');
  readonly confirmDisabled = computed(() => this.store.isBusy() || this.selectedTechStack().length === 0 || this.selectedPlatforms().length === 0 || !this.selectedProjectType());

  constructor() {
    effect(() => {
      const setup = this.store.setup();
      if (!setup || setup.projectId === this.initializedProject || setup.techStack.status === 'Confirmed') return;
      const suggestion = setup.techStack.suggestion;
      if (!suggestion) return;
      this.initializedProject = setup.projectId;
      this.applyStack(suggestion.primaryStack, 'primary');
      this.selectedPlatforms.set(suggestion.platformTargets?.length ? [...suggestion.platformTargets] : ['Web']);
      this.selectedProjectType.set(suggestion.projectType || 'Other');
    });

    effect(() => {
      const latest = this.notifications.notifications()[0];
      const activeProjectId = this.store.setup()?.projectId;
      if (activeProjectId && latest?.url?.includes(activeProjectId)) void this.store.refresh();
    });
  }

  ngOnInit(): void {
    this.projectState.setSelectedProject(this.projectId());
    void this.store.start(this.projectId());
  }

  ngOnDestroy(): void { this.store.stop(); }

  steps = computed(() => {
    const setup = this.store.setup();
    if (!setup) return [];
    return [
      { label: 'Tech stack', detail: setup.techStack.status === 'Confirmed' ? 'Architecture locked' : 'Review recommendation', state: setup.techStack.status === 'Confirmed' ? 'complete' : setup.techStack.status === 'Failed' ? 'failed' : 'active' },
      { label: 'WBS generation', detail: this.jobLabel(setup.wbs.status), state: this.stageState(setup.wbs.status, setup.techStack.status === 'Confirmed') },
      { label: 'Skill mapping', detail: this.jobLabel(setup.skills.status), state: this.stageState(setup.skills.status, setup.wbs.status === 'Succeeded') }
    ];
  });

  overallLabel = computed(() => ({
    NeedsTechStack: 'Architecture needed', ReadyForWbs: 'Ready to generate', WbsQueued: 'Generation queued',
    WbsGenerating: 'Generating backlog', WbsReady: 'Backlog ready', EnrichingSkills: 'Mapping skills',
    Ready: 'Setup complete', ReadyWithWarnings: 'Ready with warnings', Failed: 'Action needed'
  }[this.store.setup()?.overallStatus || 'NeedsTechStack']));

  asInput(event: Event): HTMLInputElement { return event.target as HTMLInputElement; }
  asSelect(event: Event): HTMLSelectElement { return event.target as HTMLSelectElement; }
  refresh(): void { void this.store.refresh(); }

  selectStack(choice: StackChoice, stack: RecommendedStackDto): void { this.applyStack(stack, choice); }
  private applyStack(stack: RecommendedStackDto | undefined, choice: StackChoice): void {
    if (!stack) return;
    this.selectedChoice.set(choice);
    this.selectedTechStack.set([...new Set(stack.techStack || [])]);
  }

  addTech(event: Event): void {
    event.preventDefault();
    const value = this.newTech().trim();
    if (!value) return;
    this.selectedChoice.set('custom');
    this.selectedTechStack.update(items => items.some(item => item.toLowerCase() === value.toLowerCase()) ? items : [...items, value]);
    this.newTech.set('');
  }

  removeTech(tech: string): void { this.selectedChoice.set('custom'); this.selectedTechStack.update(items => items.filter(item => item !== tech)); }
  togglePlatform(platform: string): void { this.selectedPlatforms.update(items => items.includes(platform) ? items.filter(item => item !== platform) : [...items, platform]); }

  async regenerate(): Promise<void> {
    this.initializedProject = null;
    try { await this.store.generateSuggestion(true); } catch { this.toast.show('Could not regenerate the recommendation.', 'error'); }
  }

  async confirmStack(): Promise<void> {
    if (this.confirmDisabled()) return;
    try {
      await this.store.confirmTechStack({ techStack: this.selectedTechStack(), platformTargets: this.selectedPlatforms(), projectType: this.selectedProjectType() });
      this.toast.show('Architecture confirmed. WBS generation is ready to launch.', 'success');
    } catch { this.toast.show('Could not confirm the architecture.', 'error'); }
  }

  async generateWbs(): Promise<void> {
    try { await this.store.queueWbs(); this.toast.show('WBS generation started. You can safely leave this page.', 'success'); }
    catch { this.toast.show('Could not start WBS generation.', 'error'); }
  }

  async retrySkills(): Promise<void> {
    try { await this.store.retrySkills(); this.toast.show('Skill mapping was queued again.', 'success'); }
    catch { this.toast.show('Could not retry skill mapping.', 'error'); }
  }

  openBacklog(): void { this.projectState.setSelectedProject(this.projectId()); void this.router.navigate(['/dashboard', 'backlog']); }

  private jobLabel(status: BackgroundSetupStatus): string {
    return ({ NotStarted: 'Waiting', Queued: 'Queued', Running: 'In progress', Succeeded: 'Complete', PartiallySucceeded: 'Warnings', Failed: 'Retry needed' })[status];
  }

  private stageState(status: BackgroundSetupStatus, available: boolean): 'pending' | 'active' | 'complete' | 'failed' {
    if (status === 'Succeeded' || status === 'PartiallySucceeded') return 'complete';
    if (status === 'Failed') return 'failed';
    if (status === 'Queued' || status === 'Running' || available) return 'active';
    return 'pending';
  }
}
