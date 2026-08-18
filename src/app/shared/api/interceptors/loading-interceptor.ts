import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../../services/loading.service';

export const SKIP_GLOBAL_LOADING = new HttpContextToken<boolean>(() => false);

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  const isAuthRequest = req.url.toLowerCase().includes('/auth/');
  const shouldSkip = isAuthRequest || req.context.get(SKIP_GLOBAL_LOADING);

  if (!shouldSkip) {
    loadingService.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (!shouldSkip) {
        loadingService.hide();
      }
    })
  );
};
