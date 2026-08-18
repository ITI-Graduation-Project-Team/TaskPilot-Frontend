import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BackgroundSetupStatus, RecommendedStackDto } from '../../../../shared/api/project-setup.api';
import { NotificationHubService } from '../../../../shared/services/notification-hub.service';
import { ProjectSetupStore } from '../../../../shared/services/project-setup.store';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { ToastService } from '../../../../shared/services/toast.service';

type StackChoice = 'primary' | 'ideal';

@Component({
  selector: 'app-project-setup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe],
  host: { class: 'block min-h-full' },
  template: `
    <main class="mx-auto w-full max-w-6xl pb-12" aria-labelledby="setup-title">
      <a routerLink="/dashboard/projects"
         class="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
        <svg class="h-4 w-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        {{ 'PROJECT_SETUP.BACK_TO_PROJECTS' | translate }}
      </a>

      <header class="relative overflow-hidden rounded-3xl border border-primary/20 bg-surface p-6 shadow-sm md:p-8">
        <div class="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden="true"></div>
        <div class="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="text-[11px] font-extrabold uppercase tracking-[0.24em] text-primary">{{ 'PROJECT_SETUP.FLIGHT_PLAN' | translate }}</p>
            <h1 id="setup-title" class="mt-2 text-3xl font-extrabold tracking-tight text-text-primary font-display md:text-4xl">
              {{ store.setup()?.projectName || ('PROJECT_SETUP.PREPARING' | translate) }}
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
              {{ 'PROJECT_SETUP.INTRO' | translate }}
            </p>
          </div>
          @if (store.setup(); as setup) {
            <span class="inline-flex min-h-10 items-center gap-2 self-start rounded-full border border-border bg-sidebar px-4 text-xs font-extrabold text-text-primary md:self-auto">
              <span class="h-2.5 w-2.5 rounded-full" [class.bg-success]="setup.overallStatus === 'Ready'" [class.bg-warning]="setup.overallStatus !== 'Ready'"></span>
              {{ overallLabel() | translate }}
            </span>
          }
        </div>
      </header>

      @if (store.error()) {
        <div class="mt-5 flex items-start justify-between gap-4 rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error" role="alert">
          <p>{{ store.error() }}</p>
          <button type="button" (click)="refresh()" class="min-h-11 shrink-0 rounded-xl border border-error/30 px-4 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40">{{ 'PROJECT_SETUP.RETRY' | translate }}</button>
        </div>
      }

      @if (store.loading() && !store.setup()) {
        <section class="mt-6 grid gap-4" [attr.aria-label]="'PROJECT_SETUP.LOADING' | translate">
          @for (item of [1, 2, 3]; track item) {
            <div class="h-36 animate-pulse rounded-3xl border border-border bg-surface"></div>
          }
        </section>
      } @else if (store.setup(); as setup) {
        <ol class="setup-rail mt-6 grid gap-3 md:grid-cols-3" [attr.aria-label]="'PROJECT_SETUP.PROGRESS' | translate">
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
                <p class="font-extrabold text-text-primary">{{ step.label | translate }}</p>
                <p class="mt-1 text-xs text-text-secondary">{{ step.detail | translate }}</p>
              </div>
            </li>
          }
        </ol>

        <section class="mt-6 rounded-3xl border border-border bg-surface p-5 shadow-sm md:p-7" aria-labelledby="tech-heading">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary">{{ 'PROJECT_SETUP.STAGE_01' | translate }}</p>
              <h2 id="tech-heading" class="mt-1 text-xl font-extrabold text-text-primary font-display">{{ 'PROJECT_SETUP.CHOOSE_ARCHITECTURE' | translate }}</h2>
              <p class="mt-1 text-sm text-text-secondary">{{ 'PROJECT_SETUP.RECOMMENDATION_HINT' | translate }}</p>
            </div>
            @if (setup.techStack.status !== 'Confirmed') {
              <button type="button" (click)="regenerate()" [disabled]="store.isBusy()"
                      class="min-h-11 rounded-xl border border-border px-4 text-sm font-bold text-text-secondary transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                {{ 'PROJECT_SETUP.REGENERATE' | translate }}
              </button>
            }
          </div>

          @if (store.action() === 'suggesting' || store.action() === 'regenerating') {
            <div class="mt-6 flex min-h-32 items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5" role="status">
              <span class="h-9 w-9 shrink-0 animate-spin rounded-full border-4 border-primary/15 border-t-primary"></span>
              <div><p class="font-extrabold text-text-primary">{{ 'PROJECT_SETUP.COMPARING' | translate }}</p><p class="mt-1 text-sm text-text-secondary">{{ 'PROJECT_SETUP.EVALUATING' | translate }}</p></div>
            </div>
          } @else if (setup.techStack.status === 'Confirmed') {
            <div class="mt-6 rounded-2xl border border-success/25 bg-success/5 p-5">
              <p class="text-sm font-extrabold text-success">{{ 'PROJECT_SETUP.ARCHITECTURE_CONFIRMED' | translate }}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                @for (tech of setup.techStack.confirmedStack; track tech) {
                  <span class="rounded-full border border-success/25 bg-surface px-3 py-1.5 text-xs font-bold text-text-primary">{{ tech }}</span>
                }
              </div>
            </div>
          } @else if (setup.techStack.suggestion; as suggestion) {
            <div class="mt-6 grid gap-4 lg:grid-cols-2">
              @if (setup.teamContext.teamStackAvailable) {
                <button type="button" (click)="selectStack('primary', suggestion.primaryStack)" class="stack-option"
                        [class.stack-option--selected]="selectedChoice() === 'primary'" [attr.aria-pressed]="selectedChoice() === 'primary'">
                  <span class="flex items-center justify-between gap-3">
                    <span class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-success">{{ 'PROJECT_SETUP.TEAM_STACK' | translate }}</span>
                    @if (selectedChoice() === 'primary') { <span class="selection-badge">{{ 'PROJECT_SETUP.SELECTED' | translate }}</span> }
                  </span>
                  <strong class="mt-2 block text-lg text-text-primary">{{ 'PROJECT_SETUP.TEAM_READY' | translate }}</strong>
                  <span class="mt-2 block text-sm leading-6 text-text-secondary">{{ suggestion.primaryStack.reasoning }}</span>
                  <span class="mt-4 flex flex-wrap gap-2">
                    @for (tech of suggestion.primaryStack.techStack; track tech) { <span class="tech-chip tech-chip--team">{{ tech }}</span> }
                  </span>
                </button>
              } @else {
                <article class="stack-option stack-option--unavailable" aria-labelledby="team-stack-unavailable-title">
                  <span class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-text-secondary">{{ 'PROJECT_SETUP.TEAM_STACK' | translate }}</span>
                  <strong id="team-stack-unavailable-title" class="mt-2 block text-lg text-text-primary">{{ 'PROJECT_SETUP.ADD_TEAM_TO_UNLOCK' | translate }}</strong>
                  <p class="mt-2 text-sm leading-6 text-text-secondary">
                    @if (setup.teamContext.activeMemberCount === 0) {
                      {{ 'PROJECT_SETUP.NO_TEAM_DESC' | translate }}
                    } @else {
                      {{ 'PROJECT_SETUP.NO_SKILLS_DESC' | translate }}
                    }
                  </p>
                  <button type="button" (click)="openTeamSetup()" class="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/30 bg-surface px-4 text-sm font-extrabold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                    {{ (setup.teamContext.activeMemberCount === 0 ? 'PROJECT_SETUP.ADD_EMPLOYEES' : 'PROJECT_SETUP.REVIEW_PROFILES') | translate }}
                    <svg class="h-4 w-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18 6-6-6-6"/></svg>
                  </button>
                </article>
              }
              <button type="button" (click)="selectStack('ideal', suggestion.idealStack)" class="stack-option"
                      [class.stack-option--selected]="selectedChoice() === 'ideal'" [attr.aria-pressed]="selectedChoice() === 'ideal'">
                <span class="flex items-center justify-between gap-3">
                  <span class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary">{{ 'PROJECT_SETUP.IDEAL_STACK' | translate }}</span>
                  @if (selectedChoice() === 'ideal') { <span class="selection-badge">{{ 'PROJECT_SETUP.SELECTED' | translate }}</span> }
                </span>
                <strong class="mt-2 block text-lg text-text-primary">{{ 'PROJECT_SETUP.IDEAL_FIT' | translate }}</strong>
                <span class="mt-2 block text-sm leading-6 text-text-secondary">{{ suggestion.idealStack.reasoning }}</span>
                <span class="mt-4 flex flex-wrap gap-2">
                  @for (tech of suggestion.idealStack.techStack; track tech) { <span class="tech-chip tech-chip--ideal">{{ tech }}</span> }
                </span>
              </button>
            </div>

            @if (setup.teamContext.teamStackAvailable && suggestion.gapAnalysis.length > 0) {
              <aside class="mt-5 overflow-hidden rounded-2xl border border-warning/30 bg-warning/10" aria-labelledby="gap-analysis-heading">
                <div class="flex flex-col gap-2 border-b border-warning/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-warning">{{ 'PROJECT_SETUP.TEAM_READINESS' | translate }}</p>
                    <h3 id="gap-analysis-heading" class="mt-1 text-base font-extrabold text-text-primary">{{ 'PROJECT_SETUP.GAP_TITLE' | translate }}</h3>
                  </div>
                  <span class="inline-flex min-h-8 w-fit items-center rounded-full border border-warning/30 bg-surface px-3 text-xs font-extrabold text-text-primary">
                    {{ 'PROJECT_SETUP.GAP_COUNT' | translate: { count: suggestion.gapAnalysis.length } }}
                  </span>
                </div>
                <ul class="grid gap-px bg-warning/15 lg:grid-cols-2" [attr.aria-label]="'PROJECT_SETUP.MISSING_SKILLS_LABEL' | translate">
                  @for (gap of suggestion.gapAnalysis; track gap) {
                    <li class="bg-surface/95 px-5 py-4 text-sm leading-5 text-text-primary">
                      <div class="flex items-start gap-3">
                        <svg class="mt-0.5 h-4 w-4 shrink-0 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>
                        </svg>
                        <div class="min-w-0 flex-1">
                          <div class="flex flex-wrap items-center gap-2">
                            <strong>{{ gap.skill || gap.technology || ('PROJECT_SETUP.CAPABILITY_GAP' | translate) }}</strong>
                            <span class="gap-badge" [class.gap-badge--high]="gap.severity === 'High'">{{ severityLabel(gap.severity) | translate }}</span>
                            <span class="gap-badge">{{ gapTypeLabel(gap.gapType) | translate }}</span>
                          </div>
                          <p class="mt-2 text-text-secondary">{{ gap.summary }}</p>
                          @if (gap.requiredLevel || gap.availableLevel || gap.requiredCount) {
                            <p class="mt-2 text-xs font-bold text-text-secondary">
                              {{ 'PROJECT_SETUP.REQUIRED' | translate }}: {{ gap.requiredLevel || ('PROJECT_SETUP.NOT_SPECIFIED' | translate) }}{{ gap.requiredCount ? ' × ' + gap.requiredCount : '' }}
                              · {{ 'PROJECT_SETUP.AVAILABLE' | translate }}: {{ gap.availableLevel || ('PROJECT_SETUP.NONE' | translate) }} × {{ gap.availableCount }} ({{ gap.availableFte }} {{ 'PROJECT_SETUP.FTE' | translate }})
                            </p>
                          }
                          <p class="mt-2 text-xs font-bold text-text-primary">{{ gap.recommendation }}</p>
                        </div>
                      </div>
                    </li>
                  }
                </ul>
                <p class="px-5 py-3 text-xs leading-5 text-text-secondary">
                  {{ 'PROJECT_SETUP.GAP_HELP' | translate }}
                </p>
              </aside>
            }

            @if (setup.teamContext.teamStackAvailable && suggestion.gapAnalysis.length === 0) {
              <div class="mt-5 flex items-start gap-3 rounded-2xl border border-success/25 bg-success/5 p-4 text-sm text-text-primary" role="status">
                <svg class="mt-0.5 h-5 w-5 shrink-0 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="m5 13 4 4L19 7"/></svg>
                <div><p class="font-extrabold">{{ 'PROJECT_SETUP.NO_GAPS_TITLE' | translate }}</p><p class="mt-1 text-text-secondary">{{ 'PROJECT_SETUP.NO_GAPS_DESC' | translate }}</p></div>
              </div>
            }

            <div class="mt-5 rounded-2xl border border-border bg-sidebar p-5">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><h3 class="text-sm font-extrabold text-text-primary">{{ 'PROJECT_SETUP.STACK_TO_CONFIRM' | translate }}</h3><p class="mt-1 text-xs text-text-secondary">{{ 'PROJECT_SETUP.CONFIRM_HINT' | translate }}</p></div>
                <button type="button" (click)="toggleCustomization()" class="min-h-11 rounded-xl border border-border bg-surface px-4 text-sm font-bold text-text-secondary hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                  {{ (isCustomizing() ? 'PROJECT_SETUP.CLOSE_CUSTOMIZE' : 'PROJECT_SETUP.CUSTOMIZE') | translate }}
                </button>
              </div>
              <div class="mt-4 flex flex-wrap gap-2">
                @for (tech of selectedTechStack(); track tech) {
                  <span class="inline-flex min-h-9 items-center gap-2 rounded-full border border-primary/25 bg-surface px-3 text-xs font-bold text-text-primary">
                    {{ tech }}
                    @if (isCustomizing()) {
                      <button type="button" (click)="removeTech(tech)" class="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary hover:bg-error/10 hover:text-error" [attr.aria-label]="'PROJECT_SETUP.REMOVE_TECH' | translate: { tech: tech }">×</button>
                    }
                  </span>
                }
              </div>
              @if (isCustomizing()) {
                <form class="mt-4 flex flex-col gap-2 sm:flex-row" (submit)="addTech($event)">
                  <label class="sr-only" for="new-tech">{{ 'PROJECT_SETUP.ADD_TECH' | translate }}</label>
                  <input id="new-tech" [value]="newTech()" (input)="newTech.set(asInput($event).value)" [placeholder]="'PROJECT_SETUP.ADD_TECH_PLACEHOLDER' | translate"
                         class="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-4 text-base text-text-primary outline-none focus:ring-2 focus:ring-primary/30">
                  <button type="submit" class="min-h-11 rounded-xl bg-text-primary px-5 text-sm font-extrabold text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">{{ 'PROJECT_SETUP.ADD_TECH' | translate }}</button>
                  <button type="button" (click)="resetCustomization()" class="min-h-11 rounded-xl border border-border bg-surface px-4 text-sm font-bold text-text-secondary">{{ 'PROJECT_SETUP.RESET' | translate }}</button>
                </form>
                <p class="mt-3 text-xs text-text-secondary">{{ 'PROJECT_SETUP.CUSTOM_GAP_NOTE' | translate }}</p>
              }

              <div class="mt-6 flex justify-end">
                <button type="button" (click)="confirmStack()" [disabled]="confirmDisabled()"
                        class="min-h-12 rounded-xl bg-primary px-6 text-sm font-extrabold text-white shadow-md transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                  {{ (store.action() === 'confirming' ? 'PROJECT_SETUP.SAVING_ARCHITECTURE' : 'PROJECT_SETUP.CONFIRM_ARCHITECTURE') | translate }}
                </button>
              </div>
            </div>
          } @else {
            <div class="mt-6 rounded-2xl border border-warning/30 bg-warning/10 p-5" role="alert">
              <p class="font-extrabold text-text-primary">{{ 'PROJECT_SETUP.INCOMPLETE_TITLE' | translate }}</p>
              <p class="mt-1 text-sm text-text-secondary">{{ 'PROJECT_SETUP.INCOMPLETE_DESC' | translate }}</p>
            </div>
          }
        </section>

        <section class="mt-5 rounded-3xl border border-border bg-surface p-5 shadow-sm md:p-7" aria-labelledby="wbs-heading">
          <p class="text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary">{{ 'PROJECT_SETUP.STAGE_02' | translate }}</p>
          <h2 id="wbs-heading" class="mt-1 text-xl font-extrabold text-text-primary font-display">{{ 'PROJECT_SETUP.GENERATE_BREAKDOWN' | translate }}</h2>
          <p class="mt-1 text-sm text-text-secondary">{{ 'PROJECT_SETUP.WBS_HINT' | translate }}</p>

          @if (setup.wbs.status === 'Queued' || setup.wbs.status === 'Running') {
            <div class="mt-5 overflow-hidden rounded-2xl border border-primary/25 bg-primary/5 p-5" role="status" aria-live="polite">
              <div class="flex items-center gap-4"><span class="setup-pulse h-3 w-3 rounded-full bg-primary"></span><div><p class="font-extrabold text-text-primary">{{ (setup.wbs.status === 'Queued' ? 'PROJECT_SETUP.WAITING_WORKER' : 'PROJECT_SETUP.BUILDING_TASKS') | translate }}</p><p class="mt-1 text-sm text-text-secondary">{{ 'PROJECT_SETUP.ATTEMPT_CONTINUE' | translate: { count: setup.wbs.attemptCount || 1 } }}</p></div></div>
              <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-primary/10"><span class="progress-sweep block h-full w-1/3 rounded-full bg-primary"></span></div>
            </div>
          } @else if (setup.wbs.status === 'Succeeded') {
            <div class="mt-5 flex flex-col gap-4 rounded-2xl border border-success/25 bg-success/5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p class="font-extrabold text-success">{{ 'PROJECT_SETUP.BACKLOG_READY' | translate }}</p><p class="mt-1 text-sm text-text-secondary">{{ 'PROJECT_SETUP.CREATED_ITEMS' | translate: { stories: setup.wbs.itemsCreated, tasks: setup.wbs.secondaryItemsCreated } }}</p></div>
              <button type="button" (click)="openBacklog()" class="min-h-11 rounded-xl bg-primary px-5 text-sm font-extrabold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">{{ 'PROJECT_SETUP.OPEN_BACKLOG' | translate }}</button>
            </div>
          } @else {
            @if (setup.wbs.error) { <p class="mt-4 rounded-xl bg-error/10 p-3 text-sm text-error" role="alert">{{ setup.wbs.error }}</p> }
            <div class="mt-5 flex justify-end">
              <button type="button" (click)="generateWbs()" [disabled]="setup.techStack.status !== 'Confirmed' || store.isBusy()"
                      class="min-h-12 rounded-xl bg-primary px-6 text-sm font-extrabold text-white shadow-md hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                {{ (setup.wbs.status === 'Failed' ? 'PROJECT_SETUP.RETRY_WBS' : 'PROJECT_SETUP.GENERATE_WBS') | translate }}
              </button>
            </div>
          }
        </section>

        <section class="mt-5 rounded-3xl border border-border bg-surface p-5 shadow-sm md:p-7" aria-labelledby="skills-heading">
          <p class="text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary">{{ 'PROJECT_SETUP.STAGE_03' | translate }}</p>
          <h2 id="skills-heading" class="mt-1 text-xl font-extrabold text-text-primary font-display">{{ 'PROJECT_SETUP.MAP_SKILLS' | translate }}</h2>
          <p class="mt-1 text-sm text-text-secondary">{{ 'PROJECT_SETUP.SKILLS_HINT' | translate }}</p>
          @if (setup.skills.status === 'Queued' || setup.skills.status === 'Running') {
            <p class="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm font-bold text-text-primary" role="status">{{ 'PROJECT_SETUP.ENRICHING_TASKS' | translate }}</p>
          } @else if (setup.skills.status === 'Succeeded' && setup.skills.itemsSkipped === 0) {
            <p class="mt-5 rounded-2xl border border-success/25 bg-success/5 p-4 text-sm font-bold text-success">{{ 'PROJECT_SETUP.SKILL_MAPPING_COMPLETE' | translate }}</p>
          } @else if (setup.skills.status === 'Failed' || setup.skills.status === 'PartiallySucceeded' || setup.skills.itemsSkipped > 0) {
            <div class="mt-5 flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p class="text-sm text-text-primary">{{ 'PROJECT_SETUP.SKILL_MAPPING_WARNING' | translate }}</p>
              <button type="button" (click)="retrySkills()" [disabled]="store.isBusy()" class="min-h-11 rounded-xl border border-warning/40 px-4 text-sm font-extrabold text-text-primary disabled:opacity-50">{{ 'PROJECT_SETUP.RETRY_SKILLS' | translate }}</button>
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
    .stack-option--unavailable { border-style: dashed; background: color-mix(in srgb, var(--border) 20%, transparent); }
    .stack-option:focus-visible { outline: 2px solid color-mix(in srgb, var(--primary) 45%, transparent); outline-offset: 3px; }
    .selection-badge { border-radius: 999px; background: var(--primary); color: white; padding: .25rem .65rem; font-size: .65rem; font-weight: 800; }
    .tech-chip { display: inline-flex; min-height: 1.75rem; align-items: center; border-radius: 999px; border: 1px solid var(--border); padding: 0 .65rem; font-size: .7rem; font-weight: 800; color: var(--text-primary); }
    .tech-chip--team { border-color: color-mix(in srgb, var(--success) 30%, transparent); background: color-mix(in srgb, var(--success) 8%, transparent); }
    .tech-chip--ideal { border-color: color-mix(in srgb, var(--primary) 30%, transparent); background: color-mix(in srgb, var(--primary) 8%, transparent); }
    .gap-badge { display: inline-flex; align-items: center; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--warning) 35%, transparent); padding: .1rem .5rem; font-size: .62rem; font-weight: 800; color: var(--text-secondary); }
    .gap-badge--high { border-color: color-mix(in srgb, var(--error) 40%, transparent); color: var(--error); }
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
  private translate = inject(TranslateService);
  private initializedProject: string | null = null;

  readonly selectedChoice = signal<StackChoice>('ideal');
  readonly selectedTechStack = signal<string[]>([]);
  readonly selectedBaseStack = signal<string[]>([]);
  readonly isCustomizing = signal(false);
  readonly newTech = signal('');
  readonly confirmDisabled = computed(() => this.store.isBusy() || this.selectedTechStack().length === 0);

  constructor() {
    effect(() => {
      const setup = this.store.setup();
      if (!setup || setup.projectId === this.initializedProject || setup.techStack.status === 'Confirmed') return;
      const suggestion = setup.techStack.suggestion;
      if (!suggestion) return;
      this.initializedProject = setup.projectId;
      this.applyStack(
        setup.teamContext.teamStackAvailable ? suggestion.primaryStack : suggestion.idealStack,
        setup.teamContext.teamStackAvailable ? 'primary' : 'ideal');
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
      { label: 'PROJECT_SETUP.TECH_STACK_STEP', detail: setup.techStack.status === 'Confirmed' ? 'PROJECT_SETUP.ARCHITECTURE_LOCKED' : 'PROJECT_SETUP.REVIEW_RECOMMENDATION', state: setup.techStack.status === 'Confirmed' ? 'complete' : setup.techStack.status === 'Failed' ? 'failed' : 'active' },
      { label: 'PROJECT_SETUP.WBS_STEP', detail: this.jobLabel(setup.wbs.status), state: this.stageState(setup.wbs.status, setup.techStack.status === 'Confirmed') },
      { label: 'PROJECT_SETUP.SKILL_MAPPING_STEP', detail: this.jobLabel(setup.skills.status), state: this.stageState(setup.skills.status, setup.wbs.status === 'Succeeded') }
    ];
  });

  overallLabel = computed(() => ({
    NeedsTechStack: 'PROJECT_SETUP.STATUS_ARCHITECTURE_NEEDED', ReadyForWbs: 'PROJECT_SETUP.STATUS_READY_TO_GENERATE', WbsQueued: 'PROJECT_SETUP.STATUS_GENERATION_QUEUED',
    WbsGenerating: 'PROJECT_SETUP.STATUS_GENERATING_BACKLOG', WbsReady: 'PROJECT_SETUP.STATUS_BACKLOG_READY', EnrichingSkills: 'PROJECT_SETUP.STATUS_MAPPING_SKILLS',
    Ready: 'PROJECT_SETUP.STATUS_COMPLETE', ReadyWithWarnings: 'PROJECT_SETUP.STATUS_WARNINGS', Failed: 'PROJECT_SETUP.STATUS_ACTION_NEEDED'
  }[this.store.setup()?.overallStatus || 'NeedsTechStack']));

  asInput(event: Event): HTMLInputElement { return event.target as HTMLInputElement; }
  refresh(): void { void this.store.refresh(); }

  selectStack(choice: StackChoice, stack: RecommendedStackDto): void {
    this.isCustomizing.set(false);
    this.applyStack(stack, choice);
  }
  private applyStack(stack: RecommendedStackDto | undefined, choice: StackChoice): void {
    if (!stack) return;
    const technologies = [...new Set(stack.techStack || [])];
    this.selectedChoice.set(choice);
    this.selectedBaseStack.set(technologies);
    this.selectedTechStack.set(technologies);
  }

  toggleCustomization(): void { this.isCustomizing.update(value => !value); }
  resetCustomization(): void { this.selectedTechStack.set([...this.selectedBaseStack()]); this.newTech.set(''); }

  addTech(event: Event): void {
    event.preventDefault();
    const value = this.newTech().trim();
    if (!value) return;
    this.selectedTechStack.update(items => items.some(item => item.toLowerCase() === value.toLowerCase()) ? items : [...items, value]);
    this.newTech.set('');
  }

  removeTech(tech: string): void { this.selectedTechStack.update(items => items.filter(item => item !== tech)); }

  openTeamSetup(): void {
    const setup = this.store.setup();
    if (setup && setup.teamContext.activeMemberCount > 0) {
      void this.router.navigate(['/dashboard', 'employees']);
      return;
    }
    void this.router.navigate(['/dashboard', 'team'], {
      queryParams: {
        setupProjectId: this.projectId(),
        returnUrl: `/dashboard/projects/${this.projectId()}/setup`,
      }
    });
  }

  async regenerate(): Promise<void> {
    this.initializedProject = null;
    try { await this.store.generateSuggestion(true); } catch { this.toast.show(this.translate.instant('PROJECT_SETUP.TOAST_REGENERATE_ERROR'), 'error'); }
  }

  async confirmStack(): Promise<void> {
    if (this.confirmDisabled()) return;
    try {
      await this.store.confirmTechStack({ techStack: this.selectedTechStack() });
      this.toast.show(this.translate.instant('PROJECT_SETUP.TOAST_CONFIRM_SUCCESS'), 'success');
    } catch { this.toast.show(this.translate.instant('PROJECT_SETUP.TOAST_CONFIRM_ERROR'), 'error'); }
  }

  async generateWbs(): Promise<void> {
    try { await this.store.queueWbs(); this.toast.show(this.translate.instant('PROJECT_SETUP.TOAST_WBS_STARTED'), 'success'); }
    catch { this.toast.show(this.translate.instant('PROJECT_SETUP.TOAST_WBS_ERROR'), 'error'); }
  }

  async retrySkills(): Promise<void> {
    try { await this.store.retrySkills(); this.toast.show(this.translate.instant('PROJECT_SETUP.TOAST_SKILLS_QUEUED'), 'success'); }
    catch { this.toast.show(this.translate.instant('PROJECT_SETUP.TOAST_SKILLS_ERROR'), 'error'); }
  }

  openBacklog(): void { this.projectState.setSelectedProject(this.projectId()); void this.router.navigate(['/dashboard', 'backlog']); }

  private jobLabel(status: BackgroundSetupStatus): string {
    return ({ NotStarted: 'PROJECT_SETUP.JOB_WAITING', Queued: 'PROJECT_SETUP.JOB_QUEUED', Running: 'PROJECT_SETUP.JOB_IN_PROGRESS', Succeeded: 'PROJECT_SETUP.JOB_COMPLETE', PartiallySucceeded: 'PROJECT_SETUP.JOB_WARNINGS', Failed: 'PROJECT_SETUP.JOB_RETRY_NEEDED' })[status];
  }

  severityLabel(severity: string): string { return `PROJECT_SETUP.SEVERITY_${severity.toUpperCase()}`; }

  gapTypeLabel(gapType: string): string {
    return ({
      MissingSkill: 'PROJECT_SETUP.GAP_TYPE_MISSING_SKILL',
      ProficiencyGap: 'PROJECT_SETUP.GAP_TYPE_PROFICIENCY',
      CapacityGap: 'PROJECT_SETUP.GAP_TYPE_CAPACITY',
      Unclassified: 'PROJECT_SETUP.GAP_TYPE_UNCLASSIFIED'
    } as Record<string, string>)[gapType] || 'PROJECT_SETUP.GAP_TYPE_UNCLASSIFIED';
  }

  private stageState(status: BackgroundSetupStatus, available: boolean): 'pending' | 'active' | 'complete' | 'failed' {
    if (status === 'Succeeded' || status === 'PartiallySucceeded') return 'complete';
    if (status === 'Failed') return 'failed';
    if (status === 'Queued' || status === 'Running' || available) return 'active';
    return 'pending';
  }
}
