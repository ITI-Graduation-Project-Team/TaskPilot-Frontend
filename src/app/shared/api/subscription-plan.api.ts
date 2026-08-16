import { apiClient } from './axios.instance';
import { ApiResponse } from './auth.api';
import {
  SubscriptionPlanDto,
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto
} from './subscription.models';

/**
 * API module for subscription plan endpoints.
 *
 * NOTE: `GET /SubscriptionPlans` is currently restricted to the `Admin` role.
 * The backend team must update the authorization policy to also allow `ProjectManager`.
 * Until that change is deployed, calls from PM users will receive HTTP 403 —
 * the subscription page handles this with a graceful "plans unavailable" empty state.
 */
export const subscriptionPlanApi = {
  /**
   * `GET /SubscriptionPlans` — Returns all plans.
   * Requires `Admin` role today; target: `Admin | ProjectManager` after backend update.
   */
  getAll: () =>
    apiClient.get<ApiResponse<SubscriptionPlanDto[]>>('/SubscriptionPlans'),

  /**
   * `GET /SubscriptionPlans/{id}` — Returns a single plan by ID.
   * Requires `Admin` role.
   */
  getById: (id: number) =>
    apiClient.get<ApiResponse<SubscriptionPlanDto>>(`/SubscriptionPlans/${id}`),

  create: (data: CreateSubscriptionPlanDto) =>
    apiClient.post<ApiResponse<SubscriptionPlanDto>>('/SubscriptionPlans', data),

  update: (id: number, data: UpdateSubscriptionPlanDto) =>
    apiClient.put<ApiResponse<SubscriptionPlanDto>>(`/SubscriptionPlans/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/SubscriptionPlans/${id}`),
};
