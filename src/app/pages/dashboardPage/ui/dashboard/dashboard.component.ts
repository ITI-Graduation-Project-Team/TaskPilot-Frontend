import { Component } from '@angular/core';
// Important: Ensure the relative path goes back exactly 4 levels to reach the widgets folder
import { BoardComponent } from '../../../../widgets/taskBoard';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [BoardComponent],
  template: `
    <div class="min-h-screen bg-brandLight p-8">
      <header class="mb-8">
        <h1 class="text-4xl font-extrabold text-brandSecondary">TaskPilot</h1>
      </header>
      <main>
        <app-board></app-board>
      </main>
    </div>
  `
})
export class DashboardComponent {}