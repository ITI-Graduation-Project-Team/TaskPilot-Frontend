import { Injectable, computed, signal } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  IRetryPolicy,
  LogLevel,
  RetryContext
} from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { NotificationDto } from '../models/notification.model';
import { notificationApi } from '../api/notification.api';
import { getAccessToken } from '../lib/auth/cookie.helper';

const reconnectPolicy: IRetryPolicy = {
  nextRetryDelayInMilliseconds(context: RetryContext): number {
    const delays = [0, 2_000, 5_000, 10_000, 30_000];
    return delays[Math.min(context.previousRetryCount, delays.length - 1)];
  }
};

@Injectable({ providedIn: 'root' })
export class NotificationHubService {
  private hubConnection: HubConnection | null = null;
  private connectionPromise: Promise<void> | null = null;

  private _notifications = signal<NotificationDto[]>([]);
  readonly notifications = this._notifications.asReadonly();

  private _latestNotification = signal<NotificationDto | null>(null);
  readonly latestNotification = this._latestNotification.asReadonly();

  readonly unreadCount = computed(() => this._notifications().filter(notification => !notification.isRead).length);

  startConnection(): Promise<void> {
    if (this.hubConnection?.state === HubConnectionState.Connected
      || this.hubConnection?.state === HubConnectionState.Reconnecting) {
      return Promise.resolve();
    }

    if (this.connectionPromise) return this.connectionPromise;

    if (!getAccessToken()) {
      console.warn('Cannot connect to NotificationHub: No access token found.');
      return Promise.resolve();
    }

    this.connectionPromise = this.connect()
      .catch(error => console.error('Error connecting to NotificationHub:', error))
      .finally(() => { this.connectionPromise = null; });

    return this.connectionPromise;
  }

  private async connect(): Promise<void> {
    const connection = this.ensureConnection();
    if (connection.state === HubConnectionState.Disconnected) {
      await connection.start();
      console.log('SignalR NotificationHub connected.');
    }

    // Connect first so notifications created while the initial list loads are received live.
    await this.syncNotifications();
  }

  private ensureConnection(): HubConnection {
    if (this.hubConnection) return this.hubConnection;

    const connection = new HubConnectionBuilder()
      .withUrl(environment.hubUrl, {
        accessTokenFactory: () => getAccessToken() ?? ''
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect(reconnectPolicy)
      .build();

    connection.on('ReceiveNotification', (notification: NotificationDto) => {
      this.mergeNotifications([notification]);
    });

    connection.onreconnected(() => {
      void this.syncNotifications();
    });

    this.hubConnection = connection;
    return connection;
  }

  private async syncNotifications(): Promise<void> {
    try {
      const response = await notificationApi.getNotifications(false);
      if (response.data?.succeeded && response.data.data) {
        this.mergeNotifications(response.data.data as NotificationDto[]);
      }
    } catch (error) {
      // The live connection remains useful even if the historical sync fails.
      console.error('Failed to synchronize notifications:', error);
    }
  }

  private mergeNotifications(incoming: NotificationDto[]): void {
    const existingIds = new Set(this._notifications().map(notification => notification.id));
    const normalizedIncoming = incoming.map(notification => this.normalize(notification));
    const merged = new Map<string, NotificationDto>();

    for (const notification of [...normalizedIncoming, ...this._notifications()]) {
      if (!merged.has(notification.id)) merged.set(notification.id, notification);
    }

    this._notifications.set(
      [...merged.values()].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    );

    const newestUnseen = normalizedIncoming.find(notification => !existingIds.has(notification.id));
    if (newestUnseen) this._latestNotification.set(newestUnseen);
  }

  private normalize(notification: NotificationDto): NotificationDto {
    return {
      ...notification,
      createdAt: notification.createdAt.endsWith('Z') ? notification.createdAt : `${notification.createdAt}Z`
    };
  }

  async stopConnection(): Promise<void> {
    if (this.connectionPromise) await this.connectionPromise;

    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
    }

    this._notifications.set([]);
    this._latestNotification.set(null);
  }

  async markAsRead(id: string): Promise<void> {
    const notification = this._notifications().find(item => item.id === id);
    if (!notification || notification.isRead) return;

    this._notifications.update(previous =>
      previous.map(item => item.id === id ? { ...item, isRead: true } : item)
    );

    try {
      await notificationApi.markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      this._notifications.update(previous =>
        previous.map(item => item.id === id ? { ...item, isRead: false } : item)
      );
    }
  }

  async markAllAsRead(): Promise<void> {
    if (this.unreadCount() === 0) return;

    const previousState = this._notifications();
    this._notifications.update(previous => previous.map(item => ({ ...item, isRead: true })));

    try {
      await notificationApi.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      this._notifications.set(previousState);
    }
  }
}
