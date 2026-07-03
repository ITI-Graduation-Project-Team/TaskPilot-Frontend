import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface SkillDetails {
  name: string;
  level: string | number;
  yearsOfExperience: number;
  confidenceScore?: number;
  isPrimary?: boolean;
}

export interface CvExtractionData {
  jobTitle: string;
  seniorityLevel: string | number;
  totalYearsOfExperience: number;
  skills: SkillDetails[];
}

export interface ProfileResponse {
  succeeded: boolean;
  message: string;
  data: CvExtractionData;
  errors: any[];
}

export function mapSeniorityLevelToBackend(level: string | number): number {
  if (typeof level === 'number') return level;
  switch (level?.toLowerCase()?.replace('-', '')) {
    case 'junior': return 1;
    case 'mid':
    case 'midlevel':
      return 2;
    case 'senior': return 3;
    case 'lead': return 4;
    default: return 2;
  }
}

export function mapSeniorityLevelToFrontend(level: number | string): string {
  const l = String(level);
  if (l === '1' || l?.toLowerCase() === 'junior') return 'Junior';
  if (l === '3' || l?.toLowerCase() === 'senior') return 'Senior';
  if (l === '4' || l?.toLowerCase() === 'lead') return 'Lead';
  return 'MidLevel';
}

export function mapSkillLevelToBackend(level: string | number): number {
  if (typeof level === 'number') return level;
  switch (level?.toLowerCase()) {
    case 'beginner': return 0;
    case 'intermediate': return 1;
    case 'advanced': return 2;
    case 'expert': return 3;
    default: return 1;
  }
}

export function mapSkillLevelToFrontend(level: number | string): string {
  const l = String(level);
  if (l === '0' || l?.toLowerCase() === 'beginner') return 'Beginner';
  if (l === '2' || l?.toLowerCase() === 'advanced') return 'Advanced';
  if (l === '3' || l?.toLowerCase() === 'expert') return 'Expert';
  return 'Intermediate';
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
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
    formData.append('File', file, file.name);
    
    return this.http.post<ProfileResponse>(
      `${environment.apiUrl}/employees/cv/extract`, 
      formData, 
      { headers: this.getHeaders() }
    );
  }

  confirmProfile(data: {
    jobTitle: string;
    seniorityLevel: number;
    totalYearsOfExperience: number;
    skills: {
      name: string;
      level: number;
      yearsOfExperience: number;
      isPrimary: boolean;
    }[];
  }): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/employees/cv/confirm`, 
      data, 
      { headers: this.getHeaders() }
    );
  }
}
