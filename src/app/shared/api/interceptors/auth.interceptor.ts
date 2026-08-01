import { HttpInterceptorFn } from '@angular/common/http';
import { getAccessToken } from '../../lib/auth/cookie.helper';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = getAccessToken();

  let setHeaders: any = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  if (token) {
    setHeaders['Authorization'] = `Bearer ${token}`;
  }

  const clonedRequest = req.clone({ setHeaders });
  return next(clonedRequest);
};