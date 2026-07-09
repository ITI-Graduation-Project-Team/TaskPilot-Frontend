import { Component, inject, Injector } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';

import { LoaderComponent } from './shared/ui/loader/loader';
import { ToastComponent } from './shared/ui/toast/toast.component';
import { ConfirmDialogComponent } from './shared/ui/confirm-dialog/confirm-dialog.component';
import { LoadingService } from './shared/services/loading.service';
import { setAxiosInjector } from './shared/api/axios.instance';
import { ThemeService } from './shared/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    LoaderComponent,
    ToastComponent,
    ConfirmDialogComponent,
    AsyncPipe
  ],
  template: `
    @if ((loading$ | async) === true) {
      <app-loader />
    }

    <router-outlet />
    <app-toast />
    <app-confirm-dialog />
  `,
})
export class AppComponent {
  private loadingService = inject(LoadingService);
  private injector = inject(Injector);
  // Injecting ThemeService here ensures it initializes and applies the
  // persisted theme immediately when the app starts, before any page loads.
  private themeService = inject(ThemeService);

  loading$ = this.loadingService.loading$;

  constructor() {
    setAxiosInjector(this.injector);
  }
}