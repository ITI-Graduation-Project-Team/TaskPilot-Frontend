import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  getUserRole(): string | null {
    return localStorage.getItem('userRole') || null; 
  }

  isLoggedIn(): boolean {
   return !!localStorage.getItem('taskPilotJwtToken');
  }
}