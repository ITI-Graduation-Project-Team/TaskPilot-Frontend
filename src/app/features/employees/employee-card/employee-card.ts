import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { CompanyEmployeeModel } from '../../../shared/api/Company-api/company';

@Component({
  selector: 'app-employee-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './employee-card.html'
})
export class EmployeeCardComponent {
  @Input() employee!: CompanyEmployeeModel;
  @Output() viewDetails = new EventEmitter<string>();
  @Output() deactivate = new EventEmitter<CompanyEmployeeModel>();

  get initials(): string {
    if (!this.employee.fullName) return '?';
    const parts = this.employee.fullName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  get workloadStatus(): 'Available' | 'Moderate' | 'Busy' {
    if (this.employee.activeProjectsCount === 0) return 'Available';
    if (this.employee.currentAssignedTasksCount > 10) return 'Busy';
    return 'Moderate';
  }
}
