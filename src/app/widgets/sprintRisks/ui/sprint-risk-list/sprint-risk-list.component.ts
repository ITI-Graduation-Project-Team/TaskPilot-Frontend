import { Component, ChangeDetectionStrategy, input, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SprintRiskService } from '../../../../shared/api/sprint-risk.service';
import { SprintRiskAlertDto, WhatIfScenarioDto } from '../../../../shared/models/sprint-risk.models';
import { ToastService } from '../../../../shared/services/toast.service';
import { SprintRiskCardComponent } from '../sprint-risk-card/sprint-risk-card.component';
import { SimulationResultsViewComponent } from '../simulation-results-view/simulation-results-view.component';

@Component({
  selector: 'app-sprint-risk-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SprintRiskCardComponent, SimulationResultsViewComponent],
  templateUrl: './sprint-risk-list.component.html'
})
export class SprintRiskListComponent {
  sprintId = input.required<string>();
  
  private riskService = inject(SprintRiskService);
  private toastService = inject(ToastService);

  risks = signal<SprintRiskAlertDto[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  simulatingRiskId = signal<string | null>(null);
  simulatedScenarios = signal<WhatIfScenarioDto[] | null>(null);

  currentLang = typeof localStorage !== 'undefined' ? localStorage.getItem('app_lang') || 'en' : 'en';

  constructor() {
    effect(() => {
      const id = this.sprintId();
      if (id) {
        this.loadRisks(id);
      }
    });
  }

  async loadRisks(id: string) {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const response = await this.riskService.getSprintRisks(id);
      if (response && response.isSuccess) {
        this.risks.set(response.value || []);
      } else {
        this.error.set(response?.error?.message || 'Failed to load risks');
        this.toastService.show(this.error()!, 'error');
      }
    } catch (err: any) {
      this.error.set(err.message || 'An error occurred');
      this.toastService.show(this.error()!, 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onDismiss(alertId: string) {
    try {
      const response = await this.riskService.dismissRiskAlert(this.sprintId(), alertId);
      if (response && response.isSuccess) {
        this.risks.update(list => list.filter(r => r.id !== alertId));
        this.toastService.show(this.currentLang === 'ar' ? 'تم التجاهل بنجاح' : 'Risk dismissed successfully', 'success');
      } else {
        this.toastService.show(response?.error?.message || 'Failed to dismiss risk', 'error');
      }
    } catch (err: any) {
      this.toastService.show(err.message || 'Error dismissing risk', 'error');
    }
  }

  async onSimulate(alertId: string) {
    this.simulatingRiskId.set(alertId);
    try {
      const response = await this.riskService.simulateRiskResolution(this.sprintId(), alertId);
      if (response && response.isSuccess && response.value) {
        this.simulatedScenarios.set(response.value.scenarios || []);
      } else {
        this.toastService.show(response?.error?.message || 'Simulation failed', 'error');
      }
    } catch (err: any) {
      this.toastService.show(err.message || 'Error running simulation', 'error');
    } finally {
      this.simulatingRiskId.set(null);
    }
  }

  closeSimulation() {
    this.simulatedScenarios.set(null);
  }
}
