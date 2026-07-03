import { HttpInterceptorFn } from '@angular/common/http';
import { getAccessToken } from '../../lib/auth/cookie.helper';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. جلب التوكن من الـ Cookies (لأننا نقوم بتخزينه هناك وليس في localStorage)
  const token = getAccessToken();

  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  return next(req);
};