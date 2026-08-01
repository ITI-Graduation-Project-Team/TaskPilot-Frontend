import { Injectable } from '@angular/core';
import { apiClient } from './axios.instance';

export interface ProjectPolicyDocument {
  id: string;
  fileName: string;
  fileSize?: number;
  uploadedAt: string;
}

export interface ProjectPolicyQuestionRequest {
  projectId: string;
  question: string;
  history?: { role: string; content: string }[];
}

export interface PromoteProjectPolicyRequest {
  documentId: string;
  projectId: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectPoliciesService {

  async uploadDocument(projectId: string, file: File, requirementSessionId?: string, lang: string = 'en'): Promise<any> {
    const formData = new FormData();
    formData.append('ProjectId', projectId);
    if (requirementSessionId) {
      formData.append('RequirementSessionId', requirementSessionId);
    }
    formData.append('File', file);

    const { data } = await apiClient.post('/project-policies/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'lang': lang
      }
    });
    return data;
  }

  async getDocuments(projectId: string, lang: string = 'en'): Promise<ProjectPolicyDocument[]> {
    const { data } = await apiClient.get(`/project-policies/${projectId}`, {
      headers: { 'lang': lang }
    });
    return data?.data || data || [];
  }

  async deleteDocument(projectId: string, documentId: string, lang: string = 'en'): Promise<any> {
    const { data } = await apiClient.delete(`/project-policies/${documentId}?projectId=${projectId}`, {
      headers: { 'lang': lang }
    });
    return data;
  }

  async askPolicyQuestion(request: ProjectPolicyQuestionRequest, lang: string = 'en'): Promise<string> {
    try {
      const response = await apiClient.post('/project-policies/ask', request, {
        headers: { 'lang': lang, 'X-Skip-Loader': 'true' }
      });
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
      console.error('Error fetching project policy answer:', error);
      throw error; 
    }
  }

  async promotePolicy(request: PromoteProjectPolicyRequest, lang: string = 'en'): Promise<any> {
    const { data } = await apiClient.post('/project-policies/promote', request, {
      headers: { 'lang': lang }
    });
    return data;
  }
}
