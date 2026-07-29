import { Injectable } from '@angular/core';
import { apiClient } from './axios.instance';

export interface PolicyDocument {
  id: string;
  fileName: string;
  fileSize?: number;
  uploadedAt: string;
}

export interface PolicyAskRequest {
  companyId: string;
  question: string;
  history?: { role: string; content: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class CompanyPoliciesService {

  async uploadDocument(companyId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('CompanyId', companyId);
    formData.append('File', file);

    const { data } = await apiClient.post('/company-policies/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return data;
  }

  async getDocuments(companyId: string): Promise<PolicyDocument[]> {
    const { data } = await apiClient.get(`/company-policies/documents?companyId=${companyId}`);
    return data?.data || data || [];
  }

  async deleteDocument(companyId: string, documentId: string): Promise<any> {
    const { data } = await apiClient.delete(`/company-policies/documents/${documentId}?companyId=${companyId}`);
    return data;
  }

   async askPolicyQuestion(request: PolicyAskRequest): Promise<string> {
    try {
      const response = await apiClient.post('/company-policies/ask', request);
      const resData = response.data;

      let answerText = '';

      if (resData?.data?.answer) {
        answerText = resData.data.answer;
      } else if (resData?.answer) {
        answerText = resData.answer;
      } else if (resData?.Data?.Answer) {
        answerText = resData.Data.Answer;
      }

      if (typeof answerText === 'string' && answerText.trim() !== '') {
        return answerText;
      }

      return JSON.stringify(resData, null, 2);

    } catch (error) {
      console.error('Error fetching policy answer:', error);
      throw error; 
    }
  }

}
