import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserStoryDto, mapPriorityToFrontend } from '../../../../shared/api/backlog.service';

@Component({
  selector: 'app-sprint-story-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [A11yModule, FormsModule],
  host: {
    class: 'block h-full',
    '(keydown.escape)': 'cancelled.emit()',
  },
  template: `
    <section
      class="flex h-full w-full flex-col bg-surface text-text-primary shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-picker-title"
      [dir]="lang() === 'ar' ? 'rtl' : 'ltr'"
      cdkTrapFocus
      [cdkTrapFocusAutoCapture]="true"
    >
      <header class="border-b border-border px-5 py-5 sm:px-6">
        <div class="flex items-start gap-4">
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-primary">
              {{ lang() === 'ar' ? 'تعديل نطاق السبرينت' : 'Adjust sprint scope' }}
            </p>
            <h2 id="story-picker-title" class="mt-0.5 text-xl font-extrabold tracking-tight">
              {{ lang() === 'ar' ? 'إضافة من قائمة المهام' : 'Add from backlog' }}
            </h2>
            <p class="mt-1 text-sm leading-6 text-text-secondary">
              {{
                lang() === 'ar'
                  ? 'اختر قصصاً إضافية لإدراجها في هذا السبرينت.'
                  : 'Choose additional stories to include in this sprint.'
              }}
            </p>
          </div>
          <button
            type="button"
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-text-secondary hover:bg-sidebar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            (click)="cancelled.emit()"
            [attr.aria-label]="lang() === 'ar' ? 'إغلاق قائمة القصص' : 'Close story picker'"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <label for="story-search" class="sr-only">{{
          lang() === 'ar' ? 'البحث في قصص المستخدم' : 'Search user stories'
        }}</label>
        <div class="relative mt-5">
          <svg
            class="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary"
            [class.left-3]="lang() !== 'ar'"
            [class.right-3]="lang() === 'ar'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="m21 21-4.35-4.35m2.35-5.65a8 8 0 11-16 0 8 8 0 0116 0z"
            />
          </svg>
          <input
            id="story-search"
            cdkFocusInitial
            type="search"
            [ngModel]="query()"
            (ngModelChange)="query.set($event)"
            class="h-11 w-full rounded-xl border border-border bg-background text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            [class.pl-10]="lang() !== 'ar'"
            [class.pr-3]="lang() !== 'ar'"
            [class.pr-10]="lang() === 'ar'"
            [class.pl-3]="lang() === 'ar'"
            [placeholder]="
              lang() === 'ar' ? 'ابحث بالعنوان أو الوصف' : 'Search title or description'
            "
          />
        </div>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <div class="mb-3 flex items-center justify-between text-sm">
          <span class="font-bold"
            >{{ filteredStories().length }}
            {{ lang() === 'ar' ? 'قصة متاحة' : 'available stories' }}</span
          >
          <span class="text-text-secondary"
            >{{ chosenIds().size }} {{ lang() === 'ar' ? 'محددة' : 'selected' }}</span
          >
        </div>

        <div class="space-y-2">
          @for (story of filteredStories(); track story.id) {
            <label
              class="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-sidebar p-4 transition hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="checkbox"
                class="mt-1 h-5 w-5 shrink-0 accent-primary"
                [checked]="chosenIds().has(story.id)"
                (change)="toggle(story.id)"
              />
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-bold leading-6">{{
                  lang() === 'ar' ? story.titleAr || story.titleEn : story.titleEn
                }}</span>
                @if (lang() === 'ar' ? story.descriptionAr : story.descriptionEn) {
                  <span class="mt-1 line-clamp-2 block text-sm leading-5 text-text-secondary">{{
                    lang() === 'ar' ? story.descriptionAr : story.descriptionEn
                  }}</span>
                }
                <span class="mt-2 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                  <span
                    class="rounded-full border border-border bg-surface px-2 py-0.5 font-semibold"
                    >{{ priorityLabel(story.priority) }}</span
                  >
                  <span
                    >{{ story.tasks.length }}
                    {{
                      lang() === 'ar' ? 'مهمة' : story.tasks.length === 1 ? 'task' : 'tasks'
                    }}</span
                  >
                  <span aria-hidden="true">·</span>
                  <span>{{ storyHours(story) }}h</span>
                </span>
              </span>
            </label>
          } @empty {
            <div class="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
              <svg
                class="mx-auto h-8 w-8 text-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M9.5 3A6.5 6.5 0 104 13l-2 8 8-2a6.5 6.5 0 10-.5-16z"
                />
              </svg>
              <p class="mt-3 text-sm font-bold">
                {{ lang() === 'ar' ? 'لا توجد قصص مطابقة' : 'No matching stories' }}
              </p>
              <p class="mt-1 text-sm text-text-secondary">
                {{ lang() === 'ar' ? 'جرّب عبارة بحث مختلفة.' : 'Try a different search term.' }}
              </p>
            </div>
          }
        </div>
      </div>

      <footer class="border-t border-border bg-surface px-5 py-4 sm:px-6">
        @if (chosenIds().size > 0) {
          <div
            class="mb-3 flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2 text-sm"
          >
            <span class="font-semibold">{{
              lang() === 'ar' ? 'التأثير على النطاق' : 'Scope impact'
            }}</span>
            <span class="font-extrabold text-primary">+{{ chosenHours() }}h</span>
          </div>
        }
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="min-h-11 rounded-xl border border-border px-4 text-sm font-bold text-text-secondary hover:bg-sidebar"
            (click)="cancelled.emit()"
          >
            {{ lang() === 'ar' ? 'إلغاء' : 'Cancel' }}
          </button>
          <button
            type="button"
            [disabled]="chosenIds().size === 0"
            class="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            (click)="addSelected()"
          >
            {{ lang() === 'ar' ? 'إضافة القصص' : 'Add stories' }}
            @if (chosenIds().size > 0) {
              <span>({{ chosenIds().size }})</span>
            }
          </button>
        </div>
      </footer>
    </section>
  `,
})
export class SprintStoryPickerComponent {
  stories = input<UserStoryDto[]>([]);
  selectedStoryIds = input<string[]>([]);
  lang = input<'en' | 'ar'>('en');

  storiesAdded = output<string[]>();
  cancelled = output<void>();

  query = signal('');
  chosenIds = signal<Set<string>>(new Set());

  availableStories = computed(() => {
    const selected = new Set(this.selectedStoryIds());
    return this.stories().filter((story) => !selected.has(story.id));
  });

  filteredStories = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    if (!query) return this.availableStories();
    return this.availableStories().filter((story) =>
      [story.titleEn, story.titleAr, story.descriptionEn, story.descriptionAr].some((value) =>
        value?.toLocaleLowerCase().includes(query),
      ),
    );
  });

  chosenHours = computed(() => {
    const chosen = this.chosenIds();
    return this.stories()
      .filter((story) => chosen.has(story.id))
      .reduce((total, story) => total + this.storyHours(story), 0);
  });

  toggle(storyId: string): void {
    this.chosenIds.update((current) => {
      const next = new Set(current);
      next.has(storyId) ? next.delete(storyId) : next.add(storyId);
      return next;
    });
  }

  addSelected(): void {
    if (this.chosenIds().size === 0) return;
    this.storiesAdded.emit([...this.chosenIds()]);
  }

  storyHours(story: UserStoryDto): number {
    return story.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
  }

  priorityLabel(priority: string): string {
    const mapped = mapPriorityToFrontend(priority);
    if (this.lang() === 'ar') {
      return mapped === 'High' ? 'عالية' : mapped === 'Low' ? 'منخفضة' : 'متوسطة';
    }
    return mapped;
  }
}
