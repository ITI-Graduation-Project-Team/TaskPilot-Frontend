import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners
} from '@angular/core';

import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';

import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { loadingInterceptor } from '../app/shared/api/interceptors/loading-interceptor';
import { languageInterceptor } from '../app/shared/api/interceptors/language-interceptor';

// 👈 هذا هو السطر الذي كان مفقوداً
import { authInterceptor } from '../app/shared/api/interceptors/auth.interceptor'; 

import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,   // الآن سيتعرف عليها Angular بلا مشاكل
        loadingInterceptor,
        languageInterceptor,
      ])
    ),

    provideTranslateService({
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json',
      }),
    }),
  ],
};