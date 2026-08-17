import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html'
})
export class PaginationComponent {
  @Input() set currentPage(value: number) {
    this._currentPage.set(value);
  }
  @Input() set pageSize(value: number) {
    this._pageSize.set(value);
  }
  @Input() set totalItems(value: number) {
    this._totalItems.set(value);
  }
  @Output() pageChange = new EventEmitter<number>();

  private _currentPage = signal<number>(1);
  private _pageSize = signal<number>(10);
  private _totalItems = signal<number>(0);

  totalPages = computed(() => Math.max(1, Math.ceil(this._totalItems() / (this._pageSize() || 1))));
  
  hasPrevious = computed(() => this._currentPage() > 1);
  hasNext = computed(() => this._currentPage() < this.totalPages());

  get displayCurrentPage() {
    return this._currentPage();
  }

  get displayTotalPages() {
    return this.totalPages();
  }

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this._currentPage();
    
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    
    return [1, '...', current - 1, current, current + 1, '...', total];
  });

  goToPage(page: number | string) {
    if (typeof page === 'number' && page !== this._currentPage()) {
      this.pageChange.emit(page);
    }
  }

  previousPage() {
    if (this.hasPrevious()) {
      this.pageChange.emit(this._currentPage() - 1);
    }
  }

  nextPage() {
    if (this.hasNext()) {
      this.pageChange.emit(this._currentPage() + 1);
    }
  }
}
