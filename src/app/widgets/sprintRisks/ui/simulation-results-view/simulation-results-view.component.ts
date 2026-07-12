import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WhatIfScenarioDto } from '../../../../shared/models/sprint-risk.models';

@Component({
  selector: 'app-simulation-results-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './simulation-results-view.component.html',
  host: {
    '(document:keydown.escape)': 'onClose()'
  }
})
export class SimulationResultsViewComponent {
  scenarios = input.required<WhatIfScenarioDto[]>();
  
  close = output<void>();

  currentLang = typeof localStorage !== 'undefined' ? localStorage.getItem('app_lang') || 'en' : 'en';

  onClose() {
    this.close.emit();
  }

  getTitle(scenario: WhatIfScenarioDto) {
    return this.currentLang === 'ar' ? scenario.titleAr : scenario.titleEn;
  }

  getDescription(scenario: WhatIfScenarioDto) {
    return this.currentLang === 'ar' ? scenario.descriptionAr : scenario.descriptionEn;
  }

  getImpact(scenario: WhatIfScenarioDto) {
    return this.currentLang === 'ar' ? scenario.projectedImpactAr : scenario.projectedImpactEn;
  }

  getActionLabel(actionType: string) {
    if (this.currentLang === 'ar') {
      const map: Record<string, string> = {
        'Reassign': 'إعادة تعيين',
        'DropScope': 'تقليص النطاق',
        'ExtendSprint': 'تمديد السبرينت'
      };
      return map[actionType] || actionType;
    }
    return actionType;
  }
}
