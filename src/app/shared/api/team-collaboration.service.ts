import { Injectable } from '@angular/core';
import { apiClient } from './axios.instance';

export interface EmployeeAssignmentDto {
  employeeId: string;
  role: string;
}

export interface CompanyEmployee {
  employeeId: string;
  id?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  jobTitle: string;
  seniorityLevel?: string;
  availabilityStatus?: string;
  skills?: string[];
  isDeactivated?: boolean;
  deactivationReason?: string;
  deactivatedAt?: string;
}

export interface ProjectEmployee {
  employeeId: string;
  fullName: string;
  email: string;
  role: string;
  isDeactivated?: boolean;
  deactivationReason?: string;
  deactivatedAt?: string;
}

export interface ApiResponse<T> {
  succeeded: boolean;
  data: T;
  message?: string;
  errors?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class TeamCollaborationService {
  async inviteEmployees(emails: string[]): Promise<ApiResponse<any>> {
    const { data } = await apiClient.post<ApiResponse<any>>('/companies/employees/invite', { emails });
    return data;
  }

  async getCompanyEmployees(companyId?: string): Promise<ApiResponse<CompanyEmployee[]>> {
    const { data } = await apiClient.get<ApiResponse<CompanyEmployee[]>>('/companies/employees');
    return data;
  }

  async assignEmployees(projectId: string, assignments: EmployeeAssignmentDto[]): Promise<ApiResponse<any>> {
    const { data } = await apiClient.post<ApiResponse<any>>(`/projects/${projectId}/employees`, { assignments });
    return data;
  }

  async getProjectEmployees(projectId: string): Promise<ApiResponse<ProjectEmployee[]>> {
    const { data } = await apiClient.get<ApiResponse<ProjectEmployee[]>>(`/projects/${projectId}/employees`);
    return data;
  }
}
