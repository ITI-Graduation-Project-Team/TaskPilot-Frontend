import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';

import { LoaderComponent } from './shared/ui/loader/loader';
import { LoadingService } from './shared/services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    LoaderComponent,
    AsyncPipe
  ],
  template: `
    @if ((loading$ | async) === true) {
      <app-loader />
    }

    <router-outlet />
  `,
})
export class AppComponent {
  private loadingService = inject(LoadingService);

  loading$ = this.loadingService.loading$;
}