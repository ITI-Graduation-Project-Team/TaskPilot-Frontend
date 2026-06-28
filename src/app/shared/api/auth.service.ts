import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { getAccessToken } from '../lib/auth/cookie.helper';
export interface AuthResponse {
  succeeded: boolean;
  message: string;
  data?: {
    token: string;
    refreshToken: string;
    roles: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/Auth';

  constructor(private http: HttpClient) { }

  getUserRole(): string | null {
    return localStorage.getItem('userRole') || null;
  }

  isLoggedIn(): boolean {
    return !!getAccessToken();
  }
  googleLogin(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/google`, { idToken });
  }
}

