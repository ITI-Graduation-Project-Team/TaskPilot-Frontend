import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SprintRiskAlertDto } from '../../../../shared/models/sprint-risk.models';

@Component({
  selector: 'app-sprint-risk-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    'class': 'block bg-white dark:bg-gray-800 rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md p-4 mb-4',
    '[class.border-red-300]': 'isCritical()',
    '[class.dark:border-red-800]': 'isCritical()',
    '[class.border-yellow-300]': 'isWarning()',
    '[class.dark:border-yellow-800]': 'isWarning()',
    '[class.border-blue-300]': 'isInfo()',
    '[class.dark:border-blue-800]': 'isInfo()',
    '[class.border-gray-200]': '!isCritical() && !isWarning() && !isInfo()',
    '[class.dark:border-gray-700]': '!isCritical() && !isWarning() && !isInfo()'
  },
  templateUrl: './sprint-risk-card.component.html'
})
export class SprintRiskCardComponent {
  risk = input.required<SprintRiskAlertDto>();
  isSimulating = input<boolean>(false);

  dismiss = output<string>();
  simulate = output<string>();

  currentLang = typeof localStorage !== 'undefined' ? localStorage.getItem('app_lang') || 'en' : 'en';

  message = computed(() => {
    return this.currentLang === 'ar' ? this.risk().messageAr : this.risk().messageEn;
  });

  isCritical = computed(() => {
    const s = this.risk().severity?.toLowerCase() || '';
    return s === 'critical' || s === 'high' || s === 'danger';
  });

  isWarning = computed(() => {
    const s = this.risk().severity?.toLowerCase() || '';
    return s === 'medium' || s === 'warning';
  });

  isInfo = computed(() => {
    const s = this.risk().severity?.toLowerCase() || '';
    return s === 'low' || s === 'info';
  });

  getSeverityClasses() {
    if (this.isCritical()) return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (this.isWarning()) return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (this.isInfo()) return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }

  onDismiss() {
    this.dismiss.emit(this.risk().id);
  }

  onSimulate() {
    if (!this.isSimulating()) {
      this.simulate.emit(this.risk().id);
    }
  }
}
