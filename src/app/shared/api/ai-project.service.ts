import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AiChatResponseDto,
  BrdUploadResultDto,
  GenerateProjectDto,
  ProjectChatHistoryDto,
  SendAiMessageDto
} from '../models/ai-chat.models';

export interface ApiResponse<T = any> {
  succeeded: boolean;
  message: string;
  data: T;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AiProjectService {
  private apiUrl = environment.apiUrl + '/ai-projects';

  constructor(private http: HttpClient) {}

  uploadBrd(file: File): Observable<ApiResponse<BrdUploadResultDto>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<BrdUploadResultDto>>(`${this.apiUrl}/upload-brd`, formData);
  }

  processChat(request: SendAiMessageDto): Observable<ApiResponse<AiChatResponseDto>> {
    return this.http.post<ApiResponse<AiChatResponseDto>>(`${this.apiUrl}/chat`, request);
  }

  generateProject(request: GenerateProjectDto): Observable<ApiResponse<GenerateProjectDto>> {
    return this.http.post<ApiResponse<GenerateProjectDto>>(`${this.apiUrl}/generate`, request);
  }

  getChatHistory(projectId: string): Observable<ApiResponse<ProjectChatHistoryDto>> {
    return this.http.get<ApiResponse<ProjectChatHistoryDto>>(`${this.apiUrl}/${projectId}/chat`);
  }

  processFollowUpChat(projectId: string, request: SendAiMessageDto): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/projects/${projectId}/chat/send`, request);
  }

  confirmBacklogUpdates(projectId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/projects/${projectId}/chat/confirm`, {});
  }
}
