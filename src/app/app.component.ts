import { Component, inject, Injector, OnInit, DestroyRef } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { LoaderComponent } from './shared/ui/loader/loader';
import { ToastComponent } from './shared/ui/toast/toast.component';
import { ConfirmDialogComponent } from './shared/ui/confirm-dialog/confirm-dialog.component';
import { LoadingService } from './shared/services/loading.service';
import { setAxiosInjector } from './shared/api/axios.instance';
import { ThemeService } from './shared/services/theme.service';
import { NotificationHubService } from './shared/services/notification-hub.service';
import { AuthService } from './shared/api/auth.service';
import { TranslateService } from '@ngx-translate/core';

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
export class AppComponent implements OnInit {
  private loadingService = inject(LoadingService);
  private injector = inject(Injector);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  public authService = inject(AuthService);
  private notificationHubService = inject(NotificationHubService);
  private translate = inject(TranslateService);

  loading$ = this.loadingService.loading$;

  constructor() {
    setAxiosInjector(this.injector);

    // Initialize language globally
    const savedLang = localStorage.getItem('app_lang') || 'en';
    this.translate.setFallbackLang('en');
    this.translate.use(savedLang);
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLang;
  }

  ngOnInit() {
    // Check connection status on every route change (handles login/logout)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      if (this.authService.isLoggedIn()) {
        this.notificationHubService.startConnection();
      } else {
        this.notificationHubService.stopConnection();
      }
    });

    // Also check on initial load
    if (this.authService.isLoggedIn()) {
      this.notificationHubService.startConnection();
    }
  }
}