import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from 'axios';
import { Injector } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from '../lib/auth/cookie.helper';
import { LoadingService } from '../services/loading.service';

// Lazily resolved so we never call inject() outside an injection context.
let _injector: Injector | null = null;
export function setAxiosInjector(injector: Injector) { _injector = injector; }
function getLoadingService(): LoadingService | null {
  return _injector ? _injector.get(LoadingService) : null;
}


let refreshPromise: Promise<string> | null = null;

export const apiClient: AxiosInstance = axios.create({
  baseURL: environment.apiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function shouldShowLoader(url: string | undefined): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  // Skip loader for auth endpoints and AI requirements chat/streaming/status endpoints
  if (lowerUrl.includes('/auth/') || lowerUrl.includes('/requirements/')) {
    return false;
  }
  return true;
}

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (shouldShowLoader(config.url)) {
      getLoadingService()?.show();
    }
    const token = getAccessToken();

    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    config.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    config.headers.set('Pragma', 'no-cache');
    config.headers.set('Expires', '0');

    const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('app_lang')) || 'en';
    config.headers.set('lang', lang);

    return config;
  },
  (error) => {
    if (shouldShowLoader(error.config?.url)) {
      getLoadingService()?.hide();
    }
    return Promise.reject(error);
  }
);

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const accessToken = getAccessToken();

  const { data } = await axios.post<any>(
    `${environment.apiUrl}/Auth/refresh-token`,
    { 
      token: accessToken,
      refreshToken: refreshToken 
    },
    {
      withCredentials: true,
    }
  );

  const token = data?.data?.token || data?.data?.Token || data?.token || data?.Token;
  const newRefreshToken = data?.data?.refreshToken || data?.data?.RefreshToken || data?.refreshToken || data?.RefreshToken;

  if (!token || !newRefreshToken) {
    throw new Error('Failed to parse refresh tokens');
  }

  saveTokens(token, newRefreshToken);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(environment.auth.tokenKey, token);
  }

  return token;
}

apiClient.interceptors.response.use(
  (response) => {
    if (shouldShowLoader(response.config?.url)) {
      getLoadingService()?.hide();
    }
    return response;
  },

  async (error: AxiosError) => {
    if (shouldShowLoader(error.config?.url)) {
      getLoadingService()?.hide();
    }
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    // Public auth endpoints — never attempt token refresh on these.
    // A 401 here means wrong credentials, not an expired session.
    const PUBLIC_AUTH_URLS = [
      '/Auth/login',
      '/Auth/register',
      '/Auth/forgot-password',
      '/Auth/reset-password',
      '/Auth/confirm-email',
      '/Auth/invitation'
    ];
    const isPublicAuth = PUBLIC_AUTH_URLS.some((path) =>
      originalRequest.url?.toLowerCase().includes(path.toLowerCase())
    );
    if (isPublicAuth) {
      return Promise.reject(error);
    }

    // The refresh endpoint itself failing means the session is truly gone.
    if (originalRequest.url?.includes('/Auth/refresh-token') || originalRequest.url?.includes('/auth/refresh')) {
      clearTokens();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken()
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken = await refreshPromise;

      originalRequest.headers.set(
        'Authorization',
        `Bearer ${newAccessToken}`
      );

      return apiClient(originalRequest);
    } catch (refreshError) {
      clearTokens();

      window.location.href = '/login';

      return Promise.reject(refreshError);
    }
  }
);