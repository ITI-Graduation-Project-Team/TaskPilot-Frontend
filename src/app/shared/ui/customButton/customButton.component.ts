import { Component, Input, Output, EventEmitter } from '@angular/core';
// The correct import path for CommonModule
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-customButton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      (click)="onClick.emit()"
      class="px-4 py-2 rounded-md font-medium transition-colors"
      [ngClass]="{
        'bg-brandPrimary hover:opacity-90 text-brandWhite': variant === 'primary',
        'bg-brandAccent hover:opacity-90 text-brandSecondary': variant === 'secondary'
      }">
      <ng-content></ng-content>
    </button>
  `
})
export class CustomButtonComponent {
  @Input() variant: 'primary' | 'secondary' = 'primary';
  @Output() onClick = new EventEmitter<void>();
}