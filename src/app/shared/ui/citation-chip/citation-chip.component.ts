import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { CitationDto } from '../../models/agile-coach.models';

@Component({
  selector: 'app-citation-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './citation-chip.component.html',
  styleUrls: ['./citation-chip.component.scss']
})
export class CitationChipComponent {
  citation = input.required<CitationDto>();
  isExpanded = signal(false);

  toggle() {
    this.isExpanded.set(!this.isExpanded());
  }
}
