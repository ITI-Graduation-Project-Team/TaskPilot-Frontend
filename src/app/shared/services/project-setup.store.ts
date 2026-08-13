import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { ConfirmTechStackRequest, ProjectSetupApi, ProjectSetupDto } from '../api/project-setup.api';

interface ApiEnvelope { data: ProjectSetupDto; }

@Injectable({ providedIn: 'root' })
export class ProjectSetupStore {
  private api = inject(ProjectSetupApi);
  private _setup = signal<ProjectSetupDto | null>(null);
  private _loading = signal(false);
  private _action = signal<string | null>(null);
  private _error = signal<string | null>(null);
  private projectId: string | null = null;
  private pollingHandle: ReturnType<typeof setInterval> | null = null;

  readonly setup = this._setup.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly action = this._action.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isBusy = computed(() => this._action() !== null);
  readonly isBackgroundActive = computed(() => {
    const setup = this._setup();
    return setup?.wbs.status === 'Queued' || setup?.wbs.status === 'Running'
      || setup?.skills.status === 'Queued' || setup?.skills.status === 'Running';
  });

  async start(projectId: string): Promise<void> {
    this.stop();
    this.projectId = projectId;
    this._setup.set(null);
    this._loading.set(true);
    try {
      await this.refresh();
      if (this._setup()?.techStack.status === 'NotStarted') {
        await this.generateSuggestion(false);
      }
      this.syncPolling();
    } finally {
      this._loading.set(false);
    }
  }

  stop(): void {
    if (this.pollingHandle) clearInterval(this.pollingHandle);
    this.pollingHandle = null;
    this.projectId = null;
  }

  async refresh(): Promise<void> {
    if (!this.projectId) return;
    try {
      const response = await firstValueFrom(this.api.get(this.projectId));
      this._setup.set(response.data);
      this._error.set(null);
      this.syncPolling();
    } catch (error) {
      this._error.set(this.errorMessage(error));
    }
  }

  generateSuggestion(regenerate: boolean): Promise<void> {
    return this.run(regenerate ? 'regenerating' : 'suggesting', () => this.api.suggest(this.requireProjectId(), regenerate));
  }

  confirmTechStack(request: ConfirmTechStackRequest): Promise<void> {
    return this.run('confirming', () => this.api.confirm(this.requireProjectId(), request));
  }

  queueWbs(): Promise<void> {
    return this.run('queueing-wbs', () => this.api.queueWbs(this.requireProjectId()));
  }

  retrySkills(): Promise<void> {
    return this.run('retrying-skills', () => this.api.retrySkills(this.requireProjectId()));
  }

  private async run(action: string, request: () => Observable<ApiEnvelope>): Promise<void> {
    this._action.set(action);
    this._error.set(null);
    try {
      const response = await firstValueFrom(request());
      this._setup.set(response.data);
      this.syncPolling();
    } catch (error) {
      this._error.set(this.errorMessage(error));
      throw error;
    } finally {
      this._action.set(null);
    }
  }

  private syncPolling(): void {
    if (this.isBackgroundActive() && !this.pollingHandle) {
      this.pollingHandle = setInterval(() => void this.refresh(), 3000);
    } else if (!this.isBackgroundActive() && this.pollingHandle) {
      clearInterval(this.pollingHandle);
      this.pollingHandle = null;
    }
  }

  private requireProjectId(): string {
    if (!this.projectId) throw new Error('No project is selected for setup.');
    return this.projectId;
  }

  private errorMessage(error: unknown): string {
    const value = error as { error?: { error?: { description?: string }; errors?: Array<{ description?: string }>; message?: string }; message?: string };
    return value?.error?.error?.description
      || value?.error?.errors?.[0]?.description
      || value?.error?.message
      || value?.message
      || 'The request failed. Try again.';
  }
}
