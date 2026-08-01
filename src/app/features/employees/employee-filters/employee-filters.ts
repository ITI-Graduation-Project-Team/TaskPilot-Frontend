import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-employee-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './employee-filters.html'
})
export class EmployeeFiltersComponent {
  @Input() searchValue = '';
  @Input() statusValue: 'active' | 'deactivated' | '' = '';
  
  @Output() searchChange = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<'active' | 'deactivated' | ''>();

  private searchTimeout: any;

  onSearchInput(value: string) {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.searchChange.emit(value);
    }, 400); // 400ms debounce
  }

  onStatusSelect(status: 'active' | 'deactivated' | '') {
    this.statusValue = status;
    this.statusChange.emit(status);
  }
}
