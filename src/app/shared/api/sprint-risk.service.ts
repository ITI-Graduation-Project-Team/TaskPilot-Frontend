import { Injectable } from '@angular/core';
import { apiClient } from './axios.instance';
import { ApiResponse, SprintRiskAlertDto, SprintRiskSimulationResponseDto } from '../models/sprint-risk.models';

@Injectable({
  providedIn: 'root'
})
export class SprintRiskService {
  async getSprintRisks(sprintId: string): Promise<ApiResponse<SprintRiskAlertDto[]>> {
    const { data } = await apiClient.get<ApiResponse<SprintRiskAlertDto[]>>(`/sprints/${sprintId}/risks`);
    return data;
  }

  async dismissRiskAlert(sprintId: string, alertId: string): Promise<ApiResponse<null>> {
    const { data } = await apiClient.patch<ApiResponse<null>>(`/sprints/${sprintId}/risks/${alertId}/dismiss`);
    return data;
  }

  async simulateRiskResolution(sprintId: string, alertId: string): Promise<ApiResponse<SprintRiskSimulationResponseDto>> {
    const { data } = await apiClient.get<ApiResponse<SprintRiskSimulationResponseDto>>(`/sprints/${sprintId}/risks/${alertId}/simulate`);
    return data;
  }
}
