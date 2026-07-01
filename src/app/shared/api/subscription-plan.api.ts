import { apiClient } from './axios.instance';
import { ApiResponse } from './auth.api';
import { SubscriptionPlanDto } from './subscription.models';

/**
 * API module for subscription plan endpoints.
 *
 * NOTE: `GET api/subscriptionplans` is currently restricted to the `Admin` role.
 * The backend team must update the authorization policy to also allow `ProjectManager`.
 * Until that change is deployed, calls from PM users will receive HTTP 403 —
 * the subscription page handles this with a graceful "plans unavailable" empty state.
 */
export const subscriptionPlanApi = {
  /**
   * `GET api/subscriptionplans` — Returns all plans.
   * Requires `Admin` role today; target: `Admin | ProjectManager` after backend update.
   */
  getAll: () =>
    apiClient.get<ApiResponse<SubscriptionPlanDto[]>>('/subscriptionplans'),

  /**
   * `GET api/subscriptionplans/{id}` — Returns a single plan by ID.
   * Requires `Admin` role.
   */
  getById: (id: number) =>
    apiClient.get<ApiResponse<SubscriptionPlanDto>>(`/subscriptionplans/${id}`),
};
