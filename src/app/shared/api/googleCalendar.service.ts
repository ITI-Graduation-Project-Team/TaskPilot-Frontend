import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GoogleCalendarConnectResponse {
  url: string;
}

export interface GoogleCalendarVerifyResponse {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/GoogleCalendarIntegration`;

  /**
   * Retrieves the Google Calendar OAuth connect URL.
   * @returns Observable containing the connection URL.
   */
  getConnectUrl(): Observable<GoogleCalendarConnectResponse> {
    return this.http.get<GoogleCalendarConnectResponse>(`${this.baseUrl}/connect`);
  }

  /**
   * Verifies the OAuth callback from Google.
   * @param code The authorization code returned by Google.
   * @param state The state parameter returned by Google.
   * @returns Observable containing the verification result.
   */
  verifyCallback(code: string, state: string): Observable<GoogleCalendarVerifyResponse> {
    const params = new HttpParams()
      .set('code', code)
      .set('state', state);

    return this.http.get<GoogleCalendarVerifyResponse>(`${this.baseUrl}/callback`, { params });
  }
}
