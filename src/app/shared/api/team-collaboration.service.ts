import { Injectable } from '@angular/core';
import { apiClient } from './axios.instance';

export interface EmployeeAssignmentDto {
  employeeId: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeamCollaborationService {
  async inviteEmployees(emails: string[]): Promise<any> {
    const { data } = await apiClient.post('/companies/employees/invite', { emails });
    return data;
  }

  async getCompanyEmployees(companyId: string): Promise<any> {
    const { data } = await apiClient.get(`/companies/${companyId}/employees`);
    return data;
  }

  async assignEmployees(projectId: string, assignments: EmployeeAssignmentDto[]): Promise<any> {
    const { data } = await apiClient.post(`/projects/${projectId}/employees`, { assignments });
    return data;
  }

  async getProjectEmployees(projectId: string): Promise<any> {
    const { data } = await apiClient.get(`/projects/${projectId}/employees`);
    return data;
  }
}
