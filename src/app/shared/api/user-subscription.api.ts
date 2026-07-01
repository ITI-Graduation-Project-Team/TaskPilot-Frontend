import { apiClient } from './axios.instance';
import { ApiResponse } from './auth.api';
import {
  CreateUserSubscriptionDto,
  UserSubscriptionDto,
} from './subscription.models';

/**
 * API module for user subscription endpoints.
 * All methods require the caller to be authenticated as `ProjectManager`.
 */
export const userSubscriptionApi = {
  /**
   * `GET api/usersubscriptions/current`
   * Returns the current active subscription for the logged-in PM.
   * Returns HTTP 404 (axios throws) when the PM has no active subscription.
   */
  getCurrent: () =>
    apiClient.get<ApiResponse<UserSubscriptionDto>>(
      '/usersubscriptions/current'
    ),

  /**
   * `POST api/usersubscriptions`
   * Creates a new subscription. Returns a `clientSecret` in the response
   * data when Stripe payment confirmation is required.
   */
  subscribe: (dto: CreateUserSubscriptionDto) =>
    apiClient.post<ApiResponse<UserSubscriptionDto>>(
      '/usersubscriptions',
      dto
    ),

  /**
   * `POST api/usersubscriptions/{id}/cancel`
   * Cancels the PM's own subscription. Returns 403 if the subscription
   * belongs to a different PM.
   */
  cancel: (id: string) =>
    apiClient.post<ApiResponse<void>>(
      `/usersubscriptions/${id}/cancel`,
      {}
    ),
};
