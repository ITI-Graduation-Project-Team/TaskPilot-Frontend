import { apiClient } from './axios.instance';
import { NotificationDto } from '../models/notification.model';
import { ApiResponse } from './auth.api';

// Reusing ApiResponse but creating a specific one if needed
export interface NotificationsResponse extends ApiResponse<NotificationDto[]> {}

const NO_CREDS = { withCredentials: true }; // Needed for our backend endpoints

export const notificationApi = {
  getNotifications: (isUnread?: boolean) => {
    let url = '/notifications';
    if (isUnread !== undefined) {
      url += `?isUnread=${isUnread}`;
    }
    return apiClient.get<NotificationsResponse>(url, NO_CREDS);
  },

  markAsRead: (id: string) =>
    apiClient.patch<ApiResponse>(`/notifications/${id}/read`, {}, NO_CREDS),

  markAllAsRead: () =>
    apiClient.post<ApiResponse>('/notifications/read-all', {}, NO_CREDS),
};
