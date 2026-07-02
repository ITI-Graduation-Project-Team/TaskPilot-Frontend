import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface SkillDetails {
  name: string;
  level: string;
  yearsOfExperience: number;
  confidenceScore: number;
}

export interface CvExtractionData {
  jobTitle: string;
  seniorityLevel: string;
  totalYearsOfExperience: number;
  skills: SkillDetails[];
}

export interface ProfileResponse {
  succeeded: boolean;
  message: string;
  data: CvExtractionData;
  errors: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = environment.apiUrl + '/employees/cv';

  constructor(private http: HttpClient, private router: Router) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('taskPilotJwtToken');
    
    if (!token) {
      console.error('No auth token found in localStorage! Redirecting to login...');
      this.router.navigate(['/login']);
      return new HttpHeaders({ 'lang': 'en' });
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'lang': 'en'
    });
  }

  uploadCV(file: File): Observable<ProfileResponse> {
    if (!file) {
      throw new Error('No file provided for upload.');
    }

    const formData = new FormData();
    // NOTE (For Lead): We are using 'File' instead of 'request' because the 
    // backend validation (Swagger) explicitly fails with a '400 Bad Request: The File field is required' otherwise.
    formData.append('File', file, file.name);
    
    // Note: Do not set Content-Type header manually for multipart/form-data. Let the browser set the boundary automatically.
    return this.http.post<ProfileResponse>(this.apiUrl, formData, { headers: this.getHeaders() });
  }

  saveSkills(skills: string[]): Observable<any> {
    return this.http.post(`${environment.apiUrl}/Skills/bulk`, skills, {
      headers: this.getHeaders()
    });
  }

  saveProfileData(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/AiProject/confirm`, data, {
      headers: this.getHeaders()
    });
  }
}
