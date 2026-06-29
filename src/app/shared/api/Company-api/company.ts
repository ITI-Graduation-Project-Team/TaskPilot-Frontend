import { Injectable } from '@angular/core';
import { apiClient } from '../axios.instance';

export interface CompanySetupResponse {
  succeeded: boolean;
  message: string;
  data?: any;
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
}
