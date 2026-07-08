import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  const isAuthRequest = req.url.toLowerCase().includes('/auth/');

  if (!isAuthRequest) {
    loadingService.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (!isAuthRequest) {
        loadingService.hide();
      }
    })
  );
};