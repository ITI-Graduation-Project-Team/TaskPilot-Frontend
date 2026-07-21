import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TeamPulseDto } from './sprint-health.models';
export interface CustomResponse<T> {
  isSuccess: boolean;
  value?: T;
  error?: { code: string; description: string };
}

@Injectable({
  providedIn: 'root'
})
export class SprintHealthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sprints`;

  getTeamPulse(sprintId: string): Observable<CustomResponse<TeamPulseDto>> {
    return this.http.get<CustomResponse<TeamPulseDto>>(`${this.apiUrl}/${sprintId}/team-pulse`);
  }
}
