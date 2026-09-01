import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { getAccessToken, getRoleFromToken, clearTokens } from '../lib/auth/cookie.helper';

export interface AuthResponse {
  succeeded: boolean;
  message: string;
  data?: {
    token: string;
    refreshToken: string;
    roles: string[];
    requireRoleSelection?: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/Auth';

  constructor(private http: HttpClient, private router: Router) {}

  logout(): void {
    clearTokens();
    // Prefer Angular Router navigation instead of full page reload if possible
    this.router.navigate(['/login']);
  }

  getUserRole(): string | null {
    return getRoleFromToken(); // reads the actual JWT, not localStorage
  }

  isLoggedIn(): boolean {
    return !!getAccessToken();
  }

  googleLogin(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/google`, { idToken });
  }

  googleCompleteSignup(idToken: string, role: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/google/complete-signup`, { idToken, role });
  }
}
