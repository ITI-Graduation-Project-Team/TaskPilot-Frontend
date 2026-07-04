import { Injectable } from '@angular/core';
import { apiClient } from '../axios.instance';

export interface CompanySetupResponse {
  succeeded: boolean;
  message: string;
  data?: any;
}

export interface EmployeeModel {
  id: string;
  email: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameAr: string;
  lastNameAr: string;
  isAvailable?: boolean;
}

export interface InvitationModel {
  id: string;
  email: string;
  invitedAt: string;
  expiresAt: string;
  accepted: boolean;
  invitedBy: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
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

  async searchEmployees(query: string): Promise<{ succeeded: boolean; data?: EmployeeModel[]; message: string }> {
    const response = await apiClient.get<{ succeeded: boolean; data?: EmployeeModel[]; message: string }>(`/companies/employees/search?query=${encodeURIComponent(query)}`, {
      withCredentials: false
    });
    return response.data;
  }

  async getCompanyEmployees(): Promise<{ succeeded: boolean; data?: EmployeeModel[]; message: string }> {
    const response = await apiClient.get<{ succeeded: boolean; data?: EmployeeModel[]; message: string }>(`/companies/employees`, {
      withCredentials: false
    });
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
}
