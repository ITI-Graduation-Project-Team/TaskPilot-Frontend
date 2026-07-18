import { Injectable } from '@angular/core';
import { apiClient } from './axios.instance';
import { ProjectChatSessionDto, SendChatMessageDto } from '../models/projectChat.models';

// Matches the actual server envelope: { Succeeded, Data, Message, Errors }
export interface ApiEnvelope<T> {
    succeeded: boolean;
    data?: T;
    message?: string;
    errors?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ProjectChatApi {
  
  async getSession(projectId: string): Promise<ApiEnvelope<ProjectChatSessionDto>> {
    try {
      const response = await apiClient.get<ApiEnvelope<ProjectChatSessionDto>>(`/projects/${projectId}/chat`);
      return response.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            return { succeeded: false, error: 'Not Found' } as any;
        }
        throw error;
    }
  }

  async sendMessage(projectId: string, payload: SendChatMessageDto): Promise<ApiEnvelope<string>> {
    const response = await apiClient.post<ApiEnvelope<string>>(`/projects/${projectId}/chat/send`, payload);
    return response.data;
  }

  async confirmBacklog(projectId: string): Promise<ApiEnvelope<string>> {
    const response = await apiClient.post<ApiEnvelope<string>>(`/projects/${projectId}/chat/confirm`);
    return response.data;
  }
}
