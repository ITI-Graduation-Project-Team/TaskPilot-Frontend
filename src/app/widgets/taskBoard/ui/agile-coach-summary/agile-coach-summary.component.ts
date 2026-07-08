import { Component, ChangeDetectionStrategy, signal, inject, input, output, OnInit } from '@angular/core';
import { AgileCoachService } from '../../../../shared/api/agile-coach.service';
import { AgileCoachSummaryResponse } from '../../../../shared/models/agile-coach.models';
import { ToastService } from '../../../../shared/services/toast.service';
import { CitationChipComponent } from '../../../../shared/ui/citation-chip/citation-chip.component';

@Component({
  selector: 'app-agile-coach-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CitationChipComponent],
  templateUrl: './agile-coach-summary.component.html',
  styleUrls: ['./agile-coach-summary.component.scss']
})
export class AgileCoachSummaryComponent implements OnInit {
  taskItemId = input.required<string>();
  lang = input.required<string>();

  openChat = output<void>();

  private agileCoachService = inject(AgileCoachService);
  private toastService = inject(ToastService);

  summary = signal<AgileCoachSummaryResponse | null>(null);
  isLoading = signal(false);
  isCollapsed = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadSummary();
  }

  async loadSummary(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const result = await this.agileCoachService.getSummary(this.taskItemId());
      this.summary.set(result);
      if (result.isNewlyGenerated) {
        this.isCollapsed.set(false);
      }
    } catch {
      this.error.set('LOAD_FAILED');
    } finally {
      this.isLoading.set(false);
    }
  }

  async regenerate(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const result = await this.agileCoachService.regenerateSummary(this.taskItemId());
      this.summary.set(result);
      this.isCollapsed.set(false);
    } catch {
      this.error.set('REGENERATE_FAILED');
      this.toastService.show('Failed to regenerate summary', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }
}
