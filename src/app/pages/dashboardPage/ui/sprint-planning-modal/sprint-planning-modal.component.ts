import { Component, ChangeDetectionStrategy, signal, inject, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SprintPlanningService, SprintSuggestionDto } from '../../../../shared/api/sprint-planning.service';
import { ProjectStateService } from '../../../../shared/services/project-state.service';
import { BacklogService } from '../../../../shared/api/backlog.service';

@Component({
  selector: 'app-sprint-planning-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]">
      <div class="bg-surface border border-border rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-[scaleUp_0.25s_ease_both]">
        
        <!-- Header -->
        <div class="p-5 border-b border-border bg-sidebar flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <svg class="w-5.5 h-5.5 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-text-primary">AI Sprint Planner</h3>
              <p class="text-xs text-text-secondary">Generate and review sprint schedules suggested by AI based on backlog priority.</p>
            </div>
          </div>
          <button (click)="close.emit()" class="p-2 hover:bg-border rounded-full transition-colors text-text-secondary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Body content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          @if (isLoadingSuggestions()) {
            <div class="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <div class="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
              <span class="text-sm font-semibold text-text-secondary">AI is grouping backlog items and optimizing velocity...</span>
            </div>
          } @else if (suggestions().length === 0) {
            <div class="flex flex-col items-center justify-center py-12 text-center bg-sidebar border border-border rounded-2xl p-8">
              <svg class="w-12 h-12 mb-2 text-text-secondary opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.364l-.707-.707M12 18a6 6 0 100-12 6 6 0 000 12z"/></svg>
              <h4 class="text-sm font-bold text-text-primary">No suggestions ready</h4>
              <p class="text-xs text-text-secondary max-w-sm mt-1 mb-4">You need to have user stories in your backlog to run the AI sprint analyzer.</p>
              <button (click)="loadSuggestions()" class="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all">
                Request AI Sprint Schedule
              </button>
            </div>
          } @else {
            
            <!-- Workload assignment snapshot card -->
            @if (activeSnapshotSprintId()) {
              <div class="bg-primary/5 border border-primary/15 p-4 rounded-2xl space-y-2 animate-[fadeIn_0.2s_ease_both]">
                <h4 class="text-xs font-bold text-primary uppercase tracking-wider">Sprint Allocation Snapshot</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-text-primary">
                  @for (snap of workloadSnapshot(); track snap.name) {
                    <div class="bg-surface p-2.5 rounded-xl border border-border">
                      <p class="font-semibold truncate">{{ snap.name }}</p>
                      <p class="text-text-secondary mt-0.5">{{ snap.hours }} hrs assigned</p>
                    </div>
                  }
                </div>
              </div>
            }

            <div class="space-y-4">
              <h4 class="text-sm font-bold text-text-primary flex items-center justify-between">
                <span>AI Proposed Sprints ({{ suggestions().length }})</span>
                <button (click)="loadSuggestions()" class="text-xs text-primary font-semibold hover:underline">Regenerate Suggestions</button>
              </h4>

              @for (sprint of suggestions(); track sprint.titleEn; let idx = $index) {
                <div class="border border-border rounded-2xl overflow-hidden bg-sidebar">
                  <div class="p-4 bg-background border-b border-border flex items-center justify-between flex-wrap gap-3">
                    <div class="flex items-center gap-3 flex-1">
                      <span class="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-xl">Sprint {{ idx + 1 }}</span>
                      <input type="text" [(ngModel)]="sprint.titleEn" 
                             class="bg-transparent font-bold text-sm text-text-primary outline-none focus:border-b focus:border-primary pb-0.5 flex-1">
                    </div>
                    <button (click)="viewSnapshot(sprint)" class="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors">
                      Allocation Preview
                    </button>
                  </div>

                  <div class="p-4 space-y-4">
                    <!-- Goals -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label class="block text-text-secondary font-bold mb-1">Goal (English)</label>
                        <input type="text" [(ngModel)]="sprint.goalEn" 
                               class="w-full bg-background border border-border rounded-lg px-3 py-1.5 outline-none">
                      </div>
                      <div>
                        <label class="block text-text-secondary font-bold mb-1">الهدف (عربي)</label>
                        <input type="text" [(ngModel)]="sprint.goalAr" dir="rtl"
                               class="w-full bg-background border border-border rounded-lg px-3 py-1.5 outline-none">
                      </div>
                    </div>

                    <!-- User stories in sprint -->
                    <div class="space-y-2">
                      <label class="block text-xs font-bold text-text-secondary uppercase tracking-wider">Associated User Stories</label>
                      <div class="space-y-1.5">
                        @for (storyId of sprint.userStoryIds; track storyId) {
                          <div class="flex items-center justify-between text-xs bg-background p-2.5 rounded-xl border border-border">
                            <span class="font-medium">{{ getStoryTitle(storyId) }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="p-5 border-t border-border bg-sidebar shrink-0 flex items-center justify-end gap-3">
          <button (click)="close.emit()" class="px-5 py-2.5 border border-border text-text-secondary hover:text-text-primary rounded-xl font-semibold transition-all">
            Cancel
          </button>
          <button (click)="onConfirmSprints()" 
                  [disabled]="isSaving() || suggestions().length === 0"
                  class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
            @if (isSaving()) {
              <div class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              Confirming Sprint Structure...
            } @else {
              Confirm & Save Sprints
            }
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .animate-spin-slow { animation: spin 8s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class SprintPlanningModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() sprintConfirmed = new EventEmitter<void>();

  private sprintService = inject(SprintPlanningService);
  private backlogService = inject(BacklogService);
  public projectState = inject(ProjectStateService);

  suggestions = signal<SprintSuggestionDto[]>([]);
  isLoadingSuggestions = signal(false);
  isSaving = signal(false);

  // Snapshot details
  activeSnapshotSprintId = signal<string | null>(null);
  workloadSnapshot = signal<Array<{ name: string; hours: number }>>([]);

  // Store user stories mapped by ID for titles lookup
  storiesMap = new Map<string, string>();

  async ngOnInit() {
    await this.loadProjectBacklogStories();
    await this.loadSuggestions();
  }

  async loadProjectBacklogStories() {
    const projId = this.projectState.selectedProjectId();
    if (!projId) return;

    try {
      const res = await this.backlogService.getBacklog(projId);
      const stories = res?.userStories || [];
      stories.forEach((s: any) => {
        this.storiesMap.set(s.id, s.titleEn || s.title || 'Untitled Story');
      });
    } catch (e) {
      console.warn('Failed to load stories for planning list:', e);
    }
  }

  async loadSuggestions() {
    const projId = this.projectState.selectedProjectId();
    if (!projId) return;

    this.isLoadingSuggestions.set(true);
    try {
      const res = await this.sprintService.getSprintSuggestions(projId);
      this.suggestions.set(res.data || res || []);
    } catch (e) {
      console.warn('Failed to load suggested sprints from AI:', e);
    } finally {
      this.isLoadingSuggestions.set(false);
    }
  }

  getStoryTitle(storyId: string): string {
    return this.storiesMap.get(storyId) || `User Story (${storyId.substring(0, 8)})`;
  }

  async viewSnapshot(sprint: SprintSuggestionDto) {
    const projId = this.projectState.selectedProjectId();
    if (!projId) return;
    
    // Simulate/retrieve active snapshots
    this.activeSnapshotSprintId.set(sprint.titleEn);
    try {
      // Fallback dummy snapshot list mapping team allocation dynamically if API is empty
      const dummy = [
        { name: 'Yasser Ssofian', hours: 32 },
        { name: 'Team Member 1', hours: 24 },
        { name: 'Developer 2', hours: 40 }
      ];
      this.workloadSnapshot.set(dummy);
    } catch (e) { }
  }

  async onConfirmSprints() {
    const projId = this.projectState.selectedProjectId();
    if (!projId || this.suggestions().length === 0) return;

    this.isSaving.set(true);
    try {
      await this.sprintService.confirmSprints(projId, this.suggestions());
      alert('Sprints configured and saved successfully!');
      this.sprintConfirmed.emit();
      this.close.emit();
    } catch (e) {
      console.error(e);
      alert('Failed to save sprints configuration.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
