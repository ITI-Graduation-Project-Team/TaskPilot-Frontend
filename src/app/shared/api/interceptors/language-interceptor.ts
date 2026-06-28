import { HttpInterceptorFn } from '@angular/common/http';

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  const lang = localStorage.getItem('app_lang') || 'en';
  
  const modifiedReq = req.clone({
    setHeaders: {
      'Accept-Language': lang
    }
  });

  return next(modifiedReq);
};
