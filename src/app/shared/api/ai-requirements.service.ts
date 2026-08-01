import { Injectable } from '@angular/core';
import { apiClient } from './axios.instance';

export interface GeneratedProjectDTO {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  techStack: string;
  platformTargets: string;
  projectType: string;
  milestones: Array<{
    titleEn: string;
    titleAr: string;
    userStories: Array<{
      titleEn: string;
      titleAr: string;
      tasks: Array<{
        titleEn: string;
        titleAr: string;
      }>;
    }>;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AiRequirementsService {
  async startOrContinueSession(message: string, file: File | null = null, sessionId: string | null = null): Promise<any> {
    const formData = new FormData();
    if (message) formData.append('Message', message);
    if (sessionId) formData.append('SessionId', sessionId);
    if (file) formData.append('Documents', file);

    const { data } = await apiClient.post('/requirements', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return data;
  }

  async getSessionStatus(chatId: string): Promise<any> {
    const { data } = await apiClient.get(`/requirements/${chatId}`);
    return data;
  }

  async finalizeSession(
    chatId: string, 
    payload: { 
      projectNameEn: string; 
      projectNameAr: string; 
      companyId: string; 
      sprintDurationInDays: number; 
      targetSprintHours: number; 
      descriptionEn: string;
      descriptionAr: string;
    }
  ): Promise<any> {
    const { data } = await apiClient.post(`/requirements/${chatId}/finalize`, payload);
    return data;
  }



  async generateWbs(projectId: string): Promise<any> {
    const { data } = await apiClient.post(`/projects/${projectId}/wbs/generate`);
    await apiClient.post(`/projects/${projectId}/wbs/enrich-skills`);
    return data;
  }

  async getProjectWbs(projectId: string): Promise<any> {
    const { data } = await apiClient.get(`/projects/${projectId}/wbs`);
    return data;
  }
}
