import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import {
  BacklogService,
  UserStoryDto,
  UserStoryPayload,
  mapPriorityToFrontend,
} from '../../../../shared/api/backlog.service';
import { parseApiError } from '../../../../shared/api/api-error';

interface StoryEditorModel {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  acceptanceCriteriaEn: string;
  acceptanceCriteriaAr: string;
  priority: 'Low' | 'Medium' | 'High';
}

@Component({
  selector: 'app-sprint-story-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [A11yModule, FormField],
  host: {
    class: 'block h-full',
    '(keydown.escape)': 'requestClose()',
  },
  template: `
    <aside
      class="flex h-full w-full flex-col bg-surface text-text-primary shadow-2xl"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="'story-editor-title'"
      [dir]="lang() === 'ar' ? 'rtl' : 'ltr'"
      cdkTrapFocus
      [cdkTrapFocusAutoCapture]="true"
    >
      <header class="flex items-start gap-4 border-b border-border px-5 py-5 sm:px-6">
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
              d="M16.862 3.487a2.25 2.25 0 113.182 3.182L8.25 18.463 3 21l2.537-5.25L16.862 3.487z"
            />
          </svg>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-primary">
            {{ lang() === 'ar' ? 'مراجعة قبل التأكيد' : 'Review before confirming' }}
          </p>
          <h2 id="story-editor-title" class="mt-0.5 text-xl font-extrabold tracking-tight">
            {{ lang() === 'ar' ? 'تعديل قصة المستخدم' : 'Edit user story' }}
          </h2>
          <p class="mt-1 text-sm leading-6 text-text-secondary">
            {{
              lang() === 'ar'
                ? 'سيتم حفظ التغييرات في قائمة المهام حتى إذا لم تؤكد السبرينت.'
                : 'Changes are saved to the backlog even if you do not confirm this sprint.'
            }}
          </p>
        </div>
        <button
          type="button"
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-text-secondary transition-colors hover:bg-sidebar hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          (click)="requestClose()"
          [attr.aria-label]="lang() === 'ar' ? 'إغلاق محرر القصة' : 'Close story editor'"
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
      </header>

      <form class="flex min-h-0 flex-1 flex-col" (submit)="save($event)">
        <div class="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-6 sm:px-6">
          @if (saveError()) {
            <div
              role="alert"
              class="flex gap-3 rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error"
            >
              <svg
                class="mt-0.5 h-5 w-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
              <div>
                <p class="font-bold">
                  {{ lang() === 'ar' ? 'تعذر حفظ القصة' : 'Story could not be saved' }}
                </p>
                <p class="mt-1 leading-5">{{ saveError() }}</p>
              </div>
            </div>
          }

          <fieldset class="space-y-4">
            <legend class="mb-3 flex w-full items-center gap-3 text-sm font-extrabold">
              <span
                class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs text-primary"
                >EN</span
              >
              English details
            </legend>

            <div>
              <label for="story-title-en" class="mb-1.5 block text-sm font-semibold"
                >Title <span class="text-error">*</span></label
              >
              <input
                id="story-title-en"
                cdkFocusInitial
                [formField]="storyForm.titleEn"
                class="h-11 w-full rounded-xl border border-border bg-background px-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                [class.border-error]="
                  storyForm.titleEn().touched() && storyForm.titleEn().invalid()
                "
              />
              @if (storyForm.titleEn().touched() && storyForm.titleEn().invalid()) {
                <p class="mt-1.5 text-sm text-error" role="alert">
                  {{
                    lang() === 'ar'
                      ? 'العنوان الإنجليزي مطلوب ولا يزيد عن 160 حرفاً.'
                      : 'English title is required and must be 160 characters or fewer.'
                  }}
                </p>
              }
            </div>

            <div>
              <label for="story-description-en" class="mb-1.5 block text-sm font-semibold"
                >Description</label
              >
              <textarea
                id="story-description-en"
                [formField]="storyForm.descriptionEn"
                rows="4"
                class="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-base leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              ></textarea>
            </div>

            <div>
              <label for="story-criteria-en" class="mb-1.5 block text-sm font-semibold"
                >Acceptance criteria</label
              >
              <textarea
                id="story-criteria-en"
                [formField]="storyForm.acceptanceCriteriaEn"
                rows="4"
                class="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-base leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              ></textarea>
            </div>
          </fieldset>

          <div class="h-px bg-border"></div>

          <fieldset class="space-y-4" dir="rtl">
            <legend class="mb-3 flex w-full items-center gap-3 text-sm font-extrabold">
              <span
                class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs text-primary"
                >AR</span
              >
              التفاصيل العربية
            </legend>

            <div>
              <label for="story-title-ar" class="mb-1.5 block text-sm font-semibold">العنوان</label>
              <input
                id="story-title-ar"
                [formField]="storyForm.titleAr"
                class="h-11 w-full rounded-xl border border-border bg-background px-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label for="story-description-ar" class="mb-1.5 block text-sm font-semibold"
                >الوصف</label
              >
              <textarea
                id="story-description-ar"
                [formField]="storyForm.descriptionAr"
                rows="4"
                class="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-base leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              ></textarea>
            </div>

            <div>
              <label for="story-criteria-ar" class="mb-1.5 block text-sm font-semibold"
                >معايير القبول</label
              >
              <textarea
                id="story-criteria-ar"
                [formField]="storyForm.acceptanceCriteriaAr"
                rows="4"
                class="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-base leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              ></textarea>
            </div>
          </fieldset>

          <div>
            <label for="story-priority" class="mb-1.5 block text-sm font-semibold">{{
              lang() === 'ar' ? 'الأولوية' : 'Priority'
            }}</label>
            <select
              id="story-priority"
              [formField]="storyForm.priority"
              class="h-11 w-full rounded-xl border border-border bg-background px-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="Low">{{ lang() === 'ar' ? 'منخفضة' : 'Low' }}</option>
              <option value="Medium">{{ lang() === 'ar' ? 'متوسطة' : 'Medium' }}</option>
              <option value="High">{{ lang() === 'ar' ? 'عالية' : 'High' }}</option>
            </select>
          </div>
        </div>

        @if (discardPrompt()) {
          <div class="border-t border-warning/30 bg-warning/10 px-5 py-4 sm:px-6" role="alert">
            <p class="text-sm font-bold text-text-primary">
              {{ lang() === 'ar' ? 'تجاهل التغييرات غير المحفوظة؟' : 'Discard unsaved changes?' }}
            </p>
            <p class="mt-1 text-sm text-text-secondary">
              {{
                lang() === 'ar'
                  ? 'لن يمكن استعادة التعديلات التي أجريتها.'
                  : 'The edits you made in this panel cannot be recovered.'
              }}
            </p>
            <div class="mt-3 flex gap-2">
              <button
                type="button"
                class="min-h-11 rounded-xl bg-error px-4 text-sm font-bold text-white"
                (click)="confirmDiscard()"
              >
                {{ lang() === 'ar' ? 'تجاهل' : 'Discard' }}
              </button>
              <button
                type="button"
                class="min-h-11 rounded-xl border border-border bg-surface px-4 text-sm font-bold"
                (click)="discardPrompt.set(false)"
              >
                {{ lang() === 'ar' ? 'متابعة التعديل' : 'Keep editing' }}
              </button>
            </div>
          </div>
        }

        <footer
          class="flex items-center justify-between gap-3 border-t border-border bg-surface px-5 py-4 sm:px-6"
        >
          <p class="hidden text-sm text-text-secondary sm:block">
            {{
              storyForm().dirty()
                ? lang() === 'ar'
                  ? 'لديك تغييرات غير محفوظة'
                  : 'You have unsaved changes'
                : lang() === 'ar'
                  ? 'لم يتم إجراء تغييرات'
                  : 'No changes yet'
            }}
          </p>
          <div class="flex w-full justify-end gap-3 sm:w-auto">
            <button
              type="button"
              class="min-h-11 flex-1 rounded-xl border border-border px-4 text-sm font-bold text-text-secondary transition hover:bg-sidebar hover:text-text-primary sm:flex-none"
              (click)="requestClose()"
            >
              {{ lang() === 'ar' ? 'إلغاء' : 'Cancel' }}
            </button>
            <button
              type="submit"
              [disabled]="saving() || storyForm().invalid() || !storyForm().dirty()"
              class="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              @if (saving()) {
                <span
                  class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                ></span>
                {{ lang() === 'ar' ? 'جارٍ الحفظ...' : 'Saving...' }}
              } @else {
                {{ lang() === 'ar' ? 'حفظ القصة' : 'Save story' }}
              }
            </button>
          </div>
        </footer>
      </form>
    </aside>
  `,
})
export class SprintStoryEditorComponent {
  story = input.required<UserStoryDto>();
  lang = input<'en' | 'ar'>('en');

  saved = output<UserStoryDto>();
  cancelled = output<void>();

  private readonly backlogService = inject(BacklogService);
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  saving = signal(false);
  saveError = signal('');
  discardPrompt = signal(false);

  readonly storyModel = signal<StoryEditorModel>(this.emptyModel());
  readonly storyForm = form(this.storyModel, (schema) => {
    required(schema.titleEn, { message: 'English title is required.' });
    maxLength(schema.titleEn, 160);
    maxLength(schema.titleAr, 160);
    maxLength(schema.descriptionEn, 2000);
    maxLength(schema.descriptionAr, 2000);
    maxLength(schema.acceptanceCriteriaEn, 2000);
    maxLength(schema.acceptanceCriteriaAr, 2000);
  });

  constructor() {
    effect(() => {
      const story = this.story();
      this.storyModel.set({
        titleEn: story.titleEn ?? '',
        titleAr: story.titleAr ?? '',
        descriptionEn: story.descriptionEn ?? '',
        descriptionAr: story.descriptionAr ?? '',
        acceptanceCriteriaEn: story.acceptanceCriteriaEn ?? '',
        acceptanceCriteriaAr: story.acceptanceCriteriaAr ?? '',
        priority: mapPriorityToFrontend(story.priority),
      });
      this.storyForm().reset();
      this.saveError.set('');
      this.discardPrompt.set(false);
    });
  }

  requestClose(): void {
    if (this.saving()) return;
    if (this.storyForm().dirty()) {
      this.discardPrompt.set(true);
      return;
    }
    this.cancelled.emit();
  }

  confirmDiscard(): void {
    this.cancelled.emit();
  }

  save(event: Event): void {
    event.preventDefault();
    if (this.saving()) return;

    void submit(this.storyForm, async () => {
      this.saving.set(true);
      this.saveError.set('');

      const model = this.storyModel();
      const payload: UserStoryPayload = {
        titleEn: model.titleEn.trim(),
        titleAr: model.titleAr.trim(),
        descriptionEn: model.descriptionEn.trim(),
        descriptionAr: model.descriptionAr.trim(),
        acceptanceCriteriaEn: model.acceptanceCriteriaEn.trim(),
        acceptanceCriteriaAr: model.acceptanceCriteriaAr.trim(),
        priority: model.priority,
      };

      try {
        await this.backlogService.updateUserStory(this.story().id, payload);
        const updated: UserStoryDto = { ...this.story(), ...payload };
        await this.liveAnnouncer.announce(
          this.lang() === 'ar' ? 'تم حفظ قصة المستخدم' : 'User story saved',
        );
        this.storyForm().reset();
        this.saved.emit(updated);
      } catch (error: unknown) {
        const message = parseApiError(
          error,
          this.lang() === 'ar'
            ? 'تحقق من اتصالك وحاول مرة أخرى.'
            : 'Check your connection and try again.',
        ).message;
        this.saveError.set(message);
        await this.liveAnnouncer.announce(message, 'assertive');
      } finally {
        this.saving.set(false);
      }
    });
  }

  private emptyModel(): StoryEditorModel {
    return {
      titleEn: '',
      titleAr: '',
      descriptionEn: '',
      descriptionAr: '',
      acceptanceCriteriaEn: '',
      acceptanceCriteriaAr: '',
      priority: 'Medium',
    };
  }
}
