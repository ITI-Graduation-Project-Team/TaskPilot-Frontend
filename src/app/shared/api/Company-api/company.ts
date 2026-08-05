import { Injectable } from '@angular/core';
import { apiClient } from '../axios.instance';

export interface CompanySetupResponse {
  succeeded: boolean;
  message: string;
  data?: any;
}

export interface EmployeeSuggestionModel {
  id: string;
  fullName: string;
  email: string;
  status: number;
  statusMessage: string;
}

export interface CompanyEmployeeModel {
  employeeId: string;
  fullName: string;
  email: string;
  jobTitle: string;
  seniorityLevel: string;
  skills: string[];
  activeProjectsCount: number;
  currentAssignedTasksCount: number;
  availabilityStatus: string;
  isDeactivated?: boolean;
  deactivationReason?: string;
  deactivatedAt?: string;
}

export interface InvitationModel {
  id: string;
  email: string;
  invitedAt: string;
  expiresAt: string;
  accepted: boolean;
  invitedBy: string;
}

export interface DeactivationBlock {
  $type: string;
  severity: 'Warning' | 'High' | 'Critical';
}

export interface AnalysisResultDto {
  isAllowed: boolean;
  blocks: DeactivationBlock[];
}

export interface DeactivateEmployeeRequest {
  reason?: string;
}

export interface DeactivateEmployeeResult {
  code: string;
  message: string;
  data: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface EmployeeListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'active' | 'deactivated' | '';
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedEmployeeResponse {
  succeeded: boolean;
  data?: {
    items: CompanyEmployeeModel[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  message: string;
}

export interface UpdateWorkingConfigDto {
  workingHoursPerDay: number;
  workingDaysMask: number;
  defaultCapacityBufferPercentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  async setupCompany(formData: FormData, lang: string): Promise<CompanySetupResponse> {
    const response = await apiClient.post<CompanySetupResponse>('/companies/setup', formData, {
      headers: {
        'lang': lang,
        'Content-Type': 'multipart/form-data'
      },
      withCredentials: false  // Bearer token is used instead of cookies; avoids CORS wildcard conflict
    });
    return response.data;
  }

  async inviteEmployees(emails: string[]): Promise<CompanySetupResponse> {
    const response = await apiClient.post<CompanySetupResponse>('/companies/employees/invite', { emails }, {
      withCredentials: false
    });
    return response.data;
  }

  async searchEmployees(query: string): Promise<{ succeeded: boolean; data?: EmployeeSuggestionModel[]; message: string }> {
    const response = await apiClient.get<{ succeeded: boolean; data?: EmployeeSuggestionModel[]; message: string }>(`/companies/employees/search?query=${encodeURIComponent(query)}`, {
      withCredentials: false
    });
    return response.data;
  }

  async getCompanyEmployees(page: number = 1, pageSize: number = 10, isDeactivated?: boolean): Promise<PaginatedEmployeeResponse> {
    let url = `/companies/employees?page=${page}&pageSize=${pageSize}`;
    if (isDeactivated !== undefined) {
      url += `&isDeactivated=${isDeactivated}`;
    }
    const response = await apiClient.get<PaginatedEmployeeResponse>(url, {
      withCredentials: false
    });
    return response.data;
  }

  async getCompanyEmployeeById(employeeId: string): Promise<{ succeeded: boolean; data?: CompanyEmployeeModel; message: string }> {
    const response = await apiClient.get<{ succeeded: boolean; data?: CompanyEmployeeModel; message: string }>(`/companies/employees/${employeeId}`, {
      withCredentials: false
    });
    return response.data;
  }

  async getEmployeesPaged(query: EmployeeListQuery = {}): Promise<PaginatedEmployeeResponse> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.pageSize) params.set('pageSize', String(query.pageSize));
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortDirection) params.set('sortDirection', query.sortDirection);
    const response = await apiClient.get<PaginatedEmployeeResponse>(
      `/companies/employees/paged?${params.toString()}`
    );
    return response.data;
  }

  async getInvitations(status?: string, page: number = 1, pageSize: number = 20): Promise<{ succeeded: boolean; data?: PaginatedResponse<InvitationModel>; message: string }> {
    let url = `/companies/invitations?page=${page}&pageSize=${pageSize}`;
    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }
    const response = await apiClient.get<{ succeeded: boolean; data?: PaginatedResponse<InvitationModel>; message: string }>(url, {
      withCredentials: false
    });
    return response.data;
  }

  async analyzeDeactivation(employeeId: string): Promise<AnalysisResultDto> {
    const response = await apiClient.get<AnalysisResultDto>(`/employees/${employeeId}/deactivation/analyze`);
    return response.data;
  }

  async deactivateEmployee(employeeId: string, request: DeactivateEmployeeRequest): Promise<DeactivateEmployeeResult> {
    const response = await apiClient.post<DeactivateEmployeeResult>(`/employees/${employeeId}/deactivate`, request);
    return response.data;
  }

  async resendInvitation(invitationId: string): Promise<{ succeeded: boolean; message: string }> {
    const response = await apiClient.post<{ succeeded: boolean; message: string }>(`/companies/invitations/${invitationId}/resend`, {}, {
      withCredentials: false
    });
    return response.data;
  }

  async cancelInvitation(invitationId: string): Promise<{ succeeded: boolean; message: string }> {
    const response = await apiClient.delete<{ succeeded: boolean; message: string }>(`/companies/invitations/${invitationId}`, {
      withCredentials: false
    });
    return response.data;
  }

  async updateWorkingConfig(companyId: string, config: UpdateWorkingConfigDto): Promise<{ succeeded: boolean; message: string }> {
    const response = await apiClient.put<{ succeeded: boolean; message: string }>(`/companies/${companyId}/working-config`, config);
    return response.data;
  }
}
