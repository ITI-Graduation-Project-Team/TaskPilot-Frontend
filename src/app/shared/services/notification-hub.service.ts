import { Injectable, computed, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { NotificationDto } from '../models/notification.model';
import { notificationApi } from '../api/notification.api';
import { getAccessToken } from '../lib/auth/cookie.helper';

@Injectable({
  providedIn: 'root'
})
export class NotificationHubService {
  private hubConnection: HubConnection | null = null;
  
  // State
  private _notifications = signal<NotificationDto[]>([]);
  readonly notifications = this._notifications.asReadonly();
  
  // Derived state
  readonly unreadCount = computed(() => this._notifications().filter(n => !n.isRead).length);

  async startConnection(): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      return; // Already connected
    }

    const token = getAccessToken();
    if (!token) {
      console.warn('Cannot connect to NotificationHub: No access token found.');
      return;
    }

    try {
      // 1. Fetch initial state
      const res = await notificationApi.getNotifications(false); // get all or unread? let's fetch all recent
      if (res.data?.succeeded && res.data.data) {
        this._notifications.set(res.data.data);
      }

      // 2. Build connection
      this.hubConnection = new HubConnectionBuilder()
        .withUrl(environment.hubUrl, {
          accessTokenFactory: () => token
        })
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect()
        .build();

      // 3. Register handlers
      this.hubConnection.on('ReceiveNotification', (notification: NotificationDto) => {
        this._notifications.update(prev => [notification, ...prev]);
      });

      // 4. Start connection
      await this.hubConnection.start();
      console.log('SignalR NotificationHub connected.');
    } catch (err) {
      console.error('Error connecting to NotificationHub:', err);
    }
  }

  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
    }
    this._notifications.set([]);
  }

  async markAsRead(id: string): Promise<void> {
    const notification = this._notifications().find(n => n.id === id);
    if (!notification || notification.isRead) return;

    // Optimistic UI update
    this._notifications.update(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );

    try {
      await notificationApi.markAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert if failed
      this._notifications.update(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: false } : n)
      );
    }
  }

  async markAllAsRead(): Promise<void> {
    if (this.unreadCount() === 0) return;

    // Optimistic UI update
    const previousState = this._notifications();
    this._notifications.update(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );

    try {
      await notificationApi.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      // Revert if failed
      this._notifications.set(previousState);
    }
  }
}
