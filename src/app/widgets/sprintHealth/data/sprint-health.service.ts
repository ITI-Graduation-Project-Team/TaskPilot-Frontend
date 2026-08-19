import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ActivityFeedItemDto, TeamPulseDto } from './sprint-health.models';
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

  getFullAuditLog(sprintId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${sprintId}/audit-log`).pipe(
      map(res => res?.value)
    );
  }

  getRecentActivity(sprintId: string): Observable<ActivityFeedItemDto[]> {
    return this.http.get<CustomResponse<ActivityFeedItemDto[]>>(`${this.apiUrl}/${sprintId}/recent-activity`).pipe(
      map(res => res?.value || [])
    );
  }
}
