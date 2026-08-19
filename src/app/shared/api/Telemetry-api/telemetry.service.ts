import { Injectable } from '@angular/core';
import { apiClient } from '../axios.instance';

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface AiTelemetryLogDto {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  projectId?: string | null;
  projectName?: string | null;
  operationType: string;
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  responseTimeMs: number;
  status: string;
  errorMessage?: string | null;
  timestamp: string;
}

export interface EmployeeAiSummaryDto {
  totalOperations: number;
  totalTokens: number;
  totalCostUsd: number;
  averageResponseTimeMs: number;
}

export interface ProjectAiSummaryDto {
  projectId: string;
  projectName: string;
  totalOperations: number;
  totalTokens: number;
  totalCostUsd: number;
  averageResponseTimeMs: number;
  modelUsageCounts: Record<string, number>;
}

export interface ManagedProjectsAiSummaryDto {
  totalOperations: number;
  totalTokens: number;
  totalCostUsd: number;
  averageResponseTimeMs: number;
}

export interface ProjectMemberAiUsageDto {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  totalOperations: number;
  totalTokens: number;
  totalCostUsd: number;
}

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {
  
  // Employee Endpoints
  async getEmployeeSummary(): Promise<{ succeeded: boolean; data: EmployeeAiSummaryDto; message?: string }> {
    const response = await apiClient.get('/ai-telemetry/employee/summary');
    return response.data;
  }

  async getEmployeeLogs(page: number = 1, pageSize: number = 10): Promise<{ succeeded: boolean; data: PagedResult<AiTelemetryLogDto>; message?: string }> {
    const response = await apiClient.get(`/ai-telemetry/employee/logs?page=${page}&pageSize=${pageSize}`);
    return response.data;
  }

  // Project Manager Endpoints
  async getManagedProjectsSummary(): Promise<{ succeeded: boolean; data: ManagedProjectsAiSummaryDto; message?: string }> {
    const response = await apiClient.get('/ai-telemetry/projects/summary');
    return response.data;
  }

  async getProjectSummary(projectId: string): Promise<{ succeeded: boolean; data: ProjectAiSummaryDto; message?: string }> {
    const response = await apiClient.get(`/ai-telemetry/projects/${projectId}/summary`);
    return response.data;
  }

  async getProjectMembersUsage(projectId: string): Promise<{ succeeded: boolean; data: ProjectMemberAiUsageDto[]; message?: string }> {
    const response = await apiClient.get(`/ai-telemetry/projects/${projectId}/members`);
    return response.data;
  }

  async getProjectLogs(projectId: string, page: number = 1, pageSize: number = 10): Promise<{ succeeded: boolean; data: PagedResult<AiTelemetryLogDto>; message?: string }> {
    const response = await apiClient.get(`/ai-telemetry/projects/${projectId}/logs?page=${page}&pageSize=${pageSize}`);
    return response.data;
  }
}
