import Cookies from 'js-cookie';
import { environment } from '../../../../environments/environment';

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  secure: environment.production,
  sameSite: 'Strict',
  expires: 7,
};

export function getAccessToken(): string | undefined {
  return Cookies.get(environment.auth.tokenKey);
}

export function getRefreshToken(): string | undefined {
  return Cookies.get(environment.auth.refreshTokenKey);
}

export function saveTokens(accessToken: string, refreshToken: string): void {
  Cookies.set(environment.auth.tokenKey, accessToken, COOKIE_OPTIONS);
  Cookies.set(environment.auth.refreshTokenKey, refreshToken, COOKIE_OPTIONS);
}

export function clearTokens(): void {
  Cookies.remove(environment.auth.tokenKey);
  Cookies.remove(environment.auth.refreshTokenKey);
  if (typeof localStorage !== 'undefined') {
    // Keep app_lang and theme if they exist, clear user session state to prevent leakage
    const lang = localStorage.getItem('app_lang');
    const theme = localStorage.getItem('theme');
    localStorage.clear();
    if (lang) {
      localStorage.setItem('app_lang', lang);
    }
    if (theme) {
      localStorage.setItem('theme', theme);
    }
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear();
  }
}
export function getRoleFromToken(): string | null {
  const token = getAccessToken(); // your existing cookie reader
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    let role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? payload['role'];
    
    if (Array.isArray(role)) {
      role = role[0];
    }
    
    return role ?? null;
  } catch {
    return null;
  }
}

export function getUserIdFromToken(): string | null {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
      ?? payload['nameid']
      ?? null
    );
  } catch {
    return null;
  }
}

export function isProfileCompleted(): boolean {
  if (typeof localStorage !== 'undefined') {
    const localVal = localStorage.getItem('isProfileCompleted');
    if (localVal !== null) {
      return localVal === 'true';
    }
  }

  const token = getAccessToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const val = payload['ProfileCompleted'] ?? payload['isProfileCompleted'] ?? null;
    return val === 'True' || val === 'true' || val === true;
  } catch {
    return false;
  }
}