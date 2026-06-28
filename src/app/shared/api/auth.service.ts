import { Injectable } from '@angular/core';
<<<<<<< HEAD
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
  succeeded: boolean;
  message: string;
  data?: {
    token: string;
    refreshToken: string;
    roles: string[];
  };
}
=======
>>>>>>> aa9975e54e656e07e41984347f4956c93274d2a2

@Injectable({
  providedIn: 'root'
})
export class AuthService {
<<<<<<< HEAD
  private apiUrl = environment.apiUrl + '/Auth';

  constructor(private http: HttpClient) {}
=======
>>>>>>> aa9975e54e656e07e41984347f4956c93274d2a2
  
  getUserRole(): string | null {
    return localStorage.getItem('userRole') || null; 
  }

  isLoggedIn(): boolean {
<<<<<<< HEAD
   return !!localStorage.getItem(environment.auth.tokenKey);
  }

  googleLogin(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/google`, { idToken });
  }
}
=======
   return !!localStorage.getItem('taskPilotJwtToken');
  }
}
>>>>>>> aa9975e54e656e07e41984347f4956c93274d2a2
